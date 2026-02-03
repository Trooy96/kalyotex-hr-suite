import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
}

interface AddEmployeeDialogProps {
  departments: Department[];
  onSuccess: () => void;
}

export function AddEmployeeDialog({ departments, onSuccess }: AddEmployeeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    position: "",
    phone: "",
    department_id: "",
    hire_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.first_name) {
      toast({
        title: "Validation Error",
        description: "Email and first name are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user in auth (admin would typically do this via invite)
      // For now, we'll create a profile directly with a placeholder user_id
      // In production, you'd use Supabase Admin API or invite flow
      
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .single();

      if (existingProfile) {
        toast({
          title: "Error",
          description: "An employee with this email already exists",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert employee profile without user_id (they haven't signed up yet)
      // When employee signs up, their profile will be linked via the handle_new_user trigger
      const { error } = await supabase.from("profiles").insert({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        position: formData.position || null,
        phone: formData.phone || null,
        department_id: formData.department_id || null,
        hire_date: formData.hire_date || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee added successfully",
      });

      setOpen(false);
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        position: "",
        phone: "",
        department_id: "",
        hire_date: new Date().toISOString().split("T")[0],
      });
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
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>

          <Button
            className="w-full"
            variant="gradient"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
