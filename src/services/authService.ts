import type { AuthUser, UserRole } from '../types/auth.types';

export interface DemoAccount extends AuthUser {
  password: string;
}

export const demoAccounts: readonly DemoAccount[] = [
  {
    id: 'admin-1',
    name: 'Avery Admin',
    email: 'admin@support.test',
    role: 'administrator',
    password: 'password123',
  },
  {
    id: 'manager-1',
    name: 'Morgan Manager',
    email: 'manager@support.test',
    role: 'supportManager',
    password: 'password123',
  },
  {
    id: 'agent-1',
    name: 'Alex Agent',
    email: 'agent.alex@support.test',
    role: 'supportAgent',
    password: 'password123',
  },
  {
    id: 'agent-2',
    name: 'Sam Agent',
    email: 'agent.sam@support.test',
    role: 'supportAgent',
    password: 'password123',
  },
];

const AUTH_STORAGE_KEY = 'supportdesk.auth';

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthUser> {
  const account = demoAccounts.find(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() &&
      candidate.password === password,
  );

  if (!account) {
    throw new Error('The email or password is incorrect.');
  }

  const { password: _password, ...user } = account;
  return user;
}

export function readStoredUser(): AuthUser | null {
  const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsed: unknown = JSON.parse(storedUser);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      typeof parsed.id !== 'string'
    ) {
      throw new Error('Saved authentication data is invalid.');
    }

    const account = demoAccounts.find((candidate) => candidate.id === parsed.id);
    if (!account) throw new Error('Saved authentication account was not found.');

    const role = 'role' in parsed ? parsed.role : undefined;
    if (role !== account.role) throw new Error('Saved authentication role is invalid.');

    const { password: _password, ...user } = account;
    return user;
  } catch (error) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    console.error('Unable to restore the mock authentication session.', error);
    return null;
  }
}

export function saveUser(user: AuthUser): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    administrator: 'Administrator',
    supportManager: 'Support Manager',
    supportAgent: 'Support Agent',
  };
  return labels[role];
}
