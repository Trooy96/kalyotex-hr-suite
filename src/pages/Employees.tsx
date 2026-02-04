import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid3X3, List, Mail, Phone, DollarSign, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
import { EmployeeDetailDialog } from "@/components/employees/EmployeeDetailDialog";
import { formatZMW } from "@/utils/payrollCalculations";

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  salary: number | null;
  hire_date: string | null;
  department: { name: string } | null;
}

export default function Employees() {
  const { user, loading: authLoading } = useRequireAuth();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  async function fetchData() {
    const [employeesRes, deptRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email, position, phone, avatar_url, salary, hire_date, department:departments(name)"),
      supabase.from("departments").select("id, name"),
    ]);

    if (employeesRes.data) setEmployees(employeesRes.data as Employee[]);
    if (deptRes.data) setDepartments(deptRes.data);
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()) ||
      (employee.position?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesDepartment =
      department === "all" || employee.department?.name === department;

    return matchesSearch && matchesDepartment;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Employees" subtitle={`${employees.length} total employees`}>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-input overflow-hidden">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("grid")}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <AddEmployeeDialog departments={departments} onSuccess={fetchData} />
        </div>
      </div>

      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6"
            : "flex flex-col gap-4"
        }
      >
        {filteredEmployees.map((employee, index) => {
          const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "?";
          const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Unknown";
          
          return (
            <Card
              key={employee.id}
              className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={employee.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {employee.position || "No position"}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {employee.department?.name || "No department"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.salary && (
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatZMW(employee.salary)}/mo</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No employees found</h3>
          <p className="text-muted-foreground max-w-md">
          Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      <EmployeeDetailDialog
        employee={selectedEmployee}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={fetchData}
      />
    </AppLayout>
  );
}
