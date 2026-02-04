import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { Star, Plus, Search, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string | null;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  overall_rating: number | null;
  performance_score: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  goals: string | null;
  achievements: string | null;
  comments: string | null;
  employee_comments: string | null;
  status: string;
  employee: {
    first_name: string | null;
    last_name: string | null;
    position: string | null;
  } | null;
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
}

export default function PerformanceReviews() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useRequireAuth();
  const { isAdmin, isManager, profileId } = useUserRole();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    review_period_start: "",
    review_period_end: "",
    overall_rating: 3,
    performance_score: 75,
    strengths: "",
    areas_for_improvement: "",
    goals: "",
    achievements: "",
    comments: "",
  });

  async function fetchData() {
    const [reviewsRes, employeesRes] = await Promise.all([
      supabase
        .from("performance_reviews")
        .select(`
          *,
          employee:profiles!performance_reviews_employee_id_fkey(
            first_name, last_name, position
          )
        `)
        .order("review_date", { ascending: false }),
      supabase.from("profiles").select("id, first_name, last_name, position"),
    ]);

    if (reviewsRes.data) setReviews(reviewsRes.data as PerformanceReview[]);
    if (employeesRes.data) setEmployees(employeesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.employee_id || !formData.review_period_start || !formData.review_period_end) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("performance_reviews").insert({
      employee_id: formData.employee_id,
      reviewer_id: profileId,
      review_period_start: formData.review_period_start,
      review_period_end: formData.review_period_end,
      overall_rating: formData.overall_rating,
      performance_score: formData.performance_score,
      strengths: formData.strengths || null,
      areas_for_improvement: formData.areas_for_improvement || null,
      goals: formData.goals || null,
      achievements: formData.achievements || null,
      comments: formData.comments || null,
      status: "draft",
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Performance review created successfully",
      });
      setDialogOpen(false);
      setFormData({
        employee_id: "",
        review_period_start: "",
        review_period_end: "",
        overall_rating: 3,
        performance_score: 75,
        strengths: "",
        areas_for_improvement: "",
        goals: "",
        achievements: "",
        comments: "",
      });
      fetchData();
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const fullName = `${review.employee?.first_name || ""} ${review.employee?.last_name || ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-warning/10 text-warning",
    acknowledged: "bg-success/10 text-success",
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Performance Reviews" subtitle="Manage employee performance evaluations">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {(isAdmin || isManager) && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Performance Review</DialogTitle>
                <DialogDescription>
                  Evaluate an employee's performance for a specific period
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Employee *</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(v) => setFormData({ ...formData, employee_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Period Start *</Label>
                    <Input
                      type="date"
                      value={formData.review_period_start}
                      onChange={(e) => setFormData({ ...formData, review_period_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Period End *</Label>
                    <Input
                      type="date"
                      value={formData.review_period_end}
                      onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Overall Rating (1-5)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFormData({ ...formData, overall_rating: rating })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={cn(
                              "w-6 h-6 transition-colors",
                              rating <= formData.overall_rating
                                ? "text-warning fill-warning"
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Performance Score (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.performance_score}
                      onChange={(e) => setFormData({ ...formData, performance_score: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Strengths</Label>
                  <Textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    placeholder="What does the employee do well?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Areas for Improvement</Label>
                  <Textarea
                    value={formData.areas_for_improvement}
                    onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                    placeholder="Where can the employee improve?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Goals for Next Period</Label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="Set goals for the next review period"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Achievements</Label>
                  <Textarea
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    placeholder="Notable achievements during this period"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Additional Comments</Label>
                  <Textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Any other comments or notes"
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Create Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredReviews.map((review, index) => {
          const fullName = `${review.employee?.first_name || ""} ${review.employee?.last_name || ""}`.trim() || "Unknown";
          const initials = `${review.employee?.first_name?.[0] || ""}${review.employee?.last_name?.[0] || ""}`.toUpperCase() || "?";

          return (
            <Card
              key={review.id}
              className="glass-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{fullName}</h3>
                      <p className="text-sm text-muted-foreground">{review.employee?.position}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[review.status] || ""}>
                    {review.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(review.review_period_start), "MMM d")} -{" "}
                    {format(new Date(review.review_period_end), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= (review.overall_rating || 0)
                            ? "text-warning fill-warning"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">
                      {review.performance_score}%
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
          <p className="text-muted-foreground max-w-md">
            {isAdmin || isManager
              ? "Create your first performance review to get started"
              : "No performance reviews are available for you yet"}
          </p>
        </div>
      )}
    </AppLayout>
  );
}
