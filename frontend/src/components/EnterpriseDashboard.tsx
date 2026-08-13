import React, { useState } from 'react';
import {
  Truck,
  AlertTriangle,
  Plus,
  Sliders,
  Check,
  ChevronRight,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  ThumbsUp,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';
import { ActivityLog, TaskItem, OrderItem, DashboardApprovalRequest } from '../types';

interface DashboardProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function EnterpriseDashboard({ onTriggerToast }: DashboardProps) {
  // Mock data for Recharts matching production style
  const distributionData = [
    { month: 'Feb 26', Actual: 9800000, Target: 9000000 },
    { month: 'Mar 26', Actual: 11200000, Target: 10000000 },
    { month: 'Apr 26', Actual: 10400000, Target: 11000000 },
    { month: 'May 26', Actual: 12100000, Target: 11500000 },
    { month: 'Jun 26', Actual: 13500000, Target: 12000000 },
    { month: 'Jul 26', Actual: 12450000, Target: 12500000 }
  ];

  // Live Task States
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'TSK-101', title: 'Verify tax calculations for Delhi Central depot', dueDate: '2026-07-22', priority: 'critical', status: 'pending', assignedTo: 'Siddharth M.' },
    { id: 'TSK-102', title: 'Approve HUL distributor credit margin override', dueDate: '2026-07-23', priority: 'high', status: 'in_progress', assignedTo: 'You' },
    { id: 'TSK-103', title: 'Re-route Sales Force Beat Plan for Chandigarh region', dueDate: '2026-07-24', priority: 'medium', status: 'pending', assignedTo: 'Karan A.' },
    { id: 'TSK-104', title: 'Postgres DB replication backup test', dueDate: '2026-07-21', priority: 'low', status: 'completed', assignedTo: 'Dev Team' }
  ]);

  // Live Activity Logs with severity filter
  const [activityFilter, setActivityFilter] = useState<'all' | 'warning' | 'danger'>('all');
  const [activities, setActivities] = useState<ActivityLog[]>([
    { id: 'ACT-90', timestamp: '2026-07-21 01:45', user: 'Siddharth Mehra', role: 'Finance Manager', action: 'Approved credit limit exception for Britannia', module: 'Finance', status: 'success' },
    { id: 'ACT-91', timestamp: '2026-07-21 01:22', user: 'System Agent', role: 'Super Administrator', action: 'SignalR Socket Connection warning triggered', module: 'Infrastructure', status: 'warning' },
    { id: 'ACT-92', timestamp: '2026-07-21 00:58', user: 'Aman Deep', role: 'Warehouse Manager', action: 'Failed SKU verification on Bin W45-A', module: 'Warehouse', status: 'danger' },
    { id: 'ACT-93', timestamp: '2026-07-20 23:12', user: 'System Scheduler', role: 'Super Administrator', action: 'Completed monthly sales database backup', module: 'Administration', status: 'info' }
  ]);

  // Pending Approvals State
  const [approvals, setApprovals] = useState<DashboardApprovalRequest[]>([
    { id: 'APP-012', title: 'Britannia Credit Extension', requestedBy: 'Amit Sharma (Rep)', module: 'Finance', timestamp: '10m ago', details: 'Extend outstanding credit cap by ₹2,00,000 for Super Retailers.' },
    { id: 'APP-013', title: 'Urgent Inventory Procurement PO-901', requestedBy: 'Karan Anand (Procurement)', module: 'Procurement', timestamp: '1h ago', details: 'Purchase Order of ₹14,50,000 to Hindustan Unilever.' },
    { id: 'APP-014', title: 'SFA Beat Plan Change', requestedBy: 'Priya Patel (Rep)', module: 'Sales Force', timestamp: '3h ago', details: 'Realign Wednesday beat plan for Mumbai South Central Sector.' }
  ]);

  // Recent Orders State
  const [orders, setOrders] = useState<OrderItem[]>([
    { id: 'ORD-9801', customerName: 'Apex Retail Distributors', orderDate: '2026-07-21 02:10', amount: 425000, itemsCount: 42, status: 'Pending Approval', paymentStatus: 'Pending' },
    { id: 'ORD-9802', customerName: 'Kishore Kirana Supermart', orderDate: '2026-07-21 01:30', amount: 18450, itemsCount: 5, status: 'Dispatched', paymentStatus: 'Paid' },
    { id: 'ORD-9803', customerName: 'Reliance FMCG Supply Chain', orderDate: '2026-07-20 18:22', amount: 1850000, itemsCount: 140, status: 'Delivered', paymentStatus: 'Paid' },
    { id: 'ORD-9804', customerName: 'Metro Cash & Carry Hub', orderDate: '2026-07-20 15:45', amount: 954000, itemsCount: 88, status: 'Delivered', paymentStatus: 'Paid' },
    { id: 'ORD-9805', customerName: 'Nilgiris Hypermarket BLR', orderDate: '2026-07-20 11:10', amount: 320000, itemsCount: 29, status: 'Cancelled', paymentStatus: 'Overdue' }
  ]);

  // Active Summary Tab
  const [summaryTab, setSummaryTab] = useState<'sales' | 'inventory' | 'procurement' | 'collections'>('sales');

  const toggleTaskStatus = (id: string) => {
    let nextStatusText = '';
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        nextStatusText = nextStatus.toUpperCase();
        return { ...t, status: nextStatus };
      }
      return t;
    }));
    if (nextStatusText) {
      onTriggerToast('success', 'Task Updated', `Task ${id} marked as ${nextStatusText}`);
    }
  };

  const handleAddNewTask = () => {
    const newTask: TaskItem = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: 'Conduct physical inventory audit on regional grain bins',
      dueDate: '2026-07-26',
      priority: 'high',
      status: 'pending',
      assignedTo: 'You'
    };
    setTasks(prev => [newTask, ...prev]);
    onTriggerToast('success', 'Task Created', 'New audit checklist added to active ledger.');
  };

  const handleApprovalAction = (id: string, action: 'approve' | 'reject') => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    onTriggerToast(
      action === 'approve' ? 'success' : 'warning',
      action === 'approve' ? 'Approval Completed' : 'Request Rejected',
      `Audit element ${id} was logged into PostgreSQL.`
    );
  };

  const handleQuickAction = (actionName: string) => {
    onTriggerToast('info', 'Executing ERP Directive', `Simulating shortcut process: ${actionName}`);
  };

  const filteredActivities = activityFilter === 'all'
    ? activities
    : activities.filter(act => act.status === activityFilter || (activityFilter === 'danger' && act.status === 'danger'));

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: HIGH DENSITY EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: SALES SUMMARY */}
        <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Gross Sales Distribution</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-brand-success border border-green-100 flex items-center gap-0.5">
              +8.3% MoM
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-xl font-bold text-brand-text-primary">₹1,24,50,000</h3>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-brand-text-secondary font-medium">
              <span>Target: ₹1,25,00,000</span>
              <span>99.6% Achieved</span>
            </div>
            {/* Micro progress bar */}
            <div className="w-full bg-brand-bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-brand-primary h-full rounded-full" style={{ width: '99.6%' }} />
            </div>
          </div>
        </div>

        {/* KPI 2: ACTIVE TRUCKS / INVENTORY SHIPPED */}
        <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Active Fleet Dispatch</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-brand-primary border border-blue-100">
              12 Trucks Live
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-brand-text-primary">1,248 Cartons</h3>
            <div className="mt-2 flex items-center justify-between text-[10px] text-brand-text-secondary font-medium">
              <span>On Schedule Delivery</span>
              <span className="text-brand-success font-bold">94.2%</span>
            </div>
            <div className="w-full bg-brand-bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-brand-success h-full rounded-full" style={{ width: '94.2%' }} />
            </div>
          </div>
        </div>

        {/* KPI 3: STOCK ALERTS */}
        <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Stock Alerts (OOS)</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-brand-danger border border-red-100 flex items-center gap-1">
              <AlertTriangle size={10} /> 4 SKU Warnings
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-brand-text-primary">2 Critical Depots</h3>
            <div className="mt-2 flex items-center justify-between text-[10px] text-brand-text-secondary font-medium">
              <span>Primary focus: West Region</span>
              <span className="font-bold text-brand-danger">Action Required</span>
            </div>
            <div className="w-full bg-brand-bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-brand-danger h-full rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>

        {/* KPI 4: SFA VISITS */}
        <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Field SFA Collections</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-brand-success border border-green-100">
              ₹84.6L Collected
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-brand-text-primary">104 DSRs Online</h3>
            <div className="mt-2 flex items-center justify-between text-[10px] text-brand-text-secondary font-medium">
              <span>Beat Visit Completion</span>
              <span>91.4% Done</span>
            </div>
            <div className="w-full bg-brand-bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-brand-success h-full rounded-full" style={{ width: '91.4%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: QUICK ACTIONS PANEL */}
      <div className="bg-white border border-brand-border rounded-lg p-4 shadow-sm">
        <h4 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3">ERP Direct Quick Actions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => handleQuickAction('Initiate Sales Quotation')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <DollarSign size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">New Quotation</span>
          </button>

          <button
            onClick={() => handleQuickAction('Create Purchase Requisition')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-50 text-brand-warning flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <ShoppingCart size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">New Requisition</span>
          </button>

          <button
            onClick={() => handleQuickAction('Trigger Cycle Count Audit')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-green-50 text-brand-success flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Package size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">Cycle Count</span>
          </button>

          <button
            onClick={() => handleQuickAction('Dispatch Schedule Audit')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 text-brand-danger flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Truck size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">Log Dispatch</span>
          </button>

          <button
            onClick={() => handleQuickAction('Realignment Beat Route')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Calendar size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">Beat Route</span>
          </button>

          <button
            onClick={() => handleQuickAction('Generate Ledger CSV Audit')}
            className="p-3 bg-brand-bg-secondary/40 border border-brand-border hover:border-brand-primary rounded-md text-center transition hover:bg-blue-50/20 group group-hover:scale-110 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 text-brand-text-secondary flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Sliders size={15} />
            </div>
            <span className="text-[11px] font-bold text-brand-text-primary block mt-2">Audit Report</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: BENTO GRID WITH INTEGRATED SUMMARIES & SALES TARGETS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* RECHARTS AREA CHART */}
        <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Gross Revenue Distribution Analysis</h4>
              <p className="text-[11px] text-brand-text-secondary">Target planned (dashed) vs Actual realized regional ledger sync</p>
            </div>
            <div className="flex items-center gap-1 bg-brand-bg-secondary p-1 rounded border border-brand-border">
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span className="text-[9px] font-bold text-brand-text-secondary mr-2">Actual Revenue</span>
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-[9px] font-bold text-brand-text-secondary">Planned Target</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={distributionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <ChartTooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', fontSize: '11px' }}
                />
                <Area 
                  name="Actual Distribution"
                  type="monotone" 
                  dataKey="Actual" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#actualGrad)" 
                />
                <Area 
                  name="Planned Target"
                  type="monotone" 
                  dataKey="Target" 
                  stroke="#9CA3AF" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INTERACTIVE INTEGRATED METRICS PANEL */}
        <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Functional Summaries</h4>
              <span className="text-[10px] text-brand-text-secondary font-mono">Live Sync</span>
            </div>

            {/* Selector Pills */}
            <div className="flex gap-1 bg-brand-bg-secondary p-0.5 rounded border border-brand-border text-[10px] font-bold">
              {(['sales', 'inventory', 'procurement', 'collections'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSummaryTab(tab)}
                  className={`flex-1 py-1 rounded text-center capitalize transition cursor-pointer ${
                    summaryTab === tab ? 'bg-white text-brand-text-primary shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB 1: SALES */}
            {summaryTab === 'sales' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">MTD Total Sales</span>
                  <span className="font-bold text-brand-text-primary">₹85.40 Lakh</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Average Order Basket</span>
                  <span className="font-bold text-brand-text-primary">₹1,45,200</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">B2B Customers Active</span>
                  <span className="font-bold text-brand-text-primary">148 Distributors</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary">Sales Growth MoM</span>
                  <span className="font-bold text-brand-success">+14.2%</span>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY */}
            {summaryTab === 'inventory' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Total Inventory Asset Value</span>
                  <span className="font-bold text-brand-text-primary">₹2.45 Crore</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Active SKUs Configured</span>
                  <span className="font-bold text-brand-text-primary">120 Products</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Out of Stock Warning SKUs</span>
                  <span className="font-bold text-brand-danger">4 Items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary">Avg Depot Turn Cycle</span>
                  <span className="font-bold text-brand-text-primary">18.5 Days</span>
                </div>
              </div>
            )}

            {/* TAB 3: PROCUREMENT */}
            {summaryTab === 'procurement' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Active RFQs Issued</span>
                  <span className="font-bold text-brand-text-primary">8 RFQs</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Pending Suppliers POs</span>
                  <span className="font-bold text-brand-text-primary">12 Orders</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">MTD Sourcing Budget Spend</span>
                  <span className="font-bold text-brand-text-primary">₹42.80 Lakh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary">GRN Inspection Succeeded</span>
                  <span className="font-bold text-brand-success">99.1% Rate</span>
                </div>
              </div>
            )}

            {/* TAB 4: COLLECTIONS */}
            {summaryTab === 'collections' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Outstanding Receivables</span>
                  <span className="font-bold text-brand-warning">₹14.20 Lakh</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Collections MTD</span>
                  <span className="font-bold text-brand-success">₹84.60 Lakh</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-brand-text-secondary">Overdue Accounts (90+ Days)</span>
                  <span className="font-bold text-brand-danger">₹2.40 Lakh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text-secondary">Collection Recovery Index</span>
                  <span className="font-bold text-brand-text-primary">96.8% Index</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50/40 p-3 rounded border text-[10px] text-brand-text-secondary leading-normal mt-4">
            <strong>FMCG Analytics Notice:</strong> Monthly ledger balances are reconciled every 24 hours against regional depot bank portals.
          </div>
        </div>
      </div>

      {/* SECTION 4: PENDING APPROVALS & OUTSTANDING TASKS & SECURITY SENTINEL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* PENDING APPROVALS LIST */}
        <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Executive Approval Queue</h4>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">Requires Super Administrator override credentials</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-brand-warning rounded border border-amber-100">
              {approvals.length} Pending
            </span>
          </div>

          <div className="divide-y divide-brand-border">
            {approvals.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-brand-success mx-auto" />
                <p className="text-xs font-bold text-brand-text-primary">All Approvals Clear</p>
                <p className="text-[11px] text-brand-text-secondary">No outstanding overrides found in local C# queues.</p>
              </div>
            ) : (
              approvals.map((app) => (
                <div key={app.id} className="py-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-text-primary">{app.title}</span>
                        <span className="text-[9px] font-bold bg-brand-bg-secondary text-brand-text-secondary px-1.5 py-0.2 rounded border">
                          {app.module}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-text-secondary mt-0.5">Requested by {app.requestedBy} • {app.timestamp}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-brand-text-secondary shrink-0">{app.id}</span>
                  </div>

                  <p className="text-[11px] text-brand-text-secondary bg-brand-bg-secondary/40 p-2 rounded border border-brand-border/60 leading-normal">
                    {app.details}
                  </p>

                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => handleApprovalAction(app.id, 'reject')}
                      className="px-2.5 py-1 text-[10px] font-bold text-brand-danger hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprovalAction(app.id, 'approve')}
                      className="px-3 py-1 text-[10px] font-bold bg-brand-success hover:bg-green-700 text-white rounded transition shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ThumbsUp size={10} /> Approve override
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OUTSTANDING TASKS CHECKLIST */}
        <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Upcoming Tasks Checklist</h4>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">Simulated team responsibilities</p>
            </div>
            <button 
              onClick={handleAddNewTask}
              className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary transition cursor-pointer"
              title="Add brand-new checklist item"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 pr-1">
            {tasks.map(task => {
              const isCompleted = task.status === 'completed';
              return (
                <div 
                  key={task.id}
                  className={`p-3 border rounded-md transition flex items-start gap-2.5 ${
                    isCompleted ? 'bg-gray-50/50 border-brand-border opacity-70' : 'bg-white border-brand-border hover:border-brand-primary'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition ${
                      isCompleted ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border bg-white hover:border-brand-primary'
                    }`}
                  >
                    {isCompleted && <Check size={10} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${isCompleted ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-brand-text-secondary">
                      <span className="font-mono">{task.id}</span>
                      <span>•</span>
                      <span>Due: {task.dueDate}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                        task.priority === 'critical' ? 'bg-red-50 text-brand-danger' :
                        task.priority === 'high' ? 'bg-amber-50 text-brand-warning' : 'bg-blue-50 text-brand-primary'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => onTriggerToast('info', 'Task Queue Routing', 'Redirecting to full-stack dashboard...')}
            className="w-full py-2 border border-brand-border hover:bg-brand-bg-secondary text-xs font-bold text-brand-text-primary rounded-md transition flex items-center justify-center gap-1 cursor-pointer"
          >
            Open Complete Board <ChevronRight size={14} />
          </button>
        </div>

        {/* EXECUTIVE SECURITY SENTINEL OVERVIEW */}
        <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span>Security & Device Sentinel</span>
              </h4>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">Biometrics & Geofence status overview</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-success animate-pulse" title="Security engines active" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-brand-bg-secondary/40 border rounded text-center space-y-1">
              <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Active Sessions</span>
              <p className="text-lg font-mono font-bold text-brand-primary">142</p>
              <span className="text-[9px] text-brand-success font-semibold">● 100% Secure</span>
            </div>

            <div className="p-3 bg-brand-bg-secondary/40 border rounded text-center space-y-1">
              <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Accounts Locked</span>
              <p className="text-lg font-mono font-bold text-brand-danger">3</p>
              <span className="text-[9px] text-brand-text-secondary font-semibold">Suspended</span>
            </div>

            <div className="p-3 bg-brand-bg-secondary/40 border rounded text-center space-y-1">
              <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Face Enlistments</span>
              <p className="text-lg font-mono font-bold text-indigo-600">98.4%</p>
              <span className="text-[9px] text-brand-text-secondary font-semibold">126/128 Users</span>
            </div>

            <div className="p-3 bg-brand-bg-secondary/40 border rounded text-center space-y-1">
              <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Fence Bypass</span>
              <p className="text-lg font-mono font-bold text-brand-warning">0</p>
              <span className="text-[9px] text-brand-success font-semibold">No Violations</span>
            </div>
          </div>

          {/* Verification status alerts */}
          <div className="space-y-2 text-[11px] leading-relaxed">
            <div className="p-2 bg-green-50/50 border border-green-100 rounded flex items-center justify-between text-brand-success font-medium">
              <span>● PyTorch Biometrics Engine</span>
              <span>Online</span>
            </div>
            <div className="p-2 bg-blue-50/50 border border-blue-100 rounded flex items-center justify-between text-brand-primary font-medium">
              <span>● PostGIS Geofence Server</span>
              <span>Online</span>
            </div>
          </div>

          <button 
            onClick={() => {
              onTriggerToast('success', 'Sentinel Health Check Passed', 'All PostGIS fences & PyTorch biometric endpoints are fully synchronized with ASP.NET Core 9 APIs.');
            }}
            className="w-full py-2 bg-brand-primary hover:bg-blue-700 text-white text-xs font-bold rounded-md transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            Run Integrity Check
          </button>
        </div>

      </div>

      {/* SECTION 5: RECENT ORDERS TABLE & AUDIT TRANSACTIONS */}
      <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
        
        <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Recent Live B2B Orders</h4>
            <p className="text-[11px] text-brand-text-secondary mt-0.5">Real-time orders transmitted from Sales Force SFA Android Apps</p>
          </div>
          <button
            onClick={() => {
              const newOrder: OrderItem = {
                id: `ORD-${Math.floor(9000 + Math.random() * 900)}`,
                customerName: 'Kishore Kirana Supermart',
                orderDate: 'Just Now',
                amount: 45000,
                itemsCount: 14,
                status: 'Pending Approval',
                paymentStatus: 'Pending'
              };
              setOrders([newOrder, ...orders]);
              onTriggerToast('success', 'New Order Arrived', 'Received ORD-901B transaction via SFA API proxy.');
            }}
            className="px-3 py-1.5 border border-brand-border rounded hover:bg-brand-bg-secondary text-xs font-semibold text-brand-text-primary flex items-center gap-1 cursor-pointer bg-white transition shadow-xs"
          >
            <RefreshCw size={12} className="animate-spin-slow" /> Simulate SFA Order Entry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-bg-secondary border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Distributor Customer</th>
                <th className="p-3">Received Timestamp</th>
                <th className="p-3 text-right">Items Count</th>
                <th className="p-3 text-right">Basket Value</th>
                <th className="p-3 text-center">Dispatch Status</th>
                <th className="p-3 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-brand-bg-secondary/30 transition text-brand-text-primary">
                  <td className="p-3 font-mono font-bold text-brand-primary">{ord.id}</td>
                  <td className="p-3 font-semibold">{ord.customerName}</td>
                  <td className="p-3 text-brand-text-secondary">{ord.orderDate}</td>
                  <td className="p-3 text-right font-mono font-semibold">{ord.itemsCount} Units</td>
                  <td className="p-3 text-right font-mono font-bold">₹{ord.amount?.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                      ord.status === 'Delivered' ? 'bg-green-50 text-brand-success border-green-100' :
                      ord.status === 'Pending Approval' ? 'bg-amber-50 text-brand-warning border-amber-100' :
                      ord.status === 'Cancelled' ? 'bg-red-50 text-brand-danger border-red-100' :
                      'bg-blue-50 text-brand-primary border-blue-100'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                      ord.paymentStatus === 'Paid' ? 'text-brand-success' :
                      ord.paymentStatus === 'Overdue' ? 'text-brand-danger font-black' : 'text-brand-text-secondary'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
