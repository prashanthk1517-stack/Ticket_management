import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { PermissionBasedRoute } from '../components/layout/PermissionBasedRoute';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

const LoginPage = lazy(() =>
  import('../features/auth/pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);
const RoleOverview = lazy(() =>
  import('../features/dashboard/pages/RoleOverview').then((module) => ({
    default: module.RoleOverview,
  })),
);
const EmployeeDashboard = lazy(() =>
  import('../features/employees/pages/EmployeeDashboard').then((module) => ({
    default: module.EmployeeDashboard,
  })),
);
const TicketDashboard = lazy(() =>
  import('../features/tickets/pages/TicketDashboard').then((module) => ({
    default: module.TicketDashboard,
  })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);
const UserManagementPage = lazy(() =>
  import('../features/auth/pages/UserManagementPage').then((module) => ({
    default: module.UserManagementPage,
  })),
);

function RouteLoadingFallback() {
  return (
    <main className="route-loading" aria-busy="true">
      <p role="status">Loading page…</p>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/tickets" element={<TicketDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/team"
            element={
              <PermissionBasedRoute permission="viewTeamStatistics">
                <RoleOverview
                  title="Team statistics"
                  description="Team-wide ticket volume and status distribution."
                />
              </PermissionBasedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PermissionBasedRoute permission="viewAdminDashboard">
                <RoleOverview
                  title="Administration"
                  description="Administrative overview for the support workspace."
                />
              </PermissionBasedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <PermissionBasedRoute permission="viewAdminDashboard">
                <EmployeeDashboard />
              </PermissionBasedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PermissionBasedRoute permission="manageUsers">
                <UserManagementPage />
              </PermissionBasedRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </Suspense>
  );
}
