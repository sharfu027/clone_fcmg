import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Users,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  Sparkles,
  Award,
  PhoneCall,
  Camera,
  QrCode,
  TrendingUp,
  Receipt,
  ThumbsUp,
  Target
} from 'lucide-react';
import {
  SalesRepMaster,
  Territory,
  BeatPlan,
  CustomerVisit,
  GpsCheckin,
  FaceAttendanceRecord,
  SfaOrderBooking,
  CollectionRecord,
  DailyCallReport,
  SfaExpense,
  CustomerFeedbackRecord,
  SalesTarget,
  SfaMetrics
} from '../../types/sfa';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface SfaModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function SfaModule({ onTriggerToast }: SfaModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'reps' | 'beats' | 'visits' | 'orders' | 'collections' | 'dcr' | 'expenses' | 'targets' | 'analytics'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Mock Sales Reps
  const [reps, setReps] = useState<SalesRepMaster[]>([
    { id: 'REP-01', code: 'REP-DEL-01', name: 'Vikram Sethi', email: 'vikram.sethi@ink-fmcg.com', phone: '+91 98110 55443', territoryName: 'Delhi NCR Central', reportingManager: 'Rajiv Kapoor (Sales Mgr)', monthlyTarget: 1500000, monthlyAchievement: 1380000, rating: 4.8, status: 'Active' },
    { id: 'REP-02', code: 'REP-MUM-02', name: 'Rohan Deshmukh', email: 'rohan.d@ink-fmcg.com', phone: '+91 98200 44332', territoryName: 'Mumbai South Tier 1', reportingManager: 'Rajiv Kapoor (Sales Mgr)', monthlyTarget: 1800000, monthlyAchievement: 1650000, rating: 4.6, status: 'Active' }
  ]);

  // Mock Beats
  const [beats, setBeats] = useState<BeatPlan[]>([
    { id: 'BEAT-101', code: 'BEAT-DEL-MON', name: 'Connaught Place Modern Trade Circuit', territoryName: 'Delhi NCR Central', repName: 'Vikram Sethi', frequency: 'Daily', totalOutlets: 24, sequenceOrder: [1, 2, 3, 4], status: 'Active' }
  ]);

  // Mock Visits
  const [visits, setVisits] = useState<CustomerVisit[]>([
    { id: 'VST-901', code: 'VST-2026-0441', visitDate: '2026-07-23', repName: 'Vikram Sethi', customerName: 'Reliance Retail CP Branch', visitType: 'Planned', checkinTime: '10:15 AM', checkoutTime: '10:45 AM', durationMinutes: 30, gpsDistanceMeters: 12, isGeofenceValid: true, outcome: 'OrderBooked', orderValue: 185000, notes: 'Restocked Surf Excel & Dove Shampoo' }
  ]);

  // Mock Orders
  const [orders, setOrders] = useState<SfaOrderBooking[]>([
    { id: 'ORD-501', orderNo: 'SFA-SO-2026-901', bookingDate: '2026-07-23', customerName: 'Reliance Retail CP Branch', repName: 'Vikram Sethi', totalAmount: 165000, discountAmount: 15000, taxAmount: 35000, netAmount: 185000, status: 'Booked' }
  ]);

  // Mock Collections
  const [collections, setCollections] = useState<CollectionRecord[]>([
    { id: 'COL-101', receiptNo: 'REC-2026-0881', collectionDate: '2026-07-23', customerName: 'Reliance Retail CP Branch', repName: 'Vikram Sethi', paymentMode: 'UPI', amountCollected: 50000, referenceNo: 'UPI-TXN-90218842', status: 'Cleared' }
  ]);

  // Mock DCR
  const [dcrs, setDcrs] = useState<DailyCallReport[]>([
    { id: 'DCR-01', dcrDate: '2026-07-23', repName: 'Vikram Sethi', plannedVisits: 8, actualVisits: 8, ordersCount: 6, totalOrderValue: 245000, totalCollectionValue: 85000, competitorRemarks: 'Competitor launched 10% extra promo on Ariel', status: 'Submitted' }
  ]);

  // Mock Expenses
  const [expenses, setExpenses] = useState<SfaExpense[]>([
    { id: 'EXP-101', code: 'EXP-2026-052', expenseDate: '2026-07-23', repName: 'Vikram Sethi', category: 'Travel', amount: 450, status: 'Approved' }
  ]);

  // Mock Targets
  const [targets, setTargets] = useState<SalesTarget[]>([
    { id: 'TGT-01', repName: 'Vikram Sethi', period: 'Monthly', targetAmount: 1500000, achievedAmount: 1380000, achievementPercent: 92.0, incentiveEarned: 24000 }
  ]);

  const handleBookNewOrder = () => {
    const newOrder: SfaOrderBooking = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      orderNo: `SFA-SO-2026-${Math.floor(100 + Math.random() * 900)}`,
      bookingDate: new Date().toISOString().split('T')[0],
      customerName: 'Metro Cash & Carry',
      repName: 'Vikram Sethi',
      totalAmount: 120000,
      discountAmount: 10000,
      taxAmount: 22000,
      netAmount: 132000,
      status: 'Booked'
    };
    setOrders([newOrder, ...orders]);
    setIsOrderModalOpen(false);
    onTriggerToast('success', 'Field Order Booked', `Order ${newOrder.orderNo} logged successfully.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: SFA KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Daily Calls Completed" value="8 / 8 Planned" badgeText="100% Strike Rate" badgeVariant="success" subLabel="Total Outlets Visited" subValue="8 Stores" />
        <StatCard title="Field Orders Booked Today" value={formatINR(185000)} badgeText="Live Price Tariff" badgeVariant="primary" subLabel="Total Bookings" subValue="6 Sales Orders" />
        <StatCard title="Daily Payment Collections" value={formatINR(50000)} badgeText="UPI Instant" badgeVariant="info" subLabel="Receipt No." subValue="REC-2026-0881" />
        <StatCard title="Monthly Target Run-Rate" value="92.0%" badgeText="Incentive Qualified" badgeVariant="warning" subLabel="Incentive Earned" subValue={formatINR(24000)} progressPercent={92.0} progressColor="primary" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Executive SFA Dashboard', icon: TrendingUp },
          { id: 'reps', label: 'Sales Rep Master', icon: Users },
          { id: 'beats', label: 'Beat & Route Planning', icon: Compass },
          { id: 'visits', label: 'Visits & GPS Check-in', icon: MapPin },
          { id: 'orders', label: 'Field Order Booking', icon: FileSpreadsheet },
          { id: 'collections', label: 'Collections & Receipts', icon: DollarSign },
          { id: 'dcr', label: 'Daily Call Reports (DCR)', icon: PhoneCall },
          { id: 'expenses', label: 'Expenses & Feedback', icon: Receipt },
          { id: 'targets', label: 'Targets & Incentives', icon: Target },
          { id: 'analytics', label: 'Sales Analytics', icon: Sparkles }
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

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Field Force Live Activity Stream</h4>
            <div className="space-y-3">
              {visits.map(v => (
                <div key={v.id} className="p-3 border rounded bg-brand-bg-secondary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-text-primary">{v.repName}</span>
                      <Badge variant={v.isGeofenceValid ? 'success' : 'danger'}>{v.isGeofenceValid ? 'Geofence Verified (12m)' : 'Out of Bounds'}</Badge>
                    </div>
                    <p className="text-brand-text-secondary">Visited: <strong>{v.customerName}</strong> ({v.checkinTime} - {v.checkoutTime})</p>
                  </div>
                  <span className="font-mono font-bold text-brand-success">{formatINR(v.orderValue || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Biometric & GPS Verification</h4>
            <div className="p-4 border rounded bg-green-50/40 border-green-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-brand-success font-bold">
                <CheckCircle2 size={16} /> <span>Face Attendance Active</span>
              </div>
              <p className="text-brand-text-secondary text-[11px]">Photonic facial match score: 99.82%. Liveness confirmed.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES REPS MASTER */}
      {activeTab === 'reps' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search sales rep, territory..." />
            <button onClick={() => onTriggerToast('info', 'Sales Rep Master', 'Opening rep onboarding wizard...')} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Add Sales Rep
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Rep Code</th>
                  <th className="p-3">Sales Executive</th>
                  <th className="p-3">Assigned Territory</th>
                  <th className="p-3">Reporting Manager</th>
                  <th className="p-3 text-right">Monthly Target</th>
                  <th className="p-3 text-right">Achievement</th>
                  <th className="p-3 text-center">Rating</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {reps.map(r => (
                  <tr key={r.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{r.code}</td>
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3">{r.territoryName}</td>
                    <td className="p-3 text-brand-text-secondary">{r.reportingManager}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(r.monthlyTarget)}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-success">{formatINR(r.monthlyAchievement)}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{r.rating} ★</td>
                    <td className="p-3 text-center"><Badge variant="success">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FIELD ORDER BOOKING */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search order no, outlet name..." />
            <button onClick={() => setIsOrderModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Book Field Order
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Order No</th>
                  <th className="p-3">Customer Outlet</th>
                  <th className="p-3">Sales Rep</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Net Order Value</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{o.orderNo}</td>
                    <td className="p-3 font-semibold">{o.customerName}</td>
                    <td className="p-3">{o.repName}</td>
                    <td className="p-3 text-brand-text-secondary">{o.bookingDate}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-success">{formatINR(o.netAmount)}</td>
                    <td className="p-3 text-center"><Badge variant="primary">{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL BOOK ORDER */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Book New Field Sales Order</h3>
            <p className="text-xs text-brand-text-secondary">Capture outlet order with live price list and discount engine.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Customer Outlet</label>
                <input type="text" defaultValue="Metro Cash & Carry" className="w-full p-2 border rounded border-brand-border" />
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Estimated Net Amount (₹)</label>
                <input type="number" defaultValue="132000" className="w-full p-2 border rounded border-brand-border" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleBookNewOrder} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Confirm Order</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
