import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import RoleGuard from './guards/RoleGuard.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import VendorsPage from '../pages/VendorsPage.jsx';
import RfqsPage from '../pages/RfqsPage.jsx';
import QuotationsPage from '../pages/QuotationsPage.jsx';
import ComparisonPage from '../pages/ComparisonPage.jsx';
import ApprovalsPage from '../pages/ApprovalsPage.jsx';
import PosPage from '../pages/PosPage.jsx';
import InvoicesPage from '../pages/InvoicesPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import ActivityPage from '../pages/ActivityPage.jsx';
import { ROLES } from '../utils/config/constants.js';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vendors" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]}>
            <VendorsPage />
          </RoleGuard>
        } />
        <Route path="/rfqs" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR]}>
            <RfqsPage />
          </RoleGuard>
        } />
        <Route path="/quotations" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR]}>
            <QuotationsPage />
          </RoleGuard>
        } />
        <Route path="/comparison" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]}>
            <ComparisonPage />
          </RoleGuard>
        } />
        <Route path="/approvals" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <ApprovalsPage />
          </RoleGuard>
        } />
        <Route path="/pos" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR]}>
            <PosPage />
          </RoleGuard>
        } />
        <Route path="/invoices" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.VENDOR]}>
            <InvoicesPage />
          </RoleGuard>
        } />
        <Route path="/reports" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <ReportsPage />
          </RoleGuard>
        } />
        <Route path="/activity" element={
          <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]}>
            <ActivityPage />
          </RoleGuard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
