import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ticket } from '../../../types/ticket.types';

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: [] as Ticket[],
  reducers: {
    ticketsReplaced(_state, action: PayloadAction<Ticket[]>) {
      return action.payload;
    },
  },
});

export const { ticketsReplaced } = ticketSlice.actions;
export const ticketReducer = ticketSlice.reducer;
