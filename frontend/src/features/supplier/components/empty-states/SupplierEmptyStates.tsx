import React from 'react';
import { Building2, Users, MapPin, Banknote, FileText, Award, Package, Activity, ShieldCheck, Building } from 'lucide-react';

interface EmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
}

export function NoSuppliersState({ onAction, actionLabel = 'Add First Supplier' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Building2 size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Suppliers Found</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        There are no suppliers matching your current criteria. Adjust your filters or add a new supplier.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoSitesState({ onAction, actionLabel = 'Add First Site' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <MapPin size={28} className="text-blue-300" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Supplier Sites Registered</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        This supplier has no registered operational sites yet. Add a Head Office or Factory site to enable site-specific contacts, addresses, and bank accounts.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoContactsState({ onAction, actionLabel = 'Add First Contact' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Users size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Contacts Added</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        There are no key contact persons added for this supplier. Add contacts to facilitate better communication.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoAddressesState({ onAction, actionLabel = 'Add First Address' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Building size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Addresses Recorded</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        Physical addresses for this supplier are not available. Add an address to complete the profile.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoBankAccountsState({ onAction, actionLabel = 'Add Bank Account' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Banknote size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Bank Details Available</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        Payment accounts for this supplier have not been set up. Add a bank account to enable transactions.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoDocumentsState({ onAction, actionLabel = 'Upload Document' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <FileText size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Documents Uploaded</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        Certificates, agreements, and other documents are missing. Upload necessary documents.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoCertificationsState({ onAction, actionLabel = 'Add Certification' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Award size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Certifications Recorded</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        This supplier does not have any recorded certifications. Add relevant certifications (e.g., ISO, GMP).
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoComplianceState({ onAction, actionLabel = 'Run Compliance Check' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <ShieldCheck size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Compliance Data</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        Compliance checks (KYC, ESG, sanctions) have not been completed for this supplier.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoPerformanceReviewsState({ onAction, actionLabel = 'Add Performance Review' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Activity size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-brand-text-primary mb-1">No Performance Reviews</h3>
      <p className="text-xs text-brand-text-secondary max-w-xs mb-4">
        There are no past performance evaluations available. Initiate a new performance review cycle.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
