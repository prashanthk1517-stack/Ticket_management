import { useEffect, useState, type FormEvent } from 'react';
import type { Employee, EmployeeDraft, EmploymentStatus } from '../types/employee.types';

interface EmployeeFormProps {
  employee?: Employee;
  employees: Employee[];
  onSubmit: (employee: EmployeeDraft) => void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  email: string;
  role: string;
  department: string;
  salary: string;
  status: EmploymentStatus;
  joiningDate: string;
}

const departments = ['Engineering', 'Design', 'Marketing', 'People', 'Sales', 'Finance'];

function toFormValues(employee?: Employee): FormValues {
  return {
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    role: employee?.role ?? '',
    department: employee?.department ?? 'Engineering',
    salary: employee ? String(employee.salary) : '',
    status: employee?.status ?? 'Active',
    joiningDate: employee?.joiningDate ?? new Date().toISOString().slice(0, 10),
  };
}

export function EmployeeForm({
  employee,
  employees,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(employee));
  const [emailError, setEmailError] = useState('');
  const isEditing = Boolean(employee);

  useEffect(() => {
    setValues(toFormValues(employee));
    setEmailError('');
  }, [employee]);

  const updateValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'email') setEmailError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = values.email.trim().toLocaleLowerCase();
    const emailExists = employees.some(
      (candidate) =>
        candidate.id !== employee?.id &&
        candidate.email.toLocaleLowerCase() === normalizedEmail,
    );

    if (emailExists) {
      setEmailError('An employee with this email address already exists.');
      return;
    }

    onSubmit({
      name: values.name.trim(),
      email: normalizedEmail,
      role: values.role.trim(),
      department: values.department,
      salary: Number(values.salary),
      status: values.status,
      joiningDate: values.joiningDate,
    });
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <span>Full name <span className="required-mark">*</span></span>
          <input
            autoFocus
            type="text"
            autoComplete="name"
            placeholder="e.g. Alex Morgan"
            value={values.name}
            onChange={(event) => updateValue('name', event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label className="form-field">
          <span>Email address <span className="required-mark">*</span></span>
          <input
            type="email"
            autoComplete="email"
            placeholder="alex@company.com"
            value={values.email}
            onChange={(event) => updateValue('email', event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : undefined}
            required
            maxLength={120}
          />
          {emailError && <span className="field-error" id="email-error">{emailError}</span>}
        </label>
        <label className="form-field">
          <span>Job title <span className="required-mark">*</span></span>
          <input
            type="text"
            placeholder="e.g. Product Designer"
            value={values.role}
            onChange={(event) => updateValue('role', event.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label className="form-field">
          <span>Department <span className="required-mark">*</span></span>
          <select
            value={values.department}
            onChange={(event) => updateValue('department', event.target.value)}
            required
          >
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Annual salary (USD) <span className="required-mark">*</span></span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 85000"
            value={values.salary}
            onChange={(event) => updateValue('salary', event.target.value)}
            min="1"
            max="10000000"
            step="1"
            required
          />
        </label>
        <label className="form-field">
          <span>Employment status</span>
          <select
            value={values.status}
            onChange={(event) => updateValue('status', event.target.value as EmploymentStatus)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label className="form-field">
          <span>Joining date <span className="required-mark">*</span></span>
          <input
            type="date"
            value={values.joiningDate}
            onChange={(event) => updateValue('joiningDate', event.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
      </div>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit">
          {isEditing ? 'Save changes' : 'Add employee'}
        </button>
      </div>
    </form>
  );
}
