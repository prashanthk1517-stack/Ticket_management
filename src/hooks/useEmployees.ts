import { useEffect, useState } from 'react';
import { initialEmployees } from '../data/employees';
import type { Employee, EmployeeDraft } from '../types/employee.types';
import { isEmployeeArray } from '../utils/employee.utils';

const STORAGE_KEY = 'peopledesk.employees';

function readEmployees(): Employee[] {
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

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(readEmployees);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (error) {
      console.error('Unable to save employee changes.', error);
    }
  }, [employees]);

  const addEmployee = (employee: EmployeeDraft) => {
    setEmployees((current) => [
      { ...employee, id: crypto.randomUUID() },
      ...current,
    ]);
  };

  const updateEmployee = (id: string, updates: EmployeeDraft) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id ? { ...employee, ...updates } : employee,
      ),
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((current) => current.filter((employee) => employee.id !== id));
  };

  return { employees, addEmployee, updateEmployee, deleteEmployee };
}
