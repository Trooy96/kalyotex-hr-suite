import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Briefcase, Building2, MapPin, Clock, Users, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  employment_type: string | null;
  created_at: string;
  department: { name: string } | null;
}

export default function Careers() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    cover_letter: "",
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from("job_postings")
      .select("id, title, description, requirements, salary_range, employment_type, created_at, department:departments(name)")
      .eq("status", "open")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (data) setJobs(data as PublicJob[]);
    setLoading(false);
  }

  async function handleApply() {
    if (!form.applicant_name || !form.applicant_email || !selectedJob) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.functions.invoke("apply-public", {
      body: {
        job_id: selectedJob.id,
        applicant_name: form.applicant_name,
        applicant_email: form.applicant_email,
        applicant_phone: form.applicant_phone || null,
        cover_letter: form.cover_letter || null,
      },
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Application Submitted!", description: "We'll review your application and get back to you." });
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Careers</h1>
              <p className="text-xs text-muted-foreground">Join our team</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Open Positions</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We're looking for talented people to join our growing team. Browse open positions and apply today.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No open positions</h3>
            <p className="text-muted-foreground">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                        {job.department?.name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {job.department.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.employment_type?.replace("_", " ") || "Full time"}
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1">
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      )}
                    </div>
                    <Button
                      variant="gradient"
                      onClick={() => {
                        setSelectedJob(job);
                        setApplyOpen(true);
                        setSubmitted(false);
                        setForm({ applicant_name: "", applicant_email: "", applicant_phone: "", cover_letter: "" });
                      }}
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              {selectedJob?.department?.name && `${selectedJob.department.name} • `}
              {selectedJob?.employment_type?.replace("_", " ")}
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Thank you for your interest. We'll review your application and get back to you.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={form.applicant_name}
                  onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.applicant_email}
                  onChange={(e) => setForm({ ...form, applicant_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.applicant_phone}
                  onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })}
                  placeholder="+260 97X XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Cover Letter</Label>
                <Textarea
                  value={form.cover_letter}
                  onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                  placeholder="Tell us why you're a great fit..."
                  rows={4}
                />
              </div>
              <Button className="w-full" variant="gradient" onClick={handleApply} disabled={submitting}>
                {submitting ? "Submitting..." : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
