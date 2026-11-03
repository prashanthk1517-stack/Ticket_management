import {
  createContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  authenticate,
  clearStoredUser,
  readStoredUser,
  saveUser,
} from '../services/authService';
import type { AuthUser } from '../types/auth.types';

interface AuthState {
  user: AuthUser | null;
}

type AuthAction = { type: 'login'; user: AuthUser } | { type: 'logout' };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  return action.type === 'login' ? { user: action.user } : { user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, () => ({
    user: readStoredUser(),
  }));

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      async login(email, password) {
        const user = await authenticate(email, password);
        saveUser(user);
        dispatch({ type: 'login', user });
      },
      logout() {
        clearStoredUser();
        dispatch({ type: 'logout' });
      },
    }),
    [state.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
