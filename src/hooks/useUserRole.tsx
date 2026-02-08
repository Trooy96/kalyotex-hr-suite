import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "employee";

interface UserRoleState {
  roles: AppRole[];
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  loading: boolean;
  profileId: string | null;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRoles([]);
        setProfileId(null);
        setLoading(false);
        return;
      }

      try {
        const [roleRes, profileRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (roleRes.data && roleRes.data.length > 0) {
          setRoles(roleRes.data.map((r) => r.role as AppRole));
        }
        if (profileRes.data) {
          setProfileId(profileRes.data.id);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isEmployee = roles.includes("employee");

  return {
    roles,
    isAdmin,
    isManager,
    isEmployee,
    loading,
    profileId,
  };
}
