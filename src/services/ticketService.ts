import { initialTickets } from '../data/tickets';
import type { AuthUser } from '../types/auth.types';
import type {
  NewTicket,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../types/ticket.types';
import {
  canUpdateTicketStatus,
  canViewTicket,
  hasPermission,
} from '../utils/permissions';

const TICKET_STORAGE_KEY = 'supportdesk.tickets';
const validStatuses: readonly TicketStatus[] = ['Open', 'In progress', 'Resolved'];
const validPriorities: readonly TicketPriority[] = ['Low', 'Medium', 'High'];

function isTicket(value: unknown): value is Ticket {
  if (typeof value !== 'object' || value === null) return false;
  const ticket = value as Record<string, unknown>;
  return (
    typeof ticket.id === 'string' &&
    typeof ticket.subject === 'string' &&
    typeof ticket.customer === 'string' &&
    validStatuses.includes(ticket.status as TicketStatus) &&
    validPriorities.includes(ticket.priority as TicketPriority) &&
    (typeof ticket.assignedTo === 'string' || ticket.assignedTo === null) &&
    typeof ticket.createdAt === 'string'
  );
}

export function loadTickets(): Ticket[] {
  const storedTickets = window.localStorage.getItem(TICKET_STORAGE_KEY);
  if (!storedTickets) return initialTickets;

  try {
    const parsed: unknown = JSON.parse(storedTickets);
    if (Array.isArray(parsed) && parsed.every(isTicket)) return parsed;
    throw new Error('Saved ticket data has an invalid shape.');
  } catch (error) {
    console.error('Unable to load saved tickets.', error);
    return initialTickets;
  }
}

export function saveTickets(tickets: Ticket[]): void {
  window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
}

function requirePermission(user: AuthUser, permission: Parameters<typeof hasPermission>[1]): void {
  if (!hasPermission(user, permission)) {
    throw new Error('You do not have permission to perform this action.');
  }
}

function requireTicket(user: AuthUser, tickets: Ticket[], ticketId: string): Ticket {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket || !canViewTicket(user, ticket)) {
    throw new Error('This ticket is not available to your account.');
  }
  return ticket;
}

export function getTicketsForUser(user: AuthUser, tickets: Ticket[]): Ticket[] {
  return tickets.filter((ticket) => canViewTicket(user, ticket));
}

export function createTicket(
  user: AuthUser,
  tickets: Ticket[],
  ticket: NewTicket,
): Ticket[] {
  requirePermission(user, 'createTicket');
  const created: Ticket = {
    ...ticket,
    id: `TCK-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  return [created, ...tickets];
}

export function updateTicketStatus(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  status: TicketStatus,
): Ticket[] {
  const ticket = requireTicket(user, tickets, ticketId);
  if (!canUpdateTicketStatus(user, ticket)) {
    throw new Error('You cannot update this ticket’s status.');
  }
  return tickets.map((item) => (item.id === ticketId ? { ...item, status } : item));
}

export function updateTicketPriority(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  priority: TicketPriority,
): Ticket[] {
  requirePermission(user, 'updateTicketPriority');
  requireTicket(user, tickets, ticketId);
  return tickets.map((item) =>
    item.id === ticketId ? { ...item, priority } : item,
  );
}

export function assignTicket(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  assignedTo: string | null,
): Ticket[] {
  requirePermission(user, 'assignTicket');
  requireTicket(user, tickets, ticketId);
  return tickets.map((item) =>
    item.id === ticketId ? { ...item, assignedTo } : item,
  );
}

export function deleteTicket(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
): Ticket[] {
  requirePermission(user, 'deleteTicket');
  requireTicket(user, tickets, ticketId);
  return tickets.filter((ticket) => ticket.id !== ticketId);
}
