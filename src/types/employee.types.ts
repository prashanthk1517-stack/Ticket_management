export type EmploymentStatus = 'Active' | 'Inactive';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  status: EmploymentStatus;
  joiningDate: string;
}

export type EmployeeDraft = Omit<Employee, 'id'>;

export type EmployeeSort = 'name-asc' | 'name-desc' | 'salary-asc' | 'salary-desc';

export interface EmployeeFilters {
  search: string;
  department: string;
  status: EmploymentStatus | 'All';
  sort: EmployeeSort;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  averageSalary: number;
}
