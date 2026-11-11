import { Link } from 'react-router-dom';
import { getRoleLabel, useAuth } from '../../auth';

export function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="support-overview">
      <p className="eyebrow">WORKSPACE</p>
      <h1>Settings</h1>
      <p>Account details for the current demo session.</p>
      <section className="support-settings" aria-labelledby="account-settings-title">
        <h2 id="account-settings-title">Account</h2>
        <dl>
          <div><dt>Name</dt><dd>{user.name}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Role</dt><dd>{getRoleLabel(user.role)}</dd></div>
        </dl>
        <p>
          This demo stores a mock account identity in browser storage. Do not use this
          authentication approach for production accounts.
        </p>
      </section>
      <Link className="button button--primary" to="/tickets">Back to tickets</Link>
    </main>
  );
}
