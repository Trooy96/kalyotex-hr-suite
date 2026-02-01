import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  employee: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const statusStyles: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  pending: { bg: "bg-warning/10", text: "text-warning", icon: AlertCircle },
  approved: { bg: "bg-success/10", text: "text-success", icon: CheckCircle },
  rejected: { bg: "bg-destructive/10", text: "text-destructive", icon: XCircle },
};

const leaveTypeStyles: Record<string, string> = {
  annual: "bg-primary/10 text-primary",
  sick: "bg-destructive/10 text-destructive",
  personal: "bg-info/10 text-info",
  wfh: "bg-accent/10 text-accent",
};

export default function Leave() {
  const { user, loading: authLoading } = useRequireAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, onLeave: 0, totalDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const today = new Date().toISOString().split('T')[0];
      
      const [requestsRes, pendingRes, approvedRes, onLeaveRes] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("id, leave_type, start_date, end_date, reason, status, employee:profiles!leave_requests_employee_id_fkey(first_name, last_name)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("leave_requests").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("leave_requests").select("id", { count: "exact" }).eq("status", "approved"),
        supabase.from("leave_requests").select("id", { count: "exact" }).eq("status", "approved").lte("start_date", today).gte("end_date", today),
      ]);

      if (requestsRes.data) setLeaveRequests(requestsRes.data as LeaveRequest[]);
      setStats({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        onLeave: onLeaveRes.count || 0,
        totalDays: 0,
      });
      setLoading(false);
    }

    if (user) fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getDaysDiff = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <AppLayout title="Leave Management" subtitle="Manage employee leave requests">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <Calendar className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.onLeave}</p>
              <p className="text-sm text-muted-foreground">On Leave Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaveRequests.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Leave Requests</CardTitle>
          <Button variant="gradient" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request, index) => {
              const status = statusStyles[request.status] || statusStyles.pending;
              const StatusIcon = status.icon;
              const firstName = request.employee?.first_name || "";
              const lastName = request.employee?.last_name || "";
              const fullName = `${firstName} ${lastName}`.trim() || "Unknown";
              const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
              const days = getDaysDiff(request.start_date, request.end_date);
              
              return (
                <div
                  key={request.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-up gap-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{fullName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.reason || "No reason provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:gap-6">
                    <Badge
                      variant="secondary"
                      className={leaveTypeStyles[request.leave_type] || "bg-muted"}
                    >
                      {request.leave_type}
                    </Badge>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(request.start_date), "MMM d, yyyy")}
                      </span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">
                        {format(new Date(request.end_date), "MMM d, yyyy")}
                      </span>
                      <span className="ml-2 font-medium">
                        ({days} {days === 1 ? "day" : "days"})
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("capitalize flex items-center gap-1", status.bg, status.text)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {request.status}
                    </Badge>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button variant="success" size="sm">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {leaveRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
