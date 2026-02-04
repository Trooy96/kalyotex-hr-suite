import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  DollarSign,
  Phone,
  Plus,
  Trash2,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatZMW } from "@/utils/payrollCalculations";

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  salary: number | null;
  hire_date: string | null;
  department: { name: string } | null;
}

interface Contract {
  id: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  job_title: string;
  base_salary: number;
  housing_allowance: number | null;
  transport_allowance: number | null;
  lunch_allowance: number | null;
  other_allowances: number | null;
  status: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  is_primary: boolean;
}

interface Props {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EmployeeDetailDialog({ employee, open, onOpenChange, onUpdate }: Props) {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    alternate_phone: "",
    email: "",
    is_primary: false,
  });
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    if (employee && open) {
      fetchEmployeeDetails();
    }
  }, [employee, open]);

  async function fetchEmployeeDetails() {
    if (!employee) return;
    setLoading(true);

    const [contractsRes, contactsRes] = await Promise.all([
      supabase
        .from("employee_contracts")
        .select("*")
        .eq("employee_id", employee.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("emergency_contacts")
        .select("*")
        .eq("employee_id", employee.id)
        .order("is_primary", { ascending: false }),
    ]);

    if (contractsRes.data) setContracts(contractsRes.data);
    if (contactsRes.data) setEmergencyContacts(contactsRes.data);
    setLoading(false);
  }

  const handleAddEmergencyContact = async () => {
    if (!employee || !newContact.name || !newContact.relationship || !newContact.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("emergency_contacts").insert({
      employee_id: employee.id,
      name: newContact.name,
      relationship: newContact.relationship,
      phone: newContact.phone,
      alternate_phone: newContact.alternate_phone || null,
      email: newContact.email || null,
      is_primary: newContact.is_primary,
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
        description: "Emergency contact added",
      });
      setNewContact({
        name: "",
        relationship: "",
        phone: "",
        alternate_phone: "",
        email: "",
        is_primary: false,
      });
      setShowAddContact(false);
      fetchEmployeeDetails();
    }
  };

  const handleDeleteEmergencyContact = async (contactId: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", contactId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Emergency contact removed",
      });
      fetchEmployeeDetails();
    }
  };

  if (!employee) return null;

  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Unknown";
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "?";
  const activeContract = contracts.find((c) => c.status === "active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>{fullName}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {employee.position || "No position"} • {employee.department?.name || "No department"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Emergency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{employee.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hire Date</Label>
                  <p className="font-medium">
                    {employee.hire_date
                      ? format(new Date(employee.hire_date), "MMMM d, yyyy")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{employee.department?.name || "None"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No contracts found</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{contract.job_title}</CardTitle>
                      <Badge
                        variant={contract.status === "active" ? "default" : "secondary"}
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Type</Label>
                      <p className="capitalize">{contract.contract_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Duration</Label>
                      <p>
                        {format(new Date(contract.start_date), "MMM d, yyyy")} -{" "}
                        {contract.end_date
                          ? format(new Date(contract.end_date), "MMM d, yyyy")
                          : "Ongoing"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Base Salary</Label>
                      <p className="font-medium">{formatZMW(contract.base_salary)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Total Allowances</Label>
                      <p className="font-medium">
                        {formatZMW(
                          (contract.housing_allowance || 0) +
                            (contract.transport_allowance || 0) +
                            (contract.lunch_allowance || 0) +
                            (contract.other_allowances || 0)
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Salary Structure</CardTitle>
              </CardHeader>
              <CardContent>
                {activeContract ? (
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Base Salary</span>
                      <span className="font-medium">{formatZMW(activeContract.base_salary)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Housing Allowance</span>
                      <span className="font-medium">{formatZMW(activeContract.housing_allowance || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Transport Allowance</span>
                      <span className="font-medium">{formatZMW(activeContract.transport_allowance || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Lunch Allowance</span>
                      <span className="font-medium">{formatZMW(activeContract.lunch_allowance || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Other Allowances</span>
                      <span className="font-medium">{formatZMW(activeContract.other_allowances || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Gross Salary</span>
                      <span className="text-primary">
                        {formatZMW(
                          activeContract.base_salary +
                            (activeContract.housing_allowance || 0) +
                            (activeContract.transport_allowance || 0) +
                            (activeContract.lunch_allowance || 0) +
                            (activeContract.other_allowances || 0)
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No active contract found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Emergency Contacts</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddContact(!showAddContact)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>

            {showAddContact && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <Label>Relationship *</Label>
                      <Select
                        value={newContact.relationship}
                        onValueChange={(v) => setNewContact({ ...newContact, relationship: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder="+260 XXX XXX XXX"
                      />
                    </div>
                    <div>
                      <Label>Alt. Phone</Label>
                      <Input
                        value={newContact.alternate_phone}
                        onChange={(e) => setNewContact({ ...newContact, alternate_phone: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddEmergencyContact} className="w-full">
                    Add Emergency Contact
                  </Button>
                </CardContent>
              </Card>
            )}

            {emergencyContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No emergency contacts</p>
              </div>
            ) : (
              emergencyContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.name}</p>
                        {contact.is_primary && <Badge variant="secondary">Primary</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {contact.relationship}
                      </p>
                      <p className="text-sm">{contact.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmergencyContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
