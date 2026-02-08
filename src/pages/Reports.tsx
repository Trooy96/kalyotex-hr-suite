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
import { format, startOfMonth, endOfMonth, differenceInDays, subMonths } from "date-fns";
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

interface AttendanceRecord {
  employee_name: string;
  status: string;
  record_date: string;
  clock_in: string | null;
  clock_out: string | null;
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
    totalGross: 0, totalNet: 0, totalNapsa: 0, totalNhima: 0, totalPaye: 0, employeeCount: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, attendanceRate: 0,
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);

  // Generate last 12 months dynamically
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return { value: format(date, "yyyy-MM"), label: format(date, "MMMM yyyy") };
  });

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;

      const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
      const monthEnd = endOfMonth(new Date(selectedMonth + "-01"));

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

      // Fetch attendance stats with employee details
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("status, record_date, clock_in, clock_out, employee:profiles!attendance_records_employee_id_fkey(first_name, last_name)")
        .gte("record_date", format(monthStart, "yyyy-MM-dd"))
        .lte("record_date", format(monthEnd, "yyyy-MM-dd"))
        .order("record_date", { ascending: false });

      if (attendanceData) {
        const presentDays = attendanceData.filter((a) => a.status === "present").length;
        const absentDays = attendanceData.filter((a) => a.status === "absent").length;
        const lateDays = attendanceData.filter((a) => a.status === "late").length;
        const totalDays = attendanceData.length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        setAttendanceStats({ totalDays, presentDays, absentDays, lateDays, attendanceRate });

        setAttendanceRecords(attendanceData.map((a: any) => ({
          employee_name: `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim() || "Unknown",
          status: a.status || "present",
          record_date: a.record_date,
          clock_in: a.clock_in,
          clock_out: a.clock_out,
        })));
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
            annual: 21,
            sick: 10,
            maternity: 90,
            used: usedDays,
            remaining: Math.max(0, 21 - usedDays),
          };
        });

        setLeaveBalances(balances.slice(0, 20));
      }

      setLoading(false);
    }

    setLoading(true);
    fetchReports();
  }, [user, selectedMonth]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const attendanceStatusStyles: Record<string, string> = {
    present: "bg-success/10 text-success",
    absent: "bg-destructive/10 text-destructive",
    late: "bg-warning/10 text-warning",
    "half-day": "bg-info/10 text-info",
  };

  return (
    <AppLayout title="Reports" subtitle="View payroll, attendance, and leave reports">
      <div className="flex items-center justify-between mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
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
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-xl font-bold">{attendanceStats.totalDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
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
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-xl font-bold">{attendanceStats.absentDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <PieChart className="w-5 h-5 text-warning" />
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
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No attendance records for this period</p>
                  <p className="text-sm mt-1">Attendance records will appear here once employees clock in.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock In</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock Out</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{record.employee_name}</td>
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(record.record_date), "MMM d, yyyy")}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {record.clock_in ? format(new Date(record.clock_in), "hh:mm a") : "—"}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {record.clock_out ? format(new Date(record.clock_out), "hh:mm a") : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className={`capitalize ${attendanceStatusStyles[record.status] || ""}`}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
