import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { RoleBasedRoute } from '../components/layout/RoleBasedRoute';
import { EmployeeDashboard } from '../App';
import { RoleOverview } from '../pages/Dashboard/RoleOverview';
import { TicketDashboard } from '../pages/Dashboard/TicketDashboard';
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
