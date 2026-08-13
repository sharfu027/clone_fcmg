import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  Users,
  MessageSquare,
  Clock,
  ShieldAlert,
  Award,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  Activity,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  ExecutiveKpiSummary,
  BiSalesAnalytics,
  LeaderboardItem,
  RiskAlertItem
} from '../../types/bi';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface BusinessIntelligenceModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function BusinessIntelligenceModule({ onTriggerToast }: BusinessIntelligenceModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'command-center' | 'sales' | 'procurement' | 'inventory' | 'finance' | 'logistics' | 'crm' | 'hrms' | 'workflow' | 'leaderboard'
  >('command-center');

  // Executive Summary Mock Data
  const [kpis] = useState<ExecutiveKpiSummary>({
    revenueToday: 185000,
    revenueMtd: 4250000,
    grossSales: 4500000,
    netSales: 4250000,
    purchaseValueMtd: 1455000,
    collectionValueMtd: 3850000,
    outstandingReceivables: 450000,
    outstandingPayables: 1455000,
    inventoryValue: 6850000,
    inventoryTurnoverRatio: 4.8,
    orderFulfillmentRatePercent: 98.5,
    deliverySuccessRatePercent: 98.2,
    csatScorePercent: 94.6,
    employeeAttendancePercent: 95.8,
    activeUsersCount: 48,
    systemHealthScorePercent: 99.9
  });

  // Recharts Revenue Trend Mock
  const revenueTrend = [
    { month: 'Jan', revenue: 3200000, target: 3000000 },
    { month: 'Feb', revenue: 3500000, target: 3200000 },
    { month: 'Mar', revenue: 3800000, target: 3500000 },
    { month: 'Apr', revenue: 3900000, target: 3800000 },
    { month: 'May', revenue: 4100000, target: 4000000 },
    { month: 'Jun', revenue: 4250000, target: 4100000 }
  ];

  // Leaderboard Performers Mock
  const [leaderboards] = useState<LeaderboardItem[]>([
    { id: 'LD-01', rank: 1, name: 'Reliance Retail Chain', category: 'Top Customer', metricValue: '₹4,50,000 MTD', growthPercent: 18.5 },
    { id: 'LD-02', rank: 2, name: 'Metro Cash & Carry', category: 'Top Customer', metricValue: '₹3,20,000 MTD', growthPercent: 12.2 },
    { id: 'LD-03', rank: 1, name: 'Surf Excel Quick Wash 1kg', category: 'Top Product', metricValue: '4,200 Cartons', growthPercent: 24.1 },
    { id: 'LD-04', rank: 1, name: 'Amit Sharma', category: 'Top Sales Rep', metricValue: '142% Target', growthPercent: 32.0 },
    { id: 'LD-05', rank: 1, name: 'Hindustan Unilever Ltd', category: 'Top Supplier', metricValue: '₹14.5L Fulfillment', growthPercent: 15.0 }
  ]);

  // Risk Alerts Mock
  const [riskAlerts] = useState<RiskAlertItem[]>([
    { id: 'RSK-01', severity: 'Warning', module: 'Inventory', title: 'FEFO Expiry Risk Alert', description: 'Batch BAT-2026-X88 (10 Cartons) expiring in 28 days.', timestamp: '10m ago' },
    { id: 'RSK-02', severity: 'Info', module: 'Finance', title: 'Overdue Collection Reminder', description: 'Reliance Retail invoice INV-DEL-2026-0981 overdue by 5 days.', timestamp: '1h ago' }
  ]);

  return (
    <div className="space-y-6">

      {/* SECTION 1: C-SUITE EXECUTIVE BI KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue MTD" value={formatINR(kpis.revenueMtd)} badgeText="103.6% Target" badgeVariant="success" subLabel="Revenue Today" subValue={formatINR(kpis.revenueToday)} progressPercent={100} progressColor="success" />
        <StatCard title="Inventory Value" value={formatINR(kpis.inventoryValue)} badgeText="Turnover: 4.8x" badgeVariant="primary" subLabel="Expiry Risk (30d)" subValue={formatINR(45000)} />
        <StatCard title="Net Collections MTD" value={formatINR(kpis.collectionValueMtd)} badgeText="AR Outstanding" badgeVariant="warning" subLabel="Overdue AR" subValue={formatINR(85000)} />
        <StatCard title="System Health & SLA" value="99.9% Uptime" badgeText="48 Active Users" badgeVariant="info" subLabel="Fulfillment Rate" subValue="98.5%" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'command-center', label: 'Executive Command Center', icon: TrendingUp },
          { id: 'sales', label: 'Sales & Revenue BI', icon: BarChart3 },
          { id: 'procurement', label: 'Procurement Spend', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventory Turnover', icon: Package },
          { id: 'finance', label: 'Finance & Cash Flow', icon: DollarSign },
          { id: 'logistics', label: 'Logistics & Fleet SLA', icon: Truck },
          { id: 'crm', label: 'CRM & CSAT Analytics', icon: MessageSquare },
          { id: 'hrms', label: 'HRMS & Attendance', icon: Users },
          { id: 'workflow', label: 'Workflow SLA Audit', icon: Clock },
          { id: 'leaderboard', label: 'Leaderboards & Risk', icon: Award }
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

      {/* TAB 1: EXECUTIVE COMMAND CENTER */}
      {activeTab === 'command-center' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Revenue Trend vs Monthly Targets</h4>
              <Badge variant="success">+18.5% YoY Growth</Badge>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(val) => `₹${val / 100000}L`} />
                  <ChartTooltip formatter={(val: any) => [formatINR(val), 'Amount']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0052CC" fill="#0052CC" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="target" stroke="#10B981" fill="transparent" strokeDasharray="4 4" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-brand-warning" /> Operational Risk & Intelligence Alerts
            </h4>
            <div className="space-y-3 text-xs">
              {riskAlerts.map(r => (
                <div key={r.id} className="p-3 border rounded bg-brand-bg-secondary/30 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-primary">{r.title}</span>
                    <Badge variant={r.severity === 'Warning' ? 'warning' : 'info'}>{r.module}</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">"{r.description}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: LEADERBOARDS */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} className="text-brand-primary" /> Top Performers & Entity Leaderboards
            </h4>
            <Badge variant="success">Updated Real-Time</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Entity Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Metric Performance</th>
                  <th className="p-3 text-right">Growth Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {leaderboards.map(l => (
                  <tr key={l.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 text-center font-bold text-brand-primary">#{l.rank}</td>
                    <td className="p-3 font-semibold">{l.name}</td>
                    <td className="p-3"><Badge variant="info">{l.category}</Badge></td>
                    <td className="p-3 text-right font-mono font-bold">{l.metricValue}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-success">+{l.growthPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
