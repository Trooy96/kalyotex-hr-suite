import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { DepartmentChart } from "@/components/dashboard/DepartmentChart";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { Users, UserCheck, Calendar, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    openPositions: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const today = new Date().toISOString().split('T')[0];
      
      const [employeesRes, attendanceRes, leaveRes, jobsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("attendance_records").select("id", { count: "exact" }).eq("record_date", today).eq("status", "present"),
        supabase.from("leave_requests").select("id", { count: "exact" }).eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("job_postings").select("id", { count: "exact" }).eq("status", "open"),
      ]);

      setStats({
        totalEmployees: employeesRes.count || 0,
        presentToday: attendanceRes.count || 0,
        onLeave: leaveRes.count || 0,
        openPositions: jobsRes.count || 0,
      });
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees.toString(),
      icon: <Users className="w-6 h-6" />,
      iconBgClass: "bg-primary/10 text-primary",
    },
    {
      title: "Present Today",
      value: stats.presentToday.toString(),
      icon: <UserCheck className="w-6 h-6" />,
      iconBgClass: "bg-success/10 text-success",
    },
    {
      title: "On Leave",
      value: stats.onLeave.toString(),
      icon: <Calendar className="w-6 h-6" />,
      iconBgClass: "bg-warning/10 text-warning",
    },
    {
      title: "Open Positions",
      value: stats.openPositions.toString(),
      icon: <Briefcase className="w-6 h-6" />,
      iconBgClass: "bg-accent/10 text-accent",
    },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Welcome back">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgClass={stat.iconBgClass}
            delay={index * 100}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
        <AttendanceChart />
        <DepartmentChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RecentActivity />
        <UpcomingEvents />
      </div>
    </AppLayout>
  );
};

export default Index;
