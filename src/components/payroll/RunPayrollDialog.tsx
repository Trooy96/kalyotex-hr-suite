import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Calculator, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  calculatePayroll,
  formatZMW,
  StatutoryRates,
  PayeBracket,
} from "@/utils/payrollCalculations";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  salary: number | null;
}

interface Contract {
  employee_id: string;
  base_salary: number;
  housing_allowance: number | null;
  transport_allowance: number | null;
  lunch_allowance: number | null;
  other_allowances: number | null;
}

interface Props {
  onSuccess: () => void;
}

export function RunPayrollDialog({ onSuccess }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Map<string, Contract>>(new Map());
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [statutoryRates, setStatutoryRates] = useState<StatutoryRates>({
    napsa_employee: 5,
    napsa_employer: 5,
    nhima_employee: 1,
    nhima_employer: 1,
  });
  const [payeBrackets, setPayeBrackets] = useState<PayeBracket[]>([]);
  const [payPeriod, setPayPeriod] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  async function fetchData() {
    setLoading(true);

    const [employeesRes, contractsRes, statutoryRes, payeRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, position, salary"),
      supabase.from("employee_contracts").select("*").eq("status", "active"),
      supabase.from("statutory_settings").select("name, rate").eq("is_active", true),
      supabase.from("paye_brackets").select("*").eq("is_active", true).order("min_amount"),
    ]);

    if (employeesRes.data) {
      setEmployees(employeesRes.data);
      setSelectedEmployees(new Set(employeesRes.data.map((e) => e.id)));
    }

    if (contractsRes.data) {
      const contractMap = new Map<string, Contract>();
      contractsRes.data.forEach((c) => {
        contractMap.set(c.employee_id, c);
      });
      setContracts(contractMap);
    }

    if (statutoryRes.data) {
      const rates: StatutoryRates = {
        napsa_employee: 5,
        napsa_employer: 5,
        nhima_employee: 1,
        nhima_employer: 1,
      };
      statutoryRes.data.forEach((s) => {
        if (s.name in rates) {
          rates[s.name as keyof StatutoryRates] = s.rate;
        }
      });
      setStatutoryRates(rates);
    }

    if (payeRes.data) {
      setPayeBrackets(
        payeRes.data.map((b) => ({
          min_amount: Number(b.min_amount),
          max_amount: b.max_amount ? Number(b.max_amount) : null,
          rate: Number(b.rate),
          fixed_amount: Number(b.fixed_amount || 0),
        }))
      );
    }

    setLoading(false);
  }

  const handleToggleEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map((e) => e.id)));
    }
  };

  const handleRunPayroll = async () => {
    if (selectedEmployees.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    const payrollRecords = [];

    for (const employeeId of selectedEmployees) {
      const contract = contracts.get(employeeId);
      const employee = employees.find((e) => e.id === employeeId);

      const baseSalary = contract?.base_salary || employee?.salary || 0;
      if (baseSalary === 0) continue;

      const calculation = calculatePayroll(
        {
          baseSalary,
          housingAllowance: contract?.housing_allowance || 0,
          transportAllowance: contract?.transport_allowance || 0,
          lunchAllowance: contract?.lunch_allowance || 0,
          otherAllowances: contract?.other_allowances || 0,
          bonuses: 0,
          otherDeductions: 0,
        },
        statutoryRates,
        payeBrackets
      );

      payrollRecords.push({
        employee_id: employeeId,
        pay_period_start: payPeriod.start,
        pay_period_end: payPeriod.end,
        base_salary: calculation.baseSalary,
        housing_allowance: calculation.housingAllowance,
        transport_allowance: calculation.transportAllowance,
        lunch_allowance: calculation.lunchAllowance,
        other_allowances: calculation.otherAllowances,
        gross_pay: calculation.grossPay,
        bonuses: calculation.bonuses,
        napsa_employee: calculation.napsaEmployee,
        napsa_employer: calculation.napsaEmployer,
        nhima_employee: calculation.nhimaEmployee,
        nhima_employer: calculation.nhimaEmployer,
        paye: calculation.paye,
        deductions: calculation.totalDeductions,
        tax: calculation.paye,
        net_pay: calculation.netPay,
        payment_status: "pending",
      });
    }

    const { error } = await supabase.from("payroll_records").insert(payrollRecords);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Payroll processed for ${payrollRecords.length} employees`,
      });
      setOpen(false);
      onSuccess();
    }

    setProcessing(false);
  };

  const calculateTotals = () => {
    let totalGross = 0;
    let totalNet = 0;

    selectedEmployees.forEach((employeeId) => {
      const contract = contracts.get(employeeId);
      const employee = employees.find((e) => e.id === employeeId);
      const baseSalary = contract?.base_salary || employee?.salary || 0;

      if (baseSalary > 0) {
        const calculation = calculatePayroll(
          {
            baseSalary,
            housingAllowance: contract?.housing_allowance || 0,
            transportAllowance: contract?.transport_allowance || 0,
            lunchAllowance: contract?.lunch_allowance || 0,
            otherAllowances: contract?.other_allowances || 0,
            bonuses: 0,
            otherDeductions: 0,
          },
          statutoryRates,
          payeBrackets
        );
        totalGross += calculation.grossPay;
        totalNet += calculation.netPay;
      }
    });

    return { totalGross, totalNet };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <DollarSign className="w-4 h-4 mr-2" />
          Run Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Run Payroll
          </DialogTitle>
          <DialogDescription>
            Process payroll for selected employees with statutory deductions
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pay Period Start</Label>
                <Input
                  type="date"
                  value={payPeriod.start}
                  onChange={(e) => setPayPeriod({ ...payPeriod, start: e.target.value })}
                />
              </div>
              <div>
                <Label>Pay Period End</Label>
                <Input
                  type="date"
                  value={payPeriod.end}
                  onChange={(e) => setPayPeriod({ ...payPeriod, end: e.target.value })}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="flex justify-between items-center text-sm">
                  <span>NAPSA (Employee): {statutoryRates.napsa_employee}%</span>
                  <span>NHIMA: {statutoryRates.nhima_employee}%</span>
                  <span>PAYE: Progressive</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedEmployees.size === employees.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label>Select All ({employees.length} employees)</Label>
              </div>
              <Badge variant="secondary">{selectedEmployees.size} selected</Badge>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {employees.map((employee) => {
                  const contract = contracts.get(employee.id);
                  const salary = contract?.base_salary || employee.salary || 0;
                  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedEmployees.has(employee.id)}
                          onCheckedChange={() => handleToggleEmployee(employee.id)}
                        />
                        <div>
                          <p className="font-medium">{fullName || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatZMW(salary)}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract ? "Contract" : "Profile"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross</p>
                    <p className="text-xl font-bold">{formatZMW(totals.totalGross)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Net</p>
                    <p className="text-xl font-bold text-primary">{formatZMW(totals.totalNet)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleRunPayroll}
              disabled={processing || selectedEmployees.size === 0}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payroll for {selectedEmployees.size} Employees
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
