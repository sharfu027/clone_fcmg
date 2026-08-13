import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  X,
  AlertCircle,
  Info,
  Sliders,
  Loader2
} from 'lucide-react';
import { UserRole, ToastMessage } from './types';
import EnterpriseLayout from './components/EnterpriseLayout';
import EnterpriseDashboard from './components/EnterpriseDashboard';
import DesignSystemDocs from './components/DesignSystemDocs';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import SplashScreen from './components/auth/SplashScreen';

// Lazy-loaded Feature Modules
const AuthScreens = lazy(() => import('./features/auth/AuthScreens'));
const MasterDataModule = lazy(() => import('./features/master-data/MasterDataModule'));
const PricingModule = lazy(() => import('./features/pricing/PricingModule'));
const ProcurementModule = lazy(() => import('./features/procurement/ProcurementModule'));
const WarehouseModule = lazy(() => import('./features/warehouse/WarehouseModule'));
const InventoryModule = lazy(() => import('./features/inventory/InventoryModule'));
const SfaModule = lazy(() => import('./features/sfa/SfaModule'));
const O2CModule = lazy(() => import('./features/o2c/O2CModule'));
const ReturnsModule = lazy(() => import('./features/returns/ReturnsModule'));
const FinanceModule = lazy(() => import('./features/finance/FinanceModule'));
const WorkflowModule = lazy(() => import('./features/workflow/WorkflowModule'));
const HrmsModule = lazy(() => import('./features/hrms/HrmsModule'));
const CrmModule = lazy(() => import('./features/crm/CrmModule'));
const LogisticsModule = lazy(() => import('./features/logistics/LogisticsModule'));
const ReportsModule = lazy(() => import('./features/reports/ReportsModule'));
const AdminModule = lazy(() => import('./features/admin/AdminModule'));
const BusinessIntelligenceModule = lazy(() => import('./features/bi/BusinessIntelligenceModule'));
const SupplierModule = lazy(() => import('./features/supplier/SupplierManagementModule'));

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center p-12 space-x-2 text-brand-primary">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-xs font-semibold">Loading Module...</span>
    </div>
  );
}

