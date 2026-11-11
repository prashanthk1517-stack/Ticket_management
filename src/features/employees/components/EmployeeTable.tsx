import { Badge, DataTable, type ColumnDefinition } from '../../../components/ui';
import type { Employee } from '../types/employee.types';
import { formatJoiningDate, formatSalary } from '../utils/employee.utils';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const columns: ColumnDefinition<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      dataLabel: 'Employee',
      render: (_value, employee) => (
        <div className="employee-identity">
          <span className="avatar" aria-hidden="true">{getInitials(employee.name)}</span>
          <span className="employee-name-wrap">
            <span className="employee-name">{employee.name}</span>
            <span className="employee-email">{employee.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      dataLabel: 'Department',
      render: (_value, employee) => <span className="department-tag">{employee.department}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      dataLabel: 'Role',
      className: 'role-cell',
      render: (_value, employee) => employee.role,
    },
    {
      key: 'status',
      header: 'Status',
      dataLabel: 'Status',
      render: (_value, employee) => (
        <Badge
          variant={employee.status === 'Active' ? 'success' : 'neutral'}
          className={`status-badge status-badge--${employee.status.toLowerCase()}`}
        >
          <span className="status-dot" aria-hidden="true" />
          {employee.status}
        </Badge>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      dataLabel: 'Salary',
      className: 'salary-cell',
      render: (_value, employee) => formatSalary(employee.salary),
    },
    {
      key: 'joiningDate',
      header: 'Joined',
      dataLabel: 'Joined',
      className: 'date-cell',
      render: (_value, employee) => formatJoiningDate(employee.joiningDate),
    },
  ];

  return (
    <DataTable
      data={employees}
      columns={columns}
      getRowId={(employee) => employee.id}
      tableClassName="employee-table"
      className="table-scroll"
      caption="Employee directory"
      emptyMessage={(
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">⌕</div>
          <h3>No employees found</h3>
          <p>Try changing your search or filters to find what you’re looking for.</p>
        </div>
      )}
      rowActions={(employee) => (
        <div className="row-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => onEdit(employee)}
            aria-label={`Edit ${employee.name}`}
            title="Edit employee"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 4 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></svg>
          </button>
          <button
            className="icon-button icon-button--danger"
            type="button"
            onClick={() => onDelete(employee)}
            aria-label={`Delete ${employee.name}`}
            title="Delete employee"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></svg>
          </button>
        </div>
      )}
    />
  );
}
