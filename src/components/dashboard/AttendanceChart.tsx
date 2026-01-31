import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", present: 142, absent: 14 },
  { day: "Tue", present: 148, absent: 8 },
  { day: "Wed", present: 145, absent: 11 },
  { day: "Thu", present: 150, absent: 6 },
  { day: "Fri", present: 138, absent: 18 },
  { day: "Sat", present: 45, absent: 2 },
  { day: "Sun", present: 0, absent: 0 },
];

export function AttendanceChart() {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Weekly Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(175, 60%, 35%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(175, 60%, 35%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(0, 72%, 51%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(0, 72%, 51%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="hsl(175, 60%, 35%)"
                strokeWidth={2}
                fill="url(#presentGradient)"
                name="Present"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="hsl(0, 72%, 51%)"
                strokeWidth={2}
                fill="url(#absentGradient)"
                name="Absent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
