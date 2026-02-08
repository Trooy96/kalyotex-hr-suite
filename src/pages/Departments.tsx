import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AddDepartmentDialog } from "@/components/departments/AddDepartmentDialog";

interface Department {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
}

export default function Departments() {
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [deptRes, profilesRes] = await Promise.all([
      supabase.from("departments").select("id, name, description"),
      supabase.from("profiles").select("id, department_id"),
    ]);

    if (deptRes.data && profilesRes.data) {
      const deptCounts = profilesRes.data.reduce((acc, profile) => {
        if (profile.department_id) {
          acc[profile.department_id] = (acc[profile.department_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      setDepartments(
        deptRes.data.map((dept) => ({
          ...dept,
          employeeCount: deptCounts[dept.id] || 0,
        }))
      );
      setTotalEmployees(profilesRes.data.length);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const colors = [
    "bg-primary/10 text-primary",
    "bg-accent/10 text-accent",
    "bg-info/10 text-info",
    "bg-success/10 text-success",
    "bg-warning/10 text-warning",
    "bg-purple-500/10 text-purple-500",
  ];

  return (
    <AppLayout title="Departments" subtitle="Manage company departments">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {departments.length} Departments
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {totalEmployees} Total Employees
          </Badge>
        </div>
        {canEdit && <AddDepartmentDialog onSuccess={fetchData} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {departments.map((dept, index) => {
          const color = colors[index % colors.length];
          const maxCapacity = Math.max(dept.employeeCount + 10, 20);
          const capacityPercentage = (dept.employeeCount / maxCapacity) * 100;
          
          return (
            <Card
              key={dept.id}
              className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dept.description || "No description"}
                      </p>
                    </div>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Department</DropdownMenuItem>
                        <DropdownMenuItem>View Employees</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Employees</span>
                      <span className="font-medium">
                        {dept.employeeCount} / {maxCapacity}
                      </span>
                    </div>
                    <Progress value={capacityPercentage} className="h-2" />
                  </div>

                  <div className="flex justify-between pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xl font-bold">{dept.employeeCount}</p>
                      <p className="text-xs text-muted-foreground">Employees</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{Math.round(capacityPercentage)}%</p>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {departments.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No departments found
          </div>
        )}
      </div>
    </AppLayout>
  );
}
