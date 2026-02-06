import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface Activity {
  id: string;
  user: { name: string; avatar: string | null; initials: string };
  action: string;
  time: string;
  type: string;
}

const typeColors: Record<string, string> = {
  leave: "bg-warning/10 text-warning",
  attendance: "bg-primary/10 text-primary",
  profile: "bg-info/10 text-info",
  hire: "bg-success/10 text-success",
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      // Fetch recent leave requests
      const { data: leaveData } = await supabase
        .from("leave_requests")
        .select(`
          id,
          created_at,
          leave_type,
          employee:profiles!leave_requests_employee_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      // Fetch recent attendance records
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select(`
          id,
          created_at,
          status,
          employee:profiles!attendance_records_employee_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      // Fetch recent profile updates
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(2);

      const allActivities: Activity[] = [];

      // Map leave requests
      leaveData?.forEach((leave) => {
        const emp = leave.employee as any;
        const name = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Unknown";
        allActivities.push({
          id: `leave-${leave.id}`,
          user: {
            name,
            avatar: emp?.avatar_url || null,
            initials: `${emp?.first_name?.[0] || ""}${emp?.last_name?.[0] || ""}`.toUpperCase() || "?",
          },
          action: `submitted ${leave.leave_type} leave request`,
          time: formatDistanceToNow(new Date(leave.created_at), { addSuffix: true }),
          type: "leave",
        });
      });

      // Map attendance records
      attendanceData?.forEach((att) => {
        const emp = att.employee as any;
        const name = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Unknown";
        allActivities.push({
          id: `att-${att.id}`,
          user: {
            name,
            avatar: emp?.avatar_url || null,
            initials: `${emp?.first_name?.[0] || ""}${emp?.last_name?.[0] || ""}`.toUpperCase() || "?",
          },
          action: att.status === "present" ? "clocked in" : `marked as ${att.status}`,
          time: formatDistanceToNow(new Date(att.created_at), { addSuffix: true }),
          type: "attendance",
        });
      });

      // Map profile updates
      profileData?.forEach((profile) => {
        const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";
        const isNew = profile.created_at === profile.updated_at;
        allActivities.push({
          id: `profile-${profile.id}`,
          user: {
            name,
            avatar: profile.avatar_url,
            initials: `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?",
          },
          action: isNew ? "joined the company" : "updated profile information",
          time: formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }),
          type: isNew ? "hire" : "profile",
        });
      });

      // Sort by time and take top 5
      allActivities.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
      });

      setActivities(allActivities.slice(0, 5));
      setLoading(false);
    }

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No recent activity
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-center gap-4 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.user.avatar || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-foreground">
                  {activity.user.name}
                </span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn("capitalize text-xs", typeColors[activity.type] || "bg-secondary")}
            >
              {activity.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
