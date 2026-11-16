import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Alert,
  Badge,
  DataTable,
  Form,
  FormError,
  InputField,
  Modal,
  SelectField,
  SubmitButton,
  type ColumnDefinition,
  ApiErrorMessage,
  EmptyState,
  LoadingSpinner,
} from '../../../components/ui';
import { getRoleLabel, useAuth, usePermissions } from '../../auth';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModal } from '../../../hooks/useModal';
import { usePagination } from '../../../hooks/usePagination';
import { useTickets } from '../hooks/useTickets';
import {
  useAssignTicketMutation,
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useGetTicketsQuery,
  useUpdateTicketDetailsMutation,
  useUpdateTicketPriorityMutation,
  useUpdateTicketStatusMutation,
} from '../services/ticketApi';
import { toApiError } from '../../../components/ui/ApiStates';
import type { TicketApiScenario } from '../../../app/api/baseQuery';
import type {
  NewTicket,
  Ticket,
  TicketDetailsDraft,
  TicketPriority,
  TicketStatus,
} from '../../../types/ticket.types';

const emptyDraft: NewTicket = {
  subject: '',
  customer: '',
  status: 'Open',
  priority: 'Medium',
  assignedTo: null,
};

const priorityOptions = ['Low', 'Medium', 'High'].map((priority) => ({
  value: priority,
  label: priority,
}));
const statusOptions = ['Open', 'In progress', 'Resolved'].map((status) => ({
  value: status,
  label: status,
}));

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
  const { tickets, counts, agents } = useTickets(user);
  const [draft, setDraft] = useState<NewTicket>(emptyDraft);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const isSearchPending = searchTerm !== debouncedSearch;
  const [scenario, setScenario] = useState<TicketApiScenario>('healthy');
  const {
    currentData: apiTickets = [],
    error: ticketError,
    isError: hasTicketError,
    isFetching,
    isLoading,
    refetch,
  } = useGetTicketsQuery({ user, search: debouncedSearch, scenario });
  const [createTicket, createTicketState] = useCreateTicketMutation();
  const [updateTicketDetails, updateDetailsState] = useUpdateTicketDetailsMutation();
  const [updateTicketStatus, updateStatusState] = useUpdateTicketStatusMutation();
  const [updateTicketPriority, updatePriorityState] = useUpdateTicketPriorityMutation();
  const [assignTicket, assignTicketState] = useAssignTicketMutation();
  const [deleteTicket, deleteTicketState] = useDeleteTicketMutation();
  const isMutating = createTicketState.isLoading || updateDetailsState.isLoading ||
    updateStatusState.isLoading || updatePriorityState.isLoading ||
    assignTicketState.isLoading || deleteTicketState.isLoading;
  const { isOpen, open, close } = useModal(false);
  const deleteModal = useModal(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const filteredTickets = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((ticket) =>
      [ticket.id, ticket.subject, ticket.customer]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [debouncedSearch, tickets]);
  const displayedTickets = isLoading || isFetching ? filteredTickets : apiTickets;
  const pagination = usePagination(filteredTickets.length, { initialPageSize: 50 });
  useEffect(() => {
    pagination.setPage(1);
  }, [debouncedSearch, pagination.setPage]);

  const runAction = useCallback(async (action: () => Promise<unknown>, message: string) => {
    setError('');
    setNotice('');
    if (isMutating) return;
    try {
      await action();
      setNotice(message);
    } catch (actionError) {
      setError(toApiError(actionError).message);
    }
  }, [isMutating]);

  function openCreateForm() {
    setEditingTicket(null);
    setDraft(emptyDraft);
    open();
  }

  const openEditForm = useCallback((ticket: Ticket) => {
    setEditingTicket(ticket);
    setDraft({
      subject: ticket.subject,
      customer: ticket.customer,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
    });
    open();
  }, [open]);

  function closeTicketForm() {
    close();
    setEditingTicket(null);
    setDraft(emptyDraft);
  }

  function handleTicketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction(async () => {
      if (editingTicket) {
        const details: TicketDetailsDraft = {
          subject: draft.subject,
          customer: draft.customer,
          priority: draft.priority,
          assignedTo: draft.assignedTo,
        };
        await updateTicketDetails({
          user, ticketId: editingTicket.id, details, scenario,
        }).unwrap();
      } else {
        await createTicket({ user, ticket: draft, scenario }).unwrap();
      }
      closeTicketForm();
    }, editingTicket ? 'Ticket updated.' : 'Ticket created.');
  }

  const requestDelete = useCallback((ticket: Ticket) => {
    setTicketToDelete(ticket);
    deleteModal.open();
  }, [deleteModal.open]);

  function handleDelete() {
    if (!ticketToDelete) return;
    const deletedTicket = ticketToDelete;
    void runAction(async () => {
      await deleteTicket({ user, ticketId: deletedTicket.id, scenario }).unwrap();
      deleteModal.close();
      setTicketToDelete(null);
    }, `${deletedTicket.id} deleted.`);
  }

  const canCreate = checkPermission('createTicket');
  const canEdit = checkPermission('updateTicketDetails');
  const canAssign = checkPermission('assignTicket');
  const canSetPriority = checkPermission('updateTicketPriority');
  const canDelete = checkPermission('deleteTicket');
  const roleLabel = getRoleLabel(user.role);
  const agentOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
    ],
    [agents],
  );
  const columns = useMemo<ColumnDefinition<Ticket>[]>(() => [
    {
      key: 'subject',
      header: 'Ticket',
      dataLabel: 'Ticket',
      sortable: true,
      render: (_value, ticket) => (
        <>
          <strong>{ticket.subject}</strong>
          <small>{ticket.id} · {ticket.createdAt}</small>
        </>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      dataLabel: 'Customer',
      sortable: true,
    },
    {
      key: 'assignedTo',
      header: 'Assignee',
      dataLabel: 'Assignee',
      render: (_value, ticket) => {
        const assignee = agents.find((agent) => agent.id === ticket.assignedTo);
        return canAssign ? (
          <SelectField
            aria-label={`Assign ${ticket.id}`}
            className="support-ticket-select"
            value={ticket.assignedTo ?? ''}
            disabled={isMutating}
            onChange={(event) =>
              void runAction(
                () => assignTicket({
                  user, ticketId: ticket.id, assignedTo: event.target.value || null, scenario,
                }).unwrap(),
                `${ticket.id} assignment updated.`,
              )
            }
            options={agentOptions}
          />
        ) : assignee?.name ?? 'Unassigned';
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      dataLabel: 'Priority',
      sortable: true,
      render: (_value, ticket) => canSetPriority ? (
        <SelectField
          aria-label={`Priority for ${ticket.id}`}
          className="support-ticket-select"
          value={ticket.priority}
          disabled={isMutating}
          onChange={(event) =>
            void runAction(
              () => updateTicketPriority({
                user, ticketId: ticket.id,
                priority: event.target.value as TicketPriority, scenario,
              }).unwrap(),
              `${ticket.id} priority updated.`,
            )
          }
          options={priorityOptions}
        />
      ) : (
        <Badge
          variant={ticket.priority === 'High' ? 'danger' : ticket.priority === 'Medium' ? 'warning' : 'success'}
          className={`ticket-priority ticket-priority--${ticket.priority.toLowerCase()}`}
        >
          {ticket.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      dataLabel: 'Status',
      sortable: true,
      render: (_value, ticket) => (
        <SelectField
          aria-label={`Status for ${ticket.id}`}
          className="support-ticket-select"
          value={ticket.status}
          disabled={isMutating}
          onChange={(event) =>
            void runAction(
              () => updateTicketStatus({
                user, ticketId: ticket.id,
                status: event.target.value as TicketStatus, scenario,
              }).unwrap(),
              `${ticket.id} status updated.`,
            )
          }
          options={statusOptions}
        />
      ),
    },
  ], [
    agentOptions,
    agents,
    canAssign,
    canSetPriority,
    runAction,
    assignTicket,
    scenario,
    updateTicketPriority,
    updateTicketStatus,
    user,
  ]);
  const renderTicketActions = useCallback((ticket: Ticket) => (
    <div className="support-row-actions">
      {canEdit && (
        <Button
          variant="ghost"
          onClick={() => openEditForm(ticket)}
          aria-label={`Edit ${ticket.id}`}
        >
          Edit
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          className="support-delete"
          onClick={() => requestDelete(ticket)}
          aria-label={`Delete ${ticket.id}`}
        >
          Delete
        </Button>
      )}
    </div>
  ), [canDelete, canEdit, openEditForm, requestDelete]);

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
          {checkPermission('manageUsers') && (
            <Link className="support-nav-link" to="/users">
              <span aria-hidden="true">♙</span> User management
            </Link>
          )}
          {checkPermission('viewAdminDashboard') && (
            <Link className="support-nav-link" to="/employees">
              <span aria-hidden="true">♙</span> Employee directory
            </Link>
          )}
          <Link className="support-nav-link" to="/settings">
            <span aria-hidden="true">⚙</span> Settings
          </Link>
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
            <div className="support-panel-heading">
              <div>
                <h2>Create ticket</h2>
              </div>
              <Button variant="primary" onClick={openCreateForm} disabled={isMutating}>
                Create ticket
              </Button>
            </div>
          )}

          <Modal
            open={isOpen}
            onClose={closeTicketForm}
            ariaLabelledBy="ticket-form-title"
            size="md"
          >
            <Form onSubmit={handleTicketSubmit} className="support-create-form">
              <Modal.Header id="ticket-form-title">
                <h2>{editingTicket ? 'Edit ticket' : 'Create ticket'}</h2>
              </Modal.Header>
              <Modal.Body>
                <FormError message={error} />
                <InputField
                  label="Subject"
                  required
                  maxLength={120}
                  value={draft.subject}
                  onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                />
                <InputField
                  label="Customer"
                  required
                  maxLength={80}
                  value={draft.customer}
                  onChange={(event) => setDraft({ ...draft, customer: event.target.value })}
                />
                <SelectField
                  label="Priority"
                  value={draft.priority}
                  disabled={isMutating}
                  onChange={(event) =>
                    setDraft({ ...draft, priority: event.target.value as TicketPriority })
                  }
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' },
                  ]}
                />
                <SelectField
                  label="Assign to"
                  value={draft.assignedTo ?? ''}
                  disabled={isMutating}
                  onChange={(event) =>
                    setDraft({ ...draft, assignedTo: event.target.value || null })
                  }
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
                  ]}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeTicketForm}>Cancel</Button>
                <SubmitButton isLoading={isMutating}>
                  {editingTicket ? 'Save changes' : 'Add ticket'}
                </SubmitButton>
              </Modal.Footer>
            </Form>
          </Modal>
          {!isOpen && <FormError message={error} />}
          {notice && <Alert variant="success" className="support-alert">{notice}</Alert>}

          <section className="support-ticket-panel" aria-labelledby="ticket-list-title">
            <div className="support-panel-heading">
              <div>
                <h2 id="ticket-list-title">
                  {user.role === 'supportAgent' ? 'Assigned to me' : 'All tickets'}
                </h2>
                <p>Ticket updates are saved in this browser for this demo.</p>
              </div>
              <span>{filteredTickets.length} tickets</span>
            </div>
            <div className="support-toolbar">
              <InputField
                aria-label="Search tickets"
                className="support-search-input"
                type="search"
                value={searchTerm}
                placeholder="Search tickets"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <SelectField
                label="API failure simulation"
                value={scenario}
                onChange={(event) => setScenario(event.target.value as TicketApiScenario)}
                options={[
                  { value: 'healthy', label: 'Healthy demo API' },
                  { value: 'slow', label: 'Slow response (loading state)' },
                  { value: 'network', label: 'Network unavailable' },
                  { value: 'unavailable', label: 'Service unavailable (503)' },
                  { value: 'unauthorized', label: 'Expired session (401)' },
                  { value: 'forbidden', label: 'Forbidden (403)' },
                  { value: 'validation', label: 'Validation failure (mutations)' },
                ]}
              />
              {isSearchPending && (
                <span className="sr-only" role="status">Updating ticket results</span>
              )}
            </div>
            {isLoading && <LoadingSpinner />}
            {isFetching && !isLoading && !hasTicketError && (
              <LoadingSpinner label="Refreshing tickets…" />
            )}
            {hasTicketError && (
              <ApiErrorMessage
                error={ticketError}
                onRetry={() => { void refetch(); }}
                retrying={isFetching}
              />
            )}
            {error && <Alert variant="error" className="support-alert support-alert--error">{error}</Alert>}
            {!hasTicketError && (
              <DataTable
                data={displayedTickets}
                columns={columns}
                getRowId={(ticket) => ticket.id}
                virtualized={filteredTickets.length >= 100}
                tableClassName="support-ticket-table"
                className="support-table-scroll"
                caption="Customer support tickets"
                emptyMessage={<EmptyState />}
                pagination={{
                  page: pagination.currentPage,
                  pageSize: pagination.pageSize,
                  totalItems: filteredTickets.length,
                  onPageChange: pagination.setPage,
                }}
                rowActions={canDelete || canEdit ? renderTicketActions : undefined}
              />
            )}
          </section>
          <Modal
            open={deleteModal.isOpen}
            onClose={() => {
              deleteModal.close();
              setTicketToDelete(null);
            }}
            ariaLabelledBy="delete-ticket-title"
            role="alertdialog"
            size="sm"
          >
            <Modal.Header id="delete-ticket-title">
              <h2>Delete ticket?</h2>
            </Modal.Header>
            <Modal.Body>
              <p>
                Are you sure you want to delete <strong>{ticketToDelete?.id}</strong>
                {ticketToDelete ? `: ${ticketToDelete.subject}` : ''}? This action cannot be undone.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  deleteModal.close();
                  setTicketToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDelete} disabled={isMutating}>
                Delete ticket
              </Button>
            </Modal.Footer>
          </Modal>
          <p className="support-security-note">
            Demo only: the UI and client-side permission checks improve the workflow, but do not
            secure data. A production API must authenticate users and authorize every request.
          </p>
        </div>
      </main>
    </div>
  );
}
