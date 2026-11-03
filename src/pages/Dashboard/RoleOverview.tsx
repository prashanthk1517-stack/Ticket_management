import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';

export function RoleOverview({ title, description }: {
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  if (!user) return null;
  return <RoleOverviewContent user={user} title={title} description={description} />;
}

function RoleOverviewContent({
  user,
  title,
  description,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  title: string;
  description: string;
}) {
  const { tickets } = useTickets(user);
  const openCount = tickets.filter((ticket) => ticket.status === 'Open').length;
  const activeCount = tickets.filter((ticket) => ticket.status === 'In progress').length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'Resolved').length;

  return (
    <main className="support-overview">
      <p className="eyebrow">{title === 'Administration' ? 'ADMIN CONSOLE' : 'TEAM REPORTING'}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="support-stats">
        <article><span>Total tickets</span><strong>{tickets.length}</strong></article>
        <article><span>Open</span><strong>{openCount}</strong></article>
        <article><span>In progress</span><strong>{activeCount}</strong></article>
        <article><span>Resolved</span><strong>{resolvedCount}</strong></article>
      </div>
      <Link className="button button--primary" to="/tickets">Back to tickets</Link>
    </main>
  );
}
