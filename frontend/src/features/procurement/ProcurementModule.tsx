import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SupplierManagementModule from '../supplier/SupplierManagementModule';
import { PurchaseRequisitionModule } from './components/PurchaseRequisitionModule';
import { RfqModule } from './components/RfqModule';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  PackageCheck,
  Building,
  FileText,
  DollarSign,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Printer,
  Sparkles,
  TrendingUp,
  Clock,
  CheckSquare
} from 'lucide-react';
import {
  Vendor,
  PurchaseRequisition,
  Rfq,
  PurchaseOrder,
  GRN,
  PurchaseInvoice,
  VendorReturn,
  ProcurementMetrics
} from '../../types/procurement';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { formatINR, formatDate } from '../../utils/formatters';

interface ProcurementModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function ProcurementModule({ onTriggerToast }: ProcurementModuleProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Mock Vendors
  const [vendors] = useState<Vendor[]>([
    { id: 'VND-01', code: 'VND-HUL', name: 'Hindustan Unilever Ltd', category: 'FMCG Consumables', rating: 4.8, gstNo: '07AAACH1101A1Z8', panNo: 'AAACH1101A', contactPerson: 'Rajesh Malhotra', phone: '+91 98110 44210', email: 'orders@hul-dist.com', address: 'Plot 45, Okhla Phase 3, New Delhi', creditLimit: 2500000, paymentTerms: 'Net 30', bankDetails: { bankName: 'HDFC Bank', accountNumber: '502000124587', ifscCode: 'HDFC0000120', branchName: 'Okhla Delhi' }, status: 'Active' },
    { id: 'VND-02', code: 'VND-BRIT', name: 'Britannia Industries', category: 'Biscuits & Bakery', rating: 4.6, gstNo: '07AABCB2202B1Z4', panNo: 'AABCB2202B', contactPerson: 'Priya Narang', phone: '+91 98711 22334', email: 'sales@britannia.com', address: 'Sector 62, Noida, UP', creditLimit: 1800000, paymentTerms: 'Net 15', bankDetails: { bankName: 'ICICI Bank', accountNumber: '000405012478', ifscCode: 'ICIC0000004', branchName: 'Noida' }, status: 'Active' }
  ]);

  // Mock Requisitions
  const [requisitions] = useState<PurchaseRequisition[]>([
    { id: 'PR-901', code: 'PR-2026-081', departmentId: 'DEP-01', departmentName: 'Central Warehouse Logistics', requestedBy: 'Karan Anand', priority: 'High', requiredDate: '2026-07-28', status: 'Approved', itemsCount: 4, totalAmount: 450000, notes: 'Restock Surf Excel & Rin Detergent' },
    { id: 'PR-902', code: 'PR-2026-082', departmentId: 'DEP-02', departmentName: 'Retail Supply Chain', requestedBy: 'Amit Sharma', priority: 'Critical', requiredDate: '2026-07-25', status: 'Submitted', itemsCount: 2, totalAmount: 180000, notes: 'Emergency shortage of Dove Shampoo' }
  ]);

  // Mock RFQs
  const [rfqs] = useState<any[]>([
    { id: 'RFQ-10', code: 'RFQ-2026-04', title: 'Q3 Detergent Sourcing RFQs', requisitionCode: 'PR-2026-081', quoteDeadline: '2026-07-26', status: 'Evaluated', quotes: [{ vendorId: 'VND-01', vendorName: 'Hindustan Unilever Ltd', quoteAmount: 420000, deliveryDays: 3, validUntil: '2026-08-10', selected: true }] }
  ]);

  // Mock Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    { id: 'PO-901', code: 'PO-2026-0012', vendorId: 'VND-01', vendorName: 'Hindustan Unilever Ltd', poDate: '2026-07-20', expectedDeliveryDate: '2026-07-25', approvalStatus: 'Approved', orderStatus: 'Ordered', totalAmount: 1450000, itemsCount: 12, items: [{ id: 'POI-1', productId: 'PRD-901', productCode: 'PRD-901', productName: 'Surf Excel Quick Wash 1kg', orderedQty: 500, receivedQty: 500, unitPrice: 185, totalAmount: 92500 }] },
    { id: 'PO-902', code: 'PO-2026-0013', vendorId: 'VND-02', vendorName: 'Britannia Industries', poDate: '2026-07-21', expectedDeliveryDate: '2026-07-26', approvalStatus: 'Pending Approval', orderStatus: 'Draft', totalAmount: 380000, itemsCount: 5 }
  ]);

  // Mock Goods Receipt Notes (GRN)
  const [grns] = useState<GRN[]>([
    { id: 'GRN-101', code: 'GRN-2026-098', poCode: 'PO-2026-0012', vendorName: 'Hindustan Unilever Ltd', warehouseName: 'Delhi Central Depot', receiptDate: '2026-07-22', receivedBy: 'Aman Deep', status: 'Completed', items: [{ id: 'GI-1', productId: 'PRD-901', productCode: 'PRD-901', productName: 'Surf Excel Quick Wash 1kg', orderedQty: 500, receivedQty: 500, damagedQty: 0, batchNumber: 'BAT-2026-X88', expiryDate: '2027-06-30' }] }
  ]);

  // Mock Purchase Invoices
  const [invoices] = useState<PurchaseInvoice[]>([
    { id: 'INV-501', code: 'PINV-2026-045', invoiceNumber: 'HUL-DEL-9821', poCode: 'PO-2026-0012', grnCode: 'GRN-2026-098', vendorName: 'Hindustan Unilever Ltd', invoiceDate: '2026-07-22', subtotal: 1228813, taxAmount: 221187, freightAmount: 5000, netAmount: 1455000, matchingStatus: 'Matched', status: 'Unpaid' }
  ]);

  // Mock Purchase Returns
  const [returns] = useState<VendorReturn[]>([
    { id: 'RET-01', code: 'VR-2026-002', vendorName: 'Britannia Industries', grnCode: 'GRN-2026-085', returnDate: '2026-07-18', reason: 'Packaging Seal Damaged in Transit', returnAmount: 24500, creditNoteRef: 'CN-BRIT-901', status: 'Credit Note Issued' }
  ]);

  const handleApprovePO = (id: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        return { ...po, approvalStatus: 'Approved', orderStatus: 'Ordered' };
      }
      return po;
    }));
    onTriggerToast('success', 'Purchase Order Approved', `PO ${id} was signed and dispatched to supplier.`);
  };

  // Determine active view section from route path
  const isSuppliersView = currentPath.includes('/suppliers');
  const isRequisitionsView = currentPath.includes('/requisition');
  const isRfqsView = currentPath.includes('/rfq');
  const isQuotationsView = currentPath.includes('/quotations');
  const isOrdersView = currentPath.includes('/orders');
  const isGrnView = currentPath.includes('/grn');
  const isInvoicesView = currentPath.includes('/invoices');
  const isReturnsView = currentPath.includes('/returns');
  const isDashboardView = !isSuppliersView && !isRequisitionsView && !isRfqsView && !isQuotationsView && !isOrdersView && !isGrnView && !isInvoicesView && !isReturnsView;

  return (
    <div className="space-y-6">

      {/* 1. PROCUREMENT DASHBOARD VIEW */}
      {isDashboardView && (
        <>
          {/* PAGE HEADER */}
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Procurement Dashboard</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Monitor procurement activity, supplier performance, purchasing workflow, and pending actions.
            </p>
          </div>

          {/* KPI CARDS (Clickable Shortcuts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => navigate('/procurement/requisition')} className="cursor-pointer transition hover:scale-[1.01]">
              <StatCard title="Open Requisitions" value={requisitions.filter(r => r.status !== 'Approved').length} badgeText="Department Demand" badgeVariant="warning" subLabel="Total Active PRs" subValue={`${requisitions.length} PRs`} />
            </div>
            <div onClick={() => navigate('/procurement/orders')} className="cursor-pointer transition hover:scale-[1.01]">
              <StatCard title="Pending PO Approvals" value={purchaseOrders.filter(p => p.approvalStatus === 'Pending Approval').length} badgeText="Requires Signature" badgeVariant="danger" subLabel="Open Orders Value" subValue={formatINR(380000)} />
            </div>
            <div onClick={() => navigate('/procurement/grn')} className="cursor-pointer transition hover:scale-[1.01]">
              <StatCard title="Goods Receipts" value={grns.length} badgeText="Quality Verified" badgeVariant="success" subLabel="Inspection Pass Rate" subValue="100%" />
            </div>
            <div onClick={() => navigate('/procurement/invoices')} className="cursor-pointer transition hover:scale-[1.01]">
              <StatCard title="MTD Procurement Spend" value={formatINR(1455000)} badgeText="Verified Invoices" badgeVariant="info" subLabel="Avg Supplier Rating" subValue="4.7 ★" />
            </div>
          </div>

          {/* WORKFLOW SUMMARY */}
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Procurement Workflow Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div onClick={() => navigate('/procurement/requisition')} className="p-3 bg-blue-50/50 border border-blue-100 hover:border-brand-primary rounded cursor-pointer transition">
                <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Requisitions</span>
                <p className="text-lg font-bold text-brand-primary">{requisitions.length}</p>
              </div>
              <div onClick={() => navigate('/procurement/rfq')} className="p-3 bg-amber-50/50 border border-amber-100 hover:border-brand-warning rounded cursor-pointer transition">
                <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Active RFQs</span>
                <p className="text-lg font-bold text-brand-warning">{rfqs.length}</p>
              </div>
              <div onClick={() => navigate('/procurement/orders')} className="p-3 bg-green-50/50 border border-green-100 hover:border-brand-success rounded cursor-pointer transition">
                <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Purchase Orders</span>
                <p className="text-lg font-bold text-brand-success">{purchaseOrders.length}</p>
              </div>
              <div onClick={() => navigate('/procurement/invoices')} className="p-3 bg-purple-50/50 border border-purple-100 hover:border-purple-600 rounded cursor-pointer transition">
                <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Pending Invoices</span>
                <p className="text-lg font-bold text-purple-700">{invoices.length}</p>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID: TOP RATED SUPPLIERS & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TOP RATED SUPPLIERS */}
            <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm lg:col-span-2 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Top Rated FMCG Suppliers</h4>
                <button onClick={() => navigate('/procurement/suppliers')} className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer">
                  View All Suppliers
                </button>
              </div>
              <div className="space-y-2">
                {vendors.map(v => (
                  <div key={v.id} onClick={() => navigate('/procurement/suppliers')} className="p-3 border rounded bg-brand-bg-secondary/40 hover:bg-brand-bg-secondary/70 transition flex justify-between items-center text-xs cursor-pointer">
                    <div>
                      <p className="font-bold text-brand-text-primary">{v.name}</p>
                      <p className="text-[10px] text-brand-text-secondary">{v.category} • GSTIN: {v.gstNo}</p>
                    </div>
                    <Badge variant="success">{v.rating} ★</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS (ACTIONS ONLY) */}
            <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-4">Quick Actions</h4>
                <div className="space-y-2.5">
                  <button onClick={() => navigate('/procurement/suppliers')} className="w-full py-2.5 px-3 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs">
                    <Plus size={14} /> Create Supplier
                  </button>
                  <button onClick={() => { navigate('/procurement/requisition'); onTriggerToast('info', 'Create Requisition', 'Opening Purchase Requisitions creation modal...'); }} className="w-full py-2.5 px-3 border border-brand-border text-brand-text-primary text-xs font-semibold rounded-md hover:bg-brand-bg-secondary transition cursor-pointer flex items-center justify-center gap-2">
                    <Plus size={14} /> Create Purchase Requisition
                  </button>
                  <button onClick={() => { navigate('/procurement/rfq'); onTriggerToast('info', 'Create RFQ', 'Opening RFQ creation wizard...'); }} className="w-full py-2.5 px-3 border border-brand-border text-brand-text-primary text-xs font-semibold rounded-md hover:bg-brand-bg-secondary transition cursor-pointer flex items-center justify-center gap-2">
                    <Plus size={14} /> Create RFQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUPPLIER MANAGEMENT VIEW */}
      {isSuppliersView && (
        <SupplierManagementModule onTriggerToast={onTriggerToast} />
      )}

      {/* 2. PURCHASE REQUISITIONS VIEW */}
      {isRequisitionsView && (
        <PurchaseRequisitionModule onTriggerToast={onTriggerToast} />
      )}

      {/* 3. RFQS VIEW */}
      {isRfqsView && (
        <RfqModule onTriggerToast={onTriggerToast} />
      )}

      {/* 4. SUPPLIER QUOTATIONS VIEW */}
      {isQuotationsView && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Supplier Quotations</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Evaluate received supplier quotes and pricing.</p>
          </div>
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search supplier quotation..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">RFQ Code</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">Quote Amount</th>
                    <th className="p-3 text-center">Delivery Days</th>
                    <th className="p-3">Valid Until</th>
                    <th className="p-3 text-center">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {rfqs.flatMap(rfq => rfq.quotes.map((q, idx) => (
                    <tr key={`${rfq.id}-${idx}`} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono font-bold text-brand-primary">{rfq.code}</td>
                      <td className="p-3 font-semibold">{q.vendorName}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatINR(q.quoteAmount)}</td>
                      <td className="p-3 text-center">{q.deliveryDays} Days</td>
                      <td className="p-3 text-brand-text-secondary">{q.validUntil}</td>
                      <td className="p-3 text-center"><Badge variant={q.selected ? 'success' : 'neutral'}>{q.selected ? 'Selected' : 'Under Review'}</Badge></td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. PURCHASE ORDERS VIEW */}
      {isOrdersView && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Purchase Orders</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Issue and track purchase orders to suppliers.</p>
          </div>
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search PO code, supplier..." />
              <button onClick={() => onTriggerToast('success', 'Purchase Order', 'Creating PO draft...')} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
                <Plus size={14} /> Create Purchase Order
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">PO Code</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">PO Date</th>
                    <th className="p-3">Expected Delivery</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Approval</th>
                    <th className="p-3 text-center">Order Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono font-bold text-brand-primary">{po.code}</td>
                      <td className="p-3 font-semibold">{po.vendorName}</td>
                      <td className="p-3 text-brand-text-secondary">{po.poDate}</td>
                      <td className="p-3 text-brand-text-secondary">{po.expectedDeliveryDate}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatINR(po.totalAmount)}</td>
                      <td className="p-3 text-center"><Badge variant={po.approvalStatus === 'Approved' ? 'success' : 'warning'}>{po.approvalStatus}</Badge></td>
                      <td className="p-3 text-center"><Badge variant={po.orderStatus === 'Ordered' ? 'primary' : 'neutral'}>{po.orderStatus}</Badge></td>
                      <td className="p-3 text-right space-x-1">
                        {po.approvalStatus !== 'Approved' && (
                          <button onClick={() => handleApprovePO(po.id)} className="p-1 border rounded text-brand-success hover:bg-green-50 cursor-pointer" title="Approve PO Signature">
                            <CheckSquare size={13} />
                          </button>
                        )}
                        <button onClick={() => setSelectedPO(po)} className="p-1 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer" title="Print PO Document">
                          <Printer size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. GOODS RECEIPTS VIEW */}
      {isGrnView && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Goods Receipts</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Warehouse inbound goods receipts and quality inspections.</p>
          </div>
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search GRN code, supplier..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">GRN Code</th>
                    <th className="p-3">PO Code</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Warehouse</th>
                    <th className="p-3">Receipt Date</th>
                    <th className="p-3">Received By</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {grns.map(grn => (
                    <tr key={grn.id} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono font-bold text-brand-primary">{grn.code}</td>
                      <td className="p-3 font-mono text-brand-text-secondary">{grn.poCode}</td>
                      <td className="p-3 font-semibold">{grn.vendorName}</td>
                      <td className="p-3 text-brand-text-secondary">{grn.warehouseName}</td>
                      <td className="p-3 text-brand-text-secondary">{grn.receiptDate}</td>
                      <td className="p-3 text-brand-text-secondary">{grn.receivedBy}</td>
                      <td className="p-3 text-center"><Badge variant={grn.status === 'Completed' ? 'success' : 'primary'}>{grn.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. PURCHASE INVOICES VIEW */}
      {isInvoicesView && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Purchase Invoices</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Supplier invoices and 3-way matching records.</p>
          </div>
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search invoice code, supplier..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">Invoice Code</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">PO / GRN Ref</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3 text-right">Net Amount</th>
                    <th className="p-3 text-center">Matching</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono font-bold text-brand-primary">{inv.code}</td>
                      <td className="p-3 font-semibold">{inv.invoiceNumber}</td>
                      <td className="p-3 font-mono text-brand-text-secondary">{inv.poCode} / {inv.grnCode}</td>
                      <td className="p-3 font-semibold">{inv.vendorName}</td>
                      <td className="p-3 text-brand-text-secondary">{inv.invoiceDate}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatINR(inv.netAmount)}</td>
                      <td className="p-3 text-center"><Badge variant={inv.matchingStatus === 'Matched' ? 'success' : 'warning'}>{inv.matchingStatus}</Badge></td>
                      <td className="p-3 text-center"><Badge variant={inv.status === 'Paid' ? 'success' : 'neutral'}>{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. PURCHASE RETURNS VIEW */}
      {isReturnsView && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Purchase Returns</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">Return to vendor (RTV) and credit note tracking.</p>
          </div>
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search return code, supplier..." />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">Return Code</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">GRN Reference</th>
                    <th className="p-3">Return Date</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3 text-right">Return Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {returns.map(ret => (
                    <tr key={ret.id} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono font-bold text-brand-primary">{ret.code}</td>
                      <td className="p-3 font-semibold">{ret.vendorName}</td>
                      <td className="p-3 font-mono text-brand-text-secondary">{ret.grnCode}</td>
                      <td className="p-3 text-brand-text-secondary">{ret.returnDate}</td>
                      <td className="p-3 text-brand-text-secondary">{ret.reason}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatINR(ret.returnAmount)}</td>
                      <td className="p-3 text-center"><Badge variant={ret.status === 'Credit Note Issued' ? 'success' : 'warning'}>{ret.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-READY PO MODAL */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl-flat animate-fade-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">PURCHASE ORDER: {selectedPO.code}</h3>
                <p className="text-xs text-brand-text-secondary">Official Procurement Document for Supplier</p>
              </div>
              <Badge variant="success">{selectedPO.approvalStatus}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="block text-brand-text-secondary uppercase text-[10px]">Supplier</strong>
                <p className="font-bold text-brand-text-primary">{selectedPO.vendorName}</p>
                <p>Payment Terms: Net 30</p>
              </div>
              <div className="text-right">
                <strong className="block text-brand-text-secondary uppercase text-[10px]">Order Details</strong>
                <p>PO Date: {selectedPO.poDate}</p>
                <p>Delivery Due: {selectedPO.expectedDeliveryDate}</p>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-sm">Total PO Value: {formatINR(selectedPO.totalAmount)}</span>
              <div className="flex gap-2">
                <button onClick={() => setSelectedPO(null)} className="px-4 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Close</button>
                <button onClick={() => { setSelectedPO(null); onTriggerToast('success', 'PO Sent to Printer', 'Exported PDF layout for procurement records.'); }} className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer flex items-center gap-1 shadow-sm">
                  <Printer size={13} /> Print Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
