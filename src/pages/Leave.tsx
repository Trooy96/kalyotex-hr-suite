import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const leaveRequests = [
  {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    type: "Annual Leave",
    startDate: "Feb 10, 2025",
    endDate: "Feb 14, 2025",
    days: 5,
    reason: "Family vacation",
    status: "pending",
  },
  {
    id: "2",
    name: "Michael Chen",
    initials: "MC",
    type: "Sick Leave",
    startDate: "Feb 3, 2025",
    endDate: "Feb 4, 2025",
    days: 2,
    reason: "Medical appointment",
    status: "approved",
  },
  {
    id: "3",
    name: "Emily Davis",
    initials: "ED",
    type: "Personal Leave",
    startDate: "Feb 7, 2025",
    endDate: "Feb 7, 2025",
    days: 1,
    reason: "Personal matters",
    status: "pending",
  },
  {
    id: "4",
    name: "James Wilson",
    initials: "JW",
    type: "Annual Leave",
    startDate: "Feb 1, 2025",
    endDate: "Feb 5, 2025",
    days: 5,
    reason: "Traveling",
    status: "rejected",
  },
  {
    id: "5",
    name: "Lisa Anderson",
    initials: "LA",
    type: "Work From Home",
    startDate: "Feb 6, 2025",
    endDate: "Feb 6, 2025",
    days: 1,
    reason: "Home repair appointment",
    status: "approved",
  },
];

const statusStyles: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  pending: { bg: "bg-warning/10", text: "text-warning", icon: AlertCircle },
  approved: { bg: "bg-success/10", text: "text-success", icon: CheckCircle },
  rejected: { bg: "bg-destructive/10", text: "text-destructive", icon: XCircle },
};

const leaveTypeStyles: Record<string, string> = {
  "Annual Leave": "bg-primary/10 text-primary",
  "Sick Leave": "bg-destructive/10 text-destructive",
  "Personal Leave": "bg-info/10 text-info",
  "Work From Home": "bg-accent/10 text-accent",
};

export default function Leave() {
  return (
    <AppLayout title="Leave Management" subtitle="Manage employee leave requests">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
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
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Approved This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <Calendar className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
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
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Total Days Used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
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
              const status = statusStyles[request.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={request.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-up gap-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {request.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{request.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:gap-6">
                    <Badge
                      variant="secondary"
                      className={leaveTypeStyles[request.type]}
                    >
                      {request.type}
                    </Badge>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {request.startDate}
                      </span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">
                        {request.endDate}
                      </span>
                      <span className="ml-2 font-medium">
                        ({request.days} {request.days === 1 ? "day" : "days"})
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
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
