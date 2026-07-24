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
import OperationListPage from '../features/operations/executions/OperationListPage';
import OperationForm from '../features/operations/executions/OperationForm';
import OperationDetailPage from '../features/operations/executions/OperationDetailPage';
import BusinessPartnerList from '../features/master-data/business-partners/BusinessPartnerList';
import BusinessPartnerForm from '../features/master-data/business-partners/BusinessPartnerForm';
import CountryList from '../features/master-data/locations/CountryList';
import CountryForm from '../features/master-data/locations/CountryForm';
import PortList from '../features/master-data/locations/PortList';
import PortForm from '../features/master-data/locations/PortForm';
import WarehouseList from '../features/master-data/locations/WarehouseList';
import WarehouseForm from '../features/master-data/locations/WarehouseForm';
import VehicleTypeList from '../features/master-data/references/VehicleTypeList';
import VehicleTypeForm from '../features/master-data/references/VehicleTypeForm';
import ContainerTypeList from '../features/master-data/references/ContainerTypeList';
import ContainerTypeForm from '../features/master-data/references/ContainerTypeForm';
import CargoUnitList from '../features/master-data/references/CargoUnitList';
import CargoUnitForm from '../features/master-data/references/CargoUnitForm';
import ServiceTypeList from '../features/master-data/references/ServiceTypeList';
import ServiceTypeForm from '../features/master-data/references/ServiceTypeForm';
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

            {/* OPERATIONS */}
            <Route element={<ProtectedRoute requiredPermission="operations.read" />}>
              <Route path="/operations" element={<OperationListPage />} />
              <Route path="/operations/:id" element={<OperationDetailPage />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="operations.create" />}>
              <Route path="/operations/create" element={<OperationForm />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="operations.edit" />}>
              <Route path="/operations/:id/edit" element={<OperationForm />} />
            </Route>

            {/* Master Data Routes */}
            <Route element={<ProtectedRoute requiredPermission="master_data.read" />}>
              <Route path="/master-data/business-partners" element={<BusinessPartnerList title="Business Partner" icon={Briefcase} />} />
              <Route path="/master-data/customers" element={<BusinessPartnerList defaultRole="CUSTOMER" title="Customer" icon={Users} />} />
              <Route path="/master-data/vendors" element={<BusinessPartnerList defaultRole="VENDOR" title="Vendor" icon={UserCheck} />} />
              
              {/* Location Master Data */}
              <Route path="/master-data/countries" element={<CountryList />} />
              <Route path="/master-data/ports" element={<PortList />} />
              <Route path="/master-data/warehouses" element={<WarehouseList />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="master_data.create" />}>
              <Route path="/master-data/business-partners/create" element={<BusinessPartnerForm />} />
              <Route path="/master-data/customers/create" element={<BusinessPartnerForm />} />
              <Route path="/master-data/vendors/create" element={<BusinessPartnerForm />} />
              
              <Route path="/master-data/countries/create" element={<CountryForm />} />
              <Route path="/master-data/ports/create" element={<PortForm />} />
              <Route path="/master-data/warehouses/create" element={<WarehouseForm />} />
            </Route>
            
            <Route element={<ProtectedRoute requiredPermission="master_data.update" />}>
              <Route path="/master-data/business-partners/:id/edit" element={<BusinessPartnerForm />} />
              
              <Route path="/master-data/countries/:id/edit" element={<CountryForm />} />
              <Route path="/master-data/ports/:id/edit" element={<PortForm />} />
              <Route path="/master-data/warehouses/:id/edit" element={<WarehouseForm />} />
              
              <Route path="/master-data/vehicle-types" element={<VehicleTypeList />} />
              <Route path="/master-data/vehicle-types/create" element={<VehicleTypeForm />} />
              <Route path="/master-data/vehicle-types/:id/edit" element={<VehicleTypeForm />} />
              
              <Route path="/master-data/container-types" element={<ContainerTypeList />} />
              <Route path="/master-data/container-types/create" element={<ContainerTypeForm />} />
              <Route path="/master-data/container-types/:id/edit" element={<ContainerTypeForm />} />

              <Route path="/master-data/cargo-units" element={<CargoUnitList />} />
              <Route path="/master-data/cargo-units/create" element={<CargoUnitForm />} />
              <Route path="/master-data/cargo-units/:id/edit" element={<CargoUnitForm />} />

              <Route path="/master-data/service-types" element={<ServiceTypeList />} />
              <Route path="/master-data/service-types/create" element={<ServiceTypeForm />} />
              <Route path="/master-data/service-types/:id/edit" element={<ServiceTypeForm />} />
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
