import { initialTickets } from '../../../data/tickets';
import type { AuthUser } from '../../../types/auth.types';
import type {
  NewTicket,
  Ticket,
  TicketDetailsDraft,
  TicketPriority,
  TicketStatus,
} from '../../../types/ticket.types';
import {
  canUpdateTicketStatus,
  canViewTicket,
  hasPermission,
} from '../../../utils/permissions';
import { demoAccounts } from '../../auth/services/authService';

const TICKET_STORAGE_KEY = 'supportdesk.tickets';
const validStatuses: readonly TicketStatus[] = ['Open', 'In progress', 'Resolved'];
const validPriorities: readonly TicketPriority[] = ['Low', 'Medium', 'High'];
const assignableAgentIds = new Set(
  demoAccounts.filter((account) => account.role === 'supportAgent').map((account) => account.id),
);
const ticketFields = [
  'id', 'subject', 'customer', 'status', 'priority', 'assignedTo', 'createdAt',
] as const;

export class TicketServiceError extends Error {
  constructor(
    message: string,
    readonly status: 403 | 404 | 422,
  ) {
    super(message);
    this.name = 'TicketServiceError';
  }
}

function invalidTicket(message: string): never {
  throw new TicketServiceError(message, 422);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateFields(
  value: unknown,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!isRecord(value)) return invalidTicket('Ticket details are invalid.');
  if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
    return invalidTicket('Ticket contains unsupported fields.');
  }
  return value;
}

function validateText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') return invalidTicket(`${label} is required.`);
  const text = value.trim();
  if (!text) return invalidTicket(`${label} is required.`);
  if (text.length > maxLength) return invalidTicket(`${label} must be ${maxLength} characters or fewer.`);
  if (/[\u0000-\u001f\u007f]/.test(text)) return invalidTicket(`${label} contains invalid characters.`);
  return text;
}

function validateStatus(value: unknown): TicketStatus {
  if (typeof value !== 'string' || !validStatuses.includes(value as TicketStatus)) {
    return invalidTicket('Choose a valid ticket status.');
  }
  return value as TicketStatus;
}

function validatePriority(value: unknown): TicketPriority {
  if (typeof value !== 'string' || !validPriorities.includes(value as TicketPriority)) {
    return invalidTicket('Choose a valid ticket priority.');
  }
  return value as TicketPriority;
}

function validateAssignee(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !assignableAgentIds.has(value)) {
    return invalidTicket('Choose a valid support agent.');
  }
  return value;
}

function validateNewTicket(value: unknown): NewTicket {
  const ticket = validateFields(value, ['subject', 'customer', 'status', 'priority', 'assignedTo']);
  return {
    subject: validateText(ticket.subject, 'Subject', 120),
    customer: validateText(ticket.customer, 'Customer', 80),
    status: validateStatus(ticket.status),
    priority: validatePriority(ticket.priority),
    assignedTo: validateAssignee(ticket.assignedTo),
  };
}

function validateTicketDetails(value: unknown): TicketDetailsDraft {
  const details = validateFields(value, ['subject', 'customer', 'priority', 'assignedTo']);
  return {
    subject: validateText(details.subject, 'Subject', 120),
    customer: validateText(details.customer, 'Customer', 80),
    priority: validatePriority(details.priority),
    assignedTo: validateAssignee(details.assignedTo),
  };
}

function isTicket(value: unknown): value is Ticket {
  if (!isRecord(value)) return false;
  const ticket = value;
  return (
    Object.keys(ticket).every((field) => ticketFields.includes(field as typeof ticketFields[number])) &&
    typeof ticket.id === 'string' && ticket.id.length > 0 &&
    typeof ticket.subject === 'string' && ticket.subject.trim() === ticket.subject &&
    ticket.subject.length > 0 && ticket.subject.length <= 120 &&
    !/[\u0000-\u001f\u007f]/.test(ticket.subject) &&
    typeof ticket.customer === 'string' && ticket.customer.trim() === ticket.customer &&
    ticket.customer.length > 0 && ticket.customer.length <= 80 &&
    !/[\u0000-\u001f\u007f]/.test(ticket.customer) &&
    validStatuses.includes(ticket.status as TicketStatus) &&
    validPriorities.includes(ticket.priority as TicketPriority) &&
    (ticket.assignedTo === null ||
      (typeof ticket.assignedTo === 'string' && assignableAgentIds.has(ticket.assignedTo))) &&
    typeof ticket.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ticket.createdAt)
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
    throw new TicketServiceError('You do not have permission to perform this action.', 403);
  }
}

function requireTicket(user: AuthUser, tickets: Ticket[], ticketId: string): Ticket {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket || !canViewTicket(user, ticket)) {
    throw new TicketServiceError('This ticket is not available to your account.', 404);
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
  const validatedTicket = validateNewTicket(ticket);
  const created: Ticket = {
    subject: validatedTicket.subject,
    customer: validatedTicket.customer,
    status: validatedTicket.status,
    priority: validatedTicket.priority,
    assignedTo: validatedTicket.assignedTo,
    id: `TCK-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  return [created, ...tickets];
}

export function updateTicketDetails(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  details: TicketDetailsDraft,
): Ticket[] {
  requirePermission(user, 'updateTicketDetails');
  requireTicket(user, tickets, ticketId);
  const validatedDetails = validateTicketDetails(details);
  return tickets.map((ticket) =>
    ticket.id === ticketId ? { ...ticket, ...validatedDetails } : ticket,
  );
}

export function updateTicketStatus(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  status: TicketStatus,
): Ticket[] {
  const ticket = requireTicket(user, tickets, ticketId);
  if (!canUpdateTicketStatus(user, ticket)) {
    throw new TicketServiceError('You cannot update this ticket’s status.', 403);
  }
  const validatedStatus = validateStatus(status);
  return tickets.map((item) => (item.id === ticketId ? { ...item, status: validatedStatus } : item));
}

export function updateTicketPriority(
  user: AuthUser,
  tickets: Ticket[],
  ticketId: string,
  priority: TicketPriority,
): Ticket[] {
  requirePermission(user, 'updateTicketPriority');
  requireTicket(user, tickets, ticketId);
  const validatedPriority = validatePriority(priority);
  return tickets.map((item) =>
    item.id === ticketId ? { ...item, priority: validatedPriority } : item,
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
  const validatedAssignee = validateAssignee(assignedTo);
  return tickets.map((item) =>
    item.id === ticketId ? { ...item, assignedTo: validatedAssignee } : item,
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
