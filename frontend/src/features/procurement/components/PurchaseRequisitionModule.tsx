import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Building2,
  User,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  X,
  RefreshCw
} from 'lucide-react';
import {
  PurchaseRequisition,
  RequisitionItem,
  RequisitionStatus,
  RequisitionPriority,
  ProcurementMetrics
} from '../../../types/procurement';
import {
  procurementService,
  CreatePRItemPayload
} from '../../../services/procurementService';
import { ApiError } from '../../../api/apiClient';
import { fetchCompanies, fetchDepartments } from '../../../services/masterDataService';
import { ProductAutocomplete } from '../../../components/ProductAutocomplete';
import { ProductDto } from '../../../types/masterData';
import { Tooltip } from '../../../components/ui/Tooltip';

interface PurchaseRequisitionModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  initialStatusFilter?: string;
}

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

/** Extract the meaningful error detail from an ApiError's ProblemDetails data */
const extractApiErrorDetail = (err: any, fallback: string = 'An unexpected error occurred.'): string => {
  if (err instanceof ApiError && err.data) {
    const pd = err.data as any;
    if (pd.errors && typeof pd.errors === 'object') {
      const fieldErrors = Object.values(pd.errors).flat().filter(Boolean);
      if (fieldErrors.length > 0) {
        return fieldErrors.join(' | ');
      }
    }
    return pd.detail || pd.title || err.message || fallback;
  }
  return err?.message || fallback;
};

