import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import type { AuthUser } from '../../../types/auth.types';
import type { Ticket } from '../../../types/ticket.types';
import { getTicketsForUser } from '../services/ticketService';

const selectTickets = (state: RootState) => state.tickets;
const selectUser = (_state: RootState, user: AuthUser) => user;

export interface TicketCounts {
  Open: number;
  'In progress': number;
  Resolved: number;
}

export interface TicketView {
  tickets: Ticket[];
  counts: TicketCounts;
}

export const makeSelectTicketViewForUser = () =>
  createSelector(
    [selectTickets, selectUser],
    (tickets, user): TicketView => {
      const visibleTickets = getTicketsForUser(user, tickets);
      const counts = visibleTickets.reduce<TicketCounts>(
        (result, ticket) => {
          result[ticket.status] += 1;
          return result;
        },
        { Open: 0, 'In progress': 0, Resolved: 0 },
      );

      return { tickets: visibleTickets, counts };
    },
  );
