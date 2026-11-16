import { Link } from 'react-router-dom';

export function UserManagementPage() {
  return (
    <main className="support-overview">
      <p className="eyebrow">ADMIN CONSOLE</p>
      <h1>User management</h1>
      <p>
        User administration is unavailable in this frontend-only demo. Accounts are
        preconfigured; a production user-management feature requires an authorized backend.
      </p>
      <Link className="button button--primary" to="/tickets">Back to tickets</Link>
    </main>
  );
}
