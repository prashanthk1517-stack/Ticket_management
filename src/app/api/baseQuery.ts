import { retry, type BaseQueryFn } from '@reduxjs/toolkit/query';
import { clearStoredUser } from '../../features/auth/services/authService';
import { loggedOut } from '../../features/auth/state/authSlice';
import {
  assignTicket,
  createTicket,
  deleteTicket,
  getTicketsForUser,
  updateTicketDetails,
  updateTicketPriority,
  updateTicketStatus,
  TicketServiceError,
} from '../../features/tickets/services/ticketService';
import { ticketsReplaced } from '../../features/tickets/state/ticketSlice';
import type { AuthUser } from '../../types/auth.types';
import type {
  NewTicket,
  Ticket,
  TicketDetailsDraft,
  TicketPriority,
  TicketStatus,
} from '../../types/ticket.types';

export type TicketApiScenario =
  | 'healthy'
  | 'slow'
  | 'network'
  | 'unavailable'
  | 'unauthorized'
  | 'forbidden'
  | 'validation';

export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'unknown';

export interface ApiError {
  status: number | 'FETCH_ERROR' | 'CUSTOM_ERROR';
  kind: ApiErrorKind;
  message: string;
}

export type TicketApiRequest =
  | {
      operation: 'getTickets';
      user: AuthUser;
      search: string;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'createTicket';
      user: AuthUser;
      ticket: NewTicket;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'updateTicketDetails';
      user: AuthUser;
      ticketId: string;
      details: TicketDetailsDraft;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'updateTicketStatus';
      user: AuthUser;
      ticketId: string;
      status: TicketStatus;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'updateTicketPriority';
      user: AuthUser;
      ticketId: string;
      priority: TicketPriority;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'assignTicket';
      user: AuthUser;
      ticketId: string;
      assignedTo: string | null;
      scenario: TicketApiScenario;
    }
  | {
      operation: 'deleteTicket';
      user: AuthUser;
      ticketId: string;
      scenario: TicketApiScenario;
    };

const DEMO_REQUEST_DELAY_MS = 300;
const SLOW_REQUEST_DELAY_MS = 1200;

const errorMessages: Record<number, { kind: ApiErrorKind; message: string }> = {
  400: { kind: 'validation', message: 'Please check the request and try again.' },
  401: { kind: 'unauthorized', message: 'Your session has expired. Sign in again.' },
  403: { kind: 'forbidden', message: 'You do not have permission to do that.' },
  404: { kind: 'notFound', message: 'The requested item could not be found.' },
  409: { kind: 'conflict', message: 'This change conflicts with the latest data.' },
  422: { kind: 'validation', message: 'Please review the information and try again.' },
  500: { kind: 'server', message: 'The service encountered a problem. Try again later.' },
  503: { kind: 'server', message: 'The service is temporarily unavailable. Try again.' },
};

export function normalizeApiError(status: number | 'FETCH_ERROR' | 'CUSTOM_ERROR'): ApiError {
  if (status === 'FETCH_ERROR') {
    return {
      status,
      kind: 'network',
      message: 'Unable to reach the service. Check your connection and try again.',
    };
  }
  if (status === 'CUSTOM_ERROR') {
    return { status, kind: 'unknown', message: 'The request could not be completed.' };
  }
  const mappedError = errorMessages[status];
  return {
    status,
    kind: mappedError?.kind ?? (status >= 500 ? 'server' : 'unknown'),
    message: mappedError?.message ?? (status >= 500
      ? 'The service encountered a problem. Try again later.'
      : 'The request could not be completed.'),
  };
}

function delay(signal: AbortSignal, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Request cancelled.', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, duration);
    const cancel = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Request cancelled.', 'AbortError'));
    };
    signal.addEventListener('abort', cancel, { once: true });
  });
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (value.kind === 'network' || value.kind === 'server');
}

