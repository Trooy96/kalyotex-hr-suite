import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    user: { name: "Sarah Johnson", avatar: "", initials: "SJ" },
    action: "submitted leave request",
    time: "2 mins ago",
    type: "leave",
  },
  {
    id: 2,
    user: { name: "Michael Chen", avatar: "", initials: "MC" },
    action: "completed onboarding",
    time: "15 mins ago",
    type: "onboarding",
  },
  {
    id: 3,
    user: { name: "Emily Davis", avatar: "", initials: "ED" },
    action: "updated profile information",
    time: "1 hour ago",
    type: "profile",
  },
  {
    id: 4,
    user: { name: "James Wilson", avatar: "", initials: "JW" },
    action: "clocked in",
    time: "2 hours ago",
    type: "attendance",
  },
  {
    id: 5,
    user: { name: "Lisa Anderson", avatar: "", initials: "LA" },
    action: "submitted expense report",
    time: "3 hours ago",
    type: "expense",
  },
];

const typeColors: Record<string, string> = {
  leave: "bg-warning/10 text-warning",
  onboarding: "bg-success/10 text-success",
  profile: "bg-info/10 text-info",
  attendance: "bg-primary/10 text-primary",
  expense: "bg-accent/10 text-accent",
};

export function RecentActivity() {
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
              <AvatarImage src={activity.user.avatar} />
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
              className={cn("capitalize text-xs", typeColors[activity.type])}
            >
              {activity.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
