import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Copy, Check, Mail, Users, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface InvitationCode {
  id: string;
  code: string;
  role: string;
  created_at: string;
  expires_at: string | null;
  is_used: boolean;
}

interface Props {
  companyId: string;
  companyName: string;
  isSuperAdmin: boolean;
}

export function TeamManagement({ companyId, companyName, isSuperAdmin }: Props) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  async function fetchData() {
    if (!companyId) return;

    const [membersRes, codesRes] = await Promise.all([
      supabase
        .from("company_memberships")
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("invitation_codes")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_used", false)
        .order("created_at", { ascending: false }),
    ]);

    if (membersRes.data) {
      // Fetch profiles for each member
      const memberIds = membersRes.data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, user_id")
        .in("user_id", memberIds);

      const membersWithProfiles = membersRes.data.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id) || null,
      }));

      setMembers(membersWithProfiles);
    }

    if (codesRes.data) {
      setInvitationCodes(codesRes.data);
    }

    setLoading(false);
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCode = async () => {
    if (!role) {
      toast({
        variant: "destructive",
        title: "Select a role",
        description: "Please select a role for the invitation",
      });
      return;
    }

    setGeneratingCode(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const code = generateCode();

      const { error } = await supabase.from("invitation_codes").insert({
        code,
        company_id: companyId,
        role,
        created_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      setGeneratedCode(code);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating code",
        description: error.message,
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Code copied",
        description: "Invitation code copied to clipboard",
      });
    }
  };

  const handleCloseInviteDialog = () => {
    setRole("");
    setGeneratedCode(null);
    setCopied(false);
    setInviteDialogOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-primary/10 text-primary";
      case "admin":
        return "bg-warning/10 text-warning";
      case "hr_manager":
        return "bg-info/10 text-info";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Team Members
              </CardTitle>
              <CardDescription>
                Generate invitation codes to add new members to {companyName}
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="mx-auto mb-2 p-3 rounded-xl bg-primary/10 w-fit">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <DialogTitle className="text-center">Invite User</DialogTitle>
                  <DialogDescription className="text-center">
                    Generate an invitation code for {companyName}
                  </DialogDescription>
                </DialogHeader>

                {!generatedCode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role for new user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={handleGenerateCode}
                      disabled={generatingCode || !role}
                    >
                      {generatingCode ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Generate Invitation Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Invitation Code</p>
                      <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                        {generatedCode}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Role: <span className="capitalize">{role.replace("_", " ")}</span> • Expires in 7 days
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? "Copied!" : "Copy Code"}
                    </Button>

                    <Button variant="ghost" className="w-full" onClick={handleCloseInviteDialog}>
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Active Invitation Codes */}
      {invitationCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Active Invitation Codes
            </CardTitle>
            <CardDescription>
              Unused invitation codes that can be shared with new members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitationCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-mono font-semibold">{code.code}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="capitalize">{code.role.replace("_", " ")}</span>
                      {code.expires_at && ` • Expires: ${new Date(code.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(code.code);
                      toast({ title: "Copied", description: "Code copied to clipboard" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Current members of {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const profile = member.profile;
              const fullName = profile
                ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email
                : "Unknown User";
              const initials = profile
                ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?"
                : "?";

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{fullName}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <Badge className={getRoleColor(member.role)}>
                    {member.role.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
