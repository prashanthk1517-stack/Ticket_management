import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clearStoredUser } from '../services/authService';
import { loggedOut, loginUser } from '../state/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await dispatch(loginUser({ email, password })).unwrap();
      } catch (error) {
        throw new Error(typeof error === 'string' ? error : 'Unable to sign in.');
      }
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    clearStoredUser();
    dispatch(loggedOut());
  }, [dispatch]);

  return { user, login, logout };
}
