import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getRoleLabel, demoAccounts } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

interface ReturnLocation {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
}

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const returnTo = (location.state as ReturnLocation | null)?.from;
  const requestedPath = returnTo?.pathname;
  const destination =
    requestedPath?.startsWith('/') &&
    !requestedPath.startsWith('//') &&
    requestedPath !== '/login'
      ? `${requestedPath}${returnTo?.search ?? ''}${returnTo?.hash ?? ''}`
      : '/tickets';

  if (user) return <Navigate to={destination} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <a className="auth-brand" href="/" aria-label="SupportDesk home">
          <span aria-hidden="true">S</span> SupportDesk
        </a>
        <p className="eyebrow">CUSTOMER SUPPORT</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="auth-description">Sign in to manage your support tickets.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Work email</label>
          <input
            id="login-email"
            autoComplete="username"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary login-button" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <details className="demo-accounts">
          <summary>Demo accounts</summary>
          <p>Use <code>password123</code> for each account.</p>
          <ul>
            {demoAccounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setError('');
                  }}
                >
                  {account.email} <span>({getRoleLabel(account.role)})</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
        <p className="mock-notice">
          Mock authentication only. Client-side checks are not a security boundary.
        </p>
      </section>
    </main>
  );
}
