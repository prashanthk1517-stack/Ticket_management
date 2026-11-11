import { initialEmployees } from '../data/employees';
import type { Employee } from '../types/employee.types';
import { isEmployeeArray } from '../utils/employee.utils';

const STORAGE_KEY = 'peopledesk.employees';

export function loadEmployees(): Employee[] {
  try {
    const storedEmployees = window.localStorage.getItem(STORAGE_KEY);
    if (!storedEmployees) return initialEmployees;

    const parsed: unknown = JSON.parse(storedEmployees);
    if (isEmployeeArray(parsed)) return parsed;

    console.error('Saved employee data is invalid; using the sample employees.');
  } catch (error) {
    console.error('Unable to load saved employees.', error);
  }

  return initialEmployees;
}

export function saveEmployees(employees: Employee[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}
