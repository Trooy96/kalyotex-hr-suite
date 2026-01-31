import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const attendanceData = [
  {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    department: "Engineering",
    clockIn: "09:00 AM",
    clockOut: null,
    status: "present",
    breakTime: "45 min",
  },
  {
    id: "2",
    name: "Michael Chen",
    initials: "MC",
    department: "Sales",
    clockIn: "08:45 AM",
    clockOut: null,
    status: "present",
    breakTime: "30 min",
  },
  {
    id: "3",
    name: "Emily Davis",
    initials: "ED",
    department: "Marketing",
    clockIn: "09:15 AM",
    clockOut: null,
    status: "on-break",
    breakTime: "15 min",
  },
  {
    id: "4",
    name: "James Wilson",
    initials: "JW",
    department: "HR",
    clockIn: null,
    clockOut: null,
    status: "absent",
    breakTime: "0 min",
  },
  {
    id: "5",
    name: "Lisa Anderson",
    initials: "LA",
    department: "Finance",
    clockIn: "08:30 AM",
    clockOut: "05:30 PM",
    status: "completed",
    breakTime: "60 min",
  },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-success/10", text: "text-success", label: "Present" },
  absent: { bg: "bg-destructive/10", text: "text-destructive", label: "Absent" },
  "on-break": { bg: "bg-warning/10", text: "text-warning", label: "On Break" },
  completed: { bg: "bg-info/10", text: "text-info", label: "Completed" },
};

export default function Attendance() {
  return (
    <AppLayout title="Attendance" subtitle="Track daily attendance">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <LogIn className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">142</p>
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
              <p className="text-2xl font-bold">14</p>
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
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">On Break</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <Clock className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">7.5h</p>
              <p className="text-sm text-muted-foreground">Avg. Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Clock In
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Clock Out
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Break
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record, index) => {
                  const status = statusStyles[record.status];
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
                              {record.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.department}
                      </td>
                      <td className="py-3 px-4">
                        {record.clockIn || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {record.clockOut || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.breakTime}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={cn(status.bg, status.text)}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
