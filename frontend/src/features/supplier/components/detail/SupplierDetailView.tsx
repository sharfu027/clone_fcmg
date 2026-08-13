import React from 'react';
import { SupplierDto } from '../../../../types/masterData';
import { SupplierDetailTab } from '../../../../types/supplier';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { SupplierBreadcrumb } from '../shared/SupplierBreadcrumb';
import { useSupplierPermissions } from '../../hooks/useSupplierPermissions';
import { OverviewTab } from './tabs/OverviewTab';

interface Props {
  supplier: SupplierDto;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: (view: string) => void;
  detailTab?: SupplierDetailTab;
  onTabChange?: (tab: SupplierDetailTab) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  permissions: ReturnType<typeof useSupplierPermissions>;
  getBreadcrumbs: () => { label: string; view: string | null }[];
}

export function SupplierDetailView({
  supplier,
  onBack,
  onEdit,
  onDelete,
  onNavigate,
  onTriggerToast,
  permissions,
  getBreadcrumbs
}: Props) {
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-4">
      <SupplierBreadcrumb items={breadcrumbs} onNavigate={onNavigate} />

      {/* Header Bar */}
      <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 border rounded hover:bg-brand-bg-secondary cursor-pointer text-brand-text-secondary">
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-brand-text-primary">{supplier.legalName}</h2>
              <Badge variant={supplier.isActive ? 'success' : 'neutral'}>
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-brand-text-secondary font-mono">
              {supplier.code} {supplier.tradeName ? `(${supplier.tradeName})` : ''} | {supplier.city}, {supplier.country}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {permissions.canEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer flex items-center gap-1"
            >
              <Edit2 size={14} /> Edit Supplier
            </button>
          )}
          {permissions.canArchive && (
            <button
              onClick={onDelete}
              className="px-3 py-1.5 border border-red-200 text-brand-danger text-xs font-semibold rounded hover:bg-red-50 cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={14} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Supplier Master Detail Content */}
      <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm min-h-[400px]">
        <OverviewTab supplier={supplier} onEdit={onEdit} onTriggerToast={onTriggerToast} />
      </div>
    </div>
  );
}
