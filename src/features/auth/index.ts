export { useAuth } from './hooks/useAuth';
export { usePermissions } from './hooks/usePermissions';
export { LoginPage } from './pages/LoginPage';
export {
  authenticate,
  clearStoredUser,
  demoAccounts,
  getRoleLabel,
  readStoredUser,
  saveUser,
} from './services/authService';
export type { DemoAccount } from './services/authService';
