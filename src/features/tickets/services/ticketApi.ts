import { baseApi } from '../../../app/api/baseApi';
import type { TicketApiRequest, TicketApiScenario } from '../../../app/api/baseQuery';
import type { AuthUser } from '../../../types/auth.types';
import type {
  NewTicket,
  Ticket,
  TicketDetailsDraft,
  TicketPriority,
  TicketStatus,
} from '../../../types/ticket.types';

interface TicketListRequest {
  user: AuthUser;
  search: string;
  scenario: TicketApiScenario;
}

interface TicketMutationBase {
  user: AuthUser;
  scenario: TicketApiScenario;
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTickets: build.query<Ticket[], TicketListRequest>({
      query: (request): TicketApiRequest => ({
        operation: 'getTickets',
        ...request,
      }),
      providesTags: ['Tickets'],
    }),
    createTicket: build.mutation<void, TicketMutationBase & { ticket: NewTicket }>({
      query: (request): TicketApiRequest => ({ operation: 'createTicket', ...request }),
      invalidatesTags: ['Tickets'],
    }),
    updateTicketDetails: build.mutation<
      void,
      TicketMutationBase & { ticketId: string; details: TicketDetailsDraft }
    >({
      query: (request): TicketApiRequest => ({ operation: 'updateTicketDetails', ...request }),
      invalidatesTags: ['Tickets'],
    }),
    updateTicketStatus: build.mutation<
      void,
      TicketMutationBase & { ticketId: string; status: TicketStatus }
    >({
      query: (request): TicketApiRequest => ({ operation: 'updateTicketStatus', ...request }),
      invalidatesTags: ['Tickets'],
    }),
    updateTicketPriority: build.mutation<
      void,
      TicketMutationBase & { ticketId: string; priority: TicketPriority }
    >({
      query: (request): TicketApiRequest => ({ operation: 'updateTicketPriority', ...request }),
      invalidatesTags: ['Tickets'],
    }),
    assignTicket: build.mutation<
      void,
      TicketMutationBase & { ticketId: string; assignedTo: string | null }
    >({
      query: (request): TicketApiRequest => ({ operation: 'assignTicket', ...request }),
      invalidatesTags: ['Tickets'],
    }),
    deleteTicket: build.mutation<void, TicketMutationBase & { ticketId: string }>({
      query: (request): TicketApiRequest => ({ operation: 'deleteTicket', ...request }),
      invalidatesTags: ['Tickets'],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useCreateTicketMutation,
  useUpdateTicketDetailsMutation,
  useUpdateTicketStatusMutation,
  useUpdateTicketPriorityMutation,
  useAssignTicketMutation,
  useDeleteTicketMutation,
} = ticketApi;
