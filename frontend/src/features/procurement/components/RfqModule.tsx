import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Send,
  X,
  RefreshCw,
  FileText,
  Package,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart3,
  ClipboardList,
  Lock,
} from 'lucide-react';
import {
  Rfq,
  RfqStatus,
  RfqMetrics,
  CreateRfqRequest,
  UpdateRfqRequest,
  PurchaseRequisition,
} from '../../../types/procurement';
import { rfqService, FetchRfqsParams } from '../../../services/rfqService';
import { procurementService } from '../../../services/procurementService';
import { ApiError } from '../../../api/apiClient';
import { fetchCompanies, fetchSuppliers } from '../../../services/masterDataService';
import { SupplierDto } from '../../../types/masterData';
import { Tooltip } from '../../../components/ui/Tooltip';

interface RfqModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

const COMPANY_ID_FALLBACK = '76b29511-ea74-422a-928f-f5ef3abd8d80';

const formatDate = (d?: string) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

const extractApiError = (err: any, fallback = 'An unexpected error occurred.'): string => {
  if (err instanceof ApiError && err.data) {
    const pd = err.data as any;
    if (pd.errors && typeof pd.errors === 'object') {
      const fieldErrors = Object.values(pd.errors).flat().filter(Boolean);
      if (fieldErrors.length > 0) return (fieldErrors as string[]).join(' | ');
    }
    return pd.detail || pd.title || err.message || fallback;
  }
  return err?.message || fallback;
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_META: Record<RfqStatus, { label: string; color: string; icon: React.ReactNode }> = {
  Draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <FileText size={11} /> },
  Submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <ClipboardList size={11} /> },
  Sent: { label: 'Sent', color: 'bg-green-50 text-green-700 border-green-200', icon: <Send size={11} /> },
  Closed: { label: 'Closed', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <CheckCircle2 size={11} /> },
  Cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', icon: <Ban size={11} /> },
};

