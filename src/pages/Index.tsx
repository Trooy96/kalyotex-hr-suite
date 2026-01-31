import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { DepartmentChart } from "@/components/dashboard/DepartmentChart";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { Users, UserCheck, Calendar, Briefcase } from "lucide-react";

const stats = [
  {
    title: "Total Employees",
    value: "156",
    change: { value: 12, type: "increase" as const },
    icon: <Users className="w-6 h-6" />,
    iconBgClass: "bg-primary/10 text-primary",
  },
  {
    title: "Present Today",
    value: "142",
    change: { value: 3, type: "increase" as const },
    icon: <UserCheck className="w-6 h-6" />,
    iconBgClass: "bg-success/10 text-success",
  },
  {
    title: "On Leave",
    value: "8",
    change: { value: 5, type: "decrease" as const },
    icon: <Calendar className="w-6 h-6" />,
    iconBgClass: "bg-warning/10 text-warning",
  },
  {
    title: "Open Positions",
    value: "12",
    change: { value: 25, type: "increase" as const },
    icon: <Briefcase className="w-6 h-6" />,
    iconBgClass: "bg-accent/10 text-accent",
  },
];

const Index = () => {
  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, Admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            iconBgClass={stat.iconBgClass}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
        <AttendanceChart />
        <DepartmentChart />
      </div>

      {/* Activity & Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RecentActivity />
        <UpcomingEvents />
      </div>
    </AppLayout>
  );
};

export default Index;
