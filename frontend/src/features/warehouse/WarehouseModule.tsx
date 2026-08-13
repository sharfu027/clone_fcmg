import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Search,
  Layers,
  Box,
  Truck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Barcode,
  ArrowRightLeft,
  PackageCheck,
  CheckSquare,
  TrendingUp,
  Sliders,
  Users,
  Activity
} from 'lucide-react';
import {
  WarehouseZone,
  WarehouseBin,
  ReceivingOperation,
  PutawayTask,
  StockTransfer,
  PickList,
  PackingSlip,
  DispatchOrder,
  WarehouseTask,
  WarehouseMetrics
} from '../../types/warehouse';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';

interface WarehouseModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function WarehouseModule({ onTriggerToast }: WarehouseModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'bins' | 'putaway' | 'transfers' | 'picking' | 'dispatch' | 'tasks' | 'analytics'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');

  // Mock Zones
  const [zones] = useState<WarehouseZone[]>([
    { id: 'Z-01', warehouseId: 'WH-01', warehouseName: 'Delhi Central Depot', code: 'Z-DRY-A', name: 'Dry FMCG High-Velocity Zone', type: 'FastMoving', totalBins: 120, occupancyPercent: 82 },
    { id: 'Z-02', warehouseId: 'WH-01', warehouseName: 'Delhi Central Depot', code: 'Z-COLD-B', name: 'Dairy & Confectionery Cold Room', type: 'Refrigerated', totalBins: 45, occupancyPercent: 65 }
  ]);

  // Mock Bins
  const [bins, setBins] = useState<WarehouseBin[]>([
    { id: 'BIN-101', zoneId: 'Z-01', zoneCode: 'Z-DRY-A', code: 'A-01-R02-S3-B04', aisle: 'Ais-01', rack: 'R-02', shelf: 'S-03', binNumber: 'B-04', type: 'Standard', maxWeightKg: 1000, currentWeightKg: 780, capacityUtilization: 78, status: 'Available' },
    { id: 'BIN-102', zoneId: 'Z-02', zoneCode: 'Z-COLD-B', code: 'B-02-R01-S1-B01', aisle: 'Ais-02', rack: 'R-01', shelf: 'S-01', binNumber: 'B-01', type: 'ColdStorage', maxWeightKg: 500, currentWeightKg: 490, capacityUtilization: 98, status: 'Full' }
  ]);

  // Mock Putaway Tasks
  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>([
    { id: 'PT-901', receivingId: 'GRN-2026-098', productName: 'Surf Excel Quick Wash 1kg (500 Pcs)', quantity: 500, suggestedBinCode: 'A-01-R02-S3-B04', assignedWorker: 'Ramesh Kumar', status: 'Pending' }
  ]);

  // Mock Stock Transfers
  const [transfers, setTransfers] = useState<StockTransfer[]>([
    { id: 'TRF-101', code: 'TRF-2026-042', fromWarehouse: 'Delhi Central Depot', toWarehouse: 'Gurgaon Express Hub', transferDate: '2026-07-23', itemsCount: 300, status: 'In Transit' }
  ]);

  // Mock Pick Lists
  const [pickLists, setPickLists] = useState<PickList[]>([
    { id: 'PK-401', code: 'PK-2026-112', salesOrderRef: 'SO-2026-881', pickerName: 'Vikas Verma', pickingType: 'Wave', itemsCount: 8, status: 'In Progress' }
  ]);

  // Mock Dispatch Orders
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([
    { id: 'DSP-801', code: 'DSP-2026-090', salesOrderRef: 'SO-2026-881', customerName: 'Reliance Retail Chain', truckNo: 'DL-01-GA-4589', driverPhone: '+91 98112 00981', dispatchDate: '2026-07-23', status: 'Loading' }
  ]);

  // Mock Tasks
  const [tasks, setTasks] = useState<WarehouseTask[]>([
    { id: 'TSK-01', code: 'TSK-2026-301', taskType: 'Putaway', assignedWorker: 'Ramesh Kumar', priority: 'High', targetBin: 'A-01-R02-S3-B04', status: 'In Progress' }
  ]);

  const handleCompletePutaway = (id: string) => {
    setPutawayTasks(prev => prev.map(pt => pt.id === id ? { ...pt, status: 'Completed' } : pt));
    onTriggerToast('success', 'Put-away Confirmed', `Items stored safely at designated bin.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: WAREHOUSE KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Storage Capacity" value="250,000 Sft" badgeText="Multi-Zone" badgeVariant="primary" subLabel="Active Warehouses" subValue="3 Depots" />
        <StatCard title="Overall Occupancy" value="78.5%" badgeText="Optimal Load" badgeVariant="success" subLabel="Peak Zone" subValue="Z-DRY-A (82%)" progressPercent={78.5} progressColor="success" />
        <StatCard title="Pending Put-aways" value={putawayTasks.filter(p => p.status !== 'Completed').length} badgeText="GRN Staged" badgeVariant="warning" subLabel="Pending Putaway Units" subValue="500 Pcs" />
        <StatCard title="Daily Dispatch Throughput" value="1,240 Cartons" badgeText="QR Scan Ready" badgeVariant="info" subLabel="Dispatches Today" subValue="12 Trucks" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Warehouse Overview', icon: TrendingUp },
          { id: 'bins', label: 'Storage Bins & Hierarchy', icon: Layers },
          { id: 'putaway', label: 'Receiving & Put-away', icon: Box },
          { id: 'transfers', label: 'Internal Transfers', icon: ArrowRightLeft },
          { id: 'picking', label: 'Picking & Packing', icon: PackageCheck },
          { id: 'dispatch', label: 'Dispatch Orders', icon: Truck },
          { id: 'tasks', label: 'Worker Tasks', icon: CheckSquare },
          { id: 'analytics', label: 'Space Analytics', icon: Activity }
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
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Storage Zone Occupancy Summary</h4>
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.id} className="p-3 border rounded bg-brand-bg-secondary/20 space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{z.name} ({z.code})</span>
                    <span className="text-brand-primary">{z.occupancyPercent}% Filled</span>
                  </div>
                  <div className="w-full bg-brand-bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full rounded-full" style={{ width: `${z.occupancyPercent}%` }} />
                  </div>
                  <span className="text-[10px] text-brand-text-secondary">Depot: {z.warehouseName} | Total Bins: {z.totalBins}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Barcode & QR Scan Hardware</h4>
            <div className="p-4 border rounded bg-blue-50/40 border-blue-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-brand-primary font-bold">
                <QrCode size={16} /> <span>Handheld Terminal Mode Active</span>
              </div>
              <p className="text-brand-text-secondary text-[11px]">Ready for 1D/2D GS1 Barcode scanning during receiving and pick confirmation.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORAGE BINS */}
      {activeTab === 'bins' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search bin code (A-01-R02...)..." />
            <button onClick={() => onTriggerToast('info', 'Bin Management', 'Opening bin creation modal...')} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Add Storage Bin
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Bin Coordinate Code</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">Aisle / Rack / Shelf</th>
                  <th className="p-3">Bin Type</th>
                  <th className="p-3 text-right">Max Weight (Kg)</th>
                  <th className="p-3 text-center">Utilization</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {bins.map(b => (
                  <tr key={b.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{b.code}</td>
                    <td className="p-3 font-semibold">{b.zoneCode}</td>
                    <td className="p-3 text-brand-text-secondary">{b.aisle} / {b.rack} / {b.shelf}</td>
                    <td className="p-3 font-medium">{b.type}</td>
                    <td className="p-3 text-right font-mono">{b.maxWeightKg} kg</td>
                    <td className="p-3 text-center font-bold text-brand-primary">{b.capacityUtilization}%</td>
                    <td className="p-3 text-center"><Badge variant={b.status === 'Available' ? 'success' : 'danger'}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIVING & PUTAWAY */}
      {activeTab === 'putaway' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Suggested Put-away Queue</h4>
            <Badge variant="warning">Capacity Verified</Badge>
          </div>
          <div className="space-y-3">
            {putawayTasks.map(pt => (
              <div key={pt.id} className="p-4 border rounded-lg bg-brand-bg-secondary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-brand-primary">{pt.receivingId}</span>
                  <h5 className="font-bold text-brand-text-primary mt-0.5">{pt.productName}</h5>
                  <p className="text-brand-text-secondary">Suggested Bin: <strong className="font-mono text-brand-primary">{pt.suggestedBinCode}</strong> | Worker: {pt.assignedWorker}</p>
                </div>
                {pt.status !== 'Completed' ? (
                  <button onClick={() => handleCompletePutaway(pt.id)} className="px-3 py-1.5 bg-brand-success text-white font-semibold rounded hover:bg-green-700 cursor-pointer">
                    Confirm Put-away
                  </button>
                ) : (
                  <Badge variant="success">Completed</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
