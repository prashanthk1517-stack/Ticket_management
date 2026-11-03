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
  if (employees.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">⌕</div>
        <h3>No employees found</h3>
        <p>Try changing your search or filters to find what you’re looking for.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="employee-table">
        <caption className="sr-only">Employee directory</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Salary</th>
            <th scope="col">Joined</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td data-label="Employee">
                <div className="employee-identity">
                  <span className="avatar" aria-hidden="true">{getInitials(employee.name)}</span>
                  <span className="employee-name-wrap">
                    <span className="employee-name">{employee.name}</span>
                    <span className="employee-email">{employee.email}</span>
                  </span>
                </div>
              </td>
              <td data-label="Department"><span className="department-tag">{employee.department}</span></td>
              <td data-label="Role" className="role-cell">{employee.role}</td>
              <td data-label="Status">
                <span className={`status-badge status-badge--${employee.status.toLowerCase()}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {employee.status}
                </span>
              </td>
              <td data-label="Salary" className="salary-cell">{formatSalary(employee.salary)}</td>
              <td data-label="Joined" className="date-cell">{formatJoiningDate(employee.joiningDate)}</td>
              <td data-label="Actions">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
