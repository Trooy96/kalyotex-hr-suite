import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ClockInDialog } from "@/components/attendance/ClockInDialog";

interface AttendanceRecord {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string | null;
  employee: {
    first_name: string | null;
    last_name: string | null;
    department: { name: string } | null;
  } | null;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-success/10", text: "text-success", label: "Present" },
  absent: { bg: "bg-destructive/10", text: "text-destructive", label: "Absent" },
  late: { bg: "bg-warning/10", text: "text-warning", label: "Late" },
};

export default function Attendance() {
  const { user, loading: authLoading } = useRequireAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ clockedIn: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0];
    
    const [recordsRes, presentRes, absentRes, lateRes] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("id, clock_in, clock_out, status, employee:profiles!attendance_records_employee_id_fkey(first_name, last_name, department:departments(name))")
        .eq("record_date", today)
        .order("clock_in", { ascending: false }),
      supabase.from("attendance_records").select("id", { count: "exact" }).eq("record_date", today).eq("status", "present"),
      supabase.from("attendance_records").select("id", { count: "exact" }).eq("record_date", today).eq("status", "absent"),
      supabase.from("attendance_records").select("id", { count: "exact" }).eq("record_date", today).eq("status", "late"),
    ]);

    if (recordsRes.data) setRecords(recordsRes.data as AttendanceRecord[]);
    setStats({
      clockedIn: presentRes.count || 0,
      absent: absentRes.count || 0,
      late: lateRes.count || 0,
    });
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Attendance" subtitle="Track daily attendance">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <LogIn className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.clockedIn}</p>
              <p className="text-sm text-muted-foreground">Clocked In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Coffee className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.late}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <Clock className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's Attendance</CardTitle>
          {user && <ClockInDialog userId={user.id} onSuccess={fetchData} />}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock In</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock Out</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => {
                  const status = statusStyles[record.status || "present"];
                  const firstName = record.employee?.first_name || "";
                  const lastName = record.employee?.last_name || "";
                  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
                  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
                  
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.employee?.department?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {record.clock_in ? format(new Date(record.clock_in), "h:mm a") : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {record.clock_out ? format(new Date(record.clock_out), "h:mm a") : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className={cn(status.bg, status.text)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No attendance records for today
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
