import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Employee, EmployeeDraft } from '../types/employee.types';

const employeeSlice = createSlice({
  name: 'employees',
  initialState: [] as Employee[],
  reducers: {
    employeeAdded(state, action: PayloadAction<Employee>) {
      state.unshift(action.payload);
    },
    employeeUpdated(
      state,
      action: PayloadAction<{ id: string; updates: EmployeeDraft }>,
    ) {
      const employee = state.find((item) => item.id === action.payload.id);
      if (employee) Object.assign(employee, action.payload.updates);
    },
    employeeDeleted(state, action: PayloadAction<string>) {
      return state.filter((employee) => employee.id !== action.payload);
    },
  },
});

export const { employeeAdded, employeeUpdated, employeeDeleted } =
  employeeSlice.actions;
export const employeeReducer = employeeSlice.reducer;
