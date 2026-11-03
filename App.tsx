import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DashboardStats } from './components/DashboardStats';
import { EmployeeFilters } from './components/EmployeeFilters';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeTable } from './components/EmployeeTable';
import { useEmployees } from './hooks/useEmployees';
import type {
  Employee,
  EmployeeDraft,
  EmployeeFilters as EmployeeFiltersState,
} from './types/employee.types';
import {
  calculateEmployeeStats,
  filterAndSortEmployees,
} from './utils/employee.utils';
import { useAuth } from './hooks/useAuth';
import { getRoleLabel } from './services/authService';
import type { AuthUser } from './types/auth.types';

const initialFilters: EmployeeFiltersState = {
  search: '',
  department: 'All',
  status: 'All',
  sort: 'name-asc',
};

export function EmployeeDashboard() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <EmployeeDirectory user={user} logout={logout} />;
}

function EmployeeDirectory({
  user,
  logout,
}: {
  user: AuthUser;
  logout: () => void;
}) {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [filters, setFilters] = useState<EmployeeFiltersState>(initialFilters);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department))].sort(),
    [employees],
  );
  const visibleEmployees = useMemo(
    () => filterAndSortEmployees(employees, filters),
    [employees, filters],
  );
  const stats = useMemo(() => calculateEmployeeStats(employees), [employees]);

  const updateFilter = <K extends keyof EmployeeFiltersState>(
    key: K,
    value: EmployeeFiltersState[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = () => {
    setEditingEmployee(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(undefined);
  };

  useEffect(() => {
    if (!isFormOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  const saveEmployee = (employee: EmployeeDraft) => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employee);
      setAnnouncement(`${employee.name}’s details have been updated.`);
    } else {
      addEmployee(employee);
      setAnnouncement(`${employee.name} has been added to the team.`);
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (!deletingEmployee) return;
    deleteEmployee(deletingEmployee.id);
    setAnnouncement(`${deletingEmployee.name} has been deleted.`);
    setDeletingEmployee(undefined);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#main-content" aria-label="PeopleDesk home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M7 23V9l9 8 9-8v14M3 27h26" /></svg>
          </span>
          <span>people<span className="brand-light">desk</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a className="nav-link nav-link--active" href="#main-content" aria-current="page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="8" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="15" width="7" height="6" rx="1" /></svg>
            Dashboard
          </a>
          <Link className="nav-link" to="/tickets">
            <span aria-hidden="true">▦</span>
            Support tickets
          </Link>
          <a className="nav-link" href="#employee-directory">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Employees
            <span className="nav-count">{employees.length}</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">?</span>
            <div><strong>Need a hand?</strong><span>We’re here to help.</span></div>
            <a href="mailto:support@peopledesk.example" aria-label="Email support">↗</a>
          </div>
          <div className="profile-card">
            <span className="profile-avatar" aria-hidden="true">
              {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </span>
            <span className="profile-info">
              <strong>{user.name}</strong><small>{getRoleLabel(user.role)}</small>
            </span>
            <button type="button" className="profile-menu" onClick={logout} aria-label="Log out">↪</button>
          </div>
        </div>
      </aside>

      <main className="main-content" id="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>Employees</strong></div>
          <div className="topbar-right">
            <span className="today-date">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date())}
            </span>
            <span className="topbar-avatar" aria-label={user.name}>
              {user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">PEOPLE OPERATIONS</p>
              <h1>Employee directory</h1>
              <p className="page-description">Manage your team and keep employee information up to date.</p>
            </div>
            <button className="button button--primary add-button" type="button" onClick={openAddForm}>
              <span aria-hidden="true">+</span> Add employee
            </button>
          </section>

          <DashboardStats stats={stats} />

          <section className="directory-panel" id="employee-directory" aria-labelledby="directory-title">
            <div className="panel-heading">
              <div>
                <h2 id="directory-title">All employees <span className="count-pill">{visibleEmployees.length}</span></h2>
                <p>A directory of everyone in your organization.</p>
              </div>
              <span className="directory-total">{employees.length} total</span>
            </div>
            <EmployeeFilters
              filters={filters}
              departments={departments}
              onChange={updateFilter}
            />
            <EmployeeTable
              employees={visibleEmployees}
              onEdit={openEditForm}
              onDelete={setDeletingEmployee}
            />
            <div className="table-footer">
              <span>
                Showing <strong>{visibleEmployees.length ? 1 : 0}–{visibleEmployees.length}</strong> of{' '}
                <strong>{visibleEmployees.length}</strong> matching employees
              </span>
              <span>Updated just now</span>
            </div>
          </section>
        </div>
        <footer className="page-footer">
          <span>© {new Date().getFullYear()} PeopleDesk</span>
          <span>Made for people, built for teams.</span>
        </footer>
      </main>

      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {isFormOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="dialog-card form-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
          >
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">{editingEmployee ? 'EMPLOYEE DETAILS' : 'NEW TEAM MEMBER'}</p>
                <h2 id="employee-form-title">{editingEmployee ? 'Edit employee' : 'Add employee'}</h2>
                <p>{editingEmployee ? 'Update this employee’s information.' : 'Add someone new to your organization.'}</p>
              </div>
              <button className="icon-button close-button" type="button" onClick={closeForm} aria-label="Close form">×</button>
            </div>
            <EmployeeForm
              key={editingEmployee?.id ?? 'new'}
              employee={editingEmployee}
              employees={employees}
              onSubmit={saveEmployee}
              onCancel={closeForm}
            />
          </section>
        </div>
      )}

      {deletingEmployee && (
        <ConfirmDialog
          employeeName={deletingEmployee.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingEmployee(undefined)}
        />
      )}
    </div>
  );
}
