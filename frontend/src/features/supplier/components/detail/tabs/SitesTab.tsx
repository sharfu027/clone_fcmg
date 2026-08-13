import React from 'react';
import { Supplier } from '../../../../../types/supplier';
import { Building2, MapPin, Check } from 'lucide-react';
import { NoSitesState } from '../../empty-states/SupplierEmptyStates';

interface Props {
  supplier: Supplier;
}

export function SitesTab({ supplier }: Props) {
  // If no primary site, we show empty state (mock checking)
  if (!supplier.primary_site_name) {
    return <NoSitesState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Registered Sites & Facilities</h4>
        <button className="px-2 py-1 text-[10px] bg-brand-primary text-white rounded font-bold uppercase tracking-wider cursor-pointer">Add Site</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-success text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl">Primary HQ</div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
            <Building2 size={16} /> {supplier.primary_site_name}
          </div>
          <div className="text-xs text-brand-text-secondary space-y-1">
            <p className="flex items-start gap-1.5"><MapPin size={14} className="shrink-0 mt-0.5" /> Plot 45, Phase 3, Industrial Area<br/>New Delhi, 110020<br/>India</p>
            <p className="flex items-center gap-1.5"><Check size={14} className="text-brand-success" /> Default Procurement Site</p>
          </div>
        </div>
      </div>
    </div>
  );
}
