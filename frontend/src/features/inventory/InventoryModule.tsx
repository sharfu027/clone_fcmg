import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Layers,
  History,
  AlertTriangle,
  Calendar,
  Barcode,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  CheckCircle2,
  PieChart,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  StockItem,
  BatchInfo,
  SerialNumber,
  StockMovement,
  StockReservation,
  PhysicalCountSheet,
  InventoryAdjustment,
  ReorderRule,
  InventoryAnalytics,
  InventoryMetrics
} from '../../types/inventory';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface InventoryModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function InventoryModule({ onTriggerToast }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'stock' | 'batches' | 'serials' | 'movements' | 'reservations' | 'counts' | 'adjustments' | 'reorder' | 'abc'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Mock Stock Master
  const [stockItems, setStockItems] = useState<StockItem[]>([
    { id: 'STK-01', productId: 'PRD-901', productCode: 'PRD-901', productName: 'Surf Excel Quick Wash 1kg', categoryName: 'Detergents', unit: 'Pack', warehouseName: 'Delhi Central Depot', binCode: 'A-01-R02-S3-B04', availableQty: 1250, reservedQty: 150, allocatedQty: 100, damagedQty: 5, inTransitQty: 200, totalQty: 1705, unitCost: 145, totalValuation: 247225, status: 'InStock' },
    { id: 'STK-02', productId: 'PRD-904', productCode: 'PRD-904', productName: 'Dove Hair Fall Rescue Shampoo 650ml', categoryName: 'Personal Care', unit: 'Bottle', warehouseName: 'Gurgaon Express Hub', binCode: 'B-02-R01-S1-B01', availableQty: 18, reservedQty: 10, allocatedQty: 0, damagedQty: 0, inTransitQty: 50, totalQty: 78, unitCost: 380, totalValuation: 29640, status: 'LowStock' }
  ]);

  // Mock Batches
  const [batches, setBatches] = useState<BatchInfo[]>([
    { id: 'BAT-01', batchNumber: 'BAT-2026-X88', productId: 'PRD-901', productName: 'Surf Excel Quick Wash 1kg', mfgDate: '2026-06-01', expiryDate: '2027-05-31', shelfLifeDays: 365, availableQty: 1250, status: 'Active' },
    { id: 'BAT-02', batchNumber: 'BAT-2025-M12', productId: 'PRD-904', productName: 'Dove Hair Fall Rescue Shampoo 650ml', mfgDate: '2025-08-10', expiryDate: '2026-08-10', shelfLifeDays: 365, availableQty: 18, status: 'NearExpiry' }
  ]);

  // Mock Movements
  const [movements, setMovements] = useState<StockMovement[]>([
    { id: 'MOV-101', code: 'SM-2026-9081', timestamp: '2026-07-23 14:30', movementType: 'PurchaseReceipt', productName: 'Surf Excel Quick Wash 1kg', fromLocation: 'Supplier (HUL)', toLocation: 'Delhi Depot (A-01-R02)', quantity: 500, referenceDoc: 'GRN-2026-098', performedBy: 'Aman Deep' }
  ]);

  // Mock Reservations
  const [reservations, setReservations] = useState<StockReservation[]>([
    { id: 'RES-01', code: 'RES-2026-044', type: 'SalesOrder', referenceCode: 'SO-2026-881', productName: 'Surf Excel Quick Wash 1kg', reservedQty: 150, priority: 'High', reservationDate: '2026-07-23', status: 'Active' }
  ]);

  // Mock Cycle Counts
  const [counts, setCounts] = useState<PhysicalCountSheet[]>([
    { id: 'CC-901', code: 'CC-2026-Q3-01', warehouseName: 'Delhi Central Depot', countType: 'CycleCount', scheduledDate: '2026-07-25', itemsCounted: 120, varianceFoundCount: 2, status: 'PendingApproval' }
  ]);

  // Mock Adjustments
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([
    { id: 'ADJ-10', code: 'ADJ-2026-005', productName: 'Surf Excel Quick Wash 1kg', warehouseName: 'Delhi Central Depot', binCode: 'A-01-R02-S3-B04', adjustmentQty: -5, reason: 'Damaged', unitCost: 145, totalValueChange: -725, approvedBy: 'Logistics Mgr', timestamp: '2026-07-22' }
  ]);

  // Mock Reorder Rules
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([
    { id: 'RR-01', productId: 'PRD-904', productName: 'Dove Hair Fall Rescue Shampoo 650ml', minStock: 50, maxStock: 500, reorderLevel: 100, safetyStock: 30, eoq: 200, status: 'Triggered' }
  ]);

  // Mock ABC Analytics
  const [abcAnalytics] = useState<InventoryAnalytics[]>([
    { abcClass: 'A', xyzClass: 'X', productId: 'PRD-901', productName: 'Surf Excel Quick Wash 1kg', turnoverRatio: 14.2, agingDays: 12 },
    { abcClass: 'B', xyzClass: 'Y', productId: 'PRD-904', productName: 'Dove Hair Fall Rescue Shampoo 650ml', turnoverRatio: 6.8, agingDays: 28 }
  ]);

  const handleCreateAdjustment = () => {
    const newAdj: InventoryAdjustment = {
      id: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
      code: 'ADJ-2026-NEW',
      productName: 'Surf Excel Quick Wash 1kg',
      warehouseName: 'Delhi Central Depot',
      binCode: 'A-01-R02-S3-B04',
      adjustmentQty: -2,
      reason: 'Damaged',
      unitCost: 145,
      totalValueChange: -290,
      approvedBy: 'Admin',
      timestamp: new Date().toISOString().split('T')[0]
    };
    setAdjustments([newAdj, ...adjustments]);
    setIsAdjustmentModalOpen(false);
    onTriggerToast('warning', 'Stock Adjustment Executed', 'Damaged goods written off with audit record.');
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: INVENTORY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Inventory Valuation" value={formatINR(276865)} badgeText="FIFO Method" badgeVariant="success" subLabel="Total Stock Quantity" subValue="1,783 Units" />
        <StatCard title="Low Stock & Reorder Alerts" value={reorderRules.filter(r => r.status === 'Triggered').length} badgeText="Auto Replenish" badgeVariant="danger" subLabel="Triggered SKUs" subValue="Dove Shampoo" />
        <StatCard title="Near Expiry Batches" value={batches.filter(b => b.status === 'NearExpiry').length} badgeText="Expiry Control" badgeVariant="warning" subLabel="Earliest Expiry" subValue="2026-08-10" />
        <StatCard title="Active Reservations" value={reservations.length} badgeText="B2B Allocated" badgeVariant="primary" subLabel="Reserved Qty" subValue="150 Units" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Inventory Overview', icon: TrendingUp },
          { id: 'stock', label: 'Stock Master (SKUs)', icon: Package },
          { id: 'batches', label: 'Batch & Expiry Control', icon: Calendar },
          { id: 'serials', label: 'Serial Tracking', icon: Barcode },
          { id: 'movements', label: 'Stock Movements', icon: History },
          { id: 'reservations', label: 'Stock Reservations', icon: Layers },
          { id: 'counts', label: 'Cycle Counting', icon: CheckCircle2 },
          { id: 'adjustments', label: 'Adjustments & Shrinkage', icon: AlertTriangle },
          { id: 'reorder', label: 'Reorder & EOQ Rules', icon: Sliders },
          { id: 'abc', label: 'ABC / XYZ Analytics', icon: PieChart }
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

      {/* TAB 2: STOCK MASTER */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search product SKU, warehouse..." />
            <button onClick={() => setIsAdjustmentModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Record Stock Adjustment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">SKU Code</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Warehouse / Bin</th>
                  <th className="p-3 text-right">Available Qty</th>
                  <th className="p-3 text-right">Reserved Qty</th>
                  <th className="p-3 text-right">Damaged Qty</th>
                  <th className="p-3 text-right">Total Qty</th>
                  <th className="p-3 text-right">Valuation</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {stockItems.map(stk => (
                  <tr key={stk.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{stk.productCode}</td>
                    <td className="p-3 font-semibold">{stk.productName}</td>
                    <td className="p-3 text-brand-text-secondary">{stk.warehouseName} ({stk.binCode})</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-success">{stk.availableQty}</td>
                    <td className="p-3 text-right font-mono text-brand-warning">{stk.reservedQty}</td>
                    <td className="p-3 text-right font-mono text-brand-danger">{stk.damagedQty}</td>
                    <td className="p-3 text-right font-mono font-bold">{stk.totalQty}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(stk.totalValuation)}</td>
                    <td className="p-3 text-center"><Badge variant={stk.status === 'InStock' ? 'success' : 'danger'}>{stk.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH & EXPIRY */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Batch Shelf-Life & Expiry Control</h4>
            <Badge variant="warning">FEFO Dispatch Engine</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Batch Number</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Manufacturing Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Available Batch Qty</th>
                  <th className="p-3 text-center">Batch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {batches.map(b => (
                  <tr key={b.id}>
                    <td className="p-3 font-mono font-bold text-brand-primary">{b.batchNumber}</td>
                    <td className="p-3 font-semibold">{b.productName}</td>
                    <td className="p-3 text-brand-text-secondary">{b.mfgDate}</td>
                    <td className="p-3 font-mono text-brand-warning">{b.expiryDate}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.availableQty}</td>
                    <td className="p-3 text-center"><Badge variant={b.status === 'Active' ? 'success' : 'warning'}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ADJUSTMENT */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Record Inventory Stock Adjustment</h3>
            <p className="text-xs text-brand-text-secondary">Adjust physical count variances, damage write-offs, or shrinkage.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Adjustment Reason</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white">
                  <option value="Damaged">Damaged Goods</option>
                  <option value="Shrinkage">Shrinkage / Lost</option>
                  <option value="Expired">Expired Stock Write-Off</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Quantity Change (+/-)</label>
                <input type="number" defaultValue="-2" className="w-full p-2 border rounded border-brand-border" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleCreateAdjustment} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Save Adjustment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
