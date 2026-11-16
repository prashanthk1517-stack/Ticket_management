import { createApi } from '@reduxjs/toolkit/query/react';
import { ticketBaseQuery } from './baseQuery';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: ticketBaseQuery,
  tagTypes: ['Tickets'],
  endpoints: () => ({}),
});
