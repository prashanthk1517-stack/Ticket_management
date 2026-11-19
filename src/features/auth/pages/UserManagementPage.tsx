import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Badge, DataTable, type ColumnDefinition } from '../../../components/ui';
import { demoAccounts, getRoleLabel } from '../services/authService';
import type { AuthUser } from '../../../types/auth.types';

export function UserManagementPage() {
  const users = useMemo(
    () => demoAccounts.map(({ password: _password, ...user }) => user),
    [],
  );
  const columns = useMemo<ColumnDefinition<AuthUser>[]>(() => [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (_value, user) => (
        <Badge variant={user.role === 'administrator' ? 'danger' : 'neutral'}>
          {getRoleLabel(user.role)}
        </Badge>
      ),
    },
  ], []);

  return (
    <main className="support-overview">
      <p className="eyebrow">ADMIN CONSOLE</p>
      <h1>User management</h1>
      <p>
        Accounts are preconfigured in this frontend-only demo. Account CRUD requires
        an authorized backend.
      </p>
      <DataTable
        data={users}
        columns={columns}
        getRowId={(user) => user.id}
        caption="Preconfigured support users"
      />
      <Link className="button button--primary" to="/tickets">Back to tickets</Link>
    </main>
  );
}
