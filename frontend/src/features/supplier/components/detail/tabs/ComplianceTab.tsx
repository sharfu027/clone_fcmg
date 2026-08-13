import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Minus, ShieldCheck, Shield } from 'lucide-react';
import { Supplier } from '../../../../../types/supplier';

interface Props {
  supplier: Supplier;
}

type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending' | 'not-applicable';

interface ComplianceItem {
  label: string;
  status: ComplianceStatus;
  detail?: string;
  date?: string;
}

function ComplianceIcon({ status }: { status: ComplianceStatus }) {
  if (status === 'compliant') return <CheckCircle2 size={16} className="text-brand-success shrink-0" />;
  if (status === 'non-compliant') return <XCircle size={16} className="text-brand-danger shrink-0" />;
  if (status === 'pending') return <AlertTriangle size={16} className="text-brand-warning shrink-0" />;
  return <Minus size={16} className="text-brand-text-secondary shrink-0" />;
}

export function ComplianceTab({ supplier }: Props) {
  const complianceItems: ComplianceItem[] = [
    { label: 'KYC Verification', status: supplier.is_approved ? 'compliant' : 'pending', detail: 'Identity verification complete', date: '2026-01-10' },
    { label: 'GST Registration', status: supplier.gst_number ? 'compliant' : 'non-compliant', detail: supplier.gst_number || 'Not registered', date: '2025-04-01' },
    { label: 'PAN Verification', status: supplier.pan_number ? 'compliant' : 'non-compliant', detail: supplier.pan_number || 'Not provided' },
    { label: 'Sanctions Screening', status: supplier.is_blocked ? 'non-compliant' : 'compliant', detail: supplier.is_blocked ? 'Flagged - review required' : 'Clear - no watchlist matches', date: '2026-07-01' },
    { label: 'ESG Assessment', status: 'pending', detail: 'Annual ESG review scheduled', date: '2026-09-30' },
    { label: 'RoHS Compliance', status: 'not-applicable', detail: 'Not applicable for this supplier type' },
    { label: 'REACH Compliance', status: 'not-applicable', detail: 'Not applicable for this supplier type' },
    { label: 'Conflict Minerals', status: 'compliant', detail: 'Dodd-Frank 1502 compliance confirmed', date: '2025-12-01' },
    { label: 'Import/Export License', status: 'not-applicable', detail: 'Domestic supplier only' },
    { label: 'Anti-Bribery Policy', status: 'compliant', detail: 'FCPA/UK Bribery Act policy acknowledged', date: '2025-01-15' },
    { label: 'GDPR Compliance', status: 'compliant', detail: 'Data processing agreement signed', date: '2025-02-01' },
  ];

  const groups = [
    { title: 'Identity & Registration', items: complianceItems.slice(0, 3) },
    { title: 'Regulatory & Sanctions', items: complianceItems.slice(3, 6) },
    { title: 'Product Compliance', items: complianceItems.slice(6, 9) },
    { title: 'Ethics & Governance', items: complianceItems.slice(9) },
  ];

  const compliantCount = complianceItems.filter(i => i.status === 'compliant').length;
  const total = complianceItems.filter(i => i.status !== 'not-applicable').length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-3 bg-green-50 border border-green-100 rounded-lg">
        <ShieldCheck size={24} className="text-brand-success shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-bold text-brand-text-primary">Compliance Score: {compliantCount}/{total} checks passed</div>
          <div className="w-full bg-green-100 rounded-full h-1.5 mt-1.5">
            <div className="bg-brand-success h-1.5 rounded-full" style={{ width: `${(compliantCount/total)*100}%` }} />
          </div>
        </div>
        <span className="text-lg font-bold text-brand-success">{Math.round((compliantCount/total)*100)}%</span>
      </div>

      {/* Grouped compliance items */}
      {groups.map(group => (
        <div key={group.title} className="space-y-2">
          <h5 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider border-b pb-1">{group.title}</h5>
          <div className="space-y-2">
            {group.items.map(item => (
              <div key={item.label} className="flex items-center gap-3 p-2.5 rounded border border-brand-border text-xs hover:bg-brand-bg-secondary/20">
                <ComplianceIcon status={item.status} />
                <div className="flex-1">
                  <span className="font-semibold text-brand-text-primary">{item.label}</span>
                  {item.detail && <span className="text-brand-text-secondary ml-2">{item.detail}</span>}
                </div>
                {item.date && <span className="text-[10px] text-brand-text-secondary shrink-0">{item.date}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
