import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Code,
  TrendingUp,
  Megaphone,
  Users,
  Calculator,
  Settings,
  Plus,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const departments = [
  {
    id: "1",
    name: "Engineering",
    icon: Code,
    headCount: 45,
    maxCapacity: 50,
    lead: "John Smith",
    budget: "$1.2M",
    color: "bg-primary/10 text-primary",
    projects: 12,
  },
  {
    id: "2",
    name: "Sales",
    icon: TrendingUp,
    headCount: 28,
    maxCapacity: 35,
    lead: "Maria Garcia",
    budget: "$800K",
    color: "bg-accent/10 text-accent",
    projects: 8,
  },
  {
    id: "3",
    name: "Marketing",
    icon: Megaphone,
    headCount: 20,
    maxCapacity: 25,
    lead: "Alex Turner",
    budget: "$500K",
    color: "bg-info/10 text-info",
    projects: 6,
  },
  {
    id: "4",
    name: "Human Resources",
    icon: Users,
    headCount: 12,
    maxCapacity: 15,
    lead: "Rachel Green",
    budget: "$300K",
    color: "bg-success/10 text-success",
    projects: 4,
  },
  {
    id: "5",
    name: "Finance",
    icon: Calculator,
    headCount: 18,
    maxCapacity: 20,
    lead: "David Kim",
    budget: "$400K",
    color: "bg-warning/10 text-warning",
    projects: 5,
  },
  {
    id: "6",
    name: "Operations",
    icon: Settings,
    headCount: 33,
    maxCapacity: 40,
    lead: "Chris Brown",
    budget: "$600K",
    color: "bg-purple-500/10 text-purple-500",
    projects: 7,
  },
];

export default function Departments() {
  return (
    <AppLayout title="Departments" subtitle="Manage company departments">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {departments.length} Departments
          </Badge>
          <Badge variant="secondary" className="text-sm">
            156 Total Employees
          </Badge>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {departments.map((dept, index) => {
          const Icon = dept.icon;
          const capacityPercentage = (dept.headCount / dept.maxCapacity) * 100;
          return (
            <Card
              key={dept.id}
              className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${dept.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Lead: {dept.lead}
                      </p>
                    </div>
                  </div>
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
                </div>

                <div className="space-y-4">
                  {/* Headcount Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Headcount</span>
                      <span className="font-medium">
                        {dept.headCount} / {dept.maxCapacity}
                      </span>
                    </div>
                    <Progress value={capacityPercentage} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xl font-bold">{dept.budget}</p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{dept.projects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">
                        {Math.round(capacityPercentage)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
