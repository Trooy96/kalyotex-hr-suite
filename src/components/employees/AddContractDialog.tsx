import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
}

interface Props {
  employeeId: string;
  employeeName: string;
  departments: Department[];
  onSuccess: () => void;
}

export function AddContractDialog({ employeeId, employeeName, departments, onSuccess }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contract_type: "permanent",
    start_date: "",
    end_date: "",
    job_title: "",
    department_id: "",
    base_salary: "",
    housing_allowance: "",
    transport_allowance: "",
    lunch_allowance: "",
    other_allowances: "",
    allowances_description: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.job_title || !formData.base_salary) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("employee_contracts").insert({
      employee_id: employeeId,
      contract_type: formData.contract_type,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      job_title: formData.job_title,
      department_id: formData.department_id || null,
      base_salary: parseFloat(formData.base_salary),
      housing_allowance: formData.housing_allowance ? parseFloat(formData.housing_allowance) : 0,
      transport_allowance: formData.transport_allowance ? parseFloat(formData.transport_allowance) : 0,
      lunch_allowance: formData.lunch_allowance ? parseFloat(formData.lunch_allowance) : 0,
      other_allowances: formData.other_allowances ? parseFloat(formData.other_allowances) : 0,
      allowances_description: formData.allowances_description || null,
      notes: formData.notes || null,
      status: "active",
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
        description: "Contract created successfully",
      });
      setOpen(false);
      setFormData({
        contract_type: "permanent",
        start_date: "",
        end_date: "",
        job_title: "",
        department_id: "",
        base_salary: "",
        housing_allowance: "",
        transport_allowance: "",
        lunch_allowance: "",
        other_allowances: "",
        allowances_description: "",
        notes: "",
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee Contract</DialogTitle>
          <DialogDescription>
            Create a new contract for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Type *</Label>
              <Select
                value={formData.contract_type}
                onValueChange={(v) => setFormData({ ...formData, contract_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="fixed-term">Fixed Term</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date (if applicable)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(v) => setFormData({ ...formData, department_id: v })}
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
            <div>
              <Label>Base Salary (ZMW) *</Label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Allowances</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Housing Allowance (ZMW)</Label>
                <Input
                  type="number"
                  value={formData.housing_allowance}
                  onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Transport Allowance (ZMW)</Label>
                <Input
                  type="number"
                  value={formData.transport_allowance}
                  onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Lunch Allowance (ZMW)</Label>
                <Input
                  type="number"
                  value={formData.lunch_allowance}
                  onChange={(e) => setFormData({ ...formData, lunch_allowance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Other Allowances (ZMW)</Label>
                <Input
                  type="number"
                  value={formData.other_allowances}
                  onChange={(e) => setFormData({ ...formData, other_allowances: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label>Allowances Description</Label>
              <Textarea
                value={formData.allowances_description}
                onChange={(e) => setFormData({ ...formData, allowances_description: e.target.value })}
                placeholder="Describe any additional allowances..."
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this contract..."
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Contract"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
