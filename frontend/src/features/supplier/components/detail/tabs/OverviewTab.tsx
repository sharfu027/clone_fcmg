import React from 'react';
import { SupplierDto } from '../../../../../types/masterData';
import { Info, Users, MapPin, Banknote, Edit2, ShieldCheck, Clock } from 'lucide-react';
import { formatINR } from '../../../../../utils/formatters';

interface Props {
  supplier: SupplierDto;
  onEdit: () => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export function OverviewTab({ supplier, onEdit, onTriggerToast }: Props) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-brand-bg-secondary/20 p-3 rounded-lg border border-brand-border flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-white border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer flex items-center gap-1.5"
        >
          <Edit2 size={14} /> Edit Supplier Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* General Information */}
          <div className="border border-brand-border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
              <Info size={16} className="text-brand-primary" /> General Identification
            </h4>
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Supplier Code</span>
                <span className="font-mono font-bold text-brand-primary">{supplier.code}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Trade / Display Name</span>
                <span className="font-bold">{supplier.tradeName || supplier.legalName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-brand-text-secondary block mb-0.5">Legal Entity Name</span>
                <span className="font-semibold text-brand-text-primary">{supplier.legalName}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Company Reference</span>
                <span className="font-semibold">{supplier.companyName || 'INK FMCG India Pvt Ltd'}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Status</span>
                <span className={supplier.isActive ? 'text-brand-success font-bold' : 'text-brand-danger font-bold'}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Created Date</span>
                <span>{new Date(supplier.createdAtUtc).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Tax & Registration */}
          <div className="border border-brand-border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
              <ShieldCheck size={16} className="text-brand-primary" /> Tax & Legal Registration
            </h4>
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div>
                <span className="text-brand-text-secondary block mb-0.5">GSTIN</span>
                <span className="font-mono font-bold text-brand-text-primary">{supplier.gstin || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">PAN Number</span>
                <span className="font-mono font-bold text-brand-text-primary">{supplier.pan || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact & Address */}
          <div className="border border-brand-border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
              <Users size={16} className="text-brand-primary" /> Primary Contact & Address
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Primary Email</span>
                <span className="font-semibold text-brand-primary">{supplier.email}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Primary Phone</span>
                <span className="font-semibold text-brand-text-primary">{supplier.phone}</span>
              </div>
              <div className="border-t pt-3">
                <span className="text-brand-text-secondary block mb-1">Registered Address</span>
                <p className="font-medium text-brand-text-primary">
                  {supplier.addressLine1}
                  {supplier.addressLine2 ? `, ${supplier.addressLine2}` : ''}
                </p>
                <p className="text-brand-text-secondary">
                  {supplier.city}, {supplier.state} - {supplier.postalCode}, {supplier.country}
                </p>
              </div>
            </div>
          </div>

          {/* Commercial Terms */}
          <div className="border border-brand-border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
              <Banknote size={16} className="text-brand-primary" /> Commercial Terms
            </h4>
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Payment Terms</span>
                <span className="font-mono font-bold text-brand-primary">{supplier.paymentTermsDays} Days Net</span>
              </div>
              <div>
                <span className="text-brand-text-secondary block mb-0.5">Approved Credit Limit</span>
                <span className="font-mono font-bold text-brand-text-primary">
                  {supplier.creditLimit ? formatINR(supplier.creditLimit) : 'No Limit Set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
