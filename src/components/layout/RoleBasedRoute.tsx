import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth.types';

export function RoleBasedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? (
    children
  ) : (
    <Navigate to="/unauthorized" replace />
  );
}