export const PurchaseRequisitionModule: React.FC<PurchaseRequisitionModuleProps> = ({
  onTriggerToast,
  initialStatusFilter
}) => {
  const [companyId, setCompanyId] = useState<string>('76b29511-ea74-422a-928f-f5ef3abd8d80');

  // State
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [metrics, setMetrics] = useState<ProcurementMetrics>({
    openRequisitionsCount: 0,
    pendingApprovalsCount: 0,
    approvedRequisitionsCount: 0,
    rejectedRequisitionsCount: 0,
    estimatedPRValue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedPr, setSelectedPr] = useState<PurchaseRequisition | null>(null);

  // Reject / Cancel prompt modals
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    type: 'REJECT' | 'CANCEL';
    prId: string;
    reason: string;
    error?: string;
  }>({
    isOpen: false,
    type: 'REJECT',
    prId: '',
    reason: '',
  });

  // Create / Edit Form State
  const [nextPrCode, setNextPrCode] = useState<string>('PR-2026-000001');
  const [departmentName, setDepartmentName] = useState<string>('Procurement & Sourcing');
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requiredByDate, setRequiredByDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<RequisitionPriority>('Normal');
  const [purpose, setPurpose] = useState<string>('Monthly FMCG packaging materials replenishment');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<
    {
      productId: string;
      productCode: string;
      productName: string;
      uom: string;
      requestedQuantity: number;
      estimatedUnitPrice: number;
      notes: string;
    }[]
  >([
    {
      productId: '',
      productCode: '',
      productName: '',
      uom: 'PCS',
      requestedQuantity: 50,
      estimatedUnitPrice: 120.0,
      notes: 'Initial requirement batch',
    },
  ]);

  // Master Data Product Options for Autocomplete
  const [productsList, setProductsList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load Master Data & Company Context
  useEffect(() => {
    async function loadMasterData() {
      try {
        const comps = await fetchCompanies({});
        const compList = Array.isArray(comps) ? comps : (comps && Array.isArray(comps.items) ? comps.items : []);
        const targetComp = compList.find((c: any) => c.code === 'COM-624' || c.legalName?.includes('INK FMCG') || c.id === '76b29511-ea74-422a-928f-f5ef3abd8d80') || compList[0];
        if (targetComp && targetComp.id) {
          setCompanyId(targetComp.id);
        }

        const deptRes = await fetchDepartments({});
        const depts = Array.isArray(deptRes) ? deptRes : (deptRes && Array.isArray(deptRes.items) ? deptRes.items : []);
        setDepartmentsList(depts);
      } catch (err) {
        console.warn('Failed to fetch master data options:', err);
      }
    }
    loadMasterData();
  }, []);

  // Fetch PR List & Metrics
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pagedRes = await procurementService.getPurchaseRequisitions({
        companyId,
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as RequisitionStatus) : undefined,
        priority: priorityFilter !== 'ALL' ? (priorityFilter as RequisitionPriority) : undefined,
      });

      setRequisitions(pagedRes.items || []);
      setTotalCount(pagedRes.totalCount || 0);
      setTotalPages(pagedRes.totalPages || 1);

      const metricsRes = await procurementService.getProcurementMetrics(companyId);
      setMetrics(metricsRes);
    } catch (err: any) {
      console.error('Error loading PRs:', err);
      setError(err.message || 'Unable to load purchase requisitions.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open Create Modal
  const handleOpenCreateModal = async () => {
    try {
      const nextCode = await procurementService.getNextRequisitionNumber(companyId);
      setNextPrCode(nextCode);
    } catch (e) {
      setNextPrCode('PR-2026-000001');
    }

    setDepartmentName(departmentsList[0]?.name || 'Procurement & Sourcing');
    setRequestDate(new Date().toISOString().split('T')[0]);
    setRequiredByDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPriority('Normal');
    setPurpose('Monthly FMCG packaging materials replenishment');
    setNotes('');

    setItems([
      {
        productId: '',
        productCode: '',
        productName: '',
        uom: 'PCS',
        requestedQuantity: 10,
        estimatedUnitPrice: 0,
        notes: '',
      },
    ]);

    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (pr: PurchaseRequisition) => {
    setSelectedPr(pr);
    setNextPrCode(pr.requisitionNumber);
    setDepartmentName(pr.departmentName || 'Procurement & Sourcing');
    setRequestDate(pr.requestDate ? pr.requestDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setRequiredByDate(pr.requiredByDate ? pr.requiredByDate.split('T')[0] : '');
    setPriority(pr.priority);
    setPurpose(pr.purpose);
    setNotes(pr.notes || '');

    setItems(
      pr.items.map((i) => ({
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        uom: i.uom,
        requestedQuantity: i.requestedQuantity,
        estimatedUnitPrice: i.estimatedUnitPrice,
        notes: i.notes || '',
      }))
    );

    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!purpose.trim()) {
      errors.purpose = 'Purpose is required. Example: Monthly FMCG stock replenishment.';
    }

    if (!requiredByDate) {
      errors.requiredByDate = 'Required By Date is required. Example: 25-08-2026';
    } else if (new Date(requiredByDate) < new Date(requestDate)) {
      errors.requiredByDate = 'Required By Date cannot be before Request Date. Example: 25-08-2026';
    }

    if (items.length === 0) {
      errors.items = 'At least one product line item is required. Click "Add Product" below.';
    }

    const seenProductIds = new Set<string>();
    items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_product`] = 'Product is required. Example: PROD-001 - Premium Basmati Rice 5kg';
      } else if (seenProductIds.has(item.productId)) {
        errors[`item_${index}_product`] = 'Product is already added to this requisition. Example: select a different product.';
      } else {
        seenProductIds.add(item.productId);
      }
      if (item.requestedQuantity <= 0) {
        errors[`item_${index}_qty`] = 'Quantity must be greater than 0. Example: 50';
      }
      if (item.estimatedUnitPrice < 0) {
        errors[`item_${index}_price`] = 'Unit price cannot be negative. Example: 120.00';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save Draft / Create
  const handleSaveRequisition = async () => {
    if (!validateForm()) return;

    const payload = {
      companyId,
      departmentName,
      requestDate,
      requiredByDate,
      priority,
      purpose,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        requestedQuantity: i.requestedQuantity,
        estimatedUnitPrice: i.estimatedUnitPrice,
        notes: i.notes,
      })),
    };

    try {
      if (isEditModalOpen && selectedPr) {
        await procurementService.updatePurchaseRequisition(selectedPr.id, {
          id: selectedPr.id,
          ...payload,
        });
        onTriggerToast('success', 'Purchase Requisition Updated', `PR ${selectedPr.requisitionNumber} draft has been updated.`);
      } else {
        const created = await procurementService.createPurchaseRequisition(payload);
        onTriggerToast('success', 'Purchase Requisition Created', `PR ${created.requisitionNumber} draft created successfully.`);
      }

      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Save Failed', extractApiErrorDetail(err, 'Could not save purchase requisition.'));
    }
  };

  // Handle Action Button Clicks
  const handleSubmitPr = async (prId: string, reqNum: string) => {
    try {
      await procurementService.submitPurchaseRequisition(prId);
      onTriggerToast('success', 'PR Submitted', `Requisition ${reqNum} submitted for manager approval.`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Submission Failed', extractApiErrorDetail(err));
    }
  };

  const handleApprovePr = async (prId: string, reqNum: string) => {
    try {
      await procurementService.approvePurchaseRequisition(prId, 'Approved by Procurement Manager.');
      onTriggerToast('success', 'PR Approved', `Requisition ${reqNum} approved successfully.`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Approval Failed', extractApiErrorDetail(err));
    }
  };

  const handleRejectPrompt = async () => {
    if (!promptModal.reason.trim()) {
      setPromptModal((prev) => ({ ...prev, error: 'A reason for rejection is required. Example: Budget limit exceeded.' }));
      return;
    }

    try {
      await procurementService.rejectPurchaseRequisition(promptModal.prId, promptModal.reason);
      onTriggerToast('info', 'PR Rejected', `Purchase Requisition has been rejected.`);
      setPromptModal({ isOpen: false, type: 'REJECT', prId: '', reason: '' });
      loadData();
    } catch (err: any) {
      setPromptModal((prev) => ({ ...prev, error: extractApiErrorDetail(err) }));
    }
  };

  const handleCancelPrompt = async () => {
    try {
      await procurementService.cancelPurchaseRequisition(promptModal.prId, promptModal.reason || 'Cancelled by user request');
      onTriggerToast('warning', 'PR Cancelled', `Purchase Requisition has been cancelled.`);
      setPromptModal({ isOpen: false, type: 'CANCEL', prId: '', reason: '' });
      loadData();
    } catch (err: any) {
      setPromptModal((prev) => ({ ...prev, error: extractApiErrorDetail(err) }));
    }
  };

  const handleDeletePr = async (prId: string, reqNum: string) => {
    if (!window.confirm(`Are you sure you want to delete draft PR ${reqNum}?`)) return;

    try {
      await procurementService.deletePurchaseRequisition(prId);
      onTriggerToast('success', 'PR Deleted', `Draft ${reqNum} removed.`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Delete Failed', extractApiErrorDetail(err));
    }
  };

  // Add Item Line
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productCode: '',
        productName: '',
        uom: 'PCS',
        requestedQuantity: 10,
        estimatedUnitPrice: 0,
        notes: '',
      },
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onTriggerToast('warning', 'Item Required', 'A purchase requisition must contain at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Product Autocomplete Selection Handler
  const handleSelectProduct = (index: number, product: ProductDto | null) => {
    setItems((prev) => {
      const updated = [...prev];
      if (product) {
        // Align the PR companyId with the product's company to prevent company mismatch errors
        if (product.companyId) {
          setCompanyId(product.companyId);
        }
        updated[index] = {
          ...updated[index],
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          uom: product.baseUomCode || 'PCS',
          estimatedUnitPrice: updated[index].estimatedUnitPrice > 0 ? updated[index].estimatedUnitPrice : 0,
        };
      } else {
        updated[index] = {
          ...updated[index],
          productId: '',
          productCode: '',
          productName: '',
          uom: 'PCS',
          estimatedUnitPrice: 0,
        };
      }
      return updated;
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${index}_product`];
      return next;
    });
  };

  // Calculated Estimated Total Amount
  const computedGrandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.requestedQuantity * item.estimatedUnitPrice, 0);
  }, [items]);

  // Badge Status Renderer
  const renderStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-300">Draft</span>;
      case 'PendingApproval':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Pending Approval</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-200 text-slate-700 border border-slate-400">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800">{status}</span>;
    }
  };

  const renderPriorityBadge = (p: RequisitionPriority) => {
    switch (p) {
      case 'Urgent':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700">Urgent</span>;
      case 'High':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-orange-100 text-orange-700">High</span>;
      case 'Low':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-600">Low</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-700">Normal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & METRICS DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchase Requisitions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Production material requisitions, approval lifecycle, and estimated PR value tracker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition text-xs font-medium flex items-center gap-1 cursor-pointer"
            title="Refresh Requisitions"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={15} /> Create Requisition
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-sm hover:border-emerald-500 ${
            statusFilter === 'ALL' ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Requisitions</span>
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.openRequisitionsCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Draft & Pending</div>
        </div>

        <div
          onClick={() => setStatusFilter('PendingApproval')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-sm hover:border-amber-500 ${
            statusFilter === 'PendingApproval' ? 'ring-2 ring-amber-500/20 border-amber-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending PR Approvals</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{metrics.pendingApprovalsCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Action required</div>
        </div>

        <div
          onClick={() => setStatusFilter('Approved')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-sm hover:border-emerald-500 ${
            statusFilter === 'Approved' ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Requisitions</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{metrics.approvedRequisitionsCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for RFQ / PO</div>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-sm hover:border-rose-500 ${
            statusFilter === 'Rejected' ? 'ring-2 ring-rose-500/20 border-rose-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rejected Requisitions</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{metrics.rejectedRequisitionsCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Declined demands</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated PR Value</span>
            <DollarSign size={16} className="text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-900 font-mono">{formatINR(metrics.estimatedPRValue)}</div>
          <div className="text-[10px] text-gray-400 mt-1">Estimated demand total</div>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search PR code, requester, department..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Filter size={14} className="text-gray-400" />
            <span className="font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="PendingApproval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. REQUISITIONS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            Loading purchase requisitions from PostgreSQL...
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 text-red-700 text-xs space-y-2">
            <AlertCircle size={24} className="mx-auto text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs space-y-3">
            <FileText size={32} className="mx-auto text-gray-400" />
            <p className="font-semibold text-gray-700">No purchase requisitions found.</p>
            <p className="text-gray-400 max-w-sm mx-auto">
              Create a new department requisition to start material demand tracking.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              + Create Requisition
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">PR Code</th>
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Request Date</th>
                  <th className="p-3.5">Required By</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5 text-right">Est. Total Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {requisitions.map((pr) => (
                  <tr key={pr.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-emerald-700">{pr.requisitionNumber}</td>
                    <td className="p-3.5 font-medium text-gray-900">{pr.requestedByName}</td>
                    <td className="p-3.5 text-gray-600">{pr.departmentName || 'Procurement'}</td>
                    <td className="p-3.5 text-gray-500">{pr.requestDate ? pr.requestDate.split('T')[0] : '-'}</td>
                    <td className="p-3.5 text-gray-500 font-medium">{pr.requiredByDate ? pr.requiredByDate.split('T')[0] : '-'}</td>
                    <td className="p-3.5">{renderPriorityBadge(pr.priority)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                      {formatINR(pr.estimatedTotalAmount)}
                    </td>
                    <td className="p-3.5 text-center">{renderStatusBadge(pr.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip content="View Requisition Details">
                          <button
                            onClick={() => {
                              setSelectedPr(pr);
                              setIsDetailModalOpen(true);
                            }}
                            aria-label="View Requisition Details"
                            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                        </Tooltip>

                        {pr.status === 'Draft' && (
                          <>
                            <Tooltip content="Edit Draft">
                              <button
                                onClick={() => handleOpenEditModal(pr)}
                                aria-label="Edit Draft"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Submit for Approval">
                              <button
                                onClick={() => handleSubmitPr(pr.id, pr.requisitionNumber)}
                                aria-label="Submit for Approval"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                              >
                                <Send size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Delete Draft">
                              <button
                                onClick={() => handleDeletePr(pr.id, pr.requisitionNumber)}
                                aria-label="Delete Draft"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </>
                        )}

                        {pr.status === 'PendingApproval' && (
                          <>
                            <Tooltip content="Approve Requisition">
                              <button
                                onClick={() => handleApprovePr(pr.id, pr.requisitionNumber)}
                                aria-label="Approve Requisition"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Reject Requisition">
                              <button
                                onClick={() =>
                                  setPromptModal({
                                    isOpen: true,
                                    type: 'REJECT',
                                    prId: pr.id,
                                    reason: '',
                                  })
                                }
                                aria-label="Reject Requisition"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              >
                                <XCircle size={14} />
                              </button>
                            </Tooltip>
                          </>
                        )}

                        {(pr.status === 'Draft' || pr.status === 'PendingApproval') && (
                          <Tooltip content="Cancel Requisition">
                            <button
                              onClick={() =>
                                setPromptModal({
                                  isOpen: true,
                                  type: 'CANCEL',
                                  prId: pr.id,
                                  reason: '',
                                })
                              }
                              aria-label="Cancel Requisition"
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition cursor-pointer"
                            >
                              <Ban size={14} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {!loading && requisitions.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing <span className="font-semibold">{requisitions.length}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> requisitions (Page {page} of {totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CREATE / EDIT REQUISITION MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  {isEditModalOpen ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Internal department material request. Requisition Code:{' '}
                  <span className="font-mono font-bold text-amber-300">[ {nextPrCode} ] System generated</span>
                </p>
              </div>
              <Tooltip content="Close">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  aria-label="Close"
                  className="text-emerald-300 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </Tooltip>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* SECTION 1 — HEADER & GENERAL INFO */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Building2 size={14} className="text-emerald-600" /> General Request Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Requisition Code</label>
                    <input
                      type="text"
                      disabled
                      value={`${nextPrCode} (Read Only)`}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-500 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Requested By *</label>
                    <input
                      type="text"
                      disabled
                      value="Mohammed Sharfuddin (Manager)"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Department *</label>
                    <select
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Procurement & Sourcing">Procurement & Sourcing</option>
                      <option value="Warehouse & Inventory">Warehouse & Inventory</option>
                      <option value="FMCG Manufacturing">FMCG Manufacturing</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Request Date *</label>
                    <input
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Required By Date *</label>
                    <input
                      type="date"
                      value={requiredByDate}
                      onChange={(e) => setRequiredByDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-800 outline-none ${
                        formErrors.requiredByDate
                          ? 'border-red-500 bg-red-50/40'
                          : 'bg-gray-50 border-gray-300 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.requiredByDate && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.requiredByDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Priority *</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Purpose / Justification *</label>
                    <textarea
                      rows={2}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Explain the business justification for this requisition..."
                      className={`w-full p-2.5 border rounded-lg outline-none text-xs ${
                        formErrors.purpose
                          ? 'border-red-500 bg-red-50/40'
                          : 'bg-gray-50 border-gray-300 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    {formErrors.purpose && (
                      <p className="text-[11px] text-red-600 font-medium mt-0.5">{formErrors.purpose}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Additional Notes (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific delivery instructions..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 — LINE ITEMS GRID */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Package size={14} className="text-emerald-600" /> Requisition Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-md transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Product Line
                  </button>
                </div>

                {formErrors.items && (
                  <div className="p-2.5 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg mb-3">
                    {formErrors.items}
                  </div>
                )}

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                      <tr>
                        <th className="p-2.5 w-72">Product *</th>
                        <th className="p-2.5 w-20">UOM</th>
                        <th className="p-2.5 w-28">Requested Qty *</th>
                        <th className="p-2.5 w-32">Est. Unit Price *</th>
                        <th className="p-2.5 w-36 text-right">Est. Line Total</th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, idx) => {
                        const lineTotal = item.requestedQuantity * item.estimatedUnitPrice;
                        const prodErr = formErrors[`item_${idx}_product`];
                        const qtyErr = formErrors[`item_${idx}_qty`];
                        const priceErr = formErrors[`item_${idx}_price`];

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 min-w-[280px]">
                              <ProductAutocomplete
                                companyId={companyId}
                                selectedProductId={item.productId}
                                selectedProductLabel={
                                  item.productCode && item.productName
                                    ? `${item.productCode} - ${item.productName}`
                                    : ''
                                }
                                onSelectProduct={(product) => handleSelectProduct(idx, product)}
                                error={prodErr}
                              />
                            </td>

                            <td className="p-2.5">
                              <input
                                type="text"
                                disabled
                                value={item.uom}
                                className="w-full p-1.5 bg-gray-100 border border-gray-200 text-center font-bold text-gray-600 rounded text-xs outline-none"
                              />
                            </td>

                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                value={item.requestedQuantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setItems((prev) => {
                                    const next = [...prev];
                                    next[idx].requestedQuantity = val;
                                    return next;
                                  });
                                }}
                                className={`w-full p-1.5 border rounded text-xs outline-none font-mono ${
                                  qtyErr ? 'border-red-500 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                              />
                              {qtyErr && <p className="text-[10px] text-red-600 font-medium mt-0.5">{qtyErr}</p>}
                            </td>

                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={item.estimatedUnitPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setItems((prev) => {
                                    const next = [...prev];
                                    next[idx].estimatedUnitPrice = val;
                                    return next;
                                  });
                                }}
                                className={`w-full p-1.5 border rounded text-xs outline-none font-mono ${
                                  priceErr ? 'border-red-500 bg-red-50/40' : 'border-gray-300 bg-white'
                                }`}
                              />
                              {priceErr && <p className="text-[10px] text-red-600 font-medium mt-0.5">{priceErr}</p>}
                            </td>

                            <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                              {formatINR(lineTotal)}
                            </td>

                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItems((prev) => {
                                    const next = [...prev];
                                    next[idx].notes = val;
                                    return next;
                                  });
                                }}
                                placeholder="Item spec notes..."
                                className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white outline-none"
                              />
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 text-xs font-bold">
                      <tr>
                        <td colSpan={4} className="p-3 text-gray-700">
                          Total Items: <span className="text-emerald-700">{items.length}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-800 text-sm">
                          {formatINR(computedGrandTotal)}
                        </td>
                        <td colSpan={2} className="p-3 text-gray-500 text-[11px] font-normal text-right">
                          Server calculates final precision
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRequisition}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                {isEditModalOpen ? 'Update Draft' : 'Save Requisition Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DETAILS DRAWER / MODAL */}
      {isDetailModalOpen && selectedPr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-mono text-emerald-400">{selectedPr.requisitionNumber}</h2>
                  {renderStatusBadge(selectedPr.status)}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Requested by {selectedPr.requestedByName}</p>
              </div>
              <Tooltip content="Close">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </Tooltip>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* DETAILS METADATA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="block text-[11px] text-gray-500 font-semibold uppercase">Department</span>
                  <span className="font-bold text-gray-800">{selectedPr.departmentName || 'Procurement'}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-gray-500 font-semibold uppercase">Priority</span>
                  <span>{renderPriorityBadge(selectedPr.priority)}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-gray-500 font-semibold uppercase">Request Date</span>
                  <span className="font-medium text-gray-800">
                    {selectedPr.requestDate ? selectedPr.requestDate.split('T')[0] : '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-gray-500 font-semibold uppercase">Required By</span>
                  <span className="font-medium text-gray-800">
                    {selectedPr.requiredByDate ? selectedPr.requiredByDate.split('T')[0] : '-'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-1">Purpose / Justification</h4>
                <p className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800">{selectedPr.purpose}</p>
              </div>

              {selectedPr.notes && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Notes</h4>
                  <p className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">{selectedPr.notes}</p>
                </div>
              )}

              {/* LINE ITEMS TABLE */}
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Requisition Items</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5 text-center">UOM</th>
                        <th className="p-2.5 text-right">Quantity</th>
                        <th className="p-2.5 text-right">Est. Unit Price</th>
                        <th className="p-2.5 text-right">Est. Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPr.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono text-emerald-700 font-semibold">{item.productCode}</td>
                          <td className="p-2.5 font-medium text-gray-900">{item.productName}</td>
                          <td className="p-2.5 text-center text-gray-500 font-bold">{item.uom}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{item.requestedQuantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatINR(item.estimatedUnitPrice)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                            {formatINR(item.estimatedLineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                      <tr>
                        <td colSpan={5} className="p-3 text-right text-gray-700">
                          Estimated Total Amount:
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-800 text-sm">
                          {formatINR(selectedPr.estimatedTotalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* STATUS HISTORY TIMELINE */}
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Audit & Status History Timeline</h4>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2">
                  {selectedPr.statusHistories && selectedPr.statusHistories.length > 0 ? (
                    selectedPr.statusHistories.map((h, i) => (
                      <div key={h.id || i} className="flex items-start gap-2.5 text-[11px] pb-2 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800">
                              {h.fromStatus} &rarr; {h.toStatus}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {h.timestampUtc ? new Date(h.timestampUtc).toLocaleString() : '-'}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-0.5">{h.comment || 'Status transition logged'}</p>
                          <span className="text-gray-400 text-[10px]">By {h.changedByName}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs">No status history logged.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL FOR REJECT / CANCEL REASON */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              {promptModal.type === 'REJECT' ? 'Reject Purchase Requisition' : 'Cancel Purchase Requisition'}
            </h3>

            {promptModal.error && (
              <div className="p-2.5 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg">
                {promptModal.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {promptModal.type === 'REJECT' ? 'Reason for Rejection *' : 'Cancellation Reason (Optional)'}
              </label>
              <textarea
                rows={3}
                value={promptModal.reason}
                onChange={(e) =>
                  setPromptModal((prev) => ({ ...prev, reason: e.target.value, error: undefined }))
                }
                placeholder={
                  promptModal.type === 'REJECT'
                    ? 'Specify reason (e.g. Budget limit exceeded)...'
                    : 'Reason for cancellation...'
                }
                className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setPromptModal({ isOpen: false, type: 'REJECT', prId: '', reason: '' })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={promptModal.type === 'REJECT' ? handleRejectPrompt : handleCancelPrompt}
                className={`px-3.5 py-1.5 text-white font-semibold rounded-lg shadow-xs cursor-pointer ${
                  promptModal.type === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-700 hover:bg-slate-800'
                }`}
              >
                Confirm {promptModal.type === 'REJECT' ? 'Rejection' : 'Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
