import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { employees } from "@/data/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Grid3X3, List } from "lucide-react";

const departments = [
  "All Departments",
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
];

const statuses = ["All Status", "Active", "On Leave", "Remote"];

export default function Employees() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()) ||
      employee.position.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      department === "All Departments" || employee.department === department;

    const matchesStatus =
      status === "All Status" ||
      employee.status === status.toLowerCase().replace(" ", "-");

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <AppLayout title="Employees" subtitle={`${employees.length} total employees`}>
      {/* Filters */}
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
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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

          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Grid */}
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6"
            : "flex flex-col gap-4"
        }
      >
        {filteredEmployees.map((employee, index) => (
          <EmployeeCard key={employee.id} employee={employee} index={index} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No employees found</h3>
          <p className="text-muted-foreground max-w-md">
            Try adjusting your search or filter criteria to find what you're
            looking for.
          </p>
        </div>
      )}
    </AppLayout>
  );
}
