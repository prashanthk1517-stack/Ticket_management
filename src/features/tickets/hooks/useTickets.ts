import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { demoAccounts } from '../../auth';
import {
  assignTicket,
  createTicket,
  deleteTicket,
  updateTicketDetails,
  updateTicketPriority,
  updateTicketStatus,
} from '../services/ticketService';
import type { AuthUser } from '../../../types/auth.types';
import type {
  NewTicket,
  TicketDetailsDraft,
  TicketPriority,
  TicketStatus,
} from '../../../types/ticket.types';
import { ticketsReplaced } from '../state/ticketSlice';
import { makeSelectTicketViewForUser } from '../state/ticketSelectors';

const supportAgents = demoAccounts.filter((account) => account.role === 'supportAgent');

export function useTickets(user: AuthUser) {
  const dispatch = useAppDispatch();
  const selectTicketView = useMemo(makeSelectTicketViewForUser, []);
  const allTickets = useAppSelector((state) => state.tickets);
  const { tickets: visibleTickets, counts } = useAppSelector(
    (state) => selectTicketView(state, user),
  );

  const addTicket = useCallback(
    (ticket: NewTicket) =>
      dispatch(ticketsReplaced(createTicket(user, allTickets, ticket))),
    [allTickets, dispatch, user],
  );
  const editTicket = useCallback(
    (ticketId: string, details: TicketDetailsDraft) =>
      dispatch(
        ticketsReplaced(
          updateTicketDetails(user, allTickets, ticketId, details),
        ),
      ),
    [allTickets, dispatch, user],
  );
  const changeStatus = useCallback(
    (ticketId: string, status: TicketStatus) =>
      dispatch(
        ticketsReplaced(updateTicketStatus(user, allTickets, ticketId, status)),
      ),
    [allTickets, dispatch, user],
  );
  const changePriority = useCallback(
    (ticketId: string, priority: TicketPriority) =>
      dispatch(
        ticketsReplaced(
          updateTicketPriority(user, allTickets, ticketId, priority),
        ),
      ),
    [allTickets, dispatch, user],
  );
  const reassignTicket = useCallback(
    (ticketId: string, assignedTo: string | null) =>
      dispatch(
        ticketsReplaced(assignTicket(user, allTickets, ticketId, assignedTo)),
      ),
    [allTickets, dispatch, user],
  );
  const removeTicket = useCallback(
    (ticketId: string) =>
      dispatch(ticketsReplaced(deleteTicket(user, allTickets, ticketId))),
    [allTickets, dispatch, user],
  );

  return {
    tickets: visibleTickets,
    counts,
    addTicket,
    editTicket,
    changeStatus,
    changePriority,
    reassignTicket,
    removeTicket,
    agents: supportAgents,
  };
}
