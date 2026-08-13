import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  CreditCard,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  SalesQuotation,
  SalesOrder,
  DeliveryOrder,
  SalesInvoice,
  O2CPaymentRecord,
  CustomerLedgerEntry,
  CreditNote,
  DebitNote,
  O2CMetrics
} from '../../types/o2c';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface O2CModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function O2CModule({ onTriggerToast }: O2CModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'quotations' | 'orders' | 'deliveries' | 'invoices' | 'payments' | 'ledger' | 'notes' | 'analytics'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  // Mock Quotations
  const [quotations, setQuotations] = useState<SalesQuotation[]>([
    { id: 'QT-101', code: 'QT-2026-0045', customerName: 'Reliance Retail Chain', quotationDate: '2026-07-20', expiryDate: '2026-08-05', version: 1, subtotal: 156000, discountAmount: 11000, taxAmount: 28000, netTotal: 173000, status: 'Sent' }
  ]);

  // Mock Sales Orders
  const [orders, setOrders] = useState<SalesOrder[]>([
    { id: 'SO-901', code: 'SO-2026-881', quotationRef: 'QT-2026-0040', customerName: 'Reliance Retail Chain', creditLimit: 2500000, currentOutstanding: 450000, orderDate: '2026-07-22', expectedDeliveryDate: '2026-07-25', approvalStatus: 'Approved', orderStatus: 'Confirmed', netAmount: 185000, itemsCount: 4 }
  ]);

  // Mock Deliveries
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([
    { id: 'DO-801', code: 'DO-2026-090', salesOrderCode: 'SO-2026-881', customerName: 'Reliance Retail Chain', warehouseName: 'Delhi Central Depot', vehicleNo: 'DL-01-GA-4589', driverName: 'Satish Kumar', dispatchDate: '2026-07-23', podSigned: true, status: 'Delivered' }
  ]);

  // Mock Invoices
  const [invoices, setInvoices] = useState<SalesInvoice[]>([
    { id: 'INV-701', code: 'SINV-2026-0981', invoiceNumber: 'INV-DEL-2026-0981', salesOrderCode: 'SO-2026-881', deliveryCode: 'DO-2026-090', customerName: 'Reliance Retail Chain', invoiceDate: '2026-07-23', dueDate: '2026-08-22', subtotal: 156780, gstAmount: 28220, totalAmount: 185000, paidAmount: 50000, balanceAmount: 135000, status: 'PartiallyPaid' }
  ]);

  // Mock Payments
  const [payments, setPayments] = useState<O2CPaymentRecord[]>([
    { id: 'PAY-101', receiptNumber: 'REC-2026-0881', paymentDate: '2026-07-23', customerName: 'Reliance Retail Chain', invoiceCode: 'SINV-2026-0981', paymentMode: 'UPI', amount: 50000, referenceTxnNo: 'UPI-TXN-90218842', status: 'Cleared' }
  ]);

  // Mock Ledger
  const [ledger] = useState<CustomerLedgerEntry[]>([
    { id: 'LED-01', entryDate: '2026-07-23', documentNo: 'SINV-2026-0981', type: 'Invoice', debitAmount: 185000, creditAmount: 0, runningBalance: 185000 },
    { id: 'LED-02', entryDate: '2026-07-23', documentNo: 'REC-2026-0881', type: 'Payment', debitAmount: 0, creditAmount: 50000, runningBalance: 135000 }
  ]);

  // Mock Credit Notes
  const [creditNotes] = useState<CreditNote[]>([
    { id: 'CN-01', code: 'CN-2026-012', customerName: 'Reliance Retail Chain', invoiceCode: 'SINV-2026-0981', reason: 'SalesReturn', amount: 4500, issueDate: '2026-07-23', status: 'Approved' }
  ]);

  const handleConvertQuotation = (id: string) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'Converted' } : q));
    onTriggerToast('success', 'Quotation Converted', `Sales Order created from quotation ${id}.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: O2C KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Accounts Receivable" value={formatINR(450000)} badgeText="Credit Checked" badgeVariant="primary" subLabel="Overdue Amount" subValue={formatINR(85000)} />
        <StatCard title="DSO (Days Sales Outstanding)" value="34 Days" badgeText="Healthy Benchmark" badgeVariant="success" subLabel="Industry Target" subValue="30 - 45 Days" />
        <StatCard title="Order Conversion Rate" value="88.5%" badgeText="High Velocity" badgeVariant="info" subLabel="Average Order Value" subValue={formatINR(185000)} />
        <StatCard title="MTD Collection Total" value={formatINR(50000)} badgeText="POD Signed" badgeVariant="warning" subLabel="Collection Efficiency" subValue="94.2%" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Collections Dashboard', icon: TrendingUp },
          { id: 'quotations', label: 'Sales Quotations', icon: FileText },
          { id: 'orders', label: 'Sales Orders', icon: FileSpreadsheet },
          { id: 'deliveries', label: 'Deliveries & POD', icon: Truck },
          { id: 'invoices', label: 'Sales Invoices (GST)', icon: Receipt },
          { id: 'payments', label: 'Payments & Receipts', icon: DollarSign },
          { id: 'ledger', label: 'Customer Ledger', icon: CreditCard },
          { id: 'notes', label: 'Credit / Debit Notes', icon: Layers },
          { id: 'analytics', label: 'O2C Analytics', icon: Sparkles }
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

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Accounts Receivable Aging Buckets</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-green-50 border border-green-100 rounded">
                <span className="text-[10px] font-bold text-brand-success uppercase">0 - 30 Days</span>
                <p className="text-base font-bold text-brand-text-primary mt-1">{formatINR(365000)}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded">
                <span className="text-[10px] font-bold text-brand-warning uppercase">31 - 60 Days</span>
                <p className="text-base font-bold text-brand-text-primary mt-1">{formatINR(55000)}</p>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-100 rounded">
                <span className="text-[10px] font-bold text-orange-700 uppercase">61 - 90 Days</span>
                <p className="text-base font-bold text-brand-text-primary mt-1">{formatINR(30000)}</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded">
                <span className="text-[10px] font-bold text-brand-danger uppercase">90+ Days</span>
                <p className="text-base font-bold text-brand-danger mt-1">{formatINR(0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Customer Credit Limit Checks</h4>
            <div className="p-3 border rounded bg-brand-bg-secondary/30 space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span>Reliance Retail Chain</span>
                <Badge variant="success">Approved</Badge>
              </div>
              <p className="text-brand-text-secondary text-[11px]">Credit Limit: {formatINR(2500000)} | Used: {formatINR(450000)} (18%)</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search quotation code, customer..." />
            <button onClick={() => onTriggerToast('info', 'Sales Quotation', 'Opening quotation wizard...')} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Create Quotation
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Quotation Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Quotation Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Net Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {quotations.map(q => (
                  <tr key={q.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{q.code}</td>
                    <td className="p-3 font-semibold">{q.customerName}</td>
                    <td className="p-3 text-brand-text-secondary">{q.quotationDate}</td>
                    <td className="p-3 text-brand-text-secondary">{q.expiryDate}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(q.netTotal)}</td>
                    <td className="p-3 text-center"><Badge variant={q.status === 'Converted' ? 'success' : 'primary'}>{q.status}</Badge></td>
                    <td className="p-3 text-right">
                      {q.status !== 'Converted' && (
                        <button onClick={() => handleConvertQuotation(q.id)} className="px-2 py-1 bg-brand-success text-white text-[11px] font-semibold rounded hover:bg-green-700 cursor-pointer">
                          Convert to SO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SALES INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search invoice number, customer..." />
            <button onClick={() => onTriggerToast('success', 'Sales Invoice', 'Generating tax invoice...')} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Generate GST Invoice
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{inv.invoiceNumber}</td>
                    <td className="p-3 font-semibold">{inv.customerName}</td>
                    <td className="p-3 text-brand-text-secondary">{inv.invoiceDate}</td>
                    <td className="p-3 text-brand-text-secondary">{inv.dueDate}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(inv.totalAmount)}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-danger">{formatINR(inv.balanceAmount)}</td>
                    <td className="p-3 text-center"><Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>{inv.status}</Badge></td>
                    <td className="p-3 text-right">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer">
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT-READY GST INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl-flat">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">TAX INVOICE: {selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-brand-text-secondary">Official GST Compliant Billing Document</p>
              </div>
              <Badge variant="success">{selectedInvoice.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="block text-brand-text-secondary uppercase text-[10px]">Billed To</strong>
                <p className="font-bold text-brand-text-primary">{selectedInvoice.customerName}</p>
                <p>GSTIN: 07AAACH1101A1Z8</p>
              </div>
              <div className="text-right">
                <strong className="block text-brand-text-secondary uppercase text-[10px]">Invoice Summary</strong>
                <p>Subtotal: {formatINR(selectedInvoice.subtotal)}</p>
                <p>GST (18%): {formatINR(selectedInvoice.gstAmount)}</p>
                <p className="font-bold text-brand-primary">Net Payable: {formatINR(selectedInvoice.totalAmount)}</p>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-end gap-2">
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Close</button>
              <button onClick={() => { setSelectedInvoice(null); onTriggerToast('success', 'GST Invoice Printed', 'Generated PDF print copy.'); }} className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer flex items-center gap-1 shadow-sm">
                <Printer size={13} /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
