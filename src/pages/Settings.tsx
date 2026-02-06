import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Users } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileSettings } from "@/components/settings/UserProfileSettings";
import { CompanyProfileSettings } from "@/components/settings/CompanyProfileSettings";
import { TeamManagement } from "@/components/settings/TeamManagement";

interface CompanyMembership {
  company_id: string;
  role: string;
  company: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  };
}

export default function Settings() {
  const { user, loading: authLoading } = useRequireAuth();
  const [membership, setMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedCompanyId = localStorage.getItem("selectedCompanyId");
  const isSuperAdmin = membership?.role === "super_admin";
  const isAdmin = membership?.role === "admin" || isSuperAdmin;

  useEffect(() => {
    async function fetchMembership() {
      if (!user || !selectedCompanyId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("company_memberships")
        .select(`
          company_id,
          role,
          company:companies (
            id,
            name,
            address,
            phone,
            email,
            logo_url
          )
        `)
        .eq("user_id", user.id)
        .eq("company_id", selectedCompanyId)
        .single();

      if (data) {
        setMembership(data as unknown as CompanyMembership);
      }
      setLoading(false);
    }

    fetchMembership();
  }, [user, selectedCompanyId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Settings" subtitle="Manage your profile and company settings">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">My Profile</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <UserProfileSettings />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="company">
            <CompanyProfileSettings company={membership?.company || null} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="team">
            <TeamManagement 
              companyId={selectedCompanyId || ""} 
              companyName={membership?.company?.name || ""}
              isSuperAdmin={isSuperAdmin}
            />
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
}
