import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Download,
  Search,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  Eye,
  Edit,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { exportPayrollToPDF, exportIndividualPayslip } from "@/utils/payrollPdfExport";
import { useToast } from "@/hooks/use-toast";
import { RunPayrollDialog } from "@/components/payroll/RunPayrollDialog";
import { formatZMW } from "@/utils/payrollCalculations";

interface PayrollRecord {
  id: string;
  base_salary: number;
  bonuses: number | null;
  deductions: number | null;
  tax: number | null;
  net_pay: number;
  gross_pay: number | null;
  housing_allowance: number | null;
  transport_allowance: number | null;
  lunch_allowance: number | null;
  other_allowances: number | null;
  napsa_employee: number | null;
  napsa_employer: number | null;
  nhima_employee: number | null;
  nhima_employer: number | null;
  paye: number | null;
  payment_status: string | null;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string | null;
  employee: {
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    department: { name: string } | null;
  } | null;
}

const statusStyles: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  pending: { bg: "bg-warning/10", text: "text-warning", icon: Clock },
  paid: { bg: "bg-success/10", text: "text-success", icon: CheckCircle },
  processing: { bg: "bg-info/10", text: "text-info", icon: CreditCard },
};

export default function Payroll() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager } = useUserRole();
  const canManage = isAdmin || isManager;
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalPayroll: 0,
    pending: 0,
    paid: 0,
    avgSalary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  async function fetchData() {
    const [recordsRes, pendingRes, paidRes] = await Promise.all([
      supabase
        .from("payroll_records")
        .select(`
          id, base_salary, bonuses, deductions, tax, net_pay, payment_status,
          pay_period_start, pay_period_end, payment_date, gross_pay,
          housing_allowance, transport_allowance, lunch_allowance, other_allowances,
          napsa_employee, napsa_employer, nhima_employee, nhima_employer, paye,
          employee:profiles!payroll_records_employee_id_fkey(
            first_name, last_name, position,
            department:departments(name)
          )
        `)
        .order("pay_period_end", { ascending: false })
        .limit(50),
      supabase.from("payroll_records").select("net_pay", { count: "exact" }).eq("payment_status", "pending"),
      supabase.from("payroll_records").select("net_pay", { count: "exact" }).eq("payment_status", "paid"),
    ]);

    if (recordsRes.data) {
      const data = recordsRes.data as PayrollRecord[];
      setRecords(data);
      
      const totalPayroll = data.reduce((sum, r) => sum + r.net_pay, 0);
      const avgSalary = data.length > 0 ? totalPayroll / data.length : 0;
      
      setStats({
        totalPayroll,
        pending: pendingRes.count || 0,
        paid: paidRes.count || 0,
        avgSalary,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleStatusUpdate = async () => {
    if (!selectedRecord || !newStatus) return;
    setSavingStatus(true);

    const updateData: any = { payment_status: newStatus };
    if (newStatus === "paid") {
      updateData.payment_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("payroll_records")
      .update(updateData)
      .eq("id", selectedRecord.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Status Updated", description: `Payment marked as ${newStatus}` });
      setEditingStatus(false);
      setDetailOpen(false);
      fetchData();
    }
    setSavingStatus(false);
  };

  const filteredRecords = records.filter((record) => {
    const fullName = `${record.employee?.first_name || ""} ${record.employee?.last_name || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Payroll" subtitle="Manage employee compensation">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatZMW(stats.totalPayroll)}</p>
              <p className="text-sm text-muted-foreground">Total Payroll</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.paid}</p>
              <p className="text-sm text-muted-foreground">Paid This Period</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <TrendingUp className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatZMW(stats.avgSalary)}</p>
              <p className="text-sm text-muted-foreground">Average Salary</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Payroll Records</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (filteredRecords.length === 0) {
                      toast({ title: "No records", description: "No payroll records to export", variant: "destructive" });
                      return;
                    }
                    exportPayrollToPDF(filteredRecords);
                    toast({ title: "PDF Generated", description: "Payroll report has been downloaded" });
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export All Records
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canManage && <RunPayrollDialog onSuccess={fetchData} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Period</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Gross</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">PAYE</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">NAPSA</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Net Pay</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const status = statusStyles[record.payment_status || "pending"];
                  const StatusIcon = status.icon;
                  const firstName = record.employee?.first_name || "";
                  const lastName = record.employee?.last_name || "";
                  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
                  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.employee?.position || "No position"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(record.pay_period_start), "MMM d")} -{" "}
                        {format(new Date(record.pay_period_end), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatZMW(record.gross_pay || record.base_salary)}
                      </td>
                      <td className="py-3 px-4 text-right text-destructive">
                        -{formatZMW(record.paye || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-destructive">
                        -{formatZMW(record.napsa_employee || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {formatZMW(record.net_pay)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canManage ? (
                          <Select
                            value={record.payment_status || "pending"}
                            onValueChange={async (val) => {
                              const updateData: any = { payment_status: val };
                              if (val === "paid") updateData.payment_date = new Date().toISOString().split("T")[0];
                              const { error } = await supabase
                                .from("payroll_records")
                                .update(updateData)
                                .eq("id", record.id);
                              if (error) {
                                toast({ variant: "destructive", title: "Error", description: error.message });
                              } else {
                                toast({ title: "Updated", description: `Status changed to ${val}` });
                                fetchData();
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px] h-8 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={cn("capitalize flex items-center gap-1 w-fit mx-auto", status.bg, status.text)}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {record.payment_status}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setNewStatus(record.payment_status || "pending");
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              exportIndividualPayslip(record);
                              toast({
                                title: "Payslip Generated",
                                description: `Payslip for ${fullName} has been downloaded`,
                              });
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No payroll records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {`${selectedRecord.employee?.first_name?.[0] || ""}${selectedRecord.employee?.last_name?.[0] || ""}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {selectedRecord.employee?.first_name} {selectedRecord.employee?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.employee?.position} • {selectedRecord.employee?.department?.name}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground">Earnings</h4>
                <div className="flex justify-between"><span>Base Salary</span><span className="font-medium">{formatZMW(selectedRecord.base_salary)}</span></div>
                <div className="flex justify-between"><span>Housing Allowance</span><span>{formatZMW(selectedRecord.housing_allowance || 0)}</span></div>
                <div className="flex justify-between"><span>Transport Allowance</span><span>{formatZMW(selectedRecord.transport_allowance || 0)}</span></div>
                <div className="flex justify-between"><span>Lunch Allowance</span><span>{formatZMW(selectedRecord.lunch_allowance || 0)}</span></div>
                <div className="flex justify-between"><span>Other Allowances</span><span>{formatZMW(selectedRecord.other_allowances || 0)}</span></div>
                <div className="flex justify-between"><span>Bonuses</span><span className="text-success">{formatZMW(selectedRecord.bonuses || 0)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2"><span>Gross Pay</span><span>{formatZMW(selectedRecord.gross_pay || 0)}</span></div>
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground">Deductions</h4>
                <div className="flex justify-between"><span>PAYE</span><span className="text-destructive">-{formatZMW(selectedRecord.paye || 0)}</span></div>
                <div className="flex justify-between"><span>NAPSA (Employee)</span><span className="text-destructive">-{formatZMW(selectedRecord.napsa_employee || 0)}</span></div>
                <div className="flex justify-between"><span>NHIMA (Employee)</span><span className="text-destructive">-{formatZMW(selectedRecord.nhima_employee || 0)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2"><span>Total Deductions</span><span className="text-destructive">-{formatZMW(selectedRecord.deductions || 0)}</span></div>
              </div>

              <div className="flex justify-between text-lg font-bold bg-primary/5 p-3 rounded-lg">
                <span>Net Pay</span>
                <span className="text-primary">{formatZMW(selectedRecord.net_pay)}</span>
              </div>

              <div className="space-y-2 text-sm border-t pt-3">
                <h4 className="font-medium text-muted-foreground">Employer Contributions</h4>
                <div className="flex justify-between"><span>NAPSA (Employer)</span><span>{formatZMW(selectedRecord.napsa_employer || 0)}</span></div>
                <div className="flex justify-between"><span>NHIMA (Employer)</span><span>{formatZMW(selectedRecord.nhima_employer || 0)}</span></div>
              </div>

              {canManage && (
                <div className="border-t pt-3">
                  {editingStatus ? (
                    <div className="flex items-center gap-2">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleStatusUpdate} disabled={savingStatus} size="sm">
                        {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingStatus(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setEditingStatus(true)} className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Payment Status
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
