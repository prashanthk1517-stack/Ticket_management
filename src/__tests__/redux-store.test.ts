import { afterEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../app/store';
import { demoAccounts } from '../features/auth';
import { employeeAdded } from '../features/employees/state/employeeSlice';
import { ticketsReplaced } from '../features/tickets/state/ticketSlice';
import { makeSelectTicketViewForUser } from '../features/tickets/state/ticketSelectors';

afterEach(() => {
  window.localStorage.clear();
});

describe('Redux Toolkit store', () => {
  it('hydrates employee and ticket state from browser storage', () => {
    const employee = {
      id: 'employee-test',
      name: 'Taylor Test',
      email: 'taylor@example.com',
      role: 'Designer',
      department: 'Design',
      salary: 80000,
      status: 'Active' as const,
      joiningDate: '2024-01-01',
    };
    const ticket = {
      id: 'ticket-test',
      subject: 'Stored ticket',
      customer: 'Taylor Test',
      status: 'Open' as const,
      priority: 'Low' as const,
      assignedTo: null,
      createdAt: '2024-01-01',
    };
    window.localStorage.setItem(
      'peopledesk.employees',
      JSON.stringify([employee]),
    );
    window.localStorage.setItem('supportdesk.tickets', JSON.stringify([ticket]));

    const store = createAppStore();

    expect(store.getState().employees).toEqual([employee]);
    expect(store.getState().tickets).toEqual([ticket]);
  });

  it('persists ticket and employee updates from Redux state', () => {
    const store = createAppStore();
    const employee = {
      id: 'employee-test',
      name: 'Taylor Test',
      email: 'taylor@example.com',
      role: 'Designer',
      department: 'Design',
      salary: 80000,
      status: 'Active' as const,
      joiningDate: '2024-01-01',
    };

    store.dispatch(employeeAdded(employee));
    store.dispatch(ticketsReplaced([
      ...store.getState().tickets,
      {
        id: 'ticket-test',
        subject: 'New ticket',
        customer: 'Taylor Test',
        status: 'Open',
        priority: 'Low',
        assignedTo: null,
        createdAt: '2024-01-01',
      },
    ]));

    expect(JSON.parse(window.localStorage.getItem('peopledesk.employees') ?? '[]'))
      .toContainEqual(employee);
    expect(JSON.parse(window.localStorage.getItem('supportdesk.tickets') ?? '[]'))
      .toContainEqual(expect.objectContaining({ id: 'ticket-test' }));
  });

  it('keeps the memoized ticket view stable for unrelated Redux updates', () => {
    const store = createAppStore();
    const selectTicketView = makeSelectTicketViewForUser();
    const administrator = demoAccounts[0];
    const firstView = selectTicketView(store.getState(), administrator);

    store.dispatch(employeeAdded({
      id: 'employee-test',
      name: 'Taylor Test',
      email: 'taylor@example.com',
      role: 'Designer',
      department: 'Design',
      salary: 80000,
      status: 'Active',
      joiningDate: '2024-01-01',
    }));

    expect(selectTicketView(store.getState(), administrator)).toBe(firstView);
  });
});