function MasterDataRouteWrapper({ onTriggerToast }: { onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void }) {
  const { moduleName } = useParams<{ moduleName: string }>();
  if (moduleName === 'suppliers' || moduleName === 'supplier') {
    return <SupplierModule onTriggerToast={onTriggerToast} />;
  }
  return <MasterDataModule module={moduleName || 'products'} onTriggerToast={onTriggerToast} />;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateRole } = useAuth();

  // Derive active view key from location pathname
  const rawPath = location.pathname.startsWith('/') ? location.pathname.slice(1) : location.pathname;
  const activeView = rawPath || 'dashboard';

  // Global Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      description: desc
    };
    setToasts((prev) => [...prev, newToast]);

    // Automatically auto-dismiss toast after 1 second (1000ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync route changes
  const handleNavigate = (view: string) => {
    if (view === 'dashboard') navigate('/dashboard');
    else if (view === 'docs') navigate('/docs');
    else if (view === 'admin') navigate('/admin');
    else if (view.startsWith('masters')) navigate(`/${view}`);
    else if (view.startsWith('pricing')) navigate(`/${view}`);
    else if (view.startsWith('procurement')) navigate(`/${view}`);
    else if (view.startsWith('warehouse')) navigate(`/${view}`);
    else if (view.startsWith('inventory')) navigate(`/${view}`);
    else if (view.startsWith('sfa')) navigate(`/${view}`);
    else if (view.startsWith('sales')) navigate(`/${view}`);
    else if (view.startsWith('returns')) navigate(`/${view}`);
    else if (view.startsWith('finance')) navigate(`/${view}`);
    else if (view.startsWith('workflow')) navigate(`/${view}`);
    else if (view.startsWith('hrms')) navigate(`/${view}`);
    else if (view.startsWith('crm')) navigate(`/${view}`);
    else if (view.startsWith('logistics')) navigate(`/${view}`);
    else if (view.startsWith('reports')) navigate(`/${view}`);
    else if (view.startsWith('bi')) navigate(`/${view}`);
    else if (view.startsWith('auth')) navigate(`/${view}`);
    else navigate(`/${view}`);
  };

  const handleRoleChange = (role: UserRole) => {
    updateRole(role);
    triggerToast('info', 'Role Switch Triggered', `Active session security permissions re-calibrated for: ${role}`);
  };

  return (
    <>
      <Routes>
        {/* Root Redirect Route */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public-Only Auth Routes */}
        <Route
          path="/auth/*"
          element={
            <PublicOnlyRoute>
              <Suspense fallback={<ModuleLoader />}>
                <AuthScreens
                  onLoginSuccess={(userName, role) => {
                    navigate('/dashboard');
                    triggerToast('success', 'Authentication Approved', `Welcome back, ${userName}! Session secured.`);
                  }}
                  onTriggerToast={triggerToast}
                />
              </Suspense>
            </PublicOnlyRoute>
          }
        />

        {/* Protected ERP Module Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {user && (
                <EnterpriseLayout
                  activeRole={user.role}
                  onRoleChange={handleRoleChange}
                  onNavigate={handleNavigate}
                  activeView={activeView}
                  onTriggerToast={triggerToast}
                  user={user}
                >
                  <Suspense fallback={<ModuleLoader />}>
                    <Routes>
                      <Route path="/dashboard" element={<EnterpriseDashboard onTriggerToast={triggerToast} />} />
                      <Route path="/docs" element={<DesignSystemDocs onTriggerToast={triggerToast} />} />
                      <Route path="/admin" element={<AdminModule onTriggerToast={triggerToast} />} />
                      <Route path="/admin/*" element={<AdminModule onTriggerToast={triggerToast} />} />
                      <Route path="/pricing" element={<PricingModule onTriggerToast={triggerToast} />} />
                      <Route path="/pricing/*" element={<PricingModule onTriggerToast={triggerToast} />} />
                      <Route path="/procurement" element={<ProcurementModule onTriggerToast={triggerToast} />} />
                      <Route path="/procurement/suppliers" element={<SupplierModule onTriggerToast={triggerToast} />} />
                      <Route path="/procurement/*" element={<ProcurementModule onTriggerToast={triggerToast} />} />
                      <Route path="/warehouse" element={<WarehouseModule onTriggerToast={triggerToast} />} />
                      <Route path="/warehouse/*" element={<WarehouseModule onTriggerToast={triggerToast} />} />
                      <Route path="/inventory" element={<InventoryModule onTriggerToast={triggerToast} />} />
                      <Route path="/inventory/*" element={<InventoryModule onTriggerToast={triggerToast} />} />
                      <Route path="/sfa" element={<SfaModule onTriggerToast={triggerToast} />} />
                      <Route path="/sfa/*" element={<SfaModule onTriggerToast={triggerToast} />} />
                      <Route path="/sales" element={<O2CModule onTriggerToast={triggerToast} />} />
                      <Route path="/sales/*" element={<O2CModule onTriggerToast={triggerToast} />} />
                      <Route path="/returns" element={<ReturnsModule onTriggerToast={triggerToast} />} />
                      <Route path="/returns/*" element={<ReturnsModule onTriggerToast={triggerToast} />} />
                      <Route path="/finance" element={<FinanceModule onTriggerToast={triggerToast} />} />
                      <Route path="/finance/*" element={<FinanceModule onTriggerToast={triggerToast} />} />
                      <Route path="/workflow" element={<WorkflowModule onTriggerToast={triggerToast} />} />
                      <Route path="/workflow/*" element={<WorkflowModule onTriggerToast={triggerToast} />} />
                      <Route path="/hrms" element={<HrmsModule onTriggerToast={triggerToast} />} />
                      <Route path="/hrms/*" element={<HrmsModule onTriggerToast={triggerToast} />} />
                      <Route path="/crm" element={<CrmModule onTriggerToast={triggerToast} />} />
                      <Route path="/crm/*" element={<CrmModule onTriggerToast={triggerToast} />} />
                      <Route path="/logistics" element={<LogisticsModule onTriggerToast={triggerToast} />} />
                      <Route path="/logistics/*" element={<LogisticsModule onTriggerToast={triggerToast} />} />
                      <Route path="/reports" element={<ReportsModule onTriggerToast={triggerToast} />} />
                      <Route path="/reports/*" element={<ReportsModule onTriggerToast={triggerToast} />} />
                      <Route path="/bi" element={<BusinessIntelligenceModule onTriggerToast={triggerToast} />} />
                      <Route path="/bi/*" element={<BusinessIntelligenceModule onTriggerToast={triggerToast} />} />
                      <Route path="/masters/:moduleName" element={<MasterDataRouteWrapper onTriggerToast={triggerToast} />} />
                      <Route path="/masters/:moduleName/*" element={<MasterDataRouteWrapper onTriggerToast={triggerToast} />} />
                      
                      {/* Fallback view representing unbuilt module placeholders */}
                      <Route 
                        path="*" 
                        element={
                          <div className="bg-white p-12 text-center rounded-lg border border-brand-border shadow-sm space-y-4">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center mx-auto">
                              <Sliders size={24} />
                            </div>
                            <div className="max-w-md mx-auto space-y-1">
                              <h3 className="text-base font-bold text-brand-text-primary">Module Foundation Ready for Backend</h3>
                              <p className="text-xs text-brand-text-secondary">
                                The client requested to only build the Design System & Shell. This placeholder maps perfectly to future ASP.NET Core 9 C# view controllers.
                              </p>
                            </div>
                          </div>
                        } 
                      />
                    </Routes>
                  </Suspense>
                </EnterpriseLayout>
              )}
            </ProtectedRoute>
          }
        />
      </Routes>



      {/* Global Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-3 rounded-lg border shadow-lg transition-all animate-slide-in text-xs ${
              toast.type === 'success'
                ? 'bg-white border-green-200 text-brand-text-primary'
                : toast.type === 'error'
                ? 'bg-white border-red-200 text-brand-text-primary'
                : toast.type === 'warning'
                ? 'bg-white border-amber-200 text-brand-text-primary'
                : 'bg-white border-blue-200 text-brand-text-primary'
            }`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-brand-success shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-brand-danger shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertCircle size={16} className="text-brand-warning shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info size={16} className="text-brand-info shrink-0 mt-0.5" />}
              <div>
                <h4 className="font-bold">{toast.title}</h4>
                {toast.description && <p className="text-brand-text-secondary text-[11px] mt-0.5">{toast.description}</p>}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
