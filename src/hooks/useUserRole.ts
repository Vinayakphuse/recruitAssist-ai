import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "candidate" | "interviewer" | "recruiter" | "hiring_manager" | "admin";

interface UseUserRoleResult {
  role: AppRole | null;
  isLoading: boolean;
  canMakeHiringDecisions: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the security definer function to get user's highest role
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching user role:", error);
        // Fallback: try to fetch from user_roles directly
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!roleError && roleData) {
          setRole(roleData.role as AppRole);
        } else {
          setRole(null);
        }
      } else {
        setRole(data as AppRole);
      }
    } catch (err) {
      console.error("Error in useUserRole:", err);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user?.id]);

  // Only recruiters, hiring managers, and admins can make hiring decisions
  const canMakeHiringDecisions =
    role === "recruiter" || role === "hiring_manager" || role === "admin";

  return {
    role,
    isLoading,
    canMakeHiringDecisions,
    refetch: fetchRole,
  };
}
