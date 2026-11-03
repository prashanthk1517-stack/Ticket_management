import type { AuthUser, Permission, UserRole } from '../types/auth.types';
import type { Ticket } from '../types/ticket.types';

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  administrator: [
    'viewAllTickets',
    'createTicket',
    'updateTicketStatus',
    'updateTicketPriority',
    'assignTicket',
    'deleteTicket',
    'viewAdminDashboard',
    'viewTeamStatistics',
  ],
  supportManager: [
    'viewAllTickets',
    'updateTicketStatus',
    'updateTicketPriority',
    'assignTicket',
    'viewTeamStatistics',
  ],
  supportAgent: ['updateTicketStatus'],
};

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return rolePermissions[user.role].includes(permission);
}

export function canViewTicket(user: AuthUser, ticket: Ticket): boolean {
  return hasPermission(user, 'viewAllTickets') || ticket.assignedTo === user.id;
}

export function canUpdateTicketStatus(user: AuthUser, ticket: Ticket): boolean {
  return (
    hasPermission(user, 'updateTicketStatus') &&
    (user.role !== 'supportAgent' || ticket.assignedTo === user.id)
  );
}
