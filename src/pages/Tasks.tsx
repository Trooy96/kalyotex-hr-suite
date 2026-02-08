import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  assigned_by_profile: { first_name: string | null; last_name: string | null } | null;
  department: { name: string } | null;
  assignments: {
    employee_id: string;
    read_at: string | null;
    employee: { first_name: string | null; last_name: string | null } | null;
  }[];
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const statusStyles: Record<string, { bg: string; icon: typeof Clock }> = {
  pending: { bg: "bg-warning/10 text-warning", icon: Clock },
  in_progress: { bg: "bg-info/10 text-info", icon: AlertCircle },
  completed: { bg: "bg-success/10 text-success", icon: CheckCircle },
};

export default function Tasks() {
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager, profileId } = useUserRole();
  const canCreate = isAdmin || isManager;
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [assignMode, setAssignMode] = useState<"individual" | "department">("individual");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    due_date: "",
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    const [tasksRes, empRes, deptRes] = await Promise.all([
      supabase
        .from("employee_tasks")
        .select(`
          id, title, description, priority, status, due_date, created_at,
          assigned_by_profile:profiles!employee_tasks_assigned_by_fkey(first_name, last_name),
          department:departments(name),
          assignments:task_assignments(
            employee_id, read_at,
            employee:profiles!task_assignments_employee_id_fkey(first_name, last_name)
          )
        `)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, last_name, department_id"),
      supabase.from("departments").select("id, name"),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as unknown as Task[]);
    if (empRes.data) setEmployees(empRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    setLoading(false);
  }

  async function handleCreateTask() {
    if (!formData.title) {
      toast({ title: "Error", description: "Task title is required", variant: "destructive" });
      return;
    }

    let assigneeIds = selectedEmployees;
    if (assignMode === "department" && selectedDepartment) {
      assigneeIds = employees
        .filter((e) => e.department_id === selectedDepartment)
        .map((e) => e.id);
    }

    if (assigneeIds.length === 0) {
      toast({ title: "Error", description: "Select at least one employee", variant: "destructive" });
      return;
    }

    setCreating(true);

    const { data: task, error: taskError } = await supabase
      .from("employee_tasks")
      .insert({
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        assigned_by: profileId!,
        department_id: assignMode === "department" ? selectedDepartment : null,
        due_date: formData.due_date || null,
      })
      .select("id")
      .single();

    if (taskError || !task) {
      toast({ title: "Error", description: taskError?.message || "Failed to create task", variant: "destructive" });
      setCreating(false);
      return;
    }

    const assignments = assigneeIds.map((empId) => ({
      task_id: task.id,
      employee_id: empId,
    }));

    const { error: assignError } = await supabase.from("task_assignments").insert(assignments);

    if (assignError) {
      toast({ title: "Error", description: assignError.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Task sent to ${assigneeIds.length} employee(s)` });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setCreating(false);
  }

  function resetForm() {
    setFormData({ title: "", description: "", priority: "normal", due_date: "" });
    setSelectedEmployees([]);
    setSelectedDepartment("");
    setAssignMode("individual");
  }

  async function handleUpdateStatus(taskId: string, newStatus: string) {
    const { error } = await supabase
      .from("employee_tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Task marked as ${newStatus.replace("_", " ")}` });
      fetchData();
    }
  }

  async function handleMarkRead(taskId: string) {
    if (!profileId) return;
    await supabase
      .from("task_assignments")
      .update({ read_at: new Date().toISOString() })
      .eq("task_id", taskId)
      .eq("employee_id", profileId);
    fetchData();
  }

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Tasks" subtitle="Send instructions and assignments to employees">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter((t) => t.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <AlertCircle className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter((t) => t.status === "in_progress").length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">All Tasks</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            {canCreate && (
              <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>Send an instruction or assignment to employees</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Report to manager's office"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Additional details..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="datetime-local"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Assign To</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={assignMode === "individual" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAssignMode("individual")}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Individual
                        </Button>
                        <Button
                          type="button"
                          variant={assignMode === "department" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAssignMode("department")}
                        >
                          <Building2 className="w-4 h-4 mr-1" />
                          Department
                        </Button>
                      </div>

                      {assignMode === "department" ? (
                        <div className="space-y-2">
                          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedDepartment && (
                            <p className="text-sm text-muted-foreground">
                              {employees.filter((e) => e.department_id === selectedDepartment).length} employees in this department
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                          {employees.map((emp) => (
                            <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                              <Checkbox
                                checked={selectedEmployees.includes(emp.id)}
                                onCheckedChange={() => toggleEmployee(emp.id)}
                              />
                              <span className="text-sm">
                                {emp.first_name} {emp.last_name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button className="w-full" variant="gradient" onClick={handleCreateTask} disabled={creating}>
                      {creating ? "Sending..." : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Task
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.map((task, index) => {
              const statusInfo = statusStyles[task.status] || statusStyles.pending;
              const StatusIcon = statusInfo.icon;
              const isMyTask = task.assignments?.some((a) => a.employee_id === profileId);
              const myAssignment = task.assignments?.find((a) => a.employee_id === profileId);
              const isUnread = isMyTask && !myAssignment?.read_at;

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "hover:shadow-card-hover transition-all duration-300 animate-slide-up",
                    isUnread && "border-primary/50 bg-primary/5"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => isUnread && handleMarkRead(task.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{task.title}</h3>
                          {isUnread && (
                            <Badge variant="default" className="text-xs shrink-0">New</Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            From: {task.assigned_by_profile?.first_name} {task.assigned_by_profile?.last_name}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(task.created_at), "MMM d, yyyy h:mm a")}</span>
                          {task.due_date && (
                            <>
                              <span>•</span>
                              <span className="text-warning">Due: {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                            </>
                          )}
                          {task.department?.name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {task.department.name}
                              </span>
                            </>
                          )}
                        </div>
                        {canCreate && task.assignments && task.assignments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.assignments.map((a) => (
                              <Badge key={a.employee_id} variant="secondary" className="text-xs">
                                {a.employee?.first_name} {a.employee?.last_name}
                                {a.read_at && <CheckCircle className="w-3 h-3 ml-1 text-success" />}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn("capitalize", priorityStyles[task.priority])}>
                          {task.priority}
                        </Badge>
                        {canCreate ? (
                          <Select
                            value={task.status}
                            onValueChange={(v) => handleUpdateStatus(task.id, v)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={cn("capitalize flex items-center gap-1", statusInfo.bg)}>
                            <StatusIcon className="w-3 h-3" />
                            {task.status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ClipboardList className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground max-w-md">
                  {canCreate
                    ? "Create a task to send instructions to your team"
                    : "No tasks have been assigned to you yet"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
