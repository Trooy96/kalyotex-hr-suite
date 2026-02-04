import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "employee";

interface UserRoleState {
  role: AppRole | null;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  loading: boolean;
  profileId: string | null;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setProfileId(null);
        setLoading(false);
        return;
      }

      try {
        const [roleRes, profileRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (roleRes.data) {
          setRole(roleRes.data.role as AppRole);
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

  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isEmployee: role === "employee",
    loading,
    profileId,
  };
}
