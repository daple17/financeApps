import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';

import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CoaPage from '../features/coa/CoaPage';
import TransactionPage from '../features/transactions/TransactionPage';
import ApprovalPage from '../features/approvals/ApprovalPage';
import BudgetPage from '../features/budget/BudgetPage';
import ReportPage from '../features/reports/ReportPage';
import UserManagementPage from '../features/admin/UserManagementPage';
import RoleManagementPage from '../features/admin/RoleManagementPage';
import JobOrderListPage from '../features/operations/job-orders/JobOrderListPage';
import CreateJobOrderPage from '../features/operations/job-orders/CreateJobOrderPage';
import EditJobOrderPage from '../features/operations/job-orders/EditJobOrderPage';
import JobOrderDetailPage from '../features/operations/job-orders/JobOrderDetailPage';
import BusinessPartnerList from '../features/master-data/business-partners/BusinessPartnerList';
import BusinessPartnerForm from '../features/master-data/business-partners/BusinessPartnerForm';
import { Briefcase, Users, UserCheck } from 'lucide-react';

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Layout Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route element={<ProtectedRoute requiredPermission="coa.read" />}>
              <Route path="/coa" element={<CoaPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="transactions.read" />}>
              <Route path="/transactions" element={<TransactionPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="approvals.read" />}>
              <Route path="/approvals" element={<ApprovalPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="budgets.read" />}>
              <Route path="/budgets" element={<BudgetPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="reports.read" />}>
              <Route path="/reports" element={<ReportPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="users.read" />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="roles.read" />}>
              <Route path="/admin/roles" element={<RoleManagementPage />} />
            </Route>

            {/* Operasional Routes */}
            <Route element={<ProtectedRoute requiredPermission="job_orders.read" />}>
              <Route path="/job-orders" element={<JobOrderListPage />} />
              <Route path="/job-orders/:id" element={<JobOrderDetailPage />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="job_orders.create" />}>
              <Route path="/job-orders/create" element={<CreateJobOrderPage />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="job_orders.update" />}>
              <Route path="/job-orders/:id/edit" element={<EditJobOrderPage />} />
            </Route>

            {/* Master Data Routes */}
            <Route element={<ProtectedRoute requiredPermission="master_data.read" />}>
              <Route path="/master-data/business-partners" element={<BusinessPartnerList title="Business Partner" icon={Briefcase} />} />
              <Route path="/master-data/customers" element={<BusinessPartnerList defaultRole="CUSTOMER" title="Customer" icon={Users} />} />
              <Route path="/master-data/vendors" element={<BusinessPartnerList defaultRole="VENDOR" title="Vendor" icon={UserCheck} />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="master_data.create" />}>
              <Route path="/master-data/business-partners/create" element={<BusinessPartnerForm />} />
              <Route path="/master-data/customers/create" element={<BusinessPartnerForm />} />
              <Route path="/master-data/vendors/create" element={<BusinessPartnerForm />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="master_data.update" />}>
              <Route path="/master-data/business-partners/:id/edit" element={<BusinessPartnerForm />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
