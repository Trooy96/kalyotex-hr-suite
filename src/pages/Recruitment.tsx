import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Building2,
  Calendar,
  Mail,
  Phone,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  employment_type: string | null;
  status: string | null;
  created_at: string;
  department: { name: string } | null;
  applications: { id: string }[];
}

interface JobApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  status: string | null;
  applied_at: string;
  cover_letter: string | null;
  job: { title: string } | null;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-success/10", text: "text-success" },
  closed: { bg: "bg-muted", text: "text-muted-foreground" },
  paused: { bg: "bg-warning/10", text: "text-warning" },
  new: { bg: "bg-info/10", text: "text-info" },
  screening: { bg: "bg-warning/10", text: "text-warning" },
  interview: { bg: "bg-primary/10", text: "text-primary" },
  offer: { bg: "bg-accent/10", text: "text-accent" },
  hired: { bg: "bg-success/10", text: "text-success" },
  rejected: { bg: "bg-destructive/10", text: "text-destructive" },
};

export default function Recruitment() {
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ openPositions: 0, totalApplications: 0, newApplicants: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteJobOpen, setDeleteJobOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
  const [deleteAppOpen, setDeleteAppOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_range: "",
    employment_type: "full_time",
    department_id: "",
    is_public: false,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    const [jobsRes, appsRes, deptRes, openRes, newRes, interviewRes] = await Promise.all([
      supabase
        .from("job_postings")
        .select("id, title, description, requirements, salary_range, employment_type, status, created_at, department:departments(name), applications:job_applications(id)")
        .order("created_at", { ascending: false }),
      supabase
        .from("job_applications")
        .select("id, applicant_name, applicant_email, applicant_phone, status, applied_at, cover_letter, job:job_postings(title)")
        .order("applied_at", { ascending: false })
        .limit(50),
      supabase.from("departments").select("id, name"),
      supabase.from("job_postings").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("job_applications").select("id", { count: "exact" }).eq("status", "new"),
      supabase.from("interviews").select("id", { count: "exact" }).eq("status", "scheduled"),
    ]);

    if (jobsRes.data) setJobs(jobsRes.data as JobPosting[]);
    if (appsRes.data) setApplications(appsRes.data as JobApplication[]);
    if (deptRes.data) setDepartments(deptRes.data);
    
    setStats({
      openPositions: openRes.count || 0,
      totalApplications: appsRes.data?.length || 0,
      newApplicants: newRes.count || 0,
      interviews: interviewRes.count || 0,
    });
    setLoading(false);
  }

  async function handleCreateJob() {
    if (!newJob.title) {
      toast({ title: "Error", description: "Job title is required", variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    const { error } = await supabase.from("job_postings").insert({
      title: newJob.title,
      description: newJob.description || null,
      requirements: newJob.requirements || null,
      salary_range: newJob.salary_range || null,
      employment_type: newJob.employment_type,
      department_id: newJob.department_id || null,
      posted_by: profile?.id,
      status: "open",
      is_public: newJob.is_public,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Job posting created successfully" });
      setDialogOpen(false);
      setNewJob({ title: "", description: "", requirements: "", salary_range: "", employment_type: "full_time", department_id: "", is_public: false });
      fetchData();
    }
  }

  async function handleDeleteJob() {
    if (!jobToDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("job_postings").delete().eq("id", jobToDelete.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deleted", description: `"${jobToDelete.title}" has been removed.` });
      fetchData();
    }
    setDeleting(false);
    setDeleteJobOpen(false);
    setJobToDelete(null);
  }

  async function handleDeleteApplication() {
    if (!appToDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("job_applications").delete().eq("id", appToDelete.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deleted", description: `Application from ${appToDelete.applicant_name} has been removed.` });
      fetchData();
    }
    setDeleting(false);
    setDeleteAppOpen(false);
    setAppToDelete(null);
  }

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApplications = applications.filter((app) =>
    app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
    app.job?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Recruitment" subtitle="Manage job postings and applications">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.openPositions}</p>
              <p className="text-sm text-muted-foreground">Open Positions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalApplications}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newApplicants}</p>
              <p className="text-sm text-muted-foreground">New Applicants</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.interviews}</p>
              <p className="text-sm text-muted-foreground">Scheduled Interviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Job Posting</DialogTitle>
                    <DialogDescription>Fill in the details to create a new job posting</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={newJob.department_id} onValueChange={(v) => setNewJob({ ...newJob, department_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Employment Type</Label>
                        <Select value={newJob.employment_type} onValueChange={(v) => setNewJob({ ...newJob, employment_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Salary Range (ZMW)</Label>
                      <Input
                        value={newJob.salary_range}
                        onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                        placeholder="e.g. ZMW 15,000 - ZMW 25,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                        placeholder="Job description..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Requirements</Label>
                      <Textarea
                        value={newJob.requirements}
                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        placeholder="Job requirements..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={newJob.is_public}
                        onChange={(e) => setNewJob({ ...newJob, is_public: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is_public" className="cursor-pointer text-sm">
                        Post to company careers page (/careers)
                      </Label>
                    </div>
                    <Button className="w-full" variant="gradient" onClick={handleCreateJob}>
                      Create Job Posting
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="jobs">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredJobs.map((job, index) => {
              const status = statusStyles[job.status || "open"];
              return (
                <Card
                  key={job.id}
                  className="glass-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{job.department?.name || "No department"}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn("capitalize shrink-0 ml-2", status.bg, status.text)}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {job.description || "No description provided"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {job.employment_type?.replace("_", " ") || "Full time"}
                      </Badge>
                      {job.salary_range && (
                        <Badge variant="outline" className="text-xs">
                          {job.salary_range}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{job.applications?.length || 0} applicants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(job.created_at), "MMM d, yyyy")}
                        </span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => { setJobToDelete(job); setDeleteJobOpen(true); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredJobs.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No job postings found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Applicant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Position</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Applied</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      {canEdit && (
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app, index) => {
                      const status = statusStyles[app.status || "new"];
                      return (
                        <tr
                          key={app.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-slide-up"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{app.applicant_name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {app.applicant_email}
                                </span>
                                {app.applicant_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {app.applicant_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{app.job?.title || "—"}</td>
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(app.applied_at), "MMM d, yyyy")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className={cn("capitalize", status?.bg, status?.text)}>
                              {app.status}
                            </Badge>
                          </td>
                          {canEdit && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => { setAppToDelete(app); setDeleteAppOpen(true); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredApplications.length === 0 && (
                      <tr>
                        <td colSpan={canEdit ? 5 : 4} className="py-8 text-center text-muted-foreground">
                          No applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Job Posting Dialog */}
      <AlertDialog open={deleteJobOpen} onOpenChange={setDeleteJobOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{jobToDelete?.title}</strong>? This will also remove all associated applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Application Dialog */}
      <AlertDialog open={deleteAppOpen} onOpenChange={setDeleteAppOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application from <strong>{appToDelete?.applicant_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
