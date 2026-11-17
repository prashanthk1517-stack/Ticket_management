import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Permission } from '../../types/auth.types';
import { hasPermission } from '../../utils/permissions';

export function PermissionBasedRoute({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return hasPermission(user, permission) ? (
    children
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}
