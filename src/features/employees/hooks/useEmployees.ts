import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { EmployeeDraft } from '../types/employee.types';
import {
  employeeAdded,
  employeeDeleted,
  employeeUpdated,
} from '../state/employeeSlice';

export function useEmployees() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((state) => state.employees);

  const addEmployee = useCallback(
    (employee: EmployeeDraft) =>
      dispatch(employeeAdded({ ...employee, id: crypto.randomUUID() })),
    [dispatch],
  );

  const updateEmployee = useCallback(
    (id: string, updates: EmployeeDraft) =>
      dispatch(employeeUpdated({ id, updates })),
    [dispatch],
  );

  const deleteEmployee = useCallback(
    (id: string) => dispatch(employeeDeleted(id)),
    [dispatch],
  );

  return { employees, addEmployee, updateEmployee, deleteEmployee };
}
