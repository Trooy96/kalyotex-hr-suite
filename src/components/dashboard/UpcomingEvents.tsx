import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Gift, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isWithinInterval, startOfToday, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
  icon: typeof Calendar;
}

const typeStyles: Record<string, { bg: string; icon: string }> = {
  review: { bg: "bg-warning/10", icon: "text-warning" },
  leave: { bg: "bg-info/10", icon: "text-info" },
  interview: { bg: "bg-success/10", icon: "text-success" },
};

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const today = startOfToday();
      const nextWeek = addDays(today, 7);

      const allEvents: Event[] = [];

      // Fetch upcoming performance reviews
      const { data: reviews } = await supabase
        .from("performance_reviews")
        .select(`
          id,
          review_date,
          employee:profiles!performance_reviews_employee_id_fkey(
            first_name,
            last_name
          )
        `)
        .gte("review_date", format(today, "yyyy-MM-dd"))
        .lte("review_date", format(nextWeek, "yyyy-MM-dd"))
        .limit(3);

      reviews?.forEach((review) => {
        const emp = review.employee as any;
        const name = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee";
        allEvents.push({
          id: `review-${review.id}`,
          title: `${name}'s Performance Review`,
          date: format(parseISO(review.review_date), "MMM d, yyyy"),
          type: "review",
          icon: Users,
        });
      });

      // Fetch upcoming approved leaves
      const { data: leaves } = await supabase
        .from("leave_requests")
        .select(`
          id,
          start_date,
          leave_type,
          employee:profiles!leave_requests_employee_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq("status", "approved")
        .gte("start_date", format(today, "yyyy-MM-dd"))
        .lte("start_date", format(nextWeek, "yyyy-MM-dd"))
        .limit(3);

      leaves?.forEach((leave) => {
        const emp = leave.employee as any;
        const name = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee";
        allEvents.push({
          id: `leave-${leave.id}`,
          title: `${name}'s ${leave.leave_type} Leave`,
          date: format(parseISO(leave.start_date), "MMM d, yyyy"),
          type: "leave",
          icon: Calendar,
        });
      });

      // Fetch upcoming interviews
      const { data: interviews } = await supabase
        .from("interviews")
        .select(`
          id,
          scheduled_at,
          application:job_applications(
            applicant_name
          )
        `)
        .eq("status", "scheduled")
        .gte("scheduled_at", today.toISOString())
        .lte("scheduled_at", nextWeek.toISOString())
        .limit(3);

      interviews?.forEach((interview) => {
        const app = interview.application as any;
        allEvents.push({
          id: `interview-${interview.id}`,
          title: `Interview: ${app?.applicant_name || "Candidate"}`,
          date: format(new Date(interview.scheduled_at), "MMM d, h:mm a"),
          type: "interview",
          icon: Users,
        });
      });

      // Sort by date
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(allEvents.slice(0, 4));
      setLoading(false);
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No upcoming events this week
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => {
          const Icon = event.icon;
          const styles = typeStyles[event.type] || { bg: "bg-secondary/50", icon: "text-secondary-foreground" };
          return (
            <div
              key={event.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("p-2 rounded-lg", styles.bg)}>
                <Icon className={cn("w-5 h-5", styles.icon)} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
