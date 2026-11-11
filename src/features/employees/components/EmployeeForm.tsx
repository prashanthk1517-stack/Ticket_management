import { useEffect, useState, type FormEvent } from 'react';
import { Button, Form, InputField, SelectField, SubmitButton } from '../../../components/ui';
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
    <Form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <InputField
          id="employee-name"
          className="employee-control"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Alex Morgan"
          value={values.name}
          onChange={(event) => updateValue('name', event.target.value)}
          required
          minLength={2}
          maxLength={80}
        />
        <InputField
          id="employee-email"
          className="employee-control"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="alex@company.com"
          value={values.email}
          onChange={(event) => updateValue('email', event.target.value)}
          error={emailError}
          required
          maxLength={120}
        />
        <InputField
          id="employee-role"
          className="employee-control"
          label="Job title"
          type="text"
          placeholder="e.g. Product Designer"
          value={values.role}
          onChange={(event) => updateValue('role', event.target.value)}
          required
          maxLength={80}
        />
        <SelectField
          id="employee-department"
          className="employee-control"
          label="Department"
          value={values.department}
          onChange={(event) => updateValue('department', event.target.value)}
          required
          options={departments.map((department) => ({ value: department, label: department }))}
        />
        <InputField
          id="employee-salary"
          className="employee-control"
          label="Annual salary (USD)"
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
        <SelectField
          id="employee-status"
          className="employee-control"
          label="Employment status"
          value={values.status}
          onChange={(event) => updateValue('status', event.target.value as EmploymentStatus)}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
        <InputField
          id="employee-joining-date"
          className="employee-control"
          label="Joining date"
          type="date"
          value={values.joiningDate}
          onChange={(event) => updateValue('joiningDate', event.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <SubmitButton>{isEditing ? 'Save changes' : 'Add employee'}</SubmitButton>
      </div>
    </Form>
  );
}
