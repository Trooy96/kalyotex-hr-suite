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
import { Clock, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ClockInDialogProps {
  userId: string;
  onSuccess: () => void;
}

export function ClockInDialog({ userId, onSuccess }: ClockInDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [existingRecord, setExistingRecord] = useState<{ id: string; clock_in: string; clock_out: string | null } | null>(null);

  const checkExistingRecord = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profile) {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("attendance_records")
        .select("id, clock_in, clock_out")
        .eq("employee_id", profile.id)
        .eq("record_date", today)
        .single();

      setExistingRecord(data);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      checkExistingRecord();
    }
  };

  const handleClockIn = async () => {
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profile) throw new Error("Profile not found");

      const now = new Date().toISOString();
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("attendance_records").insert({
        employee_id: profile.id,
        record_date: today,
        clock_in: now,
        status: "present",
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Clocked In",
        description: `You clocked in at ${format(new Date(now), "h:mm a")}`,
      });

      setOpen(false);
      setNotes("");
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

  const handleClockOut = async () => {
    if (!existingRecord) return;

    setLoading(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("attendance_records")
        .update({ clock_out: now })
        .eq("id", existingRecord.id);

      if (error) throw error;

      toast({
        title: "Clocked Out",
        description: `You clocked out at ${format(new Date(now), "h:mm a")}`,
      });

      setOpen(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Clock In/Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>
            {existingRecord ? (existingRecord.clock_out ? "Already Clocked Out" : "Clock Out") : "Clock In"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {existingRecord ? (
            existingRecord.clock_out ? (
              <div className="text-center py-4">
                <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-success" />
                </div>
                <p className="text-muted-foreground">
                  You've completed your shift for today
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <p>Clock In: {format(new Date(existingRecord.clock_in), "h:mm a")}</p>
                  <p>Clock Out: {format(new Date(existingRecord.clock_out), "h:mm a")}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  You clocked in at {format(new Date(existingRecord.clock_in), "h:mm a")}
                </p>
                <Button
                  className="w-full"
                  variant="gradient"
                  onClick={handleClockOut}
                  disabled={loading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : "Clock Out Now"}
                </Button>
              </div>
            )
          ) : (
            <>
              <div className="text-center py-2">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <p className="text-2xl font-bold">{format(new Date(), "h:mm a")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Working from home, etc..."
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                variant="gradient"
                onClick={handleClockIn}
                disabled={loading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Clock In Now"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
