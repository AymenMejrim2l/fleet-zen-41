import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "commercial" | "conducteur" | "direction";
export type Resource = "vehicles" | "drivers" | "maintenance" | "fuel" | "documents" | "tours" | "inspections" | "reports";
export type Action = "view" | "create" | "update" | "delete";

interface Permission {
  role: AppRole;
  resource: Resource;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface UserRole {
  role: AppRole;
}

export const usePermissions = () => {
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserRolesAndPermissions();
  }, []);

  const loadUserRolesAndPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesData) {
        const roles = rolesData.map((r: UserRole) => r.role);
        setUserRoles(roles);
        setIsAdmin(roles.includes("admin"));
      }

      // Load permissions for user roles
      const { data: permissionsData } = await supabase
        .from("permissions")
        .select("*");

      if (permissionsData) {
        setPermissions(permissionsData as Permission[]);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (isAdmin) return true;

    return permissions.some(p => {
      if (!userRoles.includes(p.role)) return false;
      if (p.resource !== resource) return false;

      switch (action) {
        case "view": return p.can_view;
        case "create": return p.can_create;
        case "update": return p.can_update;
        case "delete": return p.can_delete;
        default: return false;
      }
    });
  };

  const canView = (resource: Resource) => hasPermission(resource, "view");
  const canCreate = (resource: Resource) => hasPermission(resource, "create");
  const canUpdate = (resource: Resource) => hasPermission(resource, "update");
  const canDelete = (resource: Resource) => hasPermission(resource, "delete");

  return {
    userRoles,
    isAdmin,
    loading,
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    reload: loadUserRolesAndPermissions
  };
};
