import React from 'react';
import { Plus, Download, Building, ArrowRight } from 'lucide-react';
import { StatCard } from '../../../../components/ui/StatCard';
import { SupplierDto } from '../../../../types/masterData';
import { Badge } from '../../../../components/ui/Badge';
import { exportSuppliersToCSV } from '../../utils/supplierUtils';

interface Props {
  suppliers: SupplierDto[];
  loading: boolean;
  onNavigateToListWithFilter: (status: string) => void;
  onNavigateToCreate: () => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export function SupplierDashboardView({
  suppliers,
  loading,
  onNavigateToListWithFilter,
  onNavigateToCreate,
  onTriggerToast
}: Props) {
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const inactiveSuppliers = suppliers.filter(s => !s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Real API-Driven KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateToListWithFilter('all')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            title="Total Suppliers"
            value={totalSuppliers}
            badgeText="Registered Masters"
            badgeVariant="neutral"
            subLabel="Master Directory"
            subValue={`${totalSuppliers} Records`}
          />
        </div>

        <div
          onClick={() => onNavigateToListWithFilter('active')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            title="Active Suppliers"
            value={activeSuppliers}
            badgeText="Procurement Ready"
            badgeVariant="success"
            subLabel="Active Trade Status"
            subValue={`${totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0}% Active`}
          />
        </div>

        <div
          onClick={() => onNavigateToListWithFilter('inactive')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            badgeText="Deactivated"
            badgeVariant="warning"
            subLabel="Inactive / Suspended"
            subValue={`${inactiveSuppliers} Records`}
          />
        </div>
      </div>

      {/* Main Grid: Registered Suppliers & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                  Registered Supplier Directory
                </h4>
                <p className="text-[11px] text-brand-text-secondary">
                  Live records loaded from PostgreSQL database
                </p>
              </div>
              <button
                onClick={() => onNavigateToListWithFilter('all')}
                className="text-brand-primary text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                View All Directory <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {suppliers.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-text-secondary space-y-2">
                  <Building size={28} className="mx-auto text-gray-300" />
                  <p>No supplier master records found in database.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                    <tr>
                      <th className="p-3">Supplier Code</th>
                      <th className="p-3">Legal Name</th>
                      <th className="p-3">GSTIN</th>
                      <th className="p-3">City / Country</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {suppliers.slice(0, 5).map(s => (
                      <tr key={s.id} className="hover:bg-brand-bg-secondary/30 transition">
                        <td className="p-3 font-mono font-bold text-brand-primary">{s.code}</td>
                        <td className="p-3 font-semibold text-brand-text-primary">{s.legalName}</td>
                        <td className="p-3 font-mono text-brand-text-secondary">{s.gstin || '-'}</td>
                        <td className="p-3 text-brand-text-secondary">{s.city}, {s.country}</td>
                        <td className="p-3 text-center">
                          <Badge variant={s.isActive ? 'success' : 'neutral'}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
              Quick Actions
            </h4>
            <button
              onClick={onNavigateToCreate}
              className="w-full py-2.5 px-3 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus size={14} /> Onboard New Supplier
            </button>
            <button
              onClick={() => {
                if (suppliers.length === 0) {
                  onTriggerToast('warning', 'Export Empty', 'No supplier records available to export.');
                  return;
                }
                exportSuppliersToCSV(suppliers);
                onTriggerToast('success', 'Export Complete', `Exported ${suppliers.length} supplier records to CSV.`);
              }}
              className="w-full py-2.5 px-3 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download size={14} /> Export Suppliers CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
