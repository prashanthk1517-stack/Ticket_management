import type {
  EmployeeFilters as EmployeeFiltersState,
  EmployeeSort,
  EmploymentStatus,
} from '../types/employee.types';
import { SearchBar } from './SearchBar';

interface EmployeeFiltersProps {
  filters: EmployeeFiltersState;
  departments: string[];
  onChange: <K extends keyof EmployeeFiltersState>(
    key: K,
    value: EmployeeFiltersState[K],
  ) => void;
}

export function EmployeeFilters({
  filters,
  departments,
  onChange,
}: EmployeeFiltersProps) {
  return (
    <div className="toolbar">
      <SearchBar
        value={filters.search}
        onChange={(value) => onChange('search', value)}
      />
      <div className="filter-controls">
        <label className="select-control">
          <span className="sr-only">Filter by department</span>
          <select
            value={filters.department}
            onChange={(event) => onChange('department', event.target.value)}
          >
            <option value="All">All departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <label className="select-control">
          <span className="sr-only">Filter by employment status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange('status', event.target.value as EmploymentStatus | 'All')
            }
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label className="select-control sort-control">
          <span className="sr-only">Sort employees</span>
          <select
            value={filters.sort}
            onChange={(event) => onChange('sort', event.target.value as EmployeeSort)}
          >
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="salary-desc">Salary: high to low</option>
            <option value="salary-asc">Salary: low to high</option>
          </select>
        </label>
      </div>
    </div>
  );
}
