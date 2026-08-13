import React, { useState, useEffect, useCallback } from 'react';
import { useSupplierNavigation } from './hooks/useSupplierNavigation';
import { useSupplierPermissions } from './hooks/useSupplierPermissions';
import { SupplierDashboardView } from './components/dashboard/SupplierDashboardView';
import { SupplierListView } from './components/list/SupplierListView';
import { SupplierDetailView } from './components/detail/SupplierDetailView';
import { SupplierWizardView } from './components/wizard/SupplierWizardView';
import { Activity, Layers, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { SupplierDto } from '../../types/masterData';
import * as masterDataService from '../../services/masterDataService';

interface SupplierManagementModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function SupplierManagementModule({ onTriggerToast }: SupplierManagementModuleProps) {
  const nav = useSupplierNavigation();
  const permissions = useSupplierPermissions('Procurement Manager');

  // API State
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');

  // 1. Fetch Company ID for creation payload
  useEffect(() => {
    async function loadCompany() {
      try {
        const comps = await masterDataService.fetchCompanies({});
        const items = Array.isArray(comps) ? comps : (comps && Array.isArray(comps.items) ? comps.items : []);
        if (items.length > 0 && items[0].id) {
          setActiveCompanyId(items[0].id);
        }
      } catch (e) {
        console.warn('Failed to load parent company for supplier creation:', e);
      }
    }
    loadCompany();
  }, []);

  // 2. Fetch Suppliers from API
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await masterDataService.fetchSuppliers(params);
      const items: SupplierDto[] = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
      setSuppliers(items);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to fetch suppliers from backend API.';
      setError(errMsg);
      onTriggerToast('error', 'API Connection Error', errMsg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, onTriggerToast]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Selected Supplier for Detail / Edit View
  const selectedSupplier = suppliers.find(s => s.id === nav.selectedSupplierId) || null;

  // Handle Delete
  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this supplier record?')) {
      return;
    }
    try {
      await masterDataService.deleteSupplier(id);
      onTriggerToast('success', 'Supplier Deactivated', `Supplier ID ${id} was soft-deleted successfully.`);
      loadSuppliers();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to delete supplier.';
      onTriggerToast('error', 'Delete Failed', msg);
    }
  };

  const handleNavigateToListWithFilter = (filter: string) => {
    setStatusFilter(filter);
    nav.navigateToList();
  };

  return (
    <div className="space-y-4">
      {/* Top Nav Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={nav.navigateToDashboard}
            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              nav.currentView === 'dashboard' ? 'bg-brand-primary text-white shadow-xs' : 'bg-white border text-brand-text-secondary hover:text-brand-text-primary'
            }`}
            aria-current={nav.currentView === 'dashboard' ? 'page' : undefined}
          >
            <Activity size={14} /> Dashboard
          </button>
          <button
            onClick={nav.navigateToList}
            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              ['list', 'detail'].includes(nav.currentView) ? 'bg-brand-primary text-white shadow-xs' : 'bg-white border text-brand-text-secondary hover:text-brand-text-primary'
            }`}
            aria-current={['list', 'detail'].includes(nav.currentView) ? 'page' : undefined}
          >
            <Layers size={14} /> Suppliers ({suppliers.length})
          </button>
        </div>

        <button
          onClick={loadSuppliers}
          disabled={loading}
          className="px-2.5 py-1.5 text-xs font-medium border border-brand-border rounded bg-white text-brand-text-secondary hover:text-brand-text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
          title="Refresh supplier data from database"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-brand-danger">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadSuppliers} className="px-2.5 py-1 bg-brand-danger text-white font-semibold rounded hover:bg-red-700 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* View Rendering */}
      {nav.currentView === 'dashboard' && (
        <SupplierDashboardView
          suppliers={suppliers}
          loading={loading}
          onNavigateToListWithFilter={handleNavigateToListWithFilter}
          onNavigateToCreate={nav.navigateToCreate}
          onTriggerToast={onTriggerToast}
        />
      )}

      {nav.currentView === 'list' && (
        <SupplierListView
          suppliers={suppliers}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onView={nav.navigateToDetail}
          onEdit={nav.navigateToEdit}
          onDelete={handleDeleteSupplier}
          onCreate={nav.navigateToCreate}
          onRefresh={loadSuppliers}
          onTriggerToast={onTriggerToast}
          permissions={permissions}
        />
      )}

      {nav.currentView === 'detail' && selectedSupplier && (
        <SupplierDetailView
          supplier={selectedSupplier}
          onBack={nav.navigateToList}
          onEdit={() => nav.navigateToEdit(selectedSupplier.id)}
          onDelete={() => handleDeleteSupplier(selectedSupplier.id)}
          onNavigate={(view) => nav.setCurrentView(view as any)}
          detailTab={nav.detailTab}
          onTabChange={nav.setDetailTab}
          onTriggerToast={onTriggerToast}
          permissions={permissions}
          getBreadcrumbs={() => nav.getBreadcrumbs(selectedSupplier.legalName)}
        />
      )}

      {(nav.currentView === 'create' || nav.currentView === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto">
            <SupplierWizardView
              onClose={nav.navigateToList}
              companyId={activeCompanyId}
              supplierToEdit={nav.currentView === 'edit' ? selectedSupplier : null}
              onSuccess={() => {
                nav.navigateToList();
                loadSuppliers();
              }}
              onTriggerToast={onTriggerToast}
              wizardStep={nav.wizardStep}
              onStepChange={nav.setWizardStep}
            />
          </div>
        </div>
      )}
    </div>
  );
}
