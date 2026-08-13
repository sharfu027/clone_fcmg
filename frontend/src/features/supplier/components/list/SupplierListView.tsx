import React, { useState } from 'react';
import { SupplierDto } from '../../../../types/masterData';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { Download, Plus, Filter, Eye, Edit2, Trash2, Loader2, Building, Mail, Phone, RefreshCw } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { useSupplierPermissions } from '../../hooks/useSupplierPermissions';
import { exportSuppliersToCSV } from '../../utils/supplierUtils';
import { formatINR } from '../../../../utils/formatters';

interface Props {
  suppliers: SupplierDto[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  permissions: ReturnType<typeof useSupplierPermissions>;
}

export function SupplierListView({
  suppliers,
  loading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onRefresh,
  onTriggerToast,
  permissions
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(suppliers.length / pageSize) || 1;
  const paginatedSuppliers = suppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden flex flex-col">
      {/* Search & Filter Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search code, legal name, GSTIN..."
            className="max-w-md w-full"
          />
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded flex items-center gap-1 hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {permissions.canExport && (
              <button
                onClick={() => {
                  if (suppliers.length === 0) {
                    onTriggerToast('warning', 'Export Empty', 'No supplier records available to export.');
                    return;
                  }
                  exportSuppliersToCSV(suppliers);
                  onTriggerToast('success', 'Export Complete', `Exported ${suppliers.length} supplier records to CSV.`);
                }}
                className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded flex items-center gap-1 hover:bg-brand-bg-secondary cursor-pointer"
              >
                <Download size={14} /> Export
              </button>
            )}
            {permissions.canCreate && (
              <button
                onClick={onCreate}
                className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Add Supplier
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 text-xs items-center bg-brand-bg-secondary/30 p-2 rounded">
          <Filter size={14} className="text-brand-text-secondary" />
          <span className="font-bold text-[10px] uppercase text-brand-text-secondary">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={e => {
              onStatusFilterChange(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border rounded px-2.5 py-1 text-xs outline-none focus:border-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table Body / Loading / Empty State */}
      <div className="overflow-x-auto min-h-[350px] relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-brand-primary">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-xs font-semibold text-brand-text-secondary">Loading suppliers from PostgreSQL database...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <Building size={36} className="text-gray-300" />
            <div>
              <h3 className="text-sm font-bold text-brand-text-primary">No Suppliers Found</h3>
              <p className="text-xs text-brand-text-secondary mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'No supplier records match your search query or filter.'
                  : 'No supplier master records exist in the database.'}
              </p>
            </div>
            {permissions.canCreate && (
              <button
                onClick={onCreate}
                className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} /> Add First Supplier
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
              <tr>
                <th className="p-3">Supplier Code</th>
                <th className="p-3">Legal Name / Trade Name</th>
                <th className="p-3">GSTIN / PAN</th>
                <th className="p-3">Contact Information</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Payment Terms</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {paginatedSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-brand-bg-secondary/30 transition">
                  <td className="p-3 font-mono font-bold text-brand-primary">{s.code}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-text-primary">{s.legalName}</span>
                      {s.tradeName && <span className="text-[10px] text-brand-text-secondary">({s.tradeName})</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col font-mono text-[11px]">
                      <span className="text-brand-text-primary">GST: {s.gstin || '-'}</span>
                      <span className="text-brand-text-secondary">PAN: {s.pan || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span className="flex items-center gap-1 text-brand-text-primary">
                        <Mail size={11} className="text-brand-text-secondary" /> {s.email}
                      </span>
                      <span className="flex items-center gap-1 text-brand-text-secondary">
                        <Phone size={11} className="text-brand-text-secondary" /> {s.phone}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-brand-text-primary font-medium">
                      {s.city}, {s.state}
                    </span>
                    <span className="text-[10px] text-brand-text-secondary block">{s.country}</span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className="font-bold text-brand-text-primary">{s.paymentTermsDays} Days</span>
                    {s.creditLimit && (
                      <span className="text-[10px] text-brand-text-secondary block">
                        Limit: {formatINR(s.creditLimit)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={s.isActive ? 'success' : 'neutral'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onView(s.id)}
                        className="p-1.5 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                      {permissions.canEdit && (
                        <button
                          onClick={() => onEdit(s.id)}
                          className="p-1.5 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {permissions.canArchive && (
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-1.5 border border-red-200 rounded text-brand-danger hover:bg-red-50 cursor-pointer"
                          title="Deactivate Supplier"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && suppliers.length > 0 && (
        <div className="p-3 border-t bg-brand-bg-secondary/10 flex justify-between items-center text-xs text-brand-text-secondary">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, suppliers.length)} of {suppliers.length} suppliers
          </span>
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 border rounded hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
