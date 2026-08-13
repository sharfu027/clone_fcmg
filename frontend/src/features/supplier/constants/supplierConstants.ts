import { SupplierDetailTab, SupplierWizardStep } from '../../../types/supplier';

export const SUPPLIER_STATUS_MAP: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info'> = {
  'ACTIVE': 'success',
  'PENDING': 'warning',
  'PENDING APPROVAL': 'warning',
  'BLOCKED': 'danger',
  'BLACKLISTED': 'danger',
  'PREFERRED': 'primary',
  'INACTIVE': 'neutral',
  'SUSPENDED': 'warning',
  'PROSPECT': 'info',
};

export const WIZARD_STEPS: { id: SupplierWizardStep; label: string; description: string }[] = [
  { id: 'general', label: 'General Info', description: 'Basic supplier information' },
  { id: 'sites', label: 'Sites', description: 'Operational site locations' },
  { id: 'contacts', label: 'Contacts', description: 'Key contact persons' },
  { id: 'addresses', label: 'Addresses', description: 'Physical addresses' },
  { id: 'bank-accounts', label: 'Bank Details', description: 'Payment accounts' },
  { id: 'tax-profiles', label: 'Tax Profile', description: 'GST & tax registration' },
  { id: 'compliance', label: 'Compliance', description: 'KYC, ESG, sanctions' },
  { id: 'documents', label: 'Documents', description: 'Certificates & docs' },
  { id: 'product-categories', label: 'Categories', description: 'Approved product categories' },
  { id: 'review', label: 'Review', description: 'Review & submit for approval' },
];

export const DETAIL_TABS: { id: SupplierDetailTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'Activity' },
  { id: 'sites', label: 'Sites', icon: 'MapPin' },
  { id: 'contacts', label: 'Contacts', icon: 'Users' },
  { id: 'addresses', label: 'Addresses', icon: 'Building' },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: 'Banknote' },
  { id: 'tax-profiles', label: 'Tax Profile', icon: 'FileText' },
  { id: 'documents', label: 'Documents', icon: 'FileText' },
  { id: 'certifications', label: 'Certifications', icon: 'Award' },
  { id: 'compliance', label: 'Compliance', icon: 'ShieldCheck' },
  { id: 'performance', label: 'Performance', icon: 'BarChart3' },
  { id: 'product-categories', label: 'Categories', icon: 'Package' },
  { id: 'relationships', label: 'Relationships', icon: 'Layers' },
  { id: 'status-history', label: 'Status History', icon: 'Clock' },
  { id: 'audit', label: 'Audit & Activity', icon: 'Activity' },
];

export const ACTIVITY_EVENTS = [
  { id: 'ACT-001', type: 'created', label: 'Supplier Created', description: 'Onboarding wizard submitted by Procurement team', date: '2025-01-10', user: 'Karan Anand', icon: 'Plus' },
  { id: 'ACT-002', type: 'approved', label: 'Supplier Approved', description: 'KYC verification completed. Supplier approved for procurement.', date: '2025-01-15', user: 'Siddharth Mehra', icon: 'CheckCircle2' },
  { id: 'ACT-003', type: 'site', label: 'Primary Site Added', description: 'Delhi HQ site registered with procurement default flag', date: '2025-01-18', user: 'Karan Anand', icon: 'MapPin' },
  { id: 'ACT-004', type: 'bank', label: 'Bank Account Verified', description: 'HDFC Bank account verified by Finance team. Payment enabled.', date: '2025-02-01', user: 'Finance Controller', icon: 'Banknote' },
  { id: 'ACT-005', type: 'compliance', label: 'Compliance Updated', description: 'Annual KYC renewal completed. Sanctions screening passed.', date: '2026-01-10', user: 'Compliance Officer', icon: 'Shield' },
  { id: 'ACT-006', type: 'performance', label: 'Performance Reviewed', description: 'Q2 FY2026 performance evaluation: 4.8 stars. OTD: 98%.', date: '2026-06-30', user: 'Procurement Manager', icon: 'Star' },
];
