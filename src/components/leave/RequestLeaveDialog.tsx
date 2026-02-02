import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestLeaveDialogProps {
  userId: string;
  onSuccess: () => void;
}

export function RequestLeaveDialog({ userId, onSuccess }: RequestLeaveDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Validation Error",
        description: "Start and end dates are required",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Validation Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, manager_id")
        .eq("user_id", userId)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase.from("leave_requests").insert({
        employee_id: profile.id,
        manager_id: profile.manager_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setOpen(false);
      setFormData({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="wfh">Work From Home</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Optional reason for leave..."
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            variant="gradient"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
