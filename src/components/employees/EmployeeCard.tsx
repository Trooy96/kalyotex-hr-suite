import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, MoreVertical, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  avatar?: string;
  status: "active" | "on-leave" | "remote";
  joinDate: string;
}

interface EmployeeCardProps {
  employee: Employee;
  index?: number;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-success/10", text: "text-success" },
  "on-leave": { bg: "bg-warning/10", text: "text-warning" },
  remote: { bg: "bg-info/10", text: "text-info" },
};

export function EmployeeCard({ employee, index = 0 }: EmployeeCardProps) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const status = statusStyles[employee.status];

  return (
    <Card
      className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={employee.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">
                {employee.position}
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
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Send Message</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{employee.phone}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Badge variant="secondary" className="font-medium">
            {employee.department}
          </Badge>
          <Badge
            variant="secondary"
            className={cn("capitalize", status.bg, status.text)}
          >
            {employee.status.replace("-", " ")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