function RfqStatusBadge({ status }: { status: RfqStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.Draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function DeliveryBadge({ status }: { status: 'Pending' | 'Sent' }) {
  return status === 'Sent' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <Send size={10} /> Sent
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={10} /> Pending
    </span>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-xl border bg-white p-4 flex items-center gap-3 shadow-sm`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const RfqModule: React.FC<RfqModuleProps> = ({ onTriggerToast }) => {
  const [companyId, setCompanyId] = useState<string>(COMPANY_ID_FALLBACK);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [metrics, setMetrics] = useState<RfqMetrics>({
    totalRfqsCount: 0,
    draftRfqsCount: 0,
    submittedRfqsCount: 0,
    sentRfqsCount: 0,
    closedRfqsCount: 0,
    cancelledRfqsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination & Filters ────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);

  // ── Prompt Modal (Cancel / Close) ───────────────────────────────────────────
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    type: 'CANCEL' | 'CLOSE';
    rfqId: string;
    reason: string;
    error?: string;
  }>({ isOpen: false, type: 'CANCEL', rfqId: '', reason: '' });

  // ── Form State ──────────────────────────────────────────────────────────────
  const [nextRfqNumber, setNextRfqNumber] = useState('RFQ-2026-000001');
  const [responseDueDate, setResponseDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formNotes, setFormNotes] = useState('');

  // PR selection
  const [approvedPrs, setApprovedPrs] = useState<PurchaseRequisition[]>([]);
  const [selectedPrId, setSelectedPrId] = useState('');
  const [selectedPr, setSelectedPr] = useState<PurchaseRequisition | null>(null);

  // Suppliers
  const [suppliersList, setSuppliersList] = useState<SupplierDto[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Load Company ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCompany() {
      try {
        const comps = await fetchCompanies({});
        const list = Array.isArray(comps) ? comps : comps?.items ?? [];
        const found = list.find((c: any) => c.code === 'COM-624' || c.legalName?.includes('INK FMCG') || c.id === COMPANY_ID_FALLBACK) || list[0];
        if (found?.id) setCompanyId(found.id);
      } catch {
        /* use fallback */
      }
    }
    loadCompany();
  }, []);

  // ── Load Suppliers ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSuppliers() {
      setSuppliersLoading(true);
      try {
        const res = await fetchSuppliers({ companyId, pageSize: 200, isActive: true });
        const list = Array.isArray(res) ? res : res?.items ?? [];
        // Filter to only active suppliers on the client side as a safety net
        setSuppliersList(list.filter((s: SupplierDto) => s.isActive !== false));
      } catch {
        /* ignore */
      } finally {
        setSuppliersLoading(false);
      }
    }
    loadSuppliers();
  }, [companyId]);

  // ── Load Approved PRs ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadApprovedPRs() {
      try {
        const res = await procurementService.getPurchaseRequisitions({ companyId, status: 'Approved', pageSize: 100 });
        setApprovedPrs(res?.items ?? []);
      } catch {
        /* ignore */
      }
    }
    loadApprovedPRs();
  }, [companyId]);

  // ── Fetch RFQs & Metrics ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FetchRfqsParams = {
        companyId,
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as RfqStatus) : undefined,
      };
      const pagedRes = await rfqService.getRfqs(params);
      setRfqs(pagedRes.items ?? []);
      setTotalCount(pagedRes.totalCount ?? 0);
      setTotalPages(pagedRes.totalPages ?? 1);

      const metricsRes = await rfqService.getRfqMetrics(companyId);
      setMetrics(metricsRes);
    } catch (err: any) {
      setError(extractApiError(err, 'Unable to load RFQs.'));
    } finally {
      setLoading(false);
    }
  }, [companyId, page, pageSize, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── PR Selection → Pre-fill Items (read-only display) ───────────────────────
  const handlePrSelect = useCallback((prId: string) => {
    setSelectedPrId(prId);
    const pr = approvedPrs.find((p) => p.id === prId) ?? null;
    setSelectedPr(pr);
    // Clear PR validation error when user selects
    if (prId) {
      setFormErrors((prev) => { const e = { ...prev }; delete e.pr; return e; });
    }
  }, [approvedPrs]);

  // ── Open Create Modal ────────────────────────────────────────────────────────
  const handleOpenCreate = async () => {
    try {
      const nextNum = await rfqService.getNextRfqNumber(companyId);
      setNextRfqNumber(nextNum);
    } catch {
      setNextRfqNumber('RFQ-2026-000001');
    }
    setResponseDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormNotes('');
    setSelectedPrId('');
    setSelectedPr(null);
    setSelectedSupplierIds([]);
    setSupplierSearch('');
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // ── Open Edit Modal ──────────────────────────────────────────────────────────
  const handleOpenEdit = (rfq: Rfq) => {
    setSelectedRfq(rfq);
    setResponseDueDate(rfq.responseDueDate?.split('T')[0] ?? '');
    setFormNotes(rfq.notes ?? '');
    setSelectedSupplierIds(rfq.suppliers.map((s) => s.supplierId));
    setSupplierSearch('');
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // ── Validate Create Form ─────────────────────────────────────────────────────
  const validateCreateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedPrId) errs.pr = 'Select an approved Purchase Requisition.';
    if (!responseDueDate) errs.responseDueDate = 'Response due date is required.';
    if (selectedPr && selectedPr.items.length === 0) errs.items = 'The selected PR has no line items.';
    if (selectedSupplierIds.length === 0) {
      errs.suppliers = 'At least one supplier is required. Example: SUP-001 - Hindustan Unilever Ltd.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Validate Edit Form ───────────────────────────────────────────────────────
  const validateEditForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!responseDueDate) errs.responseDueDate = 'Response due date is required.';
    if (selectedSupplierIds.length === 0) {
      errs.suppliers = 'At least one supplier is required. Example: SUP-001 - Hindustan Unilever Ltd.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Create RFQ ───────────────────────────────────────────────────────────────
  // NOTE: items are intentionally NOT sent — backend auto-populates from PR.
  const handleCreate = async () => {
    if (!validateCreateForm()) return;
    setSubmitting(true);
    try {
      const payload: CreateRfqRequest = {
        companyId,
        purchaseRequisitionId: selectedPrId,
        responseDueDate: new Date(responseDueDate).toISOString(),
        notes: formNotes || undefined,
        suppliers: selectedSupplierIds.map((id) => ({ supplierId: id })),
        // Do NOT send items — backend inherits them from the approved PR
      };
      await rfqService.createRfq(payload);
      onTriggerToast('success', 'RFQ Created', `${nextRfqNumber} has been saved as a draft.`);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Create Failed', extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update RFQ (edit suppliers / due date / notes only) ─────────────────────
  const handleUpdate = async () => {
    if (!validateEditForm() || !selectedRfq) return;
    setSubmitting(true);
    try {
      const payload: UpdateRfqRequest = {
        id: selectedRfq.id,
        responseDueDate: new Date(responseDueDate).toISOString(),
        notes: formNotes || undefined,
        suppliers: selectedSupplierIds.map((id) => ({ supplierId: id })),
        // Keep existing items unchanged — preserve PR integrity
        items: selectedRfq.items.map((i) => ({
          productId: i.productId,
          requestedQuantity: i.requestedQuantity,
          requiredByDate: i.requiredByDate,
          notes: i.notes || undefined,
        })),
      };
      await rfqService.updateRfq(selectedRfq.id, payload);
      onTriggerToast('success', 'RFQ Updated', `${selectedRfq.rfqNumber} has been updated.`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Update Failed', extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Lifecycle Actions ─────────────────────────────────────────────────────────
  const handleSubmit = async (rfq: Rfq) => {
    try {
      await rfqService.submitRfq(rfq.id);
      onTriggerToast('success', 'RFQ Submitted', `${rfq.rfqNumber} is now under review.`);
      loadData();
    } catch (err: any) { onTriggerToast('error', 'Submit Failed', extractApiError(err)); }
  };

  const handleSend = async (rfq: Rfq) => {
    try {
      await rfqService.sendRfq(rfq.id);
      onTriggerToast('success', 'RFQ Sent', `${rfq.rfqNumber} has been sent to suppliers.`);
      loadData();
    } catch (err: any) { onTriggerToast('error', 'Send Failed', extractApiError(err)); }
  };

  const handleOpenPrompt = (type: 'CANCEL' | 'CLOSE', rfqId: string) => {
    setPromptModal({ isOpen: true, type, rfqId, reason: '' });
  };

  const handlePromptConfirm = async () => {
    const { type, rfqId, reason } = promptModal;
    if (!reason.trim()) {
      setPromptModal((p) => ({ ...p, error: 'A reason is required.' }));
      return;
    }
    try {
      if (type === 'CANCEL') await rfqService.cancelRfq(rfqId, reason);
      else await rfqService.closeRfq(rfqId, reason);
      onTriggerToast('success', `RFQ ${type === 'CANCEL' ? 'Cancelled' : 'Closed'}`, `RFQ has been ${type.toLowerCase()}d.`);
      setPromptModal({ isOpen: false, type: 'CANCEL', rfqId: '', reason: '' });
      loadData();
    } catch (err: any) { onTriggerToast('error', 'Action Failed', extractApiError(err)); }
  };

  // ── Supplier Toggle ───────────────────────────────────────────────────────────
  const toggleSupplier = (supplierId: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId]
    );
    // Clear supplier error on first selection
    setFormErrors((prev) => { const e = { ...prev }; delete e.suppliers; return e; });
  };

  // ── Filtered Suppliers — search by code, name, city, gstin ───────────────────
  const filteredSuppliers = useMemo(
    () => suppliersList.filter((s) => {
      if (supplierSearch.trim() === '') return true;
      const q = supplierSearch.toLowerCase();
      return (
        s.legalName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.gstin ?? '').toLowerCase().includes(q)
      );
    }),
    [suppliersList, supplierSearch]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* ── Metrics ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Total RFQs" value={metrics.totalRfqsCount} icon={<BarChart3 size={18} className="text-indigo-600" />} color="bg-indigo-50" />
        <MetricCard label="Draft" value={metrics.draftRfqsCount} icon={<FileText size={18} className="text-slate-500" />} color="bg-slate-50" />
        <MetricCard label="Submitted" value={metrics.submittedRfqsCount} icon={<ClipboardList size={18} className="text-blue-600" />} color="bg-blue-50" />
        <MetricCard label="Sent" value={metrics.sentRfqsCount} icon={<Send size={18} className="text-green-600" />} color="bg-green-50" />
        <MetricCard label="Closed" value={metrics.closedRfqsCount} icon={<CheckCircle2 size={18} className="text-gray-500" />} color="bg-gray-50" />
        <MetricCard label="Cancelled" value={metrics.cancelledRfqsCount} icon={<Ban size={18} className="text-red-500" />} color="bg-red-50" />
      </div>

      {/* ── Header + Controls ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Request for Quotation</h2>
          <p className="text-xs text-gray-500 mt-0.5">{totalCount} RFQ{totalCount !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQs…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Sent">Sent</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <Tooltip content="Refresh Data">
            <button onClick={loadData} aria-label="Refresh Data" className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <RefreshCw size={15} className="text-gray-500" />
            </button>
          </Tooltip>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            New RFQ
          </button>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">RFQ #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PR #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Suppliers</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Loading RFQs…
                    </div>
                  </td>
                </tr>
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                    No RFQs found. Click <strong>New RFQ</strong> to create one.
                  </td>
                </tr>
              ) : (
                rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-700">{rfq.rfqNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{rfq.purchaseRequisitionNumber}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{rfq.departmentName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(rfq.responseDueDate)}</td>
                    <td className="px-4 py-3"><RfqStatusBadge status={rfq.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{rfq.items?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{rfq.suppliers?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="View Details">
                          <button
                            onClick={() => { setSelectedRfq(rfq); setIsDetailModalOpen(true); }}
                            aria-label="View Details"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                        </Tooltip>
                        {rfq.status === 'Draft' && (
                          <>
                            <Tooltip content="Edit RFQ">
                              <button onClick={() => handleOpenEdit(rfq)} aria-label="Edit RFQ" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer">
                                <Edit2 size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Submit RFQ">
                              <button onClick={() => handleSubmit(rfq)} aria-label="Submit RFQ" className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer">
                                <ClipboardList size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Cancel RFQ">
                              <button onClick={() => handleOpenPrompt('CANCEL', rfq.id)} aria-label="Cancel RFQ" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
                                <Ban size={14} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                        {rfq.status === 'Submitted' && (
                          <>
                            <Tooltip content="Send to Suppliers">
                              <button onClick={() => handleSend(rfq)} aria-label="Send to Suppliers" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors cursor-pointer">
                                <Send size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Cancel RFQ">
                              <button onClick={() => handleOpenPrompt('CANCEL', rfq.id)} aria-label="Cancel RFQ" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
                                <Ban size={14} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                        {rfq.status === 'Sent' && (
                          <Tooltip content="Close RFQ">
                            <button onClick={() => handleOpenPrompt('CLOSE', rfq.id)} aria-label="Close RFQ" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer">
                              <XCircle size={14} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} · {totalCount} total
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
           CREATE MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <CreateRfqModal
          title={`New RFQ — ${nextRfqNumber}`}
          approvedPrs={approvedPrs}
          selectedPrId={selectedPrId}
          selectedPr={selectedPr}
          onPrSelect={handlePrSelect}
          responseDueDate={responseDueDate}
          setResponseDueDate={setResponseDueDate}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          suppliersList={suppliersList}
          filteredSuppliers={filteredSuppliers}
          suppliersLoading={suppliersLoading}
          supplierSearch={supplierSearch}
          setSupplierSearch={setSupplierSearch}
          selectedSupplierIds={selectedSupplierIds}
          toggleSupplier={toggleSupplier}
          formErrors={formErrors}
          submitting={submitting}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           EDIT MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedRfq && (
        <EditRfqModal
          rfq={selectedRfq}
          responseDueDate={responseDueDate}
          setResponseDueDate={setResponseDueDate}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          suppliersList={suppliersList}
          filteredSuppliers={filteredSuppliers}
          suppliersLoading={suppliersLoading}
          supplierSearch={supplierSearch}
          setSupplierSearch={setSupplierSearch}
          selectedSupplierIds={selectedSupplierIds}
          toggleSupplier={toggleSupplier}
          formErrors={formErrors}
          submitting={submitting}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           DETAIL MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {isDetailModalOpen && selectedRfq && (
        <DetailModal rfq={selectedRfq} onClose={() => { setIsDetailModalOpen(false); setSelectedRfq(null); }} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           CANCEL / CLOSE PROMPT
         ═══════════════════════════════════════════════════════════════════════ */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              {promptModal.type === 'CANCEL' ? (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Ban size={18} className="text-red-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircle size={18} className="text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-800">{promptModal.type === 'CANCEL' ? 'Cancel RFQ' : 'Close RFQ'}</h3>
                <p className="text-xs text-gray-500">{promptModal.type === 'CANCEL' ? 'This action cannot be undone.' : 'Closes the RFQ. No further changes allowed.'}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={promptModal.reason}
                onChange={(e) => setPromptModal((p) => ({ ...p, reason: e.target.value, error: undefined }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                placeholder={promptModal.type === 'CANCEL' ? 'State why this RFQ is being cancelled…' : 'State why this RFQ is being closed…'}
              />
              {promptModal.error && <p className="text-xs text-red-600 mt-1">{promptModal.error}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPromptModal({ isOpen: false, type: 'CANCEL', rfqId: '', reason: '' })}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handlePromptConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${promptModal.type === 'CANCEL' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-800'}`}
              >
                Confirm {promptModal.type === 'CANCEL' ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUPPLIER PANEL (used by both Create + Edit modals)
// ─────────────────────────────────────────────────────────────────────────────
interface SupplierPanelProps {
  suppliersList: SupplierDto[];
  filteredSuppliers: SupplierDto[];
  suppliersLoading: boolean;
  supplierSearch: string;
  setSupplierSearch: (v: string) => void;
  selectedSupplierIds: string[];
  toggleSupplier: (id: string) => void;
  error?: string;
}

function SupplierPanel({
  filteredSuppliers,
  suppliersLoading,
  supplierSearch,
  setSupplierSearch,
  selectedSupplierIds,
  toggleSupplier,
  error,
}: SupplierPanelProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700">
          Supplier Recipients <span className="text-red-500">*</span>
        </label>
        {selectedSupplierIds.length > 0 && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {selectedSupplierIds.length} selected
          </span>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 p-2.5 mb-2 bg-red-50 border border-red-300 rounded-lg">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      <div className={`border rounded-xl overflow-hidden ${error ? 'border-red-400' : 'border-gray-200'}`}>
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, city, or GSTIN…"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
          {suppliersLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-xs">
              <Loader2 size={14} className="animate-spin" /> Loading suppliers…
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              <Building2 size={20} className="mx-auto mb-1 opacity-40" />
              {supplierSearch ? 'No suppliers match your search.' : 'No active suppliers found. Add suppliers in Supplier Management.'}
            </div>
          ) : (
            filteredSuppliers.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSupplierIds.includes(s.id)}
                  onChange={() => toggleSupplier(s.id)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {s.code} — {s.legalName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {[s.city, s.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE RFQ MODAL
// Items are derived from the selected approved PR — shown read-only.
// ─────────────────────────────────────────────────────────────────────────────
interface CreateRfqModalProps {
  title: string;
  approvedPrs: PurchaseRequisition[];
  selectedPrId: string;
  selectedPr: PurchaseRequisition | null;
  onPrSelect: (id: string) => void;
  responseDueDate: string;
  setResponseDueDate: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  suppliersList: SupplierDto[];
  filteredSuppliers: SupplierDto[];
  suppliersLoading: boolean;
  supplierSearch: string;
  setSupplierSearch: (v: string) => void;
  selectedSupplierIds: string[];
  toggleSupplier: (id: string) => void;
  formErrors: Record<string, string>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function CreateRfqModal({
  title,
  approvedPrs,
  selectedPrId,
  selectedPr,
  onPrSelect,
  responseDueDate,
  setResponseDueDate,
  formNotes,
  setFormNotes,
  suppliersList,
  filteredSuppliers,
  suppliersLoading,
  supplierSearch,
  setSupplierSearch,
  selectedSupplierIds,
  toggleSupplier,
  formErrors,
  submitting,
  onClose,
  onSubmit,
}: CreateRfqModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-500">Create a new Request for Quotation from an approved PR</p>
            </div>
          </div>
          <Tooltip content="Close">
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Step 1: Select Approved PR ──────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approved Purchase Requisition <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPrId}
              onChange={(e) => onPrSelect(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.pr ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            >
              <option value="">— Select an approved PR —</option>
              {approvedPrs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.requisitionNumber} · {pr.items.length} item{pr.items.length !== 1 ? 's' : ''} · {pr.purpose.slice(0, 40)}{pr.purpose.length > 40 ? '…' : ''}
                </option>
              ))}
            </select>
            {formErrors.pr && (
              <div className="flex items-center gap-1.5 mt-1">
                <AlertCircle size={12} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{formErrors.pr}</p>
              </div>
            )}
            {approvedPrs.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No approved PRs available. Approve a Purchase Requisition first.</p>
            )}
          </div>

          {/* ── Step 2: Requisition Items — Read-Only ──────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Package size={14} className="text-indigo-500" />
                Requisition Items
              </label>
              {selectedPr && (
                <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                  {selectedPr.items.length} item{selectedPr.items.length !== 1 ? 's' : ''} · auto-loaded from PR
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <Lock size={11} /> Read-only
              </span>
            </div>
            {formErrors.items && <p className="text-xs text-red-600 mb-2">{formErrors.items}</p>}
            {!selectedPr ? (
              <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm gap-2">
                <Package size={20} className="opacity-40" />
                Select an approved PR above to load its items automatically.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">Product</th>
                      <th className="text-left px-3 py-2 font-medium">UoM</th>
                      <th className="text-right px-3 py-2 font-medium">Qty</th>
                      <th className="text-left px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPr.items.map((item) => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-800">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.productCode}</p>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{item.uom}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                          {item.requestedQuantity.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-1.5 text-xs text-blue-700">
                  <Lock size={11} />
                  Items are inherited from the approved PR and cannot be modified here. Product scope is fixed.
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Response Due Date & Notes ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                Response Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={responseDueDate}
                onChange={(e) => setResponseDueDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.responseDueDate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {formErrors.responseDueDate && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{formErrors.responseDueDate}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes for this RFQ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* ── Step 4: Supplier Recipients ────────────────────────────────── */}
          <SupplierPanel
            suppliersList={suppliersList}
            filteredSuppliers={filteredSuppliers}
            suppliersLoading={suppliersLoading}
            supplierSearch={supplierSearch}
            setSupplierSearch={setSupplierSearch}
            selectedSupplierIds={selectedSupplierIds}
            toggleSupplier={toggleSupplier}
            error={formErrors.suppliers}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white transition-colors">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create RFQ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT RFQ MODAL
// Items are read-only (inherited from PR). Only suppliers/due date/notes editable.
// ─────────────────────────────────────────────────────────────────────────────
interface EditRfqModalProps {
  rfq: Rfq;
  responseDueDate: string;
  setResponseDueDate: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  suppliersList: SupplierDto[];
  filteredSuppliers: SupplierDto[];
  suppliersLoading: boolean;
  supplierSearch: string;
  setSupplierSearch: (v: string) => void;
  selectedSupplierIds: string[];
  toggleSupplier: (id: string) => void;
  formErrors: Record<string, string>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function EditRfqModal({
  rfq,
  responseDueDate,
  setResponseDueDate,
  formNotes,
  setFormNotes,
  suppliersList,
  filteredSuppliers,
  suppliersLoading,
  supplierSearch,
  setSupplierSearch,
  selectedSupplierIds,
  toggleSupplier,
  formErrors,
  submitting,
  onClose,
  onSubmit,
}: EditRfqModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Edit2 size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Edit RFQ — {rfq.rfqNumber}</h2>
              <p className="text-xs text-gray-500">PR: {rfq.purchaseRequisitionNumber} · Modify suppliers, due date, or notes</p>
            </div>
          </div>
          <Tooltip content="Close">
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Read-Only Items ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Package size={14} className="text-indigo-500" />
                Requisition Items
              </label>
              <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <Lock size={11} /> Read-only — sourced from PR
              </span>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Product</th>
                    <th className="text-left px-3 py-2 font-medium">UoM</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                    <th className="text-left px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rfq.items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.productCode}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{item.uom}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                        {item.requestedQuantity.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Due Date & Notes ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={responseDueDate}
                onChange={(e) => setResponseDueDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.responseDueDate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {formErrors.responseDueDate && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle size={12} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{formErrors.responseDueDate}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes for this RFQ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* ── Supplier Recipients ─────────────────────────────────────────── */}
          <SupplierPanel
            suppliersList={suppliersList}
            filteredSuppliers={filteredSuppliers}
            suppliersLoading={suppliersLoading}
            supplierSearch={supplierSearch}
            setSupplierSearch={setSupplierSearch}
            selectedSupplierIds={selectedSupplierIds}
            toggleSupplier={toggleSupplier}
            error={formErrors.suppliers}
          />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white transition-colors">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ rfq, onClose }: { rfq: Rfq; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{rfq.rfqNumber}</h2>
              <p className="text-xs text-gray-500">PR: {rfq.purchaseRequisitionNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RfqStatusBadge status={rfq.status} />
            <Tooltip content="Close">
              <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">RFQ Date</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(rfq.rfqDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Response Due</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(rfq.responseDueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-800">{rfq.departmentName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Requested By</p>
              <p className="text-sm font-medium text-gray-800">{rfq.requestedByName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Currency</p>
              <p className="text-sm font-medium text-gray-800">{rfq.currencyCode}</p>
            </div>
            {rfq.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-700">{rfq.notes}</p>
              </div>
            )}
          </div>

          {rfq.closeReason && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Close Reason</p>
              <p className="text-sm text-gray-700">{rfq.closeReason}</p>
            </div>
          )}
          {rfq.cancelReason && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs font-medium text-red-500 mb-0.5">Cancel Reason</p>
              <p className="text-sm text-red-700">{rfq.cancelReason}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Package size={15} className="text-indigo-500" /> Line Items ({rfq.items?.length ?? 0})
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-left px-3 py-2">UoM</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-left px-3 py-2">Required By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(rfq.items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{item.productName}<br /><span className="text-xs text-gray-400">{item.productCode}</span></td>
                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>
                      <td className="px-3 py-2 text-right text-gray-800">{item.requestedQuantity.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-gray-600">{formatDate(item.requiredByDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users size={15} className="text-indigo-500" /> Supplier Recipients ({rfq.suppliers?.length ?? 0})
            </h3>
            <div className="space-y-2">
              {(rfq.suppliers ?? []).map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.supplierCode} — {s.supplierName}</p>
                    <p className="text-xs text-gray-400">{s.email ? `${s.email}` : ''}{s.phone ? ` · ${s.phone}` : ''}</p>
                  </div>
                  <DeliveryBadge status={s.deliveryStatus} />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={15} className="text-indigo-500" /> Timeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { label: 'Created', value: rfq.createdAtUtc },
                { label: 'Submitted', value: rfq.submittedAtUtc },
                { label: 'Sent', value: rfq.sentAtUtc },
                { label: rfq.cancelledAtUtc ? 'Cancelled' : 'Closed', value: rfq.cancelledAtUtc ?? rfq.closedAtUtc },
              ].map((ev) =>
                ev.value ? (
                  <div key={ev.label} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <p className="text-gray-400">{ev.label}</p>
                    <p className="font-medium text-gray-700">{formatDate(ev.value)}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
