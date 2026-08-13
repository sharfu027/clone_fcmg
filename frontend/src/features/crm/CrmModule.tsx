import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  LifeBuoy,
  PhoneCall,
  Calendar,
  Star,
  MapPin,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Clock,
  Send,
  Building,
  UserCheck
} from 'lucide-react';
import {
  CrmCustomerProfile,
  CustomerComplaint,
  CustomerTicket,
  CustomerFollowUp,
  CommunicationLog,
  CustomerVisitLog,
  CustomerFeedback,
  CrmMetrics
} from '../../types/crm';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface CrmModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function CrmModule({ onTriggerToast }: CrmModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'customers' | 'complaints' | 'tickets' | 'followups' | 'communications' | 'visits' | 'feedback' | 'credit' | 'analytics'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Mock Customer Profiles
  const [customers, setCustomers] = useState<CrmCustomerProfile[]>([
    {
      id: 'CRM-CUST-01',
      customerCode: 'CUST-2026-901',
      name: 'Reliance Retail Chain',
      outletType: 'Supermarket',
      gstNumber: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      primaryContact: 'Amitabh Sen',
      mobile: '+91 98111 44556',
      email: 'procurement@relianceretail.com',
      billingAddress: 'Connaught Place, Block C, New Delhi',
      shippingAddress: 'Central Warehouse Hub, Okhla Phase III, New Delhi',
      assignedSalesman: 'Amit Sharma',
      creditLimit: 2500000,
      creditUsed: 450000,
      outstandingBalance: 450000,
      overdueAmount: 85000,
      contacts: [{ id: 'CON-01', name: 'Amitabh Sen', designation: 'Category Manager', mobile: '+91 98111 44556', email: 'sen@relianceretail.com', isPrimary: true }],
      status: 'Active'
    },
    {
      id: 'CRM-CUST-02',
      customerCode: 'CUST-2026-902',
      name: 'Metro Cash & Carry',
      outletType: 'Wholesaler',
      gstNumber: '07BBBBA1111B2Z8',
      pan: 'BBBBA1111B',
      primaryContact: 'Rakesh Gupta',
      mobile: '+91 98222 33445',
      email: 'purchase@metrocash.com',
      billingAddress: 'Seelampur Industrial Area, Delhi',
      shippingAddress: 'Seelampur Industrial Area, Delhi',
      assignedSalesman: 'Priya Patel',
      creditLimit: 5000000,
      creditUsed: 1200000,
      outstandingBalance: 1200000,
      overdueAmount: 0,
      contacts: [{ id: 'CON-02', name: 'Rakesh Gupta', designation: 'Store Director', mobile: '+91 98222 33445', email: 'gupta@metrocash.com', isPrimary: true }],
      status: 'Active'
    }
  ]);

  // Mock Complaints
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([
    {
      id: 'CMP-101',
      complaintCode: 'CMP-2026-081',
      customerName: 'Reliance Retail Chain',
      category: 'DamagedProduct',
      priority: 'High',
      status: 'UnderInvestigation',
      registeredDate: '2026-07-22',
      assignedTo: 'Deepak Sharma (WMS Mgr)',
      resolutionNotes: 'Inspecting batch BAT-2026-X88 transit outer cartons.'
    }
  ]);

  // Mock Tickets
  const [tickets] = useState<CustomerTicket[]>([
    { id: 'TCK-201', ticketCode: 'TCK-2026-042', customerName: 'Metro Cash & Carry', subject: 'GST Invoice Tax Rate Amendment Query', assignedAgent: 'Siddharth Mehra (Finance)', createdDate: '2026-07-23', slaDueDate: '2026-07-24', slaStatus: 'WithinSLA', status: 'InProgress' }
  ]);

  // Mock Follow-ups
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([
    { id: 'FLP-301', followUpCode: 'FLP-2026-11', customerName: 'Reliance Retail Chain', type: 'PaymentCollection', scheduledDate: '2026-07-25', assignedSalesman: 'Amit Sharma', notes: 'Collect overdue payment cheque of ₹85,000.', status: 'Pending' }
  ]);

  // Mock Communications
  const [communications] = useState<CommunicationLog[]>([
    { id: 'COMM-01', customerName: 'Reliance Retail Chain', channel: 'WhatsApp', timestamp: 'Today 11:30 AM', senderOrAgent: 'Amit Sharma (Rep)', summary: 'Sent digital invoice INV-DEL-2026-0981 PDF for approval.' }
  ]);

  // Mock Visits
  const [visitLogs] = useState<CustomerVisitLog[]>([
    { id: 'VST-401', visitCode: 'VST-2026-99', customerName: 'Reliance Retail Chain', salesmanName: 'Amit Sharma', checkInTime: '10:15 AM', checkOutTime: '11:00 AM', gpsCoordinates: '28.6139° N, 77.2090° E', faceVerified: true, visitNotes: 'Order booked for Surf Excel 1kg (20 Cartons).' }
  ]);

  // Mock Feedback
  const [feedbackList] = useState<CustomerFeedback[]>([
    { id: 'FBK-01', customerName: 'Metro Cash & Carry', ratingStars: 5, feedbackType: 'DeliverySpeed', comments: 'Same-day delivery from Delhi Central Depot was super fast!', date: '2026-07-21' }
  ]);

  const handleRegisterComplaint = () => {
    const newCmp: CustomerComplaint = {
      id: `CMP-${Math.floor(100 + Math.random() * 900)}`,
      complaintCode: `CMP-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: 'Metro Cash & Carry',
      category: 'BillingError',
      priority: 'Medium',
      status: 'Registered',
      registeredDate: new Date().toISOString().split('T')[0],
      assignedTo: 'Siddharth Mehra'
    };
    setComplaints([newCmp, ...complaints]);
    setIsComplaintModalOpen(false);
    onTriggerToast('success', 'Complaint Registered', `Complaint ${newCmp.complaintCode} registered & assigned.`);
  };

  const handleScheduleFollowUp = () => {
    const newFlp: CustomerFollowUp = {
      id: `FLP-${Math.floor(100 + Math.random() * 900)}`,
      followUpCode: `FLP-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: 'Metro Cash & Carry',
      type: 'SalesCall',
      scheduledDate: '2026-07-28',
      assignedSalesman: 'Priya Patel',
      notes: 'Review month-end discount promotions scheme.',
      status: 'Pending'
    };
    setFollowUps([newFlp, ...followUps]);
    setIsFollowUpModalOpen(false);
    onTriggerToast('success', 'Follow-up Scheduled', `Follow-up call scheduled for ${newFlp.scheduledDate}.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: CRM KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customer Base" value={customers.length + 142} badgeText="Active Accounts" badgeVariant="success" subLabel="New Accounts This Month" subValue="+ 12 Accounts" />
        <StatCard title="Open Complaints" value={complaints.filter(c => c.status !== 'Closed').length} badgeText="High Priority" badgeVariant="warning" subLabel="Avg Resolution Time" subValue="18.5 Hours" />
        <StatCard title="Customer Satisfaction (CSAT)" value="94.6%" badgeText="Target: >90%" badgeVariant="primary" subLabel="Total Ratings" subValue="128 Reviews" progressPercent={94.6} progressColor="success" />
        <StatCard title="Pending Sales Follow-ups" value={followUps.filter(f => f.status === 'Pending').length} badgeText="Action Required" badgeVariant="info" subLabel="Next 7 Days" subValue="3 Meetings" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'CRM Overview', icon: TrendingUp },
          { id: 'customers', label: 'Customer 360', icon: Users },
          { id: 'complaints', label: 'Complaints', icon: MessageSquare },
          { id: 'tickets', label: 'Service Tickets', icon: LifeBuoy },
          { id: 'followups', label: 'Follow-up Roster', icon: Calendar },
          { id: 'communications', label: 'Communication History', icon: PhoneCall },
          { id: 'visits', label: 'GPS Visit Timeline', icon: MapPin },
          { id: 'feedback', label: 'Customer Feedback', icon: Star },
          { id: 'credit', label: 'Credit Monitoring', icon: CreditCard },
          { id: 'analytics', label: 'CRM Analytics', icon: Sparkles }
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
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Active Customer Complaints Pipeline</h4>
            <div className="space-y-3 text-xs">
              {complaints.map(c => (
                <div key={c.id} className="p-3 border rounded bg-brand-bg-secondary/30 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-primary">{c.complaintCode} ({c.customerName})</span>
                    <Badge variant="warning">{c.status}</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">Category: {c.category} | Assigned: {c.assignedTo}</p>
                  {c.resolutionNotes && <p className="text-brand-text-secondary italic">"{c.resolutionNotes}"</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Star size={16} className="text-amber-500 fill-amber-500" /> CSAT Ratings Summary
            </h4>
            <div className="space-y-2 text-xs">
              {feedbackList.map(f => (
                <div key={f.id} className="p-2.5 border rounded bg-brand-bg-secondary/40 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{f.customerName}</span>
                    <span className="text-amber-500 font-bold">★ {f.ratingStars}/5</span>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">"{f.comments}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER 360 */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search customer code, outlet name, GST..." />
            <Badge variant="primary">Customer 360 Master</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Customer Code</th>
                  <th className="p-3">Outlet Name</th>
                  <th className="p-3">Outlet Type</th>
                  <th className="p-3">GSTIN Number</th>
                  <th className="p-3">Primary Contact</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{c.customerCode}</td>
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3">{c.outletType}</td>
                    <td className="p-3 font-mono text-brand-text-secondary">{c.gstNumber}</td>
                    <td className="p-3">{c.primaryContact} ({c.mobile})</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(c.creditLimit)}</td>
                    <td className="p-3 text-right font-mono font-bold text-brand-warning">{formatINR(c.outstandingBalance)}</td>
                    <td className="p-3 text-center"><Badge variant="success">{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search complaint code, customer..." />
            <button onClick={() => setIsComplaintModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Register Complaint
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Complaint Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Registered Date</th>
                  <th className="p-3">Assigned Agent</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {complaints.map(cmp => (
                  <tr key={cmp.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{cmp.complaintCode}</td>
                    <td className="p-3 font-semibold">{cmp.customerName}</td>
                    <td className="p-3">{cmp.category}</td>
                    <td className="p-3"><Badge variant={cmp.priority === 'High' ? 'danger' : 'warning'}>{cmp.priority}</Badge></td>
                    <td className="p-3 text-brand-text-secondary">{cmp.registeredDate}</td>
                    <td className="p-3">{cmp.assignedTo}</td>
                    <td className="p-3 text-center"><Badge variant="warning">{cmp.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTER COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Register Customer Complaint</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Customer</label>
                <input type="text" defaultValue="Metro Cash & Carry" className="w-full p-2 border rounded border-brand-border" />
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Category</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white">
                  <option value="BillingError">Billing Error</option>
                  <option value="DamagedProduct">Damaged Product</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsComplaintModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleRegisterComplaint} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Register Ticket</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
