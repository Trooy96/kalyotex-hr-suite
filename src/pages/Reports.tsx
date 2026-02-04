import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Clock,
  Calendar,
  Download,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { formatZMW } from "@/utils/payrollCalculations";

interface PayrollSummary {
  totalGross: number;
  totalNet: number;
  totalNapsa: number;
  totalNhima: number;
  totalPaye: number;
  employeeCount: number;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: number;
  sick: number;
  maternity: number;
  used: number;
  remaining: number;
}

export default function Reports() {
  const { user, loading: authLoading } = useRequireAuth();
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalGross: 0,
    totalNet: 0,
    totalNapsa: 0,
    totalNhima: 0,
    totalPaye: 0,
    employeeCount: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    attendanceRate: 0,
  });
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;

      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      // Fetch payroll summary
      const { data: payrollData } = await supabase
        .from("payroll_records")
        .select("gross_pay, net_pay, napsa_employee, nhima_employee, paye")
        .gte("pay_period_start", format(monthStart, "yyyy-MM-dd"))
        .lte("pay_period_end", format(monthEnd, "yyyy-MM-dd"));

      if (payrollData) {
        setPayrollSummary({
          totalGross: payrollData.reduce((sum, r) => sum + (r.gross_pay || 0), 0),
          totalNet: payrollData.reduce((sum, r) => sum + (r.net_pay || 0), 0),
          totalNapsa: payrollData.reduce((sum, r) => sum + (r.napsa_employee || 0), 0),
          totalNhima: payrollData.reduce((sum, r) => sum + (r.nhima_employee || 0), 0),
          totalPaye: payrollData.reduce((sum, r) => sum + (r.paye || 0), 0),
          employeeCount: payrollData.length,
        });
      }

      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("status")
        .gte("record_date", format(monthStart, "yyyy-MM-dd"))
        .lte("record_date", format(monthEnd, "yyyy-MM-dd"));

      if (attendanceData) {
        const presentDays = attendanceData.filter((a) => a.status === "present").length;
        const absentDays = attendanceData.filter((a) => a.status === "absent").length;
        const lateDays = attendanceData.filter((a) => a.status === "late").length;
        const totalDays = attendanceData.length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        setAttendanceStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
        });
      }

      // Fetch leave balances
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");

      const { data: leaveData } = await supabase
        .from("leave_requests")
        .select("employee_id, leave_type, start_date, end_date, status")
        .eq("status", "approved");

      if (profilesData) {
        const balances: LeaveBalance[] = profilesData.map((profile) => {
          const employeeLeaves = leaveData?.filter((l) => l.employee_id === profile.id) || [];
          const usedDays = employeeLeaves.reduce((sum, leave) => {
            const days = differenceInDays(new Date(leave.end_date), new Date(leave.start_date)) + 1;
            return sum + days;
          }, 0);

          return {
            employeeId: profile.id,
            employeeName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown",
            annual: 21, // Default annual leave days
            sick: 10,
            maternity: 90,
            used: usedDays,
            remaining: Math.max(0, 21 - usedDays),
          };
        });

        setLeaveBalances(balances.slice(0, 10)); // Limit to 10 for display
      }

      setLoading(false);
    }

    fetchReports();
  }, [user, selectedMonth]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Reports" subtitle="View payroll, attendance, and leave reports">
      <div className="flex items-center justify-between mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(2024, i, 1);
              return (
                <SelectItem key={i} value={format(date, "yyyy-MM")}>
                  {format(date, "MMMM yyyy")}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <Tabs defaultValue="payroll" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Leave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Payroll</p>
                    <p className="text-xl font-bold">{formatZMW(payrollSummary.totalGross)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Payroll</p>
                    <p className="text-xl font-bold">{formatZMW(payrollSummary.totalNet)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <BarChart3 className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total PAYE</p>
                    <p className="text-xl font-bold">{formatZMW(payrollSummary.totalPaye)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Users className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="text-xl font-bold">{payrollSummary.employeeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Statutory Contributions Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">NAPSA</h4>
                  <p className="text-2xl font-bold text-primary">{formatZMW(payrollSummary.totalNapsa)}</p>
                  <p className="text-sm text-muted-foreground">Employee Contribution (5%)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">NHIMA</h4>
                  <p className="text-2xl font-bold text-primary">{formatZMW(payrollSummary.totalNhima)}</p>
                  <p className="text-sm text-muted-foreground">Employee Contribution (1%)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">PAYE</h4>
                  <p className="text-2xl font-bold text-primary">{formatZMW(payrollSummary.totalPaye)}</p>
                  <p className="text-sm text-muted-foreground">Pay As You Earn Tax</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present Days</p>
                    <p className="text-xl font-bold">{attendanceStats.presentDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Clock className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                    <p className="text-xl font-bold">{attendanceStats.absentDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Late Days</p>
                    <p className="text-xl font-bold">{attendanceStats.lateDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <PieChart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-xl font-bold">{attendanceStats.attendanceRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>Attendance chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Annual</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Sick</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Used</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalances.map((balance) => (
                      <tr key={balance.employeeId} className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">{balance.employeeName}</td>
                        <td className="py-3 px-4 text-center">{balance.annual}</td>
                        <td className="py-3 px-4 text-center">{balance.sick}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary">{balance.used}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={balance.remaining > 5 ? "default" : "destructive"}>
                            {balance.remaining}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {leaveBalances.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No leave data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
