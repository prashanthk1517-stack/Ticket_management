import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { readStoredUser } from '../features/auth/services/authService';
import { authReducer } from '../features/auth/state/authSlice';
import { employeeReducer } from '../features/employees/state/employeeSlice';
import {
  loadEmployees,
  saveEmployees,
} from '../features/employees/services/employeeStorage';
import { ticketReducer } from '../features/tickets/state/ticketSlice';
import { loadTickets, saveTickets } from '../features/tickets/services/ticketService';

const rootReducer = combineReducers({
  auth: authReducer,
  employees: employeeReducer,
  tickets: ticketReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(preloadedState?: RootState) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState ?? {
      auth: { user: readStoredUser(), status: 'idle' },
      employees: loadEmployees(),
      tickets: loadTickets(),
    },
  });

  let previousState = store.getState();
  store.subscribe(() => {
    const state = store.getState();

    if (state.tickets !== previousState.tickets) {
      try {
        saveTickets(state.tickets);
      } catch (error) {
        console.error('Unable to save ticket changes.', error);
      }
    }

    if (state.employees !== previousState.employees) {
      try {
        saveEmployees(state.employees);
      } catch (error) {
        console.error('Unable to save employee changes.', error);
      }
    }

    previousState = state;
  });

  return store;
}

export const store = createAppStore();
export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
