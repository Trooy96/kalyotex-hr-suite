import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Save, Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface Props {
  company: Company | null;
}

export function CompanyProfileSettings({ company }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || "");

  const [formData, setFormData] = useState({
    name: company?.name || "",
    address: company?.address || "",
    phone: company?.phone || "",
    email: company?.email || "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
      });
      setLogoUrl(company.logo_url || "");
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
      })
      .eq("id", company.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Company Updated",
        description: "Company profile has been saved successfully.",
      });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `company-logos/${company.id}.${fileExt}`;

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
      .from("companies")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", company.id);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: updateError.message,
      });
    } else {
      setLogoUrl(urlData.publicUrl);
      toast({
        title: "Logo Updated",
        description: "Company logo has been updated.",
      });
    }
    setUploading(false);
  };

  if (!company) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No company selected
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo to brand your HR portal
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-24 w-24 rounded-xl">
            <AvatarImage src={logoUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
              <Building2 className="w-10 h-10" />
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
                Upload Logo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 200x200px PNG or JPG
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_email">Company Email</Label>
            <Input
              id="company_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Company Phone</Label>
            <Input
              id="company_phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+260 XXX XXX XXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Address</Label>
            <Input
              id="company_address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter company address"
            />
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
