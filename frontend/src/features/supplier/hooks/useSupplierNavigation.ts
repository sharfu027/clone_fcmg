import { useState } from 'react';
import { SupplierListView, SupplierDetailTab, SupplierWizardStep } from '../../../types/supplier';

export interface SupplierNavState {
  currentView: SupplierListView;
  selectedSupplierId: string | null;
  detailTab: SupplierDetailTab;
  wizardStep: SupplierWizardStep;
}

export function useSupplierNavigation() {
  const [currentView, setCurrentView] = useState<SupplierListView>('dashboard');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<SupplierDetailTab>('overview');
  const [wizardStep, setWizardStep] = useState<SupplierWizardStep>('general');

  const navigateToDetail = (id: string) => {
    setSelectedSupplierId(id);
    setDetailTab('overview');
    setCurrentView('detail');
  };

  const navigateToEdit = (id: string) => {
    setSelectedSupplierId(id);
    setWizardStep('general');
    setCurrentView('edit');
  };

  const navigateToCreate = () => {
    setSelectedSupplierId(null);
    setWizardStep('general');
    setCurrentView('create');
  };

  const navigateToList = () => {
    setCurrentView('list');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  const getBreadcrumbs = (supplierName?: string) => {
    const base = [
      { label: 'Home', view: null },
      { label: 'Procurement', view: null },
      { label: 'Supplier Management', view: 'dashboard' as SupplierListView },
    ];
    if (currentView === 'list') {
      return [...base, { label: 'Suppliers', view: null }];
    }
    if (currentView === 'create') {
      return [...base, { label: 'New Supplier', view: null }];
    }
    if (currentView === 'detail' || currentView === 'edit') {
      return [...base, { label: 'Suppliers', view: 'list' as SupplierListView }, { label: supplierName || 'Supplier Details', view: null }];
    }
    return base;
  };

  return {
    currentView, setCurrentView,
    selectedSupplierId, setSelectedSupplierId,
    detailTab, setDetailTab,
    wizardStep, setWizardStep,
    navigateToDetail, navigateToEdit, navigateToCreate, navigateToList, navigateToDashboard,
    getBreadcrumbs,
  };
}
