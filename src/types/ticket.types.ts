export type TicketStatus = 'Open' | 'In progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string | null;
  createdAt: string;
}

export type NewTicket = Omit<Ticket, 'id' | 'createdAt'>;
