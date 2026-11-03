import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../components/auth/LoginPage';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { TicketDashboard } from '../pages/Dashboard/TicketDashboard';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { AppRoutes } from '../routes/AppRoutes';
import { demoAccounts } from '../services/authService';
import {
  deleteTicket,
  getTicketsForUser,
  loadTickets,
  updateTicketStatus,
} from '../services/ticketService';
import { hasPermission } from '../utils/permissions';
import { MemoryRouter } from 'react-router-dom';

function renderRoutes(initialEntry = '/tickets') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/tickets" element={<TicketDashboard />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('mock authentication', () => {
  it('authenticates valid credentials and restores the requested protected route', async () => {
    const user = userEvent.setup();
    renderRoutes('/tickets');

    await user.type(screen.getByLabelText('Work email'), 'admin@support.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Ticket dashboard' })).not.toBeNull();
    expect(screen.getByText('Avery Admin')).not.toBeNull();
    expect(window.localStorage.getItem('supportdesk.auth')).not.toBeNull();
  });

  it('shows an error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderRoutes('/login');

    await user.type(screen.getByLabelText('Work email'), 'admin@support.test');
    await user.type(screen.getByLabelText('Password'), 'incorrect');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The email or password is incorrect.',
    );
    expect(window.localStorage.getItem('supportdesk.auth')).toBeNull();
  });

  it('redirects unauthenticated users to login and restores the destination after sign-in', async () => {
    const user = userEvent.setup();
    renderRoutes('/tickets');

    expect(screen.getByRole('heading', { name: 'Welcome back' })).not.toBeNull();
    await user.type(screen.getByLabelText('Work email'), 'manager@support.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Ticket dashboard' })).not.toBeNull();
  });

  it('returns an authenticated user to the originally requested role-protected route', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider><AppRoutes /></AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Work email'), 'admin@support.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Administration' })).not.toBeNull();
  });
});

describe('role permissions and ticket visibility', () => {
  const [administrator, manager, alex, sam] = demoAccounts;

  it('grants each role only its expected permissions', () => {
    expect(hasPermission(administrator, 'deleteTicket')).toBe(true);
    expect(hasPermission(administrator, 'createTicket')).toBe(true);
    expect(hasPermission(manager, 'assignTicket')).toBe(true);
    expect(hasPermission(manager, 'updateTicketPriority')).toBe(true);
    expect(hasPermission(manager, 'deleteTicket')).toBe(false);
    expect(hasPermission(alex, 'updateTicketStatus')).toBe(true);
    expect(hasPermission(alex, 'updateTicketPriority')).toBe(false);
    expect(hasPermission(alex, 'viewTeamStatistics')).toBe(false);
  });

  it('limits agents to their own tickets and rejects unauthorized delete attempts', () => {
    const tickets = loadTickets();
    expect(getTicketsForUser(alex, tickets).every((ticket) => ticket.assignedTo === alex.id)).toBe(true);
    expect(getTicketsForUser(sam, tickets).every((ticket) => ticket.assignedTo === sam.id)).toBe(true);
    expect(() => deleteTicket(manager, tickets, tickets[0].id)).toThrow(
      'You do not have permission',
    );
    expect(() => deleteTicket(alex, tickets, tickets[0].id)).toThrow(
      'You do not have permission',
    );
    expect(() => updateTicketStatus(alex, tickets, tickets[1].id, 'Resolved')).toThrow(
      'This ticket is not available',
    );
  });

  it('does not render tickets belonging to another agent', async () => {
    window.localStorage.setItem('supportdesk.auth', JSON.stringify({
      id: 'agent-1',
      name: alex.name,
      email: alex.email,
      role: alex.role,
    }));
    renderRoutes('/tickets');

    expect(await screen.findByRole('heading', { name: 'My assigned tickets' })).not.toBeNull();
    expect(screen.getByText('Unable to reset account password')).not.toBeNull();
    expect(screen.queryByText('Invoice shows an unexpected charge')).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('persists authentication across a page refresh', async () => {
    window.localStorage.setItem('supportdesk.auth', JSON.stringify({
      id: 'manager-1',
      name: manager.name,
      email: manager.email,
      role: manager.role,
    }));
    renderRoutes('/tickets');

    expect(await screen.findByRole('heading', { name: 'Ticket dashboard' })).not.toBeNull();
    expect(screen.getByText('Morgan Manager')).not.toBeNull();
  });

  it('redirects a manager away from the administrator dashboard', async () => {
    window.localStorage.setItem('supportdesk.auth', JSON.stringify({
      id: 'manager-1',
      name: manager.name,
      email: manager.email,
      role: manager.role,
    }));
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider><AppRoutes /></AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'You don’t have access to this page' })).not.toBeNull();
  });

  it('supports logout and clears the persisted session', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('supportdesk.auth', JSON.stringify({
      id: 'admin-1',
      name: administrator.name,
      email: administrator.email,
      role: administrator.role,
    }));
    renderRoutes('/tickets');
    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).not.toBeNull();
    expect(window.localStorage.getItem('supportdesk.auth')).toBeNull();
  });
});