function getScenarioError(
  scenario: TicketApiScenario,
  operation: TicketApiRequest['operation'],
): ApiError | undefined {
  if (scenario === 'healthy') return undefined;
  if (scenario === 'network') return normalizeApiError('FETCH_ERROR');
  if (scenario === 'unavailable') return normalizeApiError(503);
  if (scenario === 'unauthorized') return normalizeApiError(401);
  if (scenario === 'forbidden') return normalizeApiError(403);
  if (scenario === 'validation' && operation !== 'getTickets') {
    return normalizeApiError(422);
  }
  return undefined;
}

const localTicketBaseQuery: BaseQueryFn<TicketApiRequest, unknown, ApiError> = async (
  request,
  api,
) => {
  if (request.scenario !== 'healthy' || request.operation === 'getTickets') {
    try {
      await delay(
        api.signal,
        request.scenario === 'slow' ? SLOW_REQUEST_DELAY_MS : DEMO_REQUEST_DELAY_MS,
      );
    } catch {
      if (api.signal.aborted) {
        return { error: { status: 'CUSTOM_ERROR', kind: 'unknown', message: '' } };
      }
      return { error: normalizeApiError('CUSTOM_ERROR') };
    }
  }

  const simulatedError = getScenarioError(request.scenario, request.operation);
  if (simulatedError) {
    if (simulatedError.kind === 'unauthorized') {
      clearStoredUser();
      api.dispatch(loggedOut());
    }
    return { error: simulatedError };
  }

  const state = api.getState() as { tickets: Ticket[] };
  const tickets = state.tickets;

  try {
    switch (request.operation) {
      case 'getTickets': {
        const query = request.search.trim().toLowerCase();
        const visible = getTicketsForUser(request.user, tickets);
        return {
          data: query
            ? visible.filter((ticket) =>
                [ticket.id, ticket.subject, ticket.customer]
                  .some((value) => value.toLowerCase().includes(query)),
              )
            : visible,
        };
      }
      case 'createTicket':
        api.dispatch(ticketsReplaced(createTicket(request.user, tickets, request.ticket)));
        return { data: undefined };
      case 'updateTicketDetails':
        api.dispatch(ticketsReplaced(updateTicketDetails(
          request.user, tickets, request.ticketId, request.details,
        )));
        return { data: undefined };
      case 'updateTicketStatus':
        api.dispatch(ticketsReplaced(updateTicketStatus(
          request.user, tickets, request.ticketId, request.status,
        )));
        return { data: undefined };
      case 'updateTicketPriority':
        api.dispatch(ticketsReplaced(updateTicketPriority(
          request.user, tickets, request.ticketId, request.priority,
        )));
        return { data: undefined };
      case 'assignTicket':
        api.dispatch(ticketsReplaced(assignTicket(
          request.user, tickets, request.ticketId, request.assignedTo,
        )));
        return { data: undefined };
      case 'deleteTicket':
        api.dispatch(ticketsReplaced(deleteTicket(
          request.user, tickets, request.ticketId,
        )));
        return { data: undefined };
    }
  } catch (error) {
    return {
      error: error instanceof TicketServiceError
        ? normalizeApiError(error.status)
        : normalizeApiError(500),
    };
  }
};

export const ticketBaseQuery = retry(localTicketBaseQuery, {
  backoff: async (attempt, _maxRetries, signal) => {
    await new Promise<void>((resolve) => {
      const finish = () => {
        window.clearTimeout(timer);
        signal?.removeEventListener('abort', finish);
        resolve();
      };
      const timer = window.setTimeout(finish, Math.min(20 * 2 ** attempt, 80));
      signal?.addEventListener('abort', finish, { once: true });
    });
  },
  retryCondition: (error: unknown, request: TicketApiRequest, { attempt }: { attempt: number }) =>
    attempt <= 2 && request.operation === 'getTickets' && isApiError(error) &&
    (error.kind === 'network' || error.status === 503),
});
