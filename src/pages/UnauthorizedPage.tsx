import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <main className="support-overview" aria-labelledby="unauthorized-title">
      <p className="eyebrow">ACCESS RESTRICTED</p>
      <h1 id="unauthorized-title">You don’t have access to this page</h1>
      <p>Your current role does not include permission to open this area.</p>
      <Link className="button button--primary" to="/tickets">Return to tickets</Link>
    </main>
  );
}
