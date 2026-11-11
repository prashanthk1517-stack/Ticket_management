export type UserRole = 'administrator' | 'supportManager' | 'supportAgent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type Permission =
  | 'viewAllTickets'
  | 'createTicket'
  | 'updateTicketStatus'
  | 'updateTicketDetails'
  | 'updateTicketPriority'
  | 'assignTicket'
  | 'deleteTicket'
  | 'viewAdminDashboard'
  | 'viewTeamStatistics';
