import React, { useState } from 'react';
import {
  Truck,
  UserCheck,
  Compass,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Navigation,
  Box,
  Layers
} from 'lucide-react';
import {
  FleetVehicle,
  DriverProfile,
  LogisticsDeliveryOrder,
  DeliveryRoute,
  DispatchQueueItem,
  ProofOfDelivery,
  DeliveryExceptionRecord,
  LogisticsMetrics
} from '../../types/logistics';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface LogisticsModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function LogisticsModule({ onTriggerToast }: LogisticsModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vehicles' | 'drivers' | 'deliveries' | 'routes' | 'dispatch' | 'tracking' | 'pod' | 'exceptions' | 'analytics'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);

  // Mock Fleet Vehicles
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([
    { id: 'VEH-01', vehicleNumber: 'DL-01-GA-4589', vehicleType: 'LightCommercialVehicle', capacityKg: 2500, fuelType: 'Diesel', assignedDriverName: 'Ramesh Kumar', insuranceExpiryDate: '2027-03-31', registrationExpiryDate: '2029-06-30', status: 'OnDelivery' },
    { id: 'VEH-02', vehicleNumber: 'DL-01-EV-9012', vehicleType: 'ElectricVan', capacityKg: 1200, fuelType: 'Electric', assignedDriverName: 'Sunil Sharma', insuranceExpiryDate: '2027-01-15', registrationExpiryDate: '2030-01-15', status: 'Available' }
  ]);

  // Mock Drivers
  const [drivers] = useState<DriverProfile[]>([
    { id: 'DRV-101', driverCode: 'INK-DRV-42', name: 'Ramesh Kumar', licenseNumber: 'DL-1420110098273', licenseExpiryDate: '2028-10-14', mobile: '+91 98112 33445', assignedVehicleNumber: 'DL-01-GA-4589', totalDeliveriesCompleted: 420, ratingStars: 4.9, status: 'OnRoute' }
  ]);

  // Mock Delivery Orders
  const [deliveries, setDeliveries] = useState<LogisticsDeliveryOrder[]>([
    { id: 'DEL-01', deliveryCode: 'DEL-2026-0981', salesOrderRef: 'SO-2026-881', invoiceRef: 'INV-DEL-2026-0981', customerName: 'Reliance Retail Chain', destinationAddress: 'Central Warehouse Hub, Okhla Phase III, New Delhi', assignedVehicleNumber: 'DL-01-GA-4589', assignedDriverName: 'Ramesh Kumar', dispatchDate: '2026-07-23 09:30 AM', estimatedArrival: '2026-07-23 11:30 AM', cartonsCount: 42, totalValue: 185000, status: 'InTransit' }
  ]);

  // Mock Routes
  const [routes] = useState<DeliveryRoute[]>([
    { id: 'ROT-01', routeCode: 'ROT-DEL-SOUTH', name: 'South Delhi Distribution Circuit', startDepot: 'Delhi Central Depot', totalDistanceKm: 34.5, estimatedDurationHours: 2.5, stops: [{ stopNumber: 1, customerName: 'Reliance Retail Chain', address: 'Okhla Phase III', estimatedArrival: '11:30 AM', deliverableCartonsCount: 42 }] }
  ]);

  // Mock Dispatch Queue
  const [dispatchQueue] = useState<DispatchQueueItem[]>([
    { id: 'DSP-01', deliveryCode: 'DEL-2026-0981', customerName: 'Reliance Retail Chain', warehouseBin: 'STG-DISPATCH-04', vehicleNumber: 'DL-01-GA-4589', driverName: 'Ramesh Kumar', dispatchStatus: 'OutForDelivery' }
  ]);

  // Mock POD Records
  const [podRecords, setPodRecords] = useState<ProofOfDelivery[]>([
    { id: 'POD-01', deliveryCode: 'DEL-2026-0981', customerName: 'Reliance Retail Chain', receivedBy: 'Vikram (Store Mgr)', gpsLocation: '28.5244° N, 77.2788° E', timestamp: '2026-07-23 11:28 AM', deliveryNotes: '42 Cartons verified and received in good condition.' }
  ]);

  // Mock Exceptions
  const [exceptions] = useState<DeliveryExceptionRecord[]>([
    { id: 'EXC-01', deliveryCode: 'DEL-2026-0940', customerName: 'Metro Cash & Carry', reason: 'DamagedGoods', actionTaken: 'PartialAcceptance', notes: '2 outer pouches crushed during transit; replaced on spot.', timestamp: '2026-07-22 04:15 PM' }
  ]);

  const handleAddVehicle = () => {
    const newVeh: FleetVehicle = {
      id: `VEH-0${vehicles.length + 1}`,
      vehicleNumber: `DL-01-EV-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleType: 'ElectricVan',
      capacityKg: 1500,
      fuelType: 'Electric',
      assignedDriverName: 'Sunil Sharma',
      insuranceExpiryDate: '2027-12-31',
      registrationExpiryDate: '2030-12-31',
      status: 'Available'
    };
    setVehicles([...vehicles, newVeh]);
    setIsVehicleModalOpen(false);
    onTriggerToast('success', 'Vehicle Added to Fleet', `Vehicle ${newVeh.vehicleNumber} registered in logistics master.`);
  };

  const handleSubmitPod = () => {
    const newPod: ProofOfDelivery = {
      id: `POD-0${podRecords.length + 1}`,
      deliveryCode: 'DEL-2026-0985',
      customerName: 'Metro Cash & Carry',
      receivedBy: 'Anand Singh (Receiving Executive)',
      gpsLocation: '28.6692° N, 77.2954° E',
      timestamp: new Date().toLocaleTimeString(),
      deliveryNotes: 'Digital signature & photo captured on rep app.'
    };
    setPodRecords([newPod, ...podRecords]);
    setIsPodModalOpen(false);
    onTriggerToast('success', 'Digital POD Verified', `Signed Proof of Delivery logged for ${newPod.deliveryCode}.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: LOGISTICS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Deliveries Today" value={deliveries.length + 18} badgeText="In Transit" badgeVariant="primary" subLabel="Completed / Dispatched" subValue="18 / 19 Orders" />
        <StatCard title="Delivery Success Rate" value="98.2%" badgeText="Target: >95%" badgeVariant="success" subLabel="On-Time Deliveries" subValue="96.5%" progressPercent={98.2} progressColor="success" />
        <StatCard title="Active Fleet Vehicles" value={`${vehicles.filter(v => v.status === 'OnDelivery').length} / ${vehicles.length}`} badgeText="Capacity Util: 88%" badgeVariant="info" subLabel="Available Vehicles" subValue="1 Electric Van" />
        <StatCard title="Pending Proof of Delivery" value={podRecords.length} badgeText="POD Captured" badgeVariant="warning" subLabel="Geo-Verified PODs" subValue="100% Signed" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Logistics Overview', icon: TrendingUp },
          { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck },
          { id: 'drivers', label: 'Driver Roster', icon: UserCheck },
          { id: 'deliveries', label: 'Delivery Planning', icon: Box },
          { id: 'routes', label: 'Route Optimization', icon: Navigation },
          { id: 'dispatch', label: 'Dispatch Queue', icon: Layers },
          { id: 'tracking', label: 'GPS Live Tracking', icon: MapPin },
          { id: 'pod', label: 'Proof of Delivery (POD)', icon: FileCheck },
          { id: 'exceptions', label: 'Exceptions & Returns', icon: AlertTriangle },
          { id: 'analytics', label: 'Fleet Analytics', icon: Sparkles }
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
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Live Delivery & Dispatch Monitor</h4>
            <div className="space-y-3 text-xs">
              {deliveries.map(d => (
                <div key={d.id} className="p-3 border rounded bg-brand-bg-secondary/30 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-primary">{d.deliveryCode} ({d.customerName})</span>
                    <Badge variant="primary">{d.status}</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">Vehicle: {d.assignedVehicleNumber} | Driver: {d.assignedDriverName}</p>
                  <p className="text-brand-text-secondary text-[11px]">Destination: {d.destinationAddress}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck size={16} className="text-brand-success" /> Digital POD Verification Log
            </h4>
            <div className="space-y-2 text-xs">
              {podRecords.map(p => (
                <div key={p.id} className="p-2.5 border rounded bg-brand-bg-secondary/40 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{p.deliveryCode}</span>
                    <Badge variant="success">Signed POD</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">Received by: {p.receivedBy}</p>
                  <p className="text-brand-text-secondary text-[11px] font-mono">GPS: {p.gpsLocation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search vehicle number, type..." />
            <button onClick={() => setIsVehicleModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Add Fleet Vehicle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Vehicle Number</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Capacity (kg)</th>
                  <th className="p-3">Fuel Type</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Insurance Expiry</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{v.vehicleNumber}</td>
                    <td className="p-3 font-semibold">{v.vehicleType}</td>
                    <td className="p-3 font-mono">{v.capacityKg} kg</td>
                    <td className="p-3">{v.fuelType}</td>
                    <td className="p-3">{v.assignedDriverName || 'Unassigned'}</td>
                    <td className="p-3 text-brand-text-secondary">{v.insuranceExpiryDate}</td>
                    <td className="p-3 text-center"><Badge variant={v.status === 'OnDelivery' ? 'primary' : 'success'}>{v.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ADD VEHICLE */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Add Fleet Vehicle</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Vehicle Type</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white">
                  <option value="ElectricVan">Electric Delivery Van</option>
                  <option value="LightCommercialVehicle">Light Commercial Vehicle (LCV)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Payload Capacity (kg)</label>
                <input type="number" defaultValue="1500" className="w-full p-2 border rounded border-brand-border" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleAddVehicle} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Save Vehicle</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
