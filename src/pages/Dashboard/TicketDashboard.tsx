import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useTickets } from '../../hooks/useTickets';
import { getRoleLabel } from '../../services/authService';
import type {
  NewTicket,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../types/ticket.types';

const emptyDraft: NewTicket = {
  subject: '',
  customer: '',
  status: 'Open',
  priority: 'Medium',
  assignedTo: null,
};

function getTicketCounts(tickets: Ticket[]) {
  return tickets.reduce(
    (counts, ticket) => {
      counts[ticket.status] += 1;
      return counts;
    },
    { Open: 0, 'In progress': 0, Resolved: 0 },
  );
}

export function TicketDashboard() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <TicketDashboardContent user={user} logout={logout} />;
}

function TicketDashboardContent({
  user,
  logout,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  logout: ReturnType<typeof useAuth>['logout'];
}) {
  const { checkPermission } = usePermissions();
  const {
    tickets,
    addTicket,
    changeStatus,
    changePriority,
    reassignTicket,
    removeTicket,
    agents,
  } = useTickets(user);
  const [draft, setDraft] = useState<NewTicket>(emptyDraft);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const counts = useMemo(() => getTicketCounts(tickets), [tickets]);

  function runAction(action: () => void, message: string) {
    setError('');
    setNotice('');
    try {
      action();
      setNotice(message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to complete this action.',
      );
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAction(() => addTicket(draft), 'Ticket created.');
    setDraft(emptyDraft);
  }

  function handleDelete(ticket: Ticket) {
    if (!window.confirm(`Delete ${ticket.id}: ${ticket.subject}?`)) return;
    runAction(() => removeTicket(ticket.id), `${ticket.id} deleted.`);
  }

  const canCreate = checkPermission('createTicket');
  const canAssign = checkPermission('assignTicket');
  const canSetPriority = checkPermission('updateTicketPriority');
  const canDelete = checkPermission('deleteTicket');
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="support-shell">
      <aside className="support-sidebar">
        <Link className="support-brand" to="/tickets">
          <span aria-hidden="true">S</span> SupportDesk
        </Link>
        <p className="support-nav-label">WORKSPACE</p>
        <nav className="support-nav" aria-label="Main navigation">
          <Link className="support-nav-link support-nav-link--active" to="/tickets">
            <span aria-hidden="true">▦</span> Tickets
            <span className="support-nav-count">{tickets.length}</span>
          </Link>
          {checkPermission('viewTeamStatistics') && (
            <Link className="support-nav-link" to="/team">
              <span aria-hidden="true">▥</span> Team statistics
            </Link>
          )}
          {checkPermission('viewAdminDashboard') && (
            <Link className="support-nav-link" to="/admin">
              <span aria-hidden="true">⚙</span> Administration
            </Link>
          )}
          {checkPermission('viewAdminDashboard') && (
            <Link className="support-nav-link" to="/employees">
              <span aria-hidden="true">♙</span> Employee directory
            </Link>
          )}
        </nav>
        <div className="support-sidebar-footer">
          <p>Demo workspace</p>
          <small>Frontend-only sample data</small>
        </div>
      </aside>

      <main className="support-main">
        <header className="support-topbar">
          <div className="support-breadcrumb">Workspace <span>/</span> Tickets</div>
          <div className="support-user">
            <span className="support-user-avatar" aria-hidden="true">
              {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </span>
            <span className="support-user-copy">
              <strong>{user.name}</strong>
              <small>{roleLabel}</small>
            </span>
            <button type="button" className="button button--secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <div className="support-content">
          <section className="support-heading">
            <div>
              <p className="eyebrow">CUSTOMER SUPPORT</p>
              <h1>{user.role === 'supportAgent' ? 'My assigned tickets' : 'Ticket dashboard'}</h1>
              <p>
                {user.role === 'supportAgent'
                  ? 'View and update tickets assigned to you.'
                  : 'Review ticket activity and coordinate your support team.'}
              </p>
            </div>
          </section>

          <section className="support-stats" aria-label="Ticket statistics">
            <article><span>Visible tickets</span><strong>{tickets.length}</strong></article>
            <article><span>Open</span><strong>{counts.Open}</strong></article>
            <article><span>In progress</span><strong>{counts['In progress']}</strong></article>
            <article><span>Resolved</span><strong>{counts.Resolved}</strong></article>
          </section>

          {canCreate && (
            <details className="support-create-panel">
              <summary>Create ticket</summary>
              <form className="support-create-form" onSubmit={handleCreate}>
                <label>
                  Subject
                  <input
                    required
                    maxLength={120}
                    value={draft.subject}
                    onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                  />
                </label>
                <label>
                  Customer
                  <input
                    required
                    maxLength={80}
                    value={draft.customer}
                    onChange={(event) => setDraft({ ...draft, customer: event.target.value })}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft({ ...draft, priority: event.target.value as TicketPriority })
                    }
                  >
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </label>
                <label>
                  Assign to
                  <select
                    value={draft.assignedTo ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, assignedTo: event.target.value || null })
                    }
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </label>
                <button className="button button--primary" type="submit">Add ticket</button>
              </form>
            </details>
          )}

          {error && <p className="support-alert support-alert--error" role="alert">{error}</p>}
          {notice && <p className="support-alert" role="status">{notice}</p>}

          <section className="support-ticket-panel" aria-labelledby="ticket-list-title">
            <div className="support-panel-heading">
              <div>
                <h2 id="ticket-list-title">
                  {user.role === 'supportAgent' ? 'Assigned to me' : 'All tickets'}
                </h2>
                <p>Ticket updates are saved in this browser for this demo.</p>
              </div>
              <span>{tickets.length} tickets</span>
            </div>
            {tickets.length === 0 ? (
              <div className="support-empty">
                <h3>No tickets assigned yet</h3>
                <p>Tickets assigned to your account will appear here.</p>
              </div>
            ) : (
              <div className="support-table-scroll">
                <table className="support-ticket-table">
                  <caption className="sr-only">Customer support tickets</caption>
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Assignee</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      {(canAssign || canDelete) && <th scope="col">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => {
                      const assignee = agents.find((agent) => agent.id === ticket.assignedTo);
                      return (
                        <tr key={ticket.id}>
                          <td data-label="Ticket">
                            <strong>{ticket.subject}</strong>
                            <small>{ticket.id} · {ticket.createdAt}</small>
                          </td>
                          <td data-label="Customer">{ticket.customer}</td>
                          <td data-label="Assignee">
                            {canAssign ? (
                              <select
                                aria-label={`Assign ${ticket.id}`}
                                value={ticket.assignedTo ?? ''}
                                onChange={(event) =>
                                  runAction(
                                    () => reassignTicket(ticket.id, event.target.value || null),
                                    `${ticket.id} assignment updated.`,
                                  )
                                }
                              >
                                <option value="">Unassigned</option>
                                {agents.map((agent) => (
                                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                              </select>
                            ) : assignee?.name ?? 'Unassigned'}
                          </td>
                          <td data-label="Priority">
                            {canSetPriority ? (
                              <select
                                aria-label={`Priority for ${ticket.id}`}
                                value={ticket.priority}
                                onChange={(event) =>
                                  runAction(
                                    () =>
                                      changePriority(
                                        ticket.id,
                                        event.target.value as TicketPriority,
                                      ),
                                    `${ticket.id} priority updated.`,
                                  )
                                }
                              >
                                <option>Low</option><option>Medium</option><option>High</option>
                              </select>
                            ) : (
                              <span className={`ticket-priority ticket-priority--${ticket.priority.toLowerCase()}`}>
                                {ticket.priority}
                              </span>
                            )}
                          </td>
                          <td data-label="Status">
                            <select
                              aria-label={`Status for ${ticket.id}`}
                              value={ticket.status}
                              onChange={(event) =>
                                runAction(
                                  () =>
                                    changeStatus(ticket.id, event.target.value as TicketStatus),
                                  `${ticket.id} status updated.`,
                                )
                              }
                            >
                              <option>Open</option><option>In progress</option><option>Resolved</option>
                            </select>
                          </td>
                          {(canAssign || canDelete) && (
                            <td data-label="Actions">
                              <div className="support-row-actions">
                                {canDelete && (
                                  <button
                                    className="support-delete"
                                    type="button"
                                    onClick={() => handleDelete(ticket)}
                                    aria-label={`Delete ${ticket.id}`}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="support-security-note">
            Demo only: the UI and client-side permission checks improve the workflow, but do not
            secure data. A production API must authenticate users and authorize every request.
          </p>
        </div>
      </main>
    </div>
  );
}
