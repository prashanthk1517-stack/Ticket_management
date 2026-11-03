import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { canViewTicket, hasPermission } from '../utils/permissions';
import type { Permission } from '../types/auth.types';
import type { Ticket } from '../types/ticket.types';

export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = useCallback(
    (permission: Permission) => Boolean(user && hasPermission(user, permission)),
    [user],
  );

  const canView = useCallback(
    (ticket: Ticket) => Boolean(user && canViewTicket(user, ticket)),
    [user],
  );

  return { checkPermission, canView };
}
