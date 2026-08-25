import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Layers,
  History,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Eye,
  Sliders,
  X,
  FileCheck,
  Check,
  ShieldCheck,
  Clock,
  Boxes,
  ArrowRight,
  BookmarkCheck,
  Compass,
  CalendarClock,
  Truck,
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Send
} from 'lucide-react';
import {
  InventoryLocation,
  InventoryBalance,
  InventoryTransaction,
  InventoryReservation,
  StockTransfer,
  StockTransferLine,
  InventoryAvailabilityDto,
  InventoryAlternativeLocationDto,
  InventoryReconciliationDto,
  PostInventoryTransactionRequest,
  CreateStockTransferRequest
} from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import {
  fetchCompanies,
  fetchBranches,
  fetchDepartments,
  fetchWarehouses,
  fetchProducts,
  fetchEmployees
} from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tooltip } from '../../components/ui/Tooltip';

interface InventoryModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

type TabType = 'overview' | 'stock' | 'locations' | 'movements' | 'reservations' | 'transfers';

export default function InventoryModule({ onTriggerToast }: InventoryModuleProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'Super Admin' || user?.email?.toLowerCase().includes('superadmin');

  // Primary Live Navigation State (Synchronized with URL)
  const getInitialTab = (): TabType => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/inventory/stock')) return 'stock';
    if (path.includes('/inventory/locations')) return 'locations';
    if (path.includes('/inventory/movements')) return 'movements';
    if (path.includes('/inventory/reservations')) return 'reservations';
    if (path.includes('/inventory/transfers')) return 'transfers';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Sync tab with URL changes
  useEffect(() => {
    const tabFromUrl = getInitialTab();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.pathname]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/inventory/overview');
    else if (tab === 'stock') navigate('/inventory/stock');
    else if (tab === 'locations') navigate('/inventory/locations');
    else if (tab === 'movements') navigate('/inventory/movements');
    else if (tab === 'reservations') navigate('/inventory/reservations');
    else if (tab === 'transfers') navigate('/inventory/transfers');
  };

  // Core Data States
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCompanyId, setFilterCompanyId] = useState<string>('');
  const [filterLocationId, setFilterLocationId] = useState<string>('');
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterTxnType, setFilterTxnType] = useState<string>('');
  const [filterReservationStatus, setFilterReservationStatus] = useState<string>('');

  // Modals & Drawers
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState<boolean>(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [selectedTxnForDetail, setSelectedTxnForDetail] = useState<InventoryTransaction | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState<boolean>(false);
  const [reconciliationResult, setReconciliationResult] = useState<InventoryReconciliationDto | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  // Availability & Alternative Finder States
  const [availabilityResult, setAvailabilityResult] = useState<InventoryAvailabilityDto | null>(null);
  const [alternativeLocations, setAlternativeLocations] = useState<InventoryAlternativeLocationDto[] | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<boolean>(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState<boolean>(false);

  // Reserve Form
  const [reserveForm, setReserveForm] = useState({
    companyId: '',
    inventoryLocationId: '',
    productId: '',
    requestedQuantity: 1,
    salesOrderId: '',
    salesOrderLineId: '',
    expiresAtUtc: ''
  });

  // Availability Diagnostic Form
  const [availabilityForm, setAvailabilityForm] = useState({
    companyId: '',
    inventoryLocationId: '',
    productId: '',
    requestedQuantity: 1
  });

  // Opening Balance Form
  const [openingForm, setOpeningForm] = useState({
    companyId: '',
    inventoryLocationId: '',
    productId: '',
    openingQuantity: 0,
    batchNumber: '',
    expiryDate: '',
    notes: ''
  });

  // Location Form
  const [locationForm, setLocationForm] = useState({
    companyId: '',
    branchId: '',
    warehouseId: '',
    departmentId: '',
    code: '',
    name: '',
    locationType: 'Standard',
    isActive: true
  });

  // Reconciliation Form
  const [reconcileForm, setReconcileForm] = useState({
    companyId: '',
    inventoryLocationId: '',
    productId: ''
  });

  // Transfer Modals & State
  const [isCreateTransferModalOpen, setIsCreateTransferModalOpen] = useState<boolean>(false);
  const [isApproveTransferModalOpen, setIsApproveTransferModalOpen] = useState<boolean>(false);
  const [isReceiveTransferModalOpen, setIsReceiveTransferModalOpen] = useState<boolean>(false);
  const [selectedTransferForAction, setSelectedTransferForAction] = useState<StockTransfer | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);

  const [transferForm, setTransferForm] = useState({
    companyId: '',
    sourceLocationId: '',
    destinationLocationId: '',
    salesOrderId: '',
    requestedByEmployeeId: '',
    notes: '',
    productId: '',
    requestedQuantity: 10
  });

  const [receiveForm, setReceiveForm] = useState<{ lineReceipts: { [lineId: string]: number } }>({
    lineReceipts: {}
  });

  const [approveForm, setApproveForm] = useState<{ lineApprovals: { [lineId: string]: number } }>({
    lineApprovals: {}
  });

  // Company-scoped helper lists for robust modal selection & validation
  const transferCompanyId = transferForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
  const transferLocations = useMemo(() => locations.filter(l => !transferCompanyId || l.companyId === transferCompanyId), [locations, transferCompanyId]);
  const transferProducts = useMemo(() => products.filter(p => !transferCompanyId || p.companyId === transferCompanyId), [products, transferCompanyId]);
  const transferEmployees = useMemo(() => employees.filter(e => !transferCompanyId || e.companyId === transferCompanyId), [employees, transferCompanyId]);

  const reconcileCompanyId = reconcileForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
  const reconcileLocations = useMemo(() => locations.filter(l => !reconcileCompanyId || l.companyId === reconcileCompanyId), [locations, reconcileCompanyId]);
  const reconcileProducts = useMemo(() => products.filter(p => !reconcileCompanyId || p.companyId === reconcileCompanyId), [products, reconcileCompanyId]);

  const availabilityCompanyId = availabilityForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
  const availabilityLocations = useMemo(() => locations.filter(l => !availabilityCompanyId || l.companyId === availabilityCompanyId), [locations, availabilityCompanyId]);
  const availabilityProducts = useMemo(() => products.filter(p => !availabilityCompanyId || p.companyId === availabilityCompanyId), [products, availabilityCompanyId]);

  const openingCompanyId = openingForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
  const openingLocations = useMemo(() => locations.filter(l => !openingCompanyId || l.companyId === openingCompanyId), [locations, openingCompanyId]);
  const openingProducts = useMemo(() => products.filter(p => !openingCompanyId || p.companyId === openingCompanyId), [products, openingCompanyId]);

  const reserveCompanyId = reserveForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
  const reserveLocations = useMemo(() => locations.filter(l => !reserveCompanyId || l.companyId === reserveCompanyId), [locations, reserveCompanyId]);
  const reserveProducts = useMemo(() => products.filter(p => !reserveCompanyId || p.companyId === reserveCompanyId), [products, reserveCompanyId]);

  // ----------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // ----------------------------------------------------
  const loadMasterData = useCallback(async () => {
    try {
      const [compRes, prodRes, brRes, deptRes, whRes, empRes] = await Promise.allSettled([
        fetchCompanies(),
        fetchProducts(),
        fetchBranches(),
        fetchDepartments(),
        fetchWarehouses(),
        fetchEmployees()
      ]);

      if (compRes.status === 'fulfilled') {
        const cItems = compRes.value?.items || (Array.isArray(compRes.value) ? compRes.value : []);
        setCompanies(cItems);
      }
      if (prodRes.status === 'fulfilled') {
        const pItems = prodRes.value?.items || (Array.isArray(prodRes.value) ? prodRes.value : []);
        setProducts(pItems);
      }
      if (brRes.status === 'fulfilled') {
        const bItems = brRes.value?.items || (Array.isArray(brRes.value) ? brRes.value : []);
        setBranches(bItems);
      }
      if (deptRes.status === 'fulfilled') {
        const dItems = deptRes.value?.items || (Array.isArray(deptRes.value) ? deptRes.value : []);
        setDepartments(dItems);
      }
      if (whRes.status === 'fulfilled') {
        const wItems = whRes.value?.items || (Array.isArray(whRes.value) ? whRes.value : []);
        setWarehouses(wItems);
      }
      if (empRes.status === 'fulfilled') {
        const eItems = empRes.value?.items || (Array.isArray(empRes.value) ? empRes.value : []);
        setEmployees(eItems);
      }
    } catch (err) {
      console.error('Failed loading inventory master data', err);
    }
  }, []);

  const loadInventoryData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const targetCompany = filterCompanyId || undefined;
      const [locs, bals, txns, resvs, trfs] = await Promise.all([
        inventoryService.fetchInventoryLocations({
          companyId: targetCompany,
          search: searchQuery || undefined
        }),
        inventoryService.fetchInventoryBalances({
          companyId: targetCompany,
          inventoryLocationId: filterLocationId || undefined,
          productId: filterProductId || undefined,
          search: searchQuery || undefined
        }),
        inventoryService.fetchInventoryTransactions({
          companyId: targetCompany,
          inventoryLocationId: filterLocationId || undefined,
          productId: filterProductId || undefined,
          transactionType: filterTxnType || undefined,
          search: searchQuery || undefined
        }),
        inventoryService.fetchInventoryReservations({
          companyId: targetCompany,
          inventoryLocationId: filterLocationId || undefined,
          productId: filterProductId || undefined,
          status: filterReservationStatus || undefined,
          search: searchQuery || undefined
        }),
        inventoryService.fetchStockTransfers({
          companyId: targetCompany,
          search: searchQuery || undefined
        })
      ]);

      setLocations(Array.isArray(locs) ? locs : (locs as any)?.items || []);
      setBalances(Array.isArray(bals) ? bals : (bals as any)?.items || []);
      setTransactions(Array.isArray(txns) ? txns : (txns as any)?.items || []);
      setReservations(Array.isArray(resvs) ? resvs : (resvs as any)?.items || []);
      setTransfers(Array.isArray(trfs) ? trfs : (trfs as any)?.items || []);
    } catch (err: any) {
      console.error('Failed fetching inventory data', err);
      setErrorMessage('Unable to load real-time inventory data from backend services.');
      onTriggerToast('error', 'Inventory API Error', 'Failed to synchronize with inventory engine.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterCompanyId, filterLocationId, filterProductId, filterTxnType, filterReservationStatus, searchQuery, onTriggerToast]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // ----------------------------------------------------
  // REAL DASHBOARD KPIS (4 ESSENTIAL LIVE METRICS)
  // ----------------------------------------------------
  const kpis = useMemo(() => {
    const totalLocations = locations.length;
    const activeLocations = locations.filter(l => l.isActive).length;
    const totalOnHand = balances.reduce((sum, b) => sum + (Number(b.onHandQuantity) || 0), 0);
    const totalAvailable = balances.reduce((sum, b) => sum + (Number(b.availableQuantity) || 0), 0);
    const totalTransactions = transactions.length;

    return {
      totalOnHand,
      totalAvailable,
      totalLocations,
      activeLocations,
      totalTransactions
    };
  }, [locations, balances, transactions]);

  // ----------------------------------------------------
  // FORM HANDLERS
  // ----------------------------------------------------
  const handleOpenOpeningStockModal = () => {
    setOpeningForm({
      companyId: filterCompanyId || (companies.length > 0 ? companies[0].id : ''),
      inventoryLocationId: locations.length > 0 ? locations[0].id : '',
      productId: products.length > 0 ? products[0].id : '',
      openingQuantity: 10,
      batchNumber: '',
      expiryDate: '',
      notes: ''
    });
    setIsOpeningModalOpen(true);
  };

  const handleSubmitOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCompanyId = openingForm.companyId || filterCompanyId || (companies[0]?.id ?? '');
    const qty = Number(openingForm.openingQuantity);
    if (!openingForm.inventoryLocationId || !openingForm.productId || isNaN(qty) || qty <= 0) {
      onTriggerToast('warning', 'Validation Error', 'Please select location, product and valid opening quantity greater than 0.');
      return;
    }

    try {
      const selectedProd = products.find(p => p.id === openingForm.productId);
      const req: PostInventoryTransactionRequest = {
        companyId: effectiveCompanyId || (selectedProd?.companyId ?? ''),
        inventoryLocationId: openingForm.inventoryLocationId,
        productId: openingForm.productId,
        transactionType: 'OpeningBalance',
        quantity: qty,
        batchNumber: openingForm.batchNumber || null,
        expiryDate: openingForm.expiryDate ? `${openingForm.expiryDate}T00:00:00Z` : null,
        notes: openingForm.notes || 'Opening stock established via inventory UI'
      };

      await inventoryService.postInventoryTransaction(req);
      setIsOpeningModalOpen(false);
      onTriggerToast('success', 'Opening Balance Established', 'Initial stock balance recorded in immutable ledger.');
      loadInventoryData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to establish opening balance.';
      onTriggerToast('error', 'Transaction Failed', msg);
    }
  };

  const getNextLocationCode = (compId: string) => {
    const compLocs = locations.filter(l => !compId || l.companyId === compId);
    let maxSeq = 0;
    const existingCodeSet = new Set(compLocs.map(l => (l.code || '').toUpperCase().trim()));

    compLocs.forEach(l => {
      const code = (l.code || '').toUpperCase().trim();
      if (code.startsWith('LOC-')) {
        const num = parseInt(code.substring(4), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      } else if (/^\d+$/.test(code)) {
        const num = parseInt(code, 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });

    let candidateSeq = Math.max(1, maxSeq + 1);
    let candidateCode = `LOC-${String(candidateSeq).padStart(3, '0')}`;

    while (existingCodeSet.has(candidateCode)) {
      candidateSeq++;
      candidateCode = `LOC-${String(candidateSeq).padStart(3, '0')}`;
    }

    return candidateCode;
  };

  const handleOpenLocationModal = (locToEdit?: InventoryLocation) => {
    if (locToEdit) {
      setEditingLocation(locToEdit);
      setLocationForm({
        companyId: locToEdit.companyId,
        branchId: locToEdit.branchId || '',
        warehouseId: locToEdit.warehouseId || '',
        departmentId: locToEdit.departmentId || '',
        code: locToEdit.code,
        name: locToEdit.name,
        locationType: locToEdit.locationType || 'Standard',
        isActive: locToEdit.isActive
      });
    } else {
      setEditingLocation(null);
      const targetComp = filterCompanyId || (companies.length > 0 ? companies[0].id : '');
      setLocationForm({
        companyId: targetComp,
        branchId: '',
        warehouseId: '',
        departmentId: '',
        code: getNextLocationCode(targetComp),
        name: '',
        locationType: 'Standard',
        isActive: true
      });
    }
    setIsLocationModalOpen(true);
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.code || !locationForm.name) {
      onTriggerToast('warning', 'Validation Error', 'Location Code and Name are required.');
      return;
    }

    try {
      if (editingLocation) {
        await inventoryService.updateInventoryLocation(editingLocation.id, {
          id: editingLocation.id,
          branchId: locationForm.branchId || null,
          warehouseId: locationForm.warehouseId || null,
          departmentId: locationForm.departmentId || null,
          code: locationForm.code,
          name: locationForm.name,
          locationType: locationForm.locationType,
          isActive: locationForm.isActive
        });
        onTriggerToast('success', 'Location Updated', `Inventory location ${locationForm.name} modified.`);
      } else {
        await inventoryService.createInventoryLocation({
          companyId: locationForm.companyId || (companies.length > 0 ? companies[0].id : undefined),
          branchId: locationForm.branchId || null,
          warehouseId: locationForm.warehouseId || null,
          departmentId: locationForm.departmentId || null,
          code: locationForm.code,
          name: locationForm.name,
          locationType: locationForm.locationType
        });
        onTriggerToast('success', 'Location Created', `New inventory location ${locationForm.name} registered.`);
      }
      setIsLocationModalOpen(false);
      loadInventoryData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed saving inventory location.';
      onTriggerToast('error', 'Location Action Failed', msg);
    }
  };

  const handleToggleDeactivateLocation = async (loc: InventoryLocation) => {
    try {
      if (loc.isActive) {
        await inventoryService.deleteInventoryLocation(loc.id);
        onTriggerToast('warning', 'Location Deactivated', `Location ${loc.name} is now inactive.`);
      } else {
        await inventoryService.updateInventoryLocation(loc.id, {
          ...loc,
          isActive: true
        });
        onTriggerToast('success', 'Location Reactivated', `Location ${loc.name} is now active.`);
      }
      loadInventoryData(true);
    } catch (err: any) {
      onTriggerToast('error', 'Action Failed', err?.message || 'Could not toggle location status.');
    }
  };

  const handleRunReconciliation = async () => {
    if (!reconcileForm.inventoryLocationId || !reconcileForm.productId) {
      onTriggerToast('warning', 'Selection Required', 'Please select location and product to reconcile.');
      return;
    }
    setIsReconciling(true);
    try {
      const selectedLoc = locations.find(l => l.id === reconcileForm.inventoryLocationId);
      const res = await inventoryService.reconcileInventory({
        companyId: selectedLoc?.companyId || filterCompanyId || (companies[0]?.id ?? ''),
        inventoryLocationId: reconcileForm.inventoryLocationId,
        productId: reconcileForm.productId
      });
      setReconciliationResult(res);
      if (res.isReconciled) {
        onTriggerToast('success', 'Reconciliation Verified', 'Ledger matches current on-hand stock with 0 discrepancy.');
      } else {
        onTriggerToast('warning', 'Discrepancy Detected', `Discrepancy of ${res.discrepancy} units found.`);
      }
    } catch (err: any) {
      onTriggerToast('error', 'Reconciliation Failed', err?.message || 'Could not verify ledger balance.');
    } finally {
      setIsReconciling(false);
    }
  };

  // Helper formatting for hierarchy scope tags
  const renderHierarchyTag = (loc: { branchName?: string | null; warehouseName?: string | null; departmentName?: string | null; companyName?: string | null }) => {
    const parts: string[] = [];
    if (loc.branchName) parts.push(`Branch: ${loc.branchName}`);
    if (loc.warehouseName) parts.push(`Wh: ${loc.warehouseName}`);
    if (loc.departmentName) parts.push(`Dept: ${loc.departmentName}`);

    if (parts.length === 0) {
      return (
        <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
          Company Level
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {parts.map((p, idx) => (
          <span key={idx} className="inline-flex items-center text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
            {p}
          </span>
        ))}
      </div>
    );
  };

  const getTxnTypeBadge = (type: string, signedQty: number) => {
    const isPositive = signedQty > 0;
    const isNegative = signedQty < 0;

    let variant: 'success' | 'danger' | 'primary' | 'warning' | 'info' = 'primary';
    if (type === 'OpeningBalance') variant = 'primary';
    else if (type === 'GoodsReceipt' || type === 'AdjustmentIncrease' || type === 'TransferIn') variant = 'success';
    else if (type === 'GoodsIssue' || type === 'AdjustmentDecrease' || type === 'TransferOut') variant = 'danger';

    return (
      <div className="flex items-center gap-1.5">
        <Badge variant={variant}>{type}</Badge>
        <span className={`font-mono text-xs font-bold ${isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-slate-600'}`}>
          {isPositive ? `+${signedQty}` : signedQty}
        </span>
      </div>
    );
  };

  // Helper formatting for reservation status
  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="primary">Active</Badge>;
      case 'Allocated':
        return <Badge variant="warning">Allocated</Badge>;
      case 'Fulfilled':
        return <Badge variant="success">Fulfilled</Badge>;
      case 'Released':
        return <Badge variant="neutral">Released</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'Expired':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleReserveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(reserveForm.requestedQuantity);
    if (!reserveForm.inventoryLocationId || !reserveForm.productId || isNaN(qty) || qty <= 0) {
      onTriggerToast('warning', 'Validation Error', 'Please select location, product, and enter a valid quantity greater than 0.');
      return;
    }
    setIsSubmittingReservation(true);
    try {
      const res = await inventoryService.reserveStock({
        companyId: reserveForm.companyId || filterCompanyId || (companies[0]?.id ?? ''),
        inventoryLocationId: reserveForm.inventoryLocationId,
        productId: reserveForm.productId,
        requestedQuantity: qty,
        salesOrderId: reserveForm.salesOrderId || undefined,
        salesOrderLineId: reserveForm.salesOrderLineId || undefined,
        expiresAtUtc: reserveForm.expiresAtUtc ? new Date(reserveForm.expiresAtUtc).toISOString() : undefined
      });
      onTriggerToast('success', 'Stock Reserved', `Reserved ${res.reservedQuantity} units. Available stock updated.`);
      setIsReserveModalOpen(false);
      setReserveForm({
        companyId: '',
        inventoryLocationId: '',
        productId: '',
        requestedQuantity: 1,
        salesOrderId: '',
        salesOrderLineId: '',
        expiresAtUtc: ''
      });
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to reserve stock';
      onTriggerToast('error', 'Reservation Failed', detail);
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleReleaseReservation = async (reservation: InventoryReservation) => {
    if (!window.confirm(`Release reservation for ${reservation.reservedQuantity} units of ${reservation.productName}? This will restore available stock without modifying on-hand quantity.`)) {
      return;
    }
    try {
      await inventoryService.releaseReservation(reservation.id, reservation.companyId);
      onTriggerToast('success', 'Reservation Released', `Stock reservation released. Available stock restored.`);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to release reservation';
      onTriggerToast('error', 'Release Failed', detail);
    }
  };

  const handleCancelReservation = async (reservation: InventoryReservation) => {
    if (!window.confirm(`Cancel reservation for ${reservation.reservedQuantity} units of ${reservation.productName}?`)) {
      return;
    }
    try {
      await inventoryService.cancelReservation(reservation.id, reservation.companyId);
      onTriggerToast('info', 'Reservation Cancelled', `Stock reservation cancelled.`);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to cancel reservation';
      onTriggerToast('error', 'Cancel Failed', detail);
    }
  };

  const handleCheckAvailability = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const qty = Number(availabilityForm.requestedQuantity);
    if (!availabilityForm.inventoryLocationId || !availabilityForm.productId || isNaN(qty) || qty <= 0) {
      onTriggerToast('warning', 'Validation Error', 'Please select location, product, and positive requested quantity.');
      return;
    }
    setIsCheckingAvailability(true);
    setAvailabilityResult(null);
    setAlternativeLocations(null);
    try {
      const res = await inventoryService.checkStockAvailability({
        companyId: availabilityForm.companyId || filterCompanyId || (companies[0]?.id ?? ''),
        inventoryLocationId: availabilityForm.inventoryLocationId,
        productId: availabilityForm.productId,
        requestedQuantity: qty
      });
      setAvailabilityResult(res);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to evaluate stock availability';
      onTriggerToast('error', 'Availability Check Failed', detail);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleFindAlternatives = async () => {
    if (!availabilityResult) return;
    setIsLoadingAlternatives(true);
    try {
      const alts = await inventoryService.fetchAlternativeLocations({
        companyId: availabilityResult.companyId,
        productId: availabilityResult.productId,
        requestedQuantity: availabilityResult.requestedQuantity,
        excludedLocationId: availabilityResult.inventoryLocationId
      });
      setAlternativeLocations(alts);
    } catch (err: any) {
      onTriggerToast('error', 'Alternative Search Failed', 'Failed to retrieve alternate locations.');
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const getTransferStatusBadge = (status: string) => {
    switch (status) {
      case 'Requested':
        return <Badge variant="warning">Requested</Badge>;
      case 'Approved':
        return <Badge variant="info">Approved</Badge>;
      case 'Dispatched':
      case 'InTransit':
        return <Badge variant="primary">In Transit</Badge>;
      case 'Received':
        return <Badge variant="info">Received</Badge>;
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceLocationId || !transferForm.destinationLocationId || !transferForm.productId || transferForm.requestedQuantity <= 0) {
      onTriggerToast('warning', 'Validation Error', 'Please select source, destination, product, and valid quantity.');
      return;
    }
    if (transferForm.sourceLocationId === transferForm.destinationLocationId) {
      onTriggerToast('warning', 'Validation Error', 'Source and destination locations cannot be identical.');
      return;
    }
    setIsSubmittingTransfer(true);
    try {
      const res = await inventoryService.createStockTransfer({
        companyId: transferForm.companyId || filterCompanyId || (companies[0]?.id ?? ''),
        sourceLocationId: transferForm.sourceLocationId,
        destinationLocationId: transferForm.destinationLocationId,
        salesOrderId: transferForm.salesOrderId || undefined,
        requestedByEmployeeId: transferForm.requestedByEmployeeId || (employees[0]?.id ?? ''),
        notes: transferForm.notes || undefined,
        lines: [
          {
            productId: transferForm.productId,
            requestedQuantity: Number(transferForm.requestedQuantity)
          }
        ]
      });
      onTriggerToast('success', 'Transfer Created', `Transfer ${res.transferNumber} created successfully.`);
      setIsCreateTransferModalOpen(false);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create transfer';
      onTriggerToast('error', 'Transfer Creation Failed', detail);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleApproveTransfer = async (transfer: StockTransfer) => {
    try {
      const approverId = employees[0]?.id ?? user?.id ?? '';
      await inventoryService.approveStockTransfer(transfer.id, {
        approvedByEmployeeId: approverId
      }, transfer.companyId);
      onTriggerToast('success', 'Transfer Approved', `Transfer ${transfer.transferNumber} is approved and ready for dispatch.`);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to approve transfer';
      onTriggerToast('error', 'Approval Failed', detail);
    }
  };

  const handleDispatchTransfer = async (transfer: StockTransfer) => {
    if (!window.confirm(`Dispatch transfer ${transfer.transferNumber}? This will deduct physical stock from ${transfer.sourceLocationName} and mark status as In Transit.`)) {
      return;
    }
    try {
      await inventoryService.dispatchStockTransfer(transfer.id, transfer.companyId);
      onTriggerToast('success', 'Transfer Dispatched', `Stock dispatched from ${transfer.sourceLocationName}. Inventory is now in transit.`);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to dispatch transfer';
      onTriggerToast('error', 'Dispatch Failed', detail);
    }
  };

  const handleOpenReceiveModal = (transfer: StockTransfer) => {
    setSelectedTransferForAction(transfer);
    const initialReceipts: { [lineId: string]: number } = {};
    transfer.lines.forEach(l => {
      initialReceipts[l.id] = Math.max(0, l.dispatchedQuantity - l.receivedQuantity);
    });
    setReceiveForm({ lineReceipts: initialReceipts });
    setIsReceiveTransferModalOpen(true);
  };

  const handleSubmitReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferForAction) return;

    const lineReceipts = Object.entries(receiveForm.lineReceipts).map(([lineId, qty]) => ({
      lineId,
      receivedQuantity: Number(qty)
    })).filter(lr => lr.receivedQuantity > 0);

    if (lineReceipts.length === 0) {
      onTriggerToast('warning', 'Validation Error', 'Please enter receiving quantity greater than 0.');
      return;
    }

    try {
      await inventoryService.receiveStockTransfer(selectedTransferForAction.id, {
        lineReceipts
      }, selectedTransferForAction.companyId);

      onTriggerToast('success', 'Stock Received', `Received stock at ${selectedTransferForAction.destinationLocationName}. Inventory balance updated.`);
      setIsReceiveTransferModalOpen(false);
      setSelectedTransferForAction(null);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to receive transfer';
      onTriggerToast('error', 'Receive Failed', detail);
    }
  };

  const handleCancelTransfer = async (transfer: StockTransfer) => {
    if (!window.confirm(`Cancel transfer ${transfer.transferNumber}?`)) {
      return;
    }
    try {
      await inventoryService.cancelStockTransfer(transfer.id, transfer.companyId);
      onTriggerToast('info', 'Transfer Cancelled', `Transfer ${transfer.transferNumber} cancelled.`);
      loadInventoryData(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to cancel transfer';
      onTriggerToast('error', 'Cancel Failed', detail);
    }
  };


  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: TOP HEADER & PRIMARY ACTIONS */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Inventory Management</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor stock, inventory locations, and stock movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="Synchronize live balances & transactions from backend">
            <button
              onClick={() => loadInventoryData(true)}
              disabled={isRefreshing}
              aria-label="Refresh inventory data"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </Tooltip>

          <Tooltip content="Evaluate real-time stock availability and find alternate locations">
            <button
              onClick={() => {
                const compId = filterCompanyId || (companies[0]?.id ?? '');
                const compLocs = locations.filter(l => !compId || l.companyId === compId);
                const compProds = products.filter(p => !compId || p.companyId === compId);
                setAvailabilityForm({
                  companyId: compId,
                  inventoryLocationId: filterLocationId || compLocs[0]?.id || '',
                  productId: filterProductId || compProds[0]?.id || '',
                  requestedQuantity: 1
                });
                setAvailabilityResult(null);
                setAlternativeLocations(null);
                setIsAvailabilityModalOpen(true);
              }}
              aria-label="Check Availability"
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Compass size={14} />
              <span>Check Availability</span>
            </button>
          </Tooltip>

          <Tooltip content="Reserve available stock for a confirmed order or demand allocation">
            <button
              onClick={() => {
                const compId = filterCompanyId || (companies[0]?.id ?? '');
                const compLocs = locations.filter(l => !compId || l.companyId === compId);
                const compProds = products.filter(p => !compId || p.companyId === compId);
                setReserveForm({
                  companyId: compId,
                  inventoryLocationId: filterLocationId || compLocs[0]?.id || '',
                  productId: filterProductId || compProds[0]?.id || '',
                  requestedQuantity: 1,
                  salesOrderId: '',
                  salesOrderLineId: '',
                  expiresAtUtc: ''
                });
                setIsReserveModalOpen(true);
              }}
              aria-label="Reserve Stock"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <BookmarkCheck size={14} />
              <span>Reserve Stock</span>
            </button>
          </Tooltip>

          <Tooltip content="Establish initial product stock through immutable transaction ledger">
            <button
              onClick={handleOpenOpeningStockModal}
              aria-label="Establish Opening Stock"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Establish Opening Stock</span>
            </button>
          </Tooltip>

          <Tooltip content="Register a new inventory staging location or facility node">
            <button
              onClick={() => handleOpenLocationModal()}
              aria-label="Add Location"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Layers size={14} />
              <span>Add Location</span>
            </button>
          </Tooltip>

          <Tooltip content="Audit tool comparing current balance against historical ledger sum">
            <button
              onClick={() => {
                const compId = filterCompanyId || (companies[0]?.id ?? '');
                const compLocs = locations.filter(l => !compId || l.companyId === compId);
                const compProds = products.filter(p => !compId || p.companyId === compId);
                setReconcileForm({
                  companyId: compId,
                  inventoryLocationId: compLocs[0]?.id ?? '',
                  productId: compProds[0]?.id ?? ''
                });
                setReconciliationResult(null);
                setIsReconcileModalOpen(true);
              }}
              aria-label="Reconcile Ledger"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShieldCheck size={14} />
              <span>Reconcile Ledger</span>
            </button>
          </Tooltip>

          <Tooltip content="Request an inter-facility or warehouse stock transfer">
            <button
              onClick={() => {
                const compId = filterCompanyId || (companies[0]?.id ?? '');
                const compLocs = locations.filter(l => !compId || l.companyId === compId);
                const compProds = products.filter(p => !compId || p.companyId === compId);
                const compEmps = employees.filter(e => !compId || e.companyId === compId);
                setTransferForm({
                  companyId: compId,
                  sourceLocationId: compLocs[0]?.id ?? '',
                  destinationLocationId: compLocs[1]?.id ?? compLocs[0]?.id ?? '',
                  salesOrderId: '',
                  requestedByEmployeeId: compEmps[0]?.id ?? '',
                  notes: '',
                  productId: compProds[0]?.id ?? '',
                  requestedQuantity: 10
                });
                setIsCreateTransferModalOpen(true);
              }}
              aria-label="Create Transfer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <ArrowLeftRight size={14} />
              <span>Create Transfer</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2: CLEAN 6-TAB PRIMARY NAVIGATION */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex overflow-x-auto gap-1">
        {[
          { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
          { id: 'stock' as TabType, label: 'Stock', icon: Package },
          { id: 'locations' as TabType, label: 'Locations', icon: Layers },
          { id: 'movements' as TabType, label: 'Stock Movements', icon: History },
          { id: 'reservations' as TabType, label: 'Reservations', icon: BookmarkCheck },
          { id: 'transfers' as TabType, label: 'Transfers', icon: ArrowLeftRight }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* GLOBAL ERROR BANNER */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => loadInventoryData(true)}
            className="ml-auto underline font-bold cursor-pointer hover:text-rose-900"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* LEVEL 3: TAB CONTENT */}
      {/* ---------------------------------------------------- */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ROW 1: 4 ESSENTIAL LIVE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total On-Hand Stock"
              value={`${kpis.totalOnHand.toLocaleString()} Units`}
              badgeText="Live Ledger"
              badgeVariant="success"
              subLabel="Stock Valuation"
              subValue="Recorded Units"
            />
            <StatCard
              title="Available Stock"
              value={`${kpis.totalAvailable.toLocaleString()} Units`}
              badgeText="ATP"
              badgeVariant="primary"
              subLabel="Unreserved Stock"
              subValue={`${kpis.totalAvailable.toLocaleString()} Available`}
            />
            <StatCard
              title="Inventory Locations"
              value={kpis.totalLocations}
              badgeText={`${kpis.activeLocations} Active`}
              badgeVariant="info"
              subLabel="Hierarchy Nodes"
              subValue={companies.length > 0 ? `${companies.length} Companies` : '1 Company'}
            />
            <StatCard
              title="Stock Ledger Events"
              value={kpis.totalTransactions}
              badgeText="Audit Events"
              badgeVariant="warning"
              subLabel="Immutable Records"
              subValue="Total Transactions"
            />
          </div>

          {/* ROW 2: RECENT MOVEMENTS (LEFT) & LOCATION SUMMARY (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Stock Movements */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Stock Movements</h3>
                </div>
                <button
                  onClick={() => handleTabChange('movements')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading live stock transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <History size={28} className="mx-auto text-slate-300" />
                  <div className="font-semibold text-slate-700">No stock movements recorded.</div>
                  <p className="text-[11px] text-slate-400">Use 'Establish Opening Stock' to record initial inventory.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Transaction</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5 text-right">Balance After</th>
                        <th className="p-2.5 text-center">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 5).map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                            {new Date(txn.createdAtUtc).toLocaleString('en-IN', {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-2.5">{getTxnTypeBadge(txn.transactionType, txn.signedQuantity)}</td>
                          <td className="p-2.5 font-medium text-slate-800">
                            <div>{txn.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{txn.sku || txn.productCode}</div>
                          </td>
                          <td className="p-2.5 text-slate-600">
                            <div>{txn.inventoryLocationName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{txn.inventoryLocationCode}</div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {Number(txn.balanceAfter).toFixed(2)} {txn.baseUomName || 'units'}
                          </td>
                          <td className="p-2.5 text-center">
                            <Tooltip content="Inspect immutable audit event">
                              <button
                                onClick={() => setSelectedTxnForDetail(txn)}
                                aria-label="Inspect transaction"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right 1 Col: Location Stock Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">Inventory Location Summary</h3>
                </div>
                <button
                  onClick={() => handleTabChange('locations')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {locations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <Layers size={28} className="mx-auto text-slate-300" />
                  <div className="font-semibold text-slate-700">No inventory locations registered.</div>
                  <p className="text-[11px] text-slate-400">Click 'Add Location' above to configure storage nodes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.slice(0, 4).map(loc => {
                    const locBalances = balances.filter(b => b.inventoryLocationId === loc.id);
                    const locOnHand = locBalances.reduce((sum, b) => sum + Number(b.onHandQuantity), 0);
                    return (
                      <div key={loc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-slate-800">{loc.name}</div>
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {locOnHand.toLocaleString()} units
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono">{loc.code}</span>
                          <span className="text-[10px] text-slate-400">{locBalances.length} SKUs</span>
                        </div>
                        {renderHierarchyTag(loc)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: STOCK SUMMARY BY LOCATION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Stock Summary by Location</h3>
              </div>
              <button
                onClick={() => handleTabChange('stock')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Stock Master</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {balances.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Package size={28} className="mx-auto text-slate-300" />
                <div className="font-semibold text-slate-700">No stock balances recorded.</div>
                <p className="text-[11px] text-slate-400">Establish initial stock balances to see real-time distribution.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Location Name & Code</th>
                      <th className="p-2.5">Hierarchy Scope</th>
                      <th className="p-2.5 text-center">Active SKUs</th>
                      <th className="p-2.5 text-right">Total On-Hand</th>
                      <th className="p-2.5 text-right">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locations.map(loc => {
                      const locBals = balances.filter(b => b.inventoryLocationId === loc.id);
                      const locOnHand = locBals.reduce((sum, b) => sum + Number(b.onHandQuantity), 0);
                      const locAvail = locBals.reduce((sum, b) => sum + Number(b.availableQuantity), 0);
                      return (
                        <tr key={loc.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-2.5 font-medium text-slate-800">
                            <div>{loc.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loc.code}</div>
                          </td>
                          <td className="p-2.5">{renderHierarchyTag(loc)}</td>
                          <td className="p-2.5 text-center font-mono text-slate-700">{locBals.length}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {locOnHand.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {locAvail.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ROW 4: COMPACT PLANNED INVENTORY FEATURES */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Planned Inventory Features</h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-200 px-2 py-0.5 rounded">
                Coming in Future Phases
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              The following modules will integrate with this verified stock engine in upcoming phases:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Stock Reservations',
                'Multi-Facility Transfers',
                'Goods Inbound / Receiving',
                'Picking Waves',
                'Packing Stations',
                'Outbound Dispatch',
                'Delivery Tracking',
                'Cycle Counting',
                'Adjustment Approvals',
                'Batch & Expiry Control',
                'ABC / XYZ Analytics'
              ].map((feat, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-2xs select-none"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: STOCK */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-64">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search SKU, product, location..."
                />
              </div>

              {isSuperAdmin && companies.length > 0 && (
                <select
                  value={filterCompanyId}
                  onChange={e => setFilterCompanyId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="">All Companies</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.legalName || c.name}</option>
                  ))}
                </select>
              )}

              {locations.length > 0 && (
                <select
                  value={filterLocationId}
                  onChange={e => setFilterLocationId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="">All Inventory Locations</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenOpeningStockModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Establish Opening Stock
              </button>
            </div>
          </div>

          {/* Balances Table */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading real inventory balances...</div>
          ) : balances.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <Package size={36} className="mx-auto text-slate-300" />
              <div className="font-bold text-slate-800 text-sm">No stock balances recorded.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No product stock has been recorded for the selected filter context. Establish initial stock to begin tracking.
              </p>
              <button
                onClick={handleOpenOpeningStockModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Establish Opening Stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Inventory Location</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3 text-right">On Hand</th>
                    <th className="p-3 text-right">Reserved</th>
                    <th className="p-3 text-right">Allocated</th>
                    <th className="p-3 text-right">Available</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3">Last Movement</th>
                    <th className="p-3 text-center">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-bold text-blue-600">{b.sku || b.productCode}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{b.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.productCode}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-medium">{b.inventoryLocationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.inventoryLocationCode}</div>
                      </td>
                      <td className="p-3">{renderHierarchyTag(b as any)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {Number(b.onHandQuantity).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-600 font-medium">
                        {Number(b.reservedQuantity).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-600 font-medium">
                        {Number(b.allocatedQuantity).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {Number(b.availableQuantity).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{b.baseUomName || 'unit'}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {b.lastMovementAtUtc
                          ? new Date(b.lastMovementAtUtc).toLocaleString('en-IN', {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'None'}
                      </td>
                      <td className="p-3 text-center">
                        <Tooltip content="View ledger audit history for this balance">
                          <button
                            onClick={() => {
                              setFilterLocationId(b.inventoryLocationId);
                              setFilterProductId(b.productId);
                              handleTabChange('movements');
                            }}
                            aria-label="View ledger"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                          >
                            <History size={14} />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: LOCATIONS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-64">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search location code, name..."
                />
              </div>
            </div>

            <button
              onClick={() => handleOpenLocationModal()}
              aria-label="Add Location"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Location
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading inventory locations...</div>
          ) : locations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <Layers size={36} className="mx-auto text-slate-300" />
              <div className="font-bold text-slate-800 text-sm">No inventory locations registered.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Inventory balances and transactions require at least one location node in the hierarchy.
              </p>
              <button
                onClick={() => handleOpenLocationModal()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Add First Location
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Location Code</th>
                    <th className="p-3">Location Name</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Warehouse</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{loc.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{loc.name}</td>
                      <td className="p-3 text-slate-600">{loc.companyName || 'Company'}</td>
                      <td className="p-3 text-slate-600">{loc.branchName || '—'}</td>
                      <td className="p-3 text-slate-600">{loc.warehouseName || '—'}</td>
                      <td className="p-3 text-slate-600">{loc.departmentName || '—'}</td>
                      <td className="p-3">
                        <Badge variant="primary">{loc.locationType || 'Standard'}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={loc.isActive ? 'success' : 'danger'}>
                          {loc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip content="Edit location details">
                            <button
                              onClick={() => handleOpenLocationModal(loc)}
                              aria-label="Edit location"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            >
                              <Sliders size={14} />
                            </button>
                          </Tooltip>

                          <Tooltip content={loc.isActive ? 'Deactivate location' : 'Reactivate location'}>
                            <button
                              onClick={() => handleToggleDeactivateLocation(loc)}
                              aria-label={loc.isActive ? 'Deactivate location' : 'Reactivate location'}
                              className={`p-1.5 rounded transition cursor-pointer ${
                                loc.isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {loc.isActive ? <X size={14} /> : <Check size={14} />}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: STOCK MOVEMENTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-64">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search reference, product, SKU..."
                />
              </div>

              <select
                value={filterTxnType}
                onChange={e => setFilterTxnType(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="">All Transaction Types</option>
                <option value="OpeningBalance">Opening Balance</option>
                <option value="GoodsReceipt">Goods Receipt (+)</option>
                <option value="GoodsIssue">Goods Issue (-)</option>
                <option value="AdjustmentIncrease">Adjustment Increase (+)</option>
                <option value="AdjustmentDecrease">Adjustment Decrease (-)</option>
                <option value="TransferIn">Transfer In (+)</option>
                <option value="TransferOut">Transfer Out (-)</option>
              </select>

              {(filterLocationId || filterProductId || filterTxnType) && (
                <button
                  onClick={() => {
                    setFilterLocationId('');
                    setFilterProductId('');
                    setFilterTxnType('');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200 rounded-lg cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total Recorded Events: <span className="font-bold text-slate-900">{transactions.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading stock movements...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <History size={36} className="mx-auto text-slate-300" />
              <div className="font-bold text-slate-800 text-sm">No stock movements recorded.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No transaction events match the current filter selection.
              </p>
              <button
                onClick={handleOpenOpeningStockModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Establish Opening Stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Transaction</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Balance After</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Performed By</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {new Date(txn.createdAtUtc).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">{getTxnTypeBadge(txn.transactionType, txn.signedQuantity)}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{txn.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{txn.sku || txn.productCode}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div>{txn.inventoryLocationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{txn.inventoryLocationCode}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-700">
                        {Number(txn.quantity).toFixed(2)} {txn.baseUomName || 'units'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {Number(txn.balanceAfter).toFixed(2)}
                      </td>
                      <td className="p-3">
                        {txn.referenceDocumentNumber ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <FileCheck size={12} className="text-slate-500" />
                            {txn.referenceDocumentType ? `${txn.referenceDocumentType}: ` : ''}
                            {txn.referenceDocumentNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {txn.performedByEmployeeName || 'System'}
                      </td>
                      <td className="p-3 text-center">
                        <Tooltip content="View immutable transaction audit record">
                          <button
                            onClick={() => setSelectedTxnForDetail(txn)}
                            aria-label="View Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STOCK RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Reservations Ledger</h2>
              <p className="text-xs text-slate-500">Authoritative stock reservation commitments against inventory balances.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setReserveForm({
                    companyId: filterCompanyId || (companies[0]?.id ?? ''),
                    inventoryLocationId: filterLocationId || locations[0]?.id || '',
                    productId: filterProductId || products[0]?.id || '',
                    requestedQuantity: 1,
                    salesOrderId: '',
                    salesOrderLineId: '',
                    expiresAtUtc: ''
                  });
                  setIsReserveModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <BookmarkCheck size={14} />
                <span>Reserve Stock</span>
              </button>
            </div>
          </div>

          {/* RESERVATIONS FILTERS */}
          <div className="p-4 pt-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
              <SearchInput
                placeholder="Search by product code, name, or location..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                className="w-64 text-xs"
              />

              <select
                value={filterLocationId}
                onChange={e => setFilterLocationId(e.target.value)}
                className="p-2 border rounded-lg border-slate-300 text-xs bg-white text-slate-700"
              >
                <option value="">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </select>

              <select
                value={filterProductId}
                onChange={e => setFilterProductId(e.target.value)}
                className="p-2 border rounded-lg border-slate-300 text-xs bg-white text-slate-700"
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} [{p.sku || p.code}]</option>
                ))}
              </select>

              <select
                value={filterReservationStatus}
                onChange={e => setFilterReservationStatus(e.target.value)}
                className="p-2 border rounded-lg border-slate-300 text-xs bg-white text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Allocated">Allocated</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Released">Released</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>

              {(filterLocationId || filterProductId || filterReservationStatus || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterLocationId('');
                    setFilterProductId('');
                    setFilterReservationStatus('');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200 rounded-lg cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total Reservations: <span className="font-bold text-slate-900">{reservations.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading stock reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <BookmarkCheck size={36} className="mx-auto text-slate-300" />
              <div className="font-bold text-slate-800 text-sm">No stock reservations found.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active or historical reservations match the selected filter criteria.
              </p>
              <button
                onClick={() => {
                  setReserveForm({
                    companyId: filterCompanyId || (companies[0]?.id ?? ''),
                    inventoryLocationId: filterLocationId || locations[0]?.id || '',
                    productId: filterProductId || products[0]?.id || '',
                    requestedQuantity: 1,
                    salesOrderId: '',
                    salesOrderLineId: '',
                    expiresAtUtc: ''
                  });
                  setIsReserveModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Reserve Stock Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Reservation Ref</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Reserved Qty</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Reserved At</th>
                    <th className="p-3">Expires At</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map(resv => (
                    <tr key={resv.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono text-[11px] font-semibold text-indigo-700">
                        {resv.id.substring(0, 8)}...
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{resv.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{resv.sku || resv.productCode}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div>{resv.inventoryLocationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{resv.inventoryLocationCode}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-900 text-sm">
                        {Number(resv.reservedQuantity).toFixed(2)} {resv.baseUomName || 'units'}
                      </td>
                      <td className="p-3 text-center">
                        {getReservationStatusBadge(resv.status)}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {resv.salesOrderId ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            SO: {resv.salesOrderId.substring(0, 8)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {new Date(resv.reservedAtUtc).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {resv.expiresAtUtc ? (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <Clock size={11} />
                            {new Date(resv.expiresAtUtc).toLocaleDateString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">No Expiry</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(resv.status === 'Active' || resv.status === 'Allocated') && (
                            <Tooltip content="Release reservation to restore available stock">
                              <button
                                onClick={() => handleReleaseReservation(resv)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                              >
                                Release
                              </button>
                            </Tooltip>
                          )}
                          {(resv.status === 'Active' || resv.status === 'Pending') && (
                            <Tooltip content="Cancel reservation">
                              <button
                                onClick={() => handleCancelReservation(resv)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </Tooltip>
                          )}
                          {resv.status !== 'Active' && resv.status !== 'Allocated' && resv.status !== 'Pending' && (
                            <span className="text-[11px] text-slate-400 italic">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: STOCK TRANSFERS (MULTI-FACILITY & RECEIVING) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          {/* Transfer Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Transfers"
              value={transfers.length}
              icon={ArrowLeftRight}
              color="indigo"
              description="Lifetime transfer requests"
            />
            <StatCard
              title="Action Required"
              value={transfers.filter(t => t.status === 'Requested' || t.status === 'Approved').length}
              icon={Clock}
              color="amber"
              description="Awaiting approval or dispatch"
            />
            <StatCard
              title="In Transit"
              value={transfers.filter(t => t.status === 'InTransit' || t.status === 'Dispatched').length}
              icon={Truck}
              color="blue"
              description="Stock dispatched, en route"
            />
            <StatCard
              title="Completed"
              value={transfers.filter(t => t.status === 'Completed').length}
              icon={CheckCircle2}
              color="emerald"
              description="Fully received at destination"
            />
          </div>

          {/* Transfers Table Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Multi-Facility Stock Transfers</h3>
                <span className="text-xs text-slate-400 font-mono">({transfers.length} records)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateTransferModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>New Transfer Request</span>
                </button>
              </div>
            </div>

            {transfers.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Truck}
                  title="No Stock Transfers Found"
                  description="There are no active or historical stock transfer requests between inventory locations."
                  actionLabel="Create Transfer Request"
                  onAction={() => setIsCreateTransferModalOpen(true)}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Transfer #</th>
                      <th className="p-3">Source Location</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Items & Qty</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Order Link</th>
                      <th className="p-3">Requested By</th>
                      <th className="p-3">Created Date</th>
                      <th className="p-3 text-center">Workflow Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map(trf => {
                      const firstLine = trf.lines[0];
                      return (
                        <tr key={trf.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-mono text-xs font-bold text-blue-700">
                            {trf.transferNumber}
                          </td>
                          <td className="p-3 text-slate-800">
                            <div className="font-semibold">{trf.sourceLocationName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{trf.sourceLocationCode}</div>
                          </td>
                          <td className="p-3 text-slate-800">
                            <div className="font-semibold text-emerald-700">{trf.destinationLocationName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{trf.destinationLocationCode}</div>
                          </td>
                          <td className="p-3 text-slate-700">
                            {firstLine ? (
                              <div>
                                <span className="font-semibold text-slate-900">{firstLine.productName}</span>
                                <div className="text-[11px] font-mono text-slate-500 flex gap-2 mt-0.5">
                                  <span>Req: <b>{firstLine.requestedQuantity}</b></span>
                                  {trf.status !== 'Requested' && <span>Appr: <b>{firstLine.approvedQuantity}</b></span>}
                                  {firstLine.dispatchedQuantity > 0 && <span>Disp: <b>{firstLine.dispatchedQuantity}</b></span>}
                                  {firstLine.receivedQuantity > 0 && <span className="text-emerald-600 font-bold">Recv: {firstLine.receivedQuantity}</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {getTransferStatusBadge(trf.status)}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">
                            {trf.salesOrderNumber ? (
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                                {trf.salesOrderNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 text-[11px]">
                            <div>{trf.requestedByEmployeeName}</div>
                            {trf.approvedByEmployeeName && (
                              <div className="text-[10px] text-emerald-600">Appr: {trf.approvedByEmployeeName}</div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {new Date(trf.createdAtUtc).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit'
                            })}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {trf.status === 'Requested' && (
                                <>
                                  <Tooltip content="Approve stock transfer request">
                                    <button
                                      onClick={() => handleApproveTransfer(trf)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                                    >
                                      Approve
                                    </button>
                                  </Tooltip>
                                  <Tooltip content="Cancel transfer request">
                                    <button
                                      onClick={() => handleCancelTransfer(trf)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded text-[11px] font-semibold transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </Tooltip>
                                </>
                              )}

                              {trf.status === 'Approved' && (
                                <>
                                  <Tooltip content="Dispatch stock from source location (posts TransferOut transaction)">
                                    <button
                                      onClick={() => handleDispatchTransfer(trf)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                    >
                                      <Send size={11} />
                                      <span>Dispatch</span>
                                    </button>
                                  </Tooltip>
                                  <Tooltip content="Cancel approved transfer before physical dispatch">
                                    <button
                                      onClick={() => handleCancelTransfer(trf)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded text-[11px] font-semibold transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </Tooltip>
                                </>
                              )}

                              {(trf.status === 'InTransit' || trf.status === 'Dispatched') && (
                                <Tooltip content="Receive stock at destination location (posts TransferIn transaction & auto-reserves if linked)">
                                  <button
                                    onClick={() => handleOpenReceiveModal(trf)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                  >
                                    <Package size={11} />
                                    <span>Receive</span>
                                  </button>
                                </Tooltip>
                              )}

                              {trf.status === 'Completed' && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                  <CheckCircle2 size={13} />
                                  <span>Received</span>
                                </span>
                              )}

                              {trf.status === 'Cancelled' && (
                                <span className="text-slate-400 italic text-[11px]">Cancelled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE STOCK TRANSFER */}
      {/* ---------------------------------------------------- */}
      {isCreateTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Request Stock Transfer</h3>
              </div>
              <button
                onClick={() => setIsCreateTransferModalOpen(false)}
                aria-label="Close transfer modal"
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Scope</label>
                  <select
                    value={transferForm.companyId}
                    onChange={e => {
                      const newCompId = e.target.value;
                      const locs = locations.filter(l => !newCompId || l.companyId === newCompId);
                      const prods = products.filter(p => !newCompId || p.companyId === newCompId);
                      const emps = employees.filter(emp => !newCompId || emp.companyId === newCompId);
                      setTransferForm({
                        ...transferForm,
                        companyId: newCompId,
                        sourceLocationId: locs[0]?.id ?? '',
                        destinationLocationId: locs[1]?.id ?? locs[0]?.id ?? '',
                        productId: prods[0]?.id ?? '',
                        requestedByEmployeeId: emps[0]?.id ?? ''
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Company...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.legalName || c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Location (From) *</label>
                  <select
                    value={transferForm.sourceLocationId}
                    onChange={e => setTransferForm({ ...transferForm, sourceLocationId: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Source...</option>
                    {transferLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Location (To) *</label>
                  <select
                    value={transferForm.destinationLocationId}
                    onChange={e => setTransferForm({ ...transferForm, destinationLocationId: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Destination...</option>
                    {transferLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product to Transfer *</label>
                <select
                  value={transferForm.productId}
                  onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">Select Product...</option>
                  {transferProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={transferForm.requestedQuantity}
                    onChange={e => setTransferForm({ ...transferForm, requestedQuantity: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested By Employee</label>
                  <select
                    value={transferForm.requestedByEmployeeId}
                    onChange={e => setTransferForm({ ...transferForm, requestedByEmployeeId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Select Employee...</option>
                    {transferEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason for Transfer</label>
                <input
                  type="text"
                  placeholder="e.g. Replenishment for order fulfillment"
                  value={transferForm.notes}
                  onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingTransfer ? 'Creating Transfer...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: RECEIVE STOCK TRANSFER */}
      {/* ---------------------------------------------------- */}
      {isReceiveTransferModalOpen && selectedTransferForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Receive Stock at Destination</h3>
              </div>
              <button
                onClick={() => setIsReceiveTransferModalOpen(false)}
                aria-label="Close receive modal"
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Number:</span>
                <span className="font-mono font-bold text-blue-700">{selectedTransferForAction.transferNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-semibold text-emerald-700">{selectedTransferForAction.destinationLocationName}</span>
              </div>
              {selectedTransferForAction.salesOrderNumber && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Linked Sales Order:</span>
                  <span>{selectedTransferForAction.salesOrderNumber} (Auto-Reserve on receipt)</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitReceive} className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">Transfer Lines to Receive</label>
                {selectedTransferForAction.lines.map(line => {
                  const remaining = Math.max(0, line.dispatchedQuantity - line.receivedQuantity);
                  return (
                    <div key={line.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-900">{line.productName}</span>
                        <span className="text-slate-400 font-mono">Dispatched: {line.dispatchedQuantity}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">Already Received: <b>{line.receivedQuantity}</b></span>
                        <span className="text-amber-700 font-semibold">Remaining: <b>{remaining}</b></span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receive Quantity Now</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          step="0.0001"
                          value={receiveForm.lineReceipts[line.id] ?? remaining}
                          onChange={e => setReceiveForm({
                            lineReceipts: {
                              ...receiveForm.lineReceipts,
                              [line.id]: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiveTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Confirm Physical Receipt (TransferIn)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Establish Opening Stock Balance</h3>
                <p className="text-xs text-slate-500">Posts an initial stock entry through the immutable transaction ledger.</p>
              </div>
              <button onClick={() => setIsOpeningModalOpen(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOpeningBalance} className="space-y-4 text-xs">
              {isSuperAdmin && companies.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={openingForm.companyId}
                    onChange={e => setOpeningForm({ ...openingForm, companyId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.legalName || c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inventory Location *</label>
                <select
                  value={openingForm.inventoryLocationId}
                  onChange={e => setOpeningForm({ ...openingForm, inventoryLocationId: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Inventory Location...</option>
                  {openingLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product (SKU) *</label>
                <select
                  value={openingForm.productId}
                  onChange={e => setOpeningForm({ ...openingForm, productId: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Product...</option>
                  {openingProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.sku || p.code}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Stock Quantity *</label>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={openingForm.openingQuantity}
                  onChange={e => setOpeningForm({ ...openingForm, openingQuantity: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={openingForm.batchNumber}
                    onChange={e => setOpeningForm({ ...openingForm, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-01"
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={openingForm.expiryDate}
                    onChange={e => setOpeningForm({ ...openingForm, expiryDate: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={openingForm.notes}
                  onChange={e => setOpeningForm({ ...openingForm, notes: e.target.value })}
                  placeholder="Audit reason or opening note..."
                  className="w-full p-2 border rounded-lg border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpeningModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  Record Opening Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT INVENTORY LOCATION */}
      {/* ---------------------------------------------------- */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingLocation ? 'Edit Inventory Location' : 'Add Inventory Location'}
                </h3>
                <p className="text-xs text-slate-500">Configure a stock holding node in the organizational hierarchy.</p>
              </div>
              <button onClick={() => setIsLocationModalOpen(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLocation} className="space-y-4 text-xs">
              {isSuperAdmin && companies.length > 0 && !editingLocation && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Scope</label>
                  <select
                    value={locationForm.companyId}
                    onChange={e => {
                      const newCompId = e.target.value;
                      setLocationForm({
                        ...locationForm,
                        companyId: newCompId,
                        code: getNextLocationCode(newCompId),
                        branchId: '',
                        warehouseId: '',
                        departmentId: ''
                      });
                    }}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.legalName || c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Location Code</label>
                    <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                      Auto-Incremental
                    </span>
                  </div>
                  <input
                    type="text"
                    value={locationForm.code}
                    readOnly
                    disabled
                    aria-label="Location Code (Auto-generated)"
                    className="w-full p-2 border rounded-lg border-slate-200 bg-slate-100 text-slate-600 font-mono font-bold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location Name *</label>
                  <input
                    type="text"
                    value={locationForm.name}
                    onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                    required
                    placeholder="e.g. Staging Floor A"
                    className="w-full p-2 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch (Optional)</label>
                  <select
                    value={locationForm.branchId}
                    onChange={e => setLocationForm({ ...locationForm, branchId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="">None (Company Level)</option>
                    {branches.filter(b => !locationForm.companyId || b.companyId === locationForm.companyId).map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse (Optional)</label>
                  <select
                    value={locationForm.warehouseId}
                    onChange={e => setLocationForm({ ...locationForm, warehouseId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="">None</option>
                    {warehouses.filter(w => !locationForm.companyId || w.companyId === locationForm.companyId).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department (Optional)</label>
                <select
                  value={locationForm.departmentId}
                  onChange={e => setLocationForm({ ...locationForm, departmentId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">None</option>
                  {departments.filter(d => !locationForm.companyId || d.companyId === locationForm.companyId).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Type</label>
                <select
                  value={locationForm.locationType}
                  onChange={e => setLocationForm({ ...locationForm, locationType: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="Standard">Standard Storage</option>
                  <option value="Transit">Transit Staging</option>
                  <option value="VanStock">Van Stock</option>
                  <option value="Quarantine">Quarantine Bay</option>
                  <option value="Damaged">Damaged Goods</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  {editingLocation ? 'Save Changes' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: TRANSACTION AUDIT DETAIL INSPECTOR */}
      {/* ---------------------------------------------------- */}
      {selectedTxnForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Immutable Ledger Audit Record</h3>
              </div>
              <button onClick={() => setSelectedTxnForDetail(null)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">{selectedTxnForDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Timestamp (UTC):</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedTxnForDetail.createdAtUtc).toUTCString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Transaction Type:</span>
                  {getTxnTypeBadge(selectedTxnForDetail.transactionType, selectedTxnForDetail.signedQuantity)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                  <div className="text-slate-500 font-medium">Product / Item</div>
                  <div className="font-bold text-slate-900">{selectedTxnForDetail.productName}</div>
                  <div className="text-[11px] font-mono text-slate-500">SKU: {selectedTxnForDetail.sku || selectedTxnForDetail.productCode}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                  <div className="text-slate-500 font-medium">Inventory Location</div>
                  <div className="font-bold text-slate-900">{selectedTxnForDetail.inventoryLocationName}</div>
                  <div className="text-[11px] font-mono text-slate-500">Code: {selectedTxnForDetail.inventoryLocationCode}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Event Quantity</div>
                  <div className="font-mono text-sm font-bold text-slate-800">{Number(selectedTxnForDetail.quantity).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Signed Delta</div>
                  <div className={`font-mono text-sm font-bold ${
                    selectedTxnForDetail.signedQuantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedTxnForDetail.signedQuantity > 0 ? `+${Number(selectedTxnForDetail.signedQuantity).toFixed(2)}` : Number(selectedTxnForDetail.signedQuantity).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Balance After</div>
                  <div className="font-mono text-sm font-bold text-blue-700">{Number(selectedTxnForDetail.balanceAfter).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Reference Document:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {selectedTxnForDetail.referenceDocumentNumber
                      ? `${selectedTxnForDetail.referenceDocumentType}: ${selectedTxnForDetail.referenceDocumentNumber}`
                      : 'None (Direct Audit)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Batch / Expiry:</span>
                  <span className="font-mono text-slate-800">
                    {selectedTxnForDetail.batchNumber
                      ? `${selectedTxnForDetail.batchNumber} (Exp: ${selectedTxnForDetail.expiryDate ? selectedTxnForDetail.expiryDate.split('T')[0] : 'N/A'})`
                      : 'Not batch-tracked'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Performed By:</span>
                  <span className="font-medium text-slate-800">{selectedTxnForDetail.performedByEmployeeName || 'System'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Notes / Rationale:</span>
                  <span className="text-slate-700 italic">{selectedTxnForDetail.notes || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTxnForDetail(null)}
                aria-label="Close Audit Record"
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs text-xs"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: LEDGER RECONCILIATION DIAGNOSTIC */}
      {/* ---------------------------------------------------- */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inventory Ledger Reconciliation</h3>
                  <p className="text-xs text-slate-500">Audit current snapshot balance vs sum of all historical transactions.</p>
                </div>
              </div>
              <button onClick={() => setIsReconcileModalOpen(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inventory Location</label>
                  <select
                    value={reconcileForm.inventoryLocationId}
                    onChange={e => {
                      setReconcileForm({ ...reconcileForm, inventoryLocationId: e.target.value });
                      setReconciliationResult(null);
                    }}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="">Select Location...</option>
                    {reconcileLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product (SKU)</label>
                  <select
                    value={reconcileForm.productId}
                    onChange={e => {
                      setReconcileForm({ ...reconcileForm, productId: e.target.value });
                      setReconciliationResult(null);
                    }}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="">Select Product...</option>
                    {reconcileProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} [{p.sku || p.code}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunReconciliation}
                  disabled={isReconciling}
                  aria-label="Run Ledger Audit and Verify"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
                >
                  <ShieldCheck size={16} />
                  <span>{isReconciling ? 'Auditing Transaction Ledger...' : 'Run Ledger Audit & Verify'}</span>
                </button>
              </div>

              {reconciliationResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Verification Status:</span>
                    <Badge variant={reconciliationResult.isReconciled ? 'success' : 'danger'}>
                      {reconciliationResult.isReconciled ? '100% RECONCILED (0 Discrepancy)' : 'DISCREPANCY DETECTED'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Snapshot On-Hand</div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {Number(reconciliationResult.currentOnHandQuantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Ledger Sum</div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {Number(reconciliationResult.ledgerCalculatedQuantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Discrepancy</div>
                      <div className={`font-mono text-sm font-bold ${
                        reconciliationResult.discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {Number(reconciliationResult.discrepancy).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 text-center">
                    Audited across <span className="font-bold text-slate-800">{reconciliationResult.totalTransactionsCount}</span> immutable transaction records.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                aria-label="Done"
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: RESERVE STOCK */}
      {/* ---------------------------------------------------- */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookmarkCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Stock Reservation</h3>
                  <p className="text-xs text-slate-500">Reserves available inventory without moving physical on-hand stock.</p>
                </div>
              </div>
              <button onClick={() => setIsReserveModalOpen(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReserveStock} className="space-y-4 text-xs">
              {isSuperAdmin && companies.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={reserveForm.companyId}
                    onChange={e => setReserveForm({ ...reserveForm, companyId: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.legalName || c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inventory Location *</label>
                <select
                  value={reserveForm.inventoryLocationId}
                  onChange={e => setReserveForm({ ...reserveForm, inventoryLocationId: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Inventory Location...</option>
                  {reserveLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product (SKU) *</label>
                <select
                  value={reserveForm.productId}
                  onChange={e => setReserveForm({ ...reserveForm, productId: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Product...</option>
                  {reserveProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.sku || p.code}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reservation Quantity *</label>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={reserveForm.requestedQuantity}
                  onChange={e => setReserveForm({ ...reserveForm, requestedQuantity: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full p-2 border rounded-lg border-slate-300 font-mono font-bold text-indigo-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Ref / Sales Order ID</label>
                  <input
                    type="text"
                    value={reserveForm.salesOrderId}
                    onChange={e => setReserveForm({ ...reserveForm, salesOrderId: e.target.value })}
                    placeholder="Optional Order ID..."
                    className="w-full p-2 border rounded-lg border-slate-300 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={reserveForm.expiresAtUtc}
                    onChange={e => setReserveForm({ ...reserveForm, expiresAtUtc: e.target.value })}
                    className="w-full p-2 border rounded-lg border-slate-300 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReservation}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingReservation ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 6: CHECK AVAILABILITY & ALTERNATIVES */}
      {/* ---------------------------------------------------- */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Stock Availability Diagnostic</h3>
                  <p className="text-xs text-slate-500">Real-time availability check and multi-facility alternative recommendations.</p>
                </div>
              </div>
              <button onClick={() => setIsAvailabilityModalOpen(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Location *</label>
                <select
                  value={availabilityForm.inventoryLocationId}
                  onChange={e => setAvailabilityForm({ ...availabilityForm, inventoryLocationId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Location...</option>
                  {availabilityLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  value={availabilityForm.productId}
                  onChange={e => setAvailabilityForm({ ...availabilityForm, productId: e.target.value })}
                  className="w-full p-2 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Select Product...</option>
                  {availabilityProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.sku || p.code}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requested Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={availabilityForm.requestedQuantity}
                    onChange={e => setAvailabilityForm({ ...availabilityForm, requestedQuantity: parseFloat(e.target.value) || 1 })}
                    className="w-full p-2 border rounded-lg border-slate-300 font-mono font-bold"
                  />
                  <button
                    onClick={() => handleCheckAvailability()}
                    disabled={isCheckingAvailability}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    {isCheckingAvailability ? 'Checking...' : 'Check'}
                  </button>
                </div>
              </div>
            </div>

            {/* DIAGNOSTIC RESULT VIEW */}
            {availabilityResult && (
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">On-Hand</div>
                    <div className="text-base font-bold text-slate-900 font-mono">{Number(availabilityResult.onHandQuantity).toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">Reserved</div>
                    <div className="text-base font-bold text-amber-700 font-mono">{Number(availabilityResult.reservedQuantity).toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[11px] text-slate-500 font-semibold">Allocated</div>
                    <div className="text-base font-bold text-slate-700 font-mono">{Number(availabilityResult.allocatedQuantity).toFixed(2)}</div>
                  </div>
                  <div className={`p-3 border rounded-lg text-center ${availabilityResult.isAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <div className="text-[11px] font-semibold">Available Stock</div>
                    <div className="text-base font-bold font-mono">{Number(availabilityResult.availableQuantity).toFixed(2)}</div>
                  </div>
                </div>

                {/* VERDICT BANNER */}
                <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  availabilityResult.isAvailable
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {availabilityResult.isAvailable ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-600" />
                    )}
                    <div>
                      <span className="font-bold">
                        {availabilityResult.isAvailable
                          ? 'Stock Available!'
                          : `Insufficient Stock (Shortfall: ${availabilityResult.shortfallQuantity} units)`}
                      </span>
                      <p className="text-[11px] opacity-80">
                        {availabilityResult.isAvailable
                          ? `All ${availabilityResult.requestedQuantity} requested units are available for immediate reservation.`
                          : `${availabilityResult.shortfallQuantity} units required from alternate facility.`}
                      </p>
                    </div>
                  </div>

                  {!availabilityResult.isAvailable && (
                    <button
                      onClick={handleFindAlternatives}
                      disabled={isLoadingAlternatives}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition cursor-pointer shadow-xs"
                    >
                      {isLoadingAlternatives ? 'Searching...' : 'Find Alternate Locations'}
                    </button>
                  )}
                </div>

                {/* ALTERNATIVE LOCATIONS RECOMMENDATION TABLE */}
                {alternativeLocations && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">Ranked Alternative Locations</h4>
                      <span className="text-[11px] text-slate-500 font-mono">{alternativeLocations.length} locations eligible</span>
                    </div>

                    {alternativeLocations.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                        No eligible inventory locations found with available stock for this product.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                            <tr>
                              <th className="p-2.5">Rank</th>
                              <th className="p-2.5">Location</th>
                              <th className="p-2.5">Facility / Scope</th>
                              <th className="p-2.5 text-right">Available Stock</th>
                              <th className="p-2.5">Recommendation Basis</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {alternativeLocations.map(alt => (
                              <tr key={alt.inventoryLocationId} className="hover:bg-slate-50 transition">
                                <td className="p-2.5">
                                  <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                    alt.recommendedRank === 1 ? 'bg-emerald-100 text-emerald-800' :
                                    alt.recommendedRank === 2 ? 'bg-blue-100 text-blue-800' :
                                    alt.recommendedRank === 3 ? 'bg-purple-100 text-purple-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    #{alt.recommendedRank}
                                  </span>
                                </td>
                                <td className="p-2.5 font-semibold text-slate-900">
                                  {alt.locationName}
                                  <span className="text-[10px] text-slate-400 font-mono ml-1">({alt.locationCode})</span>
                                </td>
                                <td className="p-2.5 text-slate-600 text-[11px]">
                                  {alt.warehouseName ? `Wh: ${alt.warehouseName}` : alt.branchName ? `Branch: ${alt.branchName}` : 'Company Level'}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                  {Number(alt.availableQuantity).toFixed(2)} units
                                </td>
                                <td className="p-2.5 text-slate-600 text-[11px] italic">
                                  {alt.rankReason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
