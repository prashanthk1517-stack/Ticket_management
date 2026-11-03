import type { Ticket } from '../types/ticket.types';

export const initialTickets: Ticket[] = [
  {
    id: 'TCK-1042',
    subject: 'Unable to reset account password',
    customer: 'Jamie Chen',
    status: 'Open',
    priority: 'High',
    assignedTo: 'agent-1',
    createdAt: '2026-11-02',
  },
  {
    id: 'TCK-1041',
    subject: 'Invoice shows an unexpected charge',
    customer: 'Riley Morgan',
    status: 'In progress',
    priority: 'Medium',
    assignedTo: 'agent-2',
    createdAt: '2026-11-01',
  },
  {
    id: 'TCK-1040',
    subject: 'Export report is missing columns',
    customer: 'Taylor Brooks',
    status: 'Open',
    priority: 'Low',
    assignedTo: 'agent-1',
    createdAt: '2026-10-31',
  },
  {
    id: 'TCK-1039',
    subject: 'Mobile app keeps signing out',
    customer: 'Jordan Lee',
    status: 'Resolved',
    priority: 'High',
    assignedTo: 'agent-2',
    createdAt: '2026-10-30',
  },
  {
    id: 'TCK-1038',
    subject: 'Request to update billing contact',
    customer: 'Casey Patel',
    status: 'Open',
    priority: 'Medium',
    assignedTo: null,
    createdAt: '2026-10-29',
  },
];
