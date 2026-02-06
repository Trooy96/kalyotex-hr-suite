import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Save } from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  position: string | null;
  avatar_url: string | null;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

export function UserProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    position: "",
    department_id: "",
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const [profileRes, deptRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase.from("departments").select("id, name"),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          first_name: profileRes.data.first_name || "",
          last_name: profileRes.data.last_name || "",
          phone: profileRes.data.phone || "",
          position: profileRes.data.position || "",
          department_id: profileRes.data.department_id || "",
        });
      }

      if (deptRes.data) {
        setDepartments(deptRes.data);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        position: formData.position || null,
        department_id: formData.department_id || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError.message,
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: updateError.message,
      });
    } else {
      setProfile({ ...profile, avatar_url: urlData.publicUrl });
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const initials = `${formData.first_name?.[0] || ""}${formData.last_name?.[0] || ""}`.toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" disabled={uploading} asChild>
              <label className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+260 XXX XXX XXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department_id}
              onValueChange={(v) => setFormData({ ...formData, department_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
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

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
