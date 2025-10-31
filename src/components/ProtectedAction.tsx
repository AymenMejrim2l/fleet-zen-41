import { ReactNode } from "react";
import { usePermissions, Resource, Action } from "@/hooks/usePermissions";

interface ProtectedActionProps {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedAction = ({ resource, action, children, fallback = null }: ProtectedActionProps) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;
  
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
