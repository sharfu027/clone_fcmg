import React, { useState } from 'react';
import {
  Undo2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  ShieldAlert,
  Layers,
  DollarSign,
  Sparkles,
  TrendingUp,
  PackageX,
  FileCheck
} from 'lucide-react';
import {
  SalesReturnRequest,
  PurchaseReturnRequest,
  ReturnInspection,
  ReplacementOrder,
  RefundRecord,
  ReturnMetrics
} from '../../types/returns';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface ReturnsModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function ReturnsModule({ onTriggerToast }: ReturnsModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sales' | 'purchase' | 'inspection' | 'replacements' | 'refunds' | 'analytics'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);

  // Mock Sales Returns
  const [salesReturns, setSalesReturns] = useState<SalesReturnRequest[]>([
    { id: 'RMA-101', rmaNumber: 'RMA-2026-0081', invoiceCode: 'SINV-2026-0981', customerName: 'Reliance Retail Chain', requestDate: '2026-07-23', reason: 'PackagingDamage', totalReturnAmount: 4500, status: 'Inspected', itemsCount: 2 }
  ]);

  // Mock Purchase Returns
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnRequest[]>([
    { id: 'PR-901', code: 'VR-2026-002', grnCode: 'GRN-2026-085', vendorName: 'Britannia Industries', returnDate: '2026-07-18', reason: 'PackagingDamage', totalAmount: 24500, creditNoteRef: 'CN-BRIT-901', status: 'CreditReceived' }
  ]);

  // Mock Inspections
  const [inspections, setInspections] = useState<ReturnInspection[]>([
    { id: 'INS-01', rmaNumber: 'RMA-2026-0081', productName: 'Surf Excel Quick Wash 1kg', batchNumber: 'BAT-2026-X88', quantityReturned: 10, qualityGrade: 'GradeB_Discounted', disposition: 'RestockInventory', inspectorName: 'Deepak Sharma', inspectionDate: '2026-07-23', remarks: 'Outer carton crushed in transit; inner pouch intact.' }
  ]);

  // Mock Replacements
  const [replacements, setReplacements] = useState<ReplacementOrder[]>([
    { id: 'REP-101', replacementCode: 'SO-REP-2026-09', originalRmaNumber: 'RMA-2026-0081', customerName: 'Reliance Retail Chain', productName: 'Surf Excel Quick Wash 1kg', quantity: 10, status: 'Dispatched' }
  ]);

  // Mock Refunds
  const [refunds, setRefunds] = useState<RefundRecord[]>([
    { id: 'REF-01', refundCode: 'REF-2026-042', customerName: 'Reliance Retail Chain', rmaNumber: 'RMA-2026-0081', refundAmount: 4500, paymentMode: 'CreditNote', refundDate: '2026-07-23', status: 'Processed' }
  ]);

  const handleCreateRMA = () => {
    const newRma: SalesReturnRequest = {
      id: `RMA-${Math.floor(100 + Math.random() * 900)}`,
      rmaNumber: `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceCode: 'SINV-2026-0981',
      customerName: 'Metro Cash & Carry',
      requestDate: new Date().toISOString().split('T')[0],
      reason: 'QualityDefect',
      totalReturnAmount: 3200,
      status: 'Requested',
      itemsCount: 1
    };
    setSalesReturns([newRma, ...salesReturns]);
    setIsRmaModalOpen(false);
    onTriggerToast('success', 'RMA Authorization Generated', `RMA ${newRma.rmaNumber} authorized for customer pickup.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: RETURNS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Return Rate" value="1.24%" badgeText="Low Defect Rate" badgeVariant="success" subLabel="Target Threshold" subValue="< 2.0%" />
        <StatCard title="Open RMA Requests" value={salesReturns.filter(r => r.status === 'Requested').length} badgeText="Pickup Scheduled" badgeVariant="warning" subLabel="Active RMAs" subValue={`${salesReturns.length} RMAs`} />
        <StatCard title="Restocked Inventory Value" value={formatINR(4500)} badgeText="Grade B Recovered" badgeVariant="info" subLabel="Recovery Rate" subValue="92.5%" />
        <StatCard title="Vendor Credit Claims" value={formatINR(24500)} badgeText="CN Issued" badgeVariant="primary" subLabel="Supplier Claim" subValue="Britannia Industries" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Returns Overview', icon: TrendingUp },
          { id: 'sales', label: 'Customer Returns (RMA)', icon: Undo2 },
          { id: 'purchase', label: 'Supplier Returns', icon: Building },
          { id: 'inspection', label: 'Quality Inspection & Disposition', icon: FileCheck },
          { id: 'replacements', label: 'Replacement Orders', icon: Truck },
          { id: 'refunds', label: 'Refunds & Credit Notes', icon: DollarSign },
          { id: 'analytics', label: 'Return Analytics', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isActive ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Quality Inspection & Disposition Pipeline</h4>
            <div className="space-y-3 text-xs">
              {inspections.map(ins => (
                <div key={ins.id} className="p-3 border rounded bg-brand-bg-secondary/30 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-primary">{ins.rmaNumber} ({ins.productName})</span>
                    <Badge variant="success">{ins.disposition}</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">Inspector: {ins.inspectorName} | Grade: <strong>{ins.qualityGrade}</strong></p>
                  <p className="text-brand-text-secondary italic">"{ins.remarks}"</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Primary Damage Categories</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 border rounded bg-brand-bg-secondary/40 flex justify-between">
                <span>Transit Outer Packaging Damage</span>
                <span className="font-bold text-brand-primary">65%</span>
              </div>
              <div className="p-2 border rounded bg-brand-bg-secondary/40 flex justify-between">
                <span>Expired Product Shortage</span>
                <span className="font-bold text-brand-warning">25%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER RETURNS RMA */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search RMA number, customer..." />
            <button onClick={() => setIsRmaModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Authorize RMA Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">RMA Number</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Request Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Return Amount</th>
                  <th className="p-3 text-center">RMA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {salesReturns.map(rma => (
                  <tr key={rma.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{rma.rmaNumber}</td>
                    <td className="p-3 font-mono text-brand-text-secondary">{rma.invoiceCode}</td>
                    <td className="p-3 font-semibold">{rma.customerName}</td>
                    <td className="p-3 text-brand-text-secondary">{rma.requestDate}</td>
                    <td className="p-3">{rma.reason}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-danger">{formatINR(rma.totalReturnAmount)}</td>
                    <td className="p-3 text-center"><Badge variant="success">{rma.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL RMA AUTHORIZATION */}
      {isRmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Authorize Sales Return (RMA)</h3>
            <p className="text-xs text-brand-text-secondary">Generate Return Merchandise Authorization number for pickup.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Customer Outlet</label>
                <input type="text" defaultValue="Metro Cash & Carry" className="w-full p-2 border rounded border-brand-border" />
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Return Reason</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white">
                  <option value="PackagingDamage">Packaging Transit Damage</option>
                  <option value="QualityDefect">Quality Defect</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsRmaModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleCreateRMA} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Authorize RMA</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
