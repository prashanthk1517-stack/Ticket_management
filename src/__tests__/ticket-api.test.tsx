import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../app/store';
import {
  normalizeApiError,
  type TicketApiScenario,
} from '../app/api/baseQuery';
import { ApiErrorMessage, LoadingSpinner } from '../components/ui/ApiStates';
import { demoAccounts } from '../features/auth';
import {
  useCreateTicketMutation,
  useGetTicketsQuery,
} from '../features/tickets/services/ticketApi';
import type { NewTicket } from '../types/ticket.types';
import {
  clearApiMeasurements,
  getApiSummary,
} from '../monitoring/apiMonitor';
import { clearApplicationErrors } from '../monitoring/errorReporter';

const { password: _password, ...admin } = demoAccounts[0];
const newTicket: NewTicket = {
  subject: 'Test request',
  customer: 'Test Customer',
  status: 'Open',
  priority: 'Low',
  assignedTo: null,
};

function RequestHarness({
  scenario = 'healthy',
  store,
}: {
  scenario?: TicketApiScenario;
  store: ReturnType<typeof createAppStore>;
}) {
  const query = useGetTicketsQuery({ user: admin, search: '', scenario });
  const [createTicket, mutation] = useCreateTicketMutation();

  return (
    <main>
      {query.isLoading && <LoadingSpinner />}
      {query.isFetching && !query.isLoading && <p role="status">Refreshing tickets…</p>}
      {query.isError && (
        <ApiErrorMessage
          error={query.error}
          onRetry={() => { void query.refetch(); }}
          retrying={query.isFetching}
        />
      )}
      {mutation.error && <ApiErrorMessage error={mutation.error} />}
      <ul>{query.data?.map((ticket) => <li key={ticket.id}>{ticket.subject}</li>)}</ul>
      <button
        type="button"
        disabled={mutation.isLoading}
        onClick={() => {
          void createTicket({ user: admin, ticket: newTicket, scenario }).unwrap().catch(() => undefined);
        }}
      >
        Create test ticket
      </button>
      <span>{store.getState().tickets.length}</span>
    </main>
  );
}

function setup(scenario: TicketApiScenario = 'healthy') {
  window.localStorage.setItem('supportdesk.auth', JSON.stringify(admin));
  const store = createAppStore();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <RequestHarness scenario={scenario} store={store} />
    </Provider>,
  );
  return { store, user };
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('ticket API reliability', () => {
  it('records successful and failed RTK Query operations without exposing request data', async () => {
    clearApiMeasurements();
    clearApplicationErrors();
    setup('healthy');

    expect(await screen.findByText(
      'Unable to reset account password',
      {},
      { timeout: 5000 },
    )).not.toBeNull();
    expect(getApiSummary()).toMatchObject({
      totalRequests: 1,
      successfulRequests: 1,
      failedRequests: 0,
    });

    cleanup();
    clearApiMeasurements();
    setup('network');
    expect(await screen.findByText(
      'Unable to reach the service. Check your connection and try again.',
      {},
      { timeout: 5000 },
    )).not.toBeNull();
    expect(getApiSummary()).toMatchObject({
      totalRequests: 1,
      successfulRequests: 0,
      failedRequests: 1,
    });
  });

  it('loads the successful ticket response and exposes its initial loading state', async () => {
    setup('slow');

    expect(screen.getByRole('status').textContent).toContain('Loading tickets');
    expect(await screen.findByText(
      'Unable to reset account password',
      {},
      { timeout: 5000 },
    )).not.toBeNull();
  });

  it('shows a safe network error and retries only through the explicit retry action', async () => {
    const { user } = setup('network');

    const networkMessage = 'Unable to reach the service. Check your connection and try again.';
    expect(await screen.findByText(networkMessage, {}, { timeout: 5000 })).not.toBeNull();
    expect(screen.queryByText('Internal server details')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Retry tickets' }));
    expect(await screen.findByText('Loading tickets…')).not.toBeNull();
    expect(await screen.findByText(networkMessage, {}, { timeout: 5000 })).not.toBeNull();
  });

  it('clears the demo session after an unauthorized response', async () => {
    const { store } = setup('unauthorized');

    await waitFor(() => expect(store.getState().auth.user).toBeNull());
    expect(window.localStorage.getItem('supportdesk.auth')).toBeNull();
    expect(await screen.findByText('Your session has expired. Sign in again.')).not.toBeNull();
  });

  it('shows a safe forbidden message without offering a pointless retry', async () => {
    setup('forbidden');

    expect(await screen.findByText('You do not have permission to do that.'))
      .not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry tickets' })).toBeNull();
  });

  it('shows mutation validation failures without changing tickets', async () => {
    const { store, user } = setup('validation');
    const originalCount = store.getState().tickets.length;

    await user.click(screen.getByRole('button', { name: 'Create test ticket' }));

    expect(await screen.findByText(
      'Please review the information and try again.',
    )).not.toBeNull();
    expect(store.getState().tickets).toHaveLength(originalCount);
  });

  it('normalizes HTTP statuses without exposing server-provided details', () => {
    expect(normalizeApiError(401)).toEqual({
      status: 401,
      kind: 'unauthorized',
      message: 'Your session has expired. Sign in again.',
    });
    expect(normalizeApiError(422).kind).toBe('validation');
    expect(normalizeApiError(500).message).not.toContain('stack');
    expect(normalizeApiError('FETCH_ERROR').kind).toBe('network');
  });
});
