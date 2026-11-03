import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoAccounts } from '../services/authService';
import {
  assignTicket,
  createTicket,
  deleteTicket,
  getTicketsForUser,
  loadTickets,
  saveTickets,
  updateTicketPriority,
  updateTicketStatus,
} from '../services/ticketService';
import type { AuthUser } from '../types/auth.types';
import type {
  NewTicket,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../types/ticket.types';

export function useTickets(user: AuthUser) {
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);

  useEffect(() => {
    try {
      saveTickets(tickets);
    } catch (error) {
      console.error('Unable to save ticket changes.', error);
    }
  }, [tickets]);

  const visibleTickets = useMemo(
    () => getTicketsForUser(user, tickets),
    [tickets, user],
  );

  const addTicket = useCallback(
    (ticket: NewTicket) => setTickets(createTicket(user, tickets, ticket)),
    [tickets, user],
  );
  const changeStatus = useCallback(
    (ticketId: string, status: TicketStatus) =>
      setTickets(updateTicketStatus(user, tickets, ticketId, status)),
    [tickets, user],
  );
  const changePriority = useCallback(
    (ticketId: string, priority: TicketPriority) =>
      setTickets(updateTicketPriority(user, tickets, ticketId, priority)),
    [tickets, user],
  );
  const reassignTicket = useCallback(
    (ticketId: string, assignedTo: string | null) =>
      setTickets(assignTicket(user, tickets, ticketId, assignedTo)),
    [tickets, user],
  );
  const removeTicket = useCallback(
    (ticketId: string) =>
      setTickets(deleteTicket(user, tickets, ticketId)),
    [tickets, user],
  );

  return {
    tickets: visibleTickets,
    addTicket,
    changeStatus,
    changePriority,
    reassignTicket,
    removeTicket,
    agents: demoAccounts.filter((account) => account.role === 'supportAgent'),
  };
}
