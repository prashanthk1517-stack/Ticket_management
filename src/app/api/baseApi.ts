import { createApi } from '@reduxjs/toolkit/query/react';
import { monitorApiQuery } from '../../monitoring/apiMonitor';
import { ticketBaseQuery } from './baseQuery';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: monitorApiQuery(ticketBaseQuery),
  tagTypes: ['Tickets'],
  endpoints: () => ({}),
});
