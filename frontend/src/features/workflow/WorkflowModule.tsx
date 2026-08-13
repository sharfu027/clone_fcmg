import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Sliders,
  Layers,
  Clock,
  UserCheck,
  Bell,
  History,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import {
  ApprovalWorkflow,
  ApprovalMatrixRule,
  ApprovalRequest,
  ApprovalActionPayload,
  ApprovalDelegation,
  NotificationItem,
  WorkflowMetrics
} from '../../types/workflow';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface WorkflowModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function WorkflowModule({ onTriggerToast }: WorkflowModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'designer' | 'matrix' | 'inbox' | 'my-requests' | 'escalations' | 'delegation' | 'notifications' | 'analytics'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [actionComments, setActionComments] = useState('');

  // Mock Workflows
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([
    { id: 'WF-101', code: 'WF-PO-HIGH', name: 'High-Value Purchase Order Approval Engine', documentType: 'PurchaseOrder', version: 2, totalSteps: 3, steps: [{ stepNumber: 1, name: 'Procurement Mgr Sign-off', approverRole: 'Procurement Manager', routingMode: 'Sequential', timeLimitHours: 24, allowDelegation: true }], status: 'Active' }
  ]);

  // Mock Matrix
  const [matrixRules] = useState<ApprovalMatrixRule[]>([
    { id: 'MX-01', documentType: 'PurchaseOrder', minAmount: 100000, maxAmount: 500000, requiredRole: 'Procurement Manager', department: 'Procurement', company: 'INK FMCG Ltd' }
  ]);

  // Mock Requests
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    { id: 'REQ-501', requestCode: 'APR-2026-901', documentType: 'PurchaseOrder', documentRef: 'PO-2026-0012', requestorName: 'Aman Deep', amount: 1450000, currentStepNumber: 2, totalSteps: 3, assignedApprover: 'Director / Finance Mgr', submissionDate: '2026-07-22', dueDate: '2026-07-24', status: 'Pending' }
  ]);

  // Mock Delegations
  const [delegations] = useState<ApprovalDelegation[]>([
    { id: 'DEL-01', delegatorName: 'Rajiv Kapoor (Sales Mgr)', proxyName: 'Vikram Sethi (Sr Exec)', startDate: '2026-07-20', endDate: '2026-07-30', reason: 'DutyTravel', status: 'Active' }
  ]);

  // Mock Notifications
  const [notifications] = useState<NotificationItem[]>([
    { id: 'NTF-01', title: 'High Value PO Requires Signature', message: 'PO-2026-0012 for ₹14.5L requires your approval signature.', timestamp: '10 mins ago', read: false, type: 'ApprovalRequired' }
  ]);

  const handleAction = (actionType: 'Approve' | 'Reject' | 'Return') => {
    if (!selectedRequest) return;
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: actionType === 'Approve' ? 'Approved' : actionType === 'Reject' ? 'Rejected' : 'Returned' } : r));
    setSelectedRequest(null);
    setActionComments('');
    onTriggerToast(actionType === 'Approve' ? 'success' : 'warning', `Request ${actionType}d`, `Approval action executed with audit log.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: WORKFLOW KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approvals Inbox" value={requests.filter(r => r.status === 'Pending').length} badgeText="Requires Action" badgeVariant="warning" subLabel="Highest Value Pending" subValue={formatINR(1450000)} />
        <StatCard title="SLA Compliance Rate" value="98.4%" badgeText="Avg Time: 4.2h" badgeVariant="success" subLabel="Time Target" subValue="< 24.0 Hours" progressPercent={98.4} progressColor="success" />
        <StatCard title="Active Delegation Proxies" value={delegations.length} badgeText="Duty Travel Active" badgeVariant="info" subLabel="Proxy Signer" subValue="Vikram Sethi" />
        <StatCard title="Escalated Requests" value={requests.filter(r => r.status === 'Escalated').length} badgeText="Auto Escalation" badgeVariant="danger" subLabel="Unresolved > 48h" subValue="0 Requests" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Approval Overview', icon: TrendingUp },
          { id: 'inbox', label: 'Pending Inbox', icon: CheckSquare },
          { id: 'designer', label: 'Workflow Designer', icon: Sliders },
          { id: 'matrix', label: 'Approval Matrix', icon: Layers },
          { id: 'delegation', label: 'Delegations & Proxies', icon: UserCheck },
          { id: 'notifications', label: 'Notification Center', icon: Bell },
          { id: 'analytics', label: 'SLA Analytics', icon: Sparkles }
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

      {/* TAB 1: PENDING INBOX */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search request code, document ref..." />
            <Badge variant="warning">Universal ERP Workflow Inbox</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Request Code</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Doc Reference</th>
                  <th className="p-3">Requestor</th>
                  <th className="p-3 text-right">Value (₹)</th>
                  <th className="p-3 text-center">Progress Step</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Sign-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{req.requestCode}</td>
                    <td className="p-3 font-semibold">{req.documentType}</td>
                    <td className="p-3 font-mono text-brand-text-secondary">{req.documentRef}</td>
                    <td className="p-3">{req.requestorName}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(req.amount || 0)}</td>
                    <td className="p-3 text-center font-bold text-brand-primary">Step {req.currentStepNumber} / {req.totalSteps}</td>
                    <td className="p-3 text-center"><Badge variant={req.status === 'Approved' ? 'success' : 'warning'}>{req.status}</Badge></td>
                    <td className="p-3 text-right">
                      {req.status === 'Pending' && (
                        <button onClick={() => setSelectedRequest(req)} className="px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-blue-700 cursor-pointer">
                          Action Request
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

      {/* ACTION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Sign-off Request: {selectedRequest.requestCode}</h3>
            <div className="text-xs text-brand-text-secondary space-y-1">
              <p>Document Ref: <strong className="font-mono text-brand-text-primary">{selectedRequest.documentRef}</strong></p>
              <p>Value: <strong className="font-mono text-brand-success">{formatINR(selectedRequest.amount || 0)}</strong></p>
            </div>
            <textarea
              value={actionComments}
              onChange={(e) => setActionComments(e.target.value)}
              placeholder="Enter approval remarks or decision notes..."
              className="w-full p-2 border rounded border-brand-border text-xs focus:outline-none focus:border-brand-primary"
              rows={3}
            />
            <div className="flex justify-between items-center pt-2 border-t text-xs">
              <button onClick={() => handleAction('Return')} className="px-3 py-1.5 border border-brand-warning text-brand-warning font-semibold rounded hover:bg-amber-50 cursor-pointer flex items-center gap-1">
                <RotateCcw size={13} /> Return
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-brand-danger text-white font-semibold rounded hover:bg-red-700 cursor-pointer flex items-center gap-1">
                  <XCircle size={13} /> Reject
                </button>
                <button onClick={() => handleAction('Approve')} className="px-4 py-1.5 bg-brand-success text-white font-semibold rounded hover:bg-green-700 cursor-pointer flex items-center gap-1 shadow-sm">
                  <CheckCircle2 size={13} /> Approve Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
