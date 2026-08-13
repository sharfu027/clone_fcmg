import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
  Sliders,
  Landmark,
  PieChart
} from 'lucide-react';
import {
  ArReceivableRecord,
  ApPayableRecord,
  PaymentAllocation,
  VendorLedgerEntry,
  BankReconciliationStatus,
  ArApMetrics
} from '../../types/finance';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface FinanceModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function FinanceModule({ onTriggerToast }: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ar' | 'ap' | 'allocation' | 'vendor-ledger' | 'aging' | 'bank' | 'cashflow'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Mock AR Receivables
  const [receivables, setReceivables] = useState<ArReceivableRecord[]>([
    { id: 'AR-101', invoiceCode: 'SINV-2026-0981', customerName: 'Reliance Retail Chain', invoiceDate: '2026-07-23', dueDate: '2026-08-22', originalAmount: 185000, allocatedAmount: 50000, balanceDue: 135000, creditLimit: 2500000, status: 'Current' }
  ]);

  // Mock AP Payables
  const [payables, setPayables] = useState<ApPayableRecord[]>([
    { id: 'AP-201', billNumber: 'PINV-2026-045', vendorName: 'Hindustan Unilever Ltd', billDate: '2026-07-22', dueDate: '2026-08-21', originalAmount: 1455000, paidAmount: 0, balancePayable: 1455000, paymentTerms: 'Net 30', status: 'Pending' }
  ]);

  // Mock Vendor Ledger
  const [vendorLedger] = useState<VendorLedgerEntry[]>([
    { id: 'VL-01', entryDate: '2026-07-22', documentNo: 'PINV-2026-045', type: 'PurchaseBill', debitAmount: 0, creditAmount: 1455000, runningBalance: 1455000 }
  ]);

  // Mock Bank Reconciliation
  const [bankStatus] = useState<BankReconciliationStatus[]>([
    { bankAccountId: 'BNK-01', accountName: 'HDFC Corporate Operating Account', bankName: 'HDFC Bank Ltd', bookBalance: 4250000, statementBalance: 4250000, unmatchedDeposits: 0, unmatchedWithdrawals: 0, status: 'Reconciled' }
  ]);

  const handleProcessVendorPayment = () => {
    setPayables(prev => prev.map(p => p.id === 'AP-201' ? { ...p, paidAmount: 455000, balancePayable: 1000000 } : p));
    setIsPayModalOpen(false);
    onTriggerToast('success', 'Vendor Payment Processed', 'NEFT payment voucher generated for HUL.');
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: FINANCE AR/AP KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Receivables (AR)" value={formatINR(450000)} badgeText="DSO: 34 Days" badgeVariant="primary" subLabel="Overdue AR" subValue={formatINR(85000)} />
        <StatCard title="Total Payables (AP)" value={formatINR(1455000)} badgeText="DPO: 28 Days" badgeVariant="warning" subLabel="Overdue AP" subValue={formatINR(0)} />
        <StatCard title="Net 30-Day Cash Forecast" value={formatINR(2795000)} badgeText="Net Positive" badgeVariant="success" subLabel="Bank Book Balance" subValue={formatINR(4250000)} />
        <StatCard title="Bank Reconciliation" value="100% Reconciled" badgeText="HDFC Operating" badgeVariant="info" subLabel="Unmatched Txns" subValue="0" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Financial Overview', icon: TrendingUp },
          { id: 'ar', label: 'Customer Receivables (AR)', icon: DollarSign },
          { id: 'ap', label: 'Vendor Payables (AP)', icon: Building },
          { id: 'allocation', label: 'Payment Allocation Engine', icon: Sliders },
          { id: 'vendor-ledger', label: 'Vendor Sub-Ledger', icon: FileText },
          { id: 'aging', label: '5-Tier Aging Analysis', icon: PieChart },
          { id: 'bank', label: 'Bank Reconciliation', icon: Landmark },
          { id: 'cashflow', label: 'Cash Flow Projection', icon: Sparkles }
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
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">5-Tier Aging Analysis Comparison</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 bg-green-50 border rounded"><span className="text-[10px] font-bold text-brand-success">0-30 Days</span><p className="font-bold mt-1">{formatINR(365000)}</p></div>
              <div className="p-2.5 bg-amber-50 border rounded"><span className="text-[10px] font-bold text-brand-warning">31-60 Days</span><p className="font-bold mt-1">{formatINR(55000)}</p></div>
              <div className="p-2.5 bg-orange-50 border rounded"><span className="text-[10px] font-bold text-orange-700">61-90 Days</span><p className="font-bold mt-1">{formatINR(30000)}</p></div>
              <div className="p-2.5 bg-red-50 border rounded"><span className="text-[10px] font-bold text-brand-danger">91-180 Days</span><p className="font-bold mt-1">{formatINR(0)}</p></div>
              <div className="p-2.5 bg-purple-50 border rounded"><span className="text-[10px] font-bold text-purple-700">180+ Days</span><p className="font-bold mt-1">{formatINR(0)}</p></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Bank Account Sync</h4>
            {bankStatus.map(b => (
              <div key={b.bankAccountId} className="p-3 border rounded bg-brand-bg-secondary/30 text-xs space-y-1">
                <div className="flex justify-between font-bold"><span>{b.bankName}</span><Badge variant="success">{b.status}</Badge></div>
                <p className="text-brand-text-secondary text-[11px]">Book Balance: {formatINR(b.bookBalance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR PAYABLES AP */}
      {activeTab === 'ap' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vendor bill, supplier..." />
            <button onClick={() => setIsPayModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Process Supplier Payment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Bill Number</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Bill Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Bill Amount</th>
                  <th className="p-3 text-right">Balance Payable</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {payables.map(p => (
                  <tr key={p.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{p.billNumber}</td>
                    <td className="p-3 font-semibold">{p.vendorName}</td>
                    <td className="p-3 text-brand-text-secondary">{p.billDate}</td>
                    <td className="p-3 text-brand-text-secondary">{p.dueDate}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(p.originalAmount)}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-warning">{formatINR(p.balancePayable)}</td>
                    <td className="p-3 text-center"><Badge variant="warning">{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PROCESS SUPPLIER PAYMENT */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Process Supplier Payment Voucher</h3>
            <p className="text-xs text-brand-text-secondary">Release NEFT / RTGS payment for outstanding purchase bill.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Supplier</label>
                <input type="text" defaultValue="Hindustan Unilever Ltd" className="w-full p-2 border rounded border-brand-border" />
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Payment Amount (₹)</label>
                <input type="number" defaultValue="455000" className="w-full p-2 border rounded border-brand-border" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleProcessVendorPayment} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Process Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
