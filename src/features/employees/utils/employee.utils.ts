import type {
  Employee,
  EmployeeFilters,
  EmployeeStats,
} from '../types/employee.types';

export function filterAndSortEmployees(
  employees: Employee[],
  filters: EmployeeFilters,
): Employee[] {
  const query = filters.search.trim().toLocaleLowerCase();

  return employees
    .filter(({ name, email, department, status }) => {
      const matchesSearch =
        query.length === 0 ||
        name.toLocaleLowerCase().includes(query) ||
        email.toLocaleLowerCase().includes(query);
      const matchesDepartment =
        filters.department === 'All' || department === filters.department;
      const matchesStatus = filters.status === 'All' || status === filters.status;

      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((first, second) => {
      switch (filters.sort) {
        case 'name-desc':
          return second.name.localeCompare(first.name);
        case 'salary-asc':
          return first.salary - second.salary;
        case 'salary-desc':
          return second.salary - first.salary;
        case 'name-asc':
        default:
          return first.name.localeCompare(second.name);
      }
    });
}

export function calculateEmployeeStats(employees: Employee[]): EmployeeStats {
  const totals = employees.reduce(
    (result, employee) => ({
      totalSalary: result.totalSalary + employee.salary,
      active: result.active + Number(employee.status === 'Active'),
      inactive: result.inactive + Number(employee.status === 'Inactive'),
    }),
    { totalSalary: 0, active: 0, inactive: 0 },
  );

  return {
    total: employees.length,
    active: totals.active,
    inactive: totals.inactive,
    averageSalary: employees.length ? totals.totalSalary / employees.length : 0,
  };
}

export function formatSalary(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatJoiningDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function isEmployeeArray(value: unknown): value is Employee[] {
  return (
    Array.isArray(value) &&
    value.every(
      (employee) =>
        typeof employee === 'object' &&
        employee !== null &&
        typeof employee.id === 'string' &&
        typeof employee.name === 'string' &&
        typeof employee.email === 'string' &&
        typeof employee.role === 'string' &&
        typeof employee.department === 'string' &&
        typeof employee.salary === 'number' &&
        (employee.status === 'Active' || employee.status === 'Inactive') &&
        typeof employee.joiningDate === 'string',
    )
  );
}