import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { RoleBasedRoute } from '../components/layout/RoleBasedRoute';
import { LoginPage } from '../features/auth';
import { RoleOverview } from '../features/dashboard';
import { EmployeeDashboard } from '../features/employees';
import { TicketDashboard } from '../features/tickets';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/tickets" element={<TicketDashboard />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/team"
          element={
            <RoleBasedRoute allowedRoles={['administrator', 'supportManager']}>
              <RoleOverview
                title="Team statistics"
                description="Team-wide ticket volume and status distribution."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={['administrator']}>
              <RoleOverview
                title="Administration"
                description="Administrative overview for the support workspace."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <RoleBasedRoute allowedRoles={['administrator']}>
              <EmployeeDashboard />
            </RoleBasedRoute>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/tickets" replace />} />
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  );
}
