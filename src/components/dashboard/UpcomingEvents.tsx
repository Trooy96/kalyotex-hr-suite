import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  {
    id: 1,
    title: "Team Meeting",
    date: "Today, 2:00 PM",
    type: "meeting",
    icon: Video,
  },
  {
    id: 2,
    title: "Sarah's Birthday",
    date: "Tomorrow",
    type: "birthday",
    icon: Gift,
  },
  {
    id: 3,
    title: "Performance Reviews",
    date: "Feb 5, 2025",
    type: "review",
    icon: Users,
  },
  {
    id: 4,
    title: "Company Holiday",
    date: "Feb 14, 2025",
    type: "holiday",
    icon: Calendar,
  },
];

const typeStyles: Record<string, { bg: string; icon: string }> = {
  meeting: { bg: "bg-info/10", icon: "text-info" },
  birthday: { bg: "bg-accent/10", icon: "text-accent" },
  review: { bg: "bg-warning/10", icon: "text-warning" },
  holiday: { bg: "bg-success/10", icon: "text-success" },
};

export function UpcomingEvents() {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => {
          const Icon = event.icon;
          const styles = typeStyles[event.type];
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
