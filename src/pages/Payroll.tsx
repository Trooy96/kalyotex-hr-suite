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
  DollarSign,
  Download,
  Search,
  TrendingUp,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface PayrollRecord {
  id: string;
  base_salary: number;
  bonuses: number | null;
  deductions: number | null;
  tax: number | null;
  net_pay: number;
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
  const { user, loading: authLoading } = useRequireAuth();
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

  useEffect(() => {
    async function fetchData() {
      const [recordsRes, pendingRes, paidRes] = await Promise.all([
        supabase
          .from("payroll_records")
          .select(`
            id, base_salary, bonuses, deductions, tax, net_pay, payment_status,
            pay_period_start, pay_period_end, payment_date,
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

    if (user) fetchData();
  }, [user]);

  const filteredRecords = records.filter((record) => {
    const fullName = `${record.employee?.first_name || ""} ${record.employee?.last_name || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
              <p className="text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</p>
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
              <p className="text-2xl font-bold">{formatCurrency(stats.avgSalary)}</p>
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
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="gradient" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Run Payroll
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Period</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Base</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Bonus</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Deductions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Net Pay</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
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
                        {formatCurrency(record.base_salary)}
                      </td>
                      <td className="py-3 px-4 text-right text-success">
                        +{formatCurrency(record.bonuses || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-destructive">
                        -{formatCurrency((record.deductions || 0) + (record.tax || 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {formatCurrency(record.net_pay)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="secondary"
                          className={cn("capitalize flex items-center gap-1 w-fit mx-auto", status.bg, status.text)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {record.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No payroll records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
