import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../app/store';
import { demoAccounts } from '../features/auth';
import { deleteTicket, createTicket, loadTickets, TicketServiceError } from '../features/tickets/services/ticketService';
import { AppRoutes } from '../routes/AppRoutes';
import type { AuthUser } from '../types/auth.types';
import type { NewTicket, TicketPriority, TicketStatus } from '../types/ticket.types';
import { hasPermission } from '../utils/permissions';

const [adminAccount, managerAccount, agentAccount] = demoAccounts;
const { password: _adminPassword, ...admin } = adminAccount;
const { password: _managerPassword, ...manager } = managerAccount;
const { password: _agentPassword, ...agent } = agentAccount;
const validDraft: NewTicket = {
  subject: 'Validated ticket',
  customer: 'Sample customer',
  status: 'Open',
  priority: 'Medium',
  assignedTo: null,
};

function renderAs(user: AuthUser, path: string) {
  window.localStorage.setItem('supportdesk.auth', JSON.stringify(user));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Provider store={createAppStore()}>
        <AppRoutes />
      </Provider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('security and role-based access', () => {
  it('grants managers ticket creation and assignment but not admin or delete permissions', () => {
    expect(hasPermission(admin, 'manageUsers')).toBe(true);
    expect(hasPermission(manager, 'createTicket')).toBe(true);
    expect(hasPermission(manager, 'assignTicket')).toBe(true);
    expect(hasPermission(manager, 'deleteTicket')).toBe(false);
    expect(hasPermission(manager, 'manageUsers')).toBe(false);
    expect(hasPermission(agent, 'createTicket')).toBe(false);
    expect(hasPermission(agent, 'assignTicket')).toBe(false);
    expect(hasPermission(agent, 'deleteTicket')).toBe(false);
  });

  it('sends an agent attempting to open user management to the unauthorized page', async () => {
    renderAs(agent, '/users');

    expect(await screen.findByRole('heading', {
      name: 'You don’t have access to this page',
    })).not.toBeNull();
  });

  it('rejects unauthorized ticket deletion without mutating the source records', () => {
    const tickets = loadTickets();
    const originalTickets = [...tickets];

    expect(() => deleteTicket(agent, tickets, tickets[0].id))
      .toThrow('You do not have permission');
    expect(tickets).toEqual(originalTickets);
  });

  it('rejects missing, overlong, invalid, and unexpected ticket fields', () => {
    const invalidDrafts: NewTicket[] = [
      { ...validDraft, subject: '  ' },
      { ...validDraft, customer: 'c'.repeat(81) },
      { ...validDraft, status: 'Closed' as TicketStatus },
      { ...validDraft, priority: 'Urgent' as TicketPriority },
      { ...validDraft, assignedTo: 'admin-1' },
      { ...validDraft, subject: 'Invalid\nsubject' },
    ];

    for (const draft of invalidDrafts) {
      try {
        createTicket(manager, loadTickets(), draft);
        throw new Error('Expected invalid ticket input to be rejected.');
      } catch (error) {
        expect(error).toBeInstanceOf(TicketServiceError);
        expect((error as TicketServiceError).status).toBe(422);
      }
    }

    const withExtraField = { ...validDraft, isAdmin: true };
    expect(() => createTicket(manager, loadTickets(), withExtraField))
      .toThrow('Ticket contains unsupported fields.');
  });

  it('renders script-like ticket text as text rather than executable markup', async () => {
    const user = userEvent.setup();
    const { container } = renderAs(manager, '/tickets');
    const payload = '<img src=x onerror=alert(1)> support request';

    await screen.findByRole('table', { name: 'Customer support tickets' });
    await user.click(screen.getByRole('button', { name: 'Create ticket' }));
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), payload);
    await user.type(screen.getByRole('textbox', { name: 'Customer' }), 'Example customer');
    await user.click(screen.getByRole('button', { name: 'Add ticket' }));

    expect(await screen.findByText(payload)).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('displays validation feedback and keeps the form open for invalid input', async () => {
    const user = userEvent.setup();
    renderAs(manager, '/tickets');

    await screen.findByRole('table', { name: 'Customer support tickets' });
    await user.click(screen.getByRole('button', { name: 'Create ticket' }));
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), ' ');
    await user.type(screen.getByRole('textbox', { name: 'Customer' }), 'Example customer');
    await user.click(screen.getByRole('button', { name: 'Add ticket' }));

    expect(await screen.findByText(
      'Please review the information and try again.',
      { selector: '.form-error' },
    ))
      .not.toBeNull();
    expect(screen.getByRole('dialog')).not.toBeNull();
  });
});
