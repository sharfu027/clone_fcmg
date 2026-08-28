import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Truck,
  UserCheck,
  Search,
  RefreshCw,
  Box,
  Layers,
  ArrowRight,
  Barcode,
  Calendar,
  Eye,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import {
  ReadyForFulfillmentOrderDto,
  PickTaskDto,
  PackTaskDto,
  DispatchDto,
  CreatePickTaskRequest,
  CreatePackTaskRequest,
  CreateDispatchRequest,
  PackageInput,
  PackageItemInput,
  CompletePickItemVerification
} from '../../../types/inventory';
import { inventoryService } from '../../../services/inventoryService';
import { fetchEmployees, fetchCompanies } from '../../../services/masterDataService';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Tooltip } from '../../../components/ui/Tooltip';

interface FulfillmentViewProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

type SubTabType = 'ready' | 'picking' | 'packing' | 'dispatch';

export default function FulfillmentView({ onTriggerToast }: FulfillmentViewProps) {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<SubTabType>('ready');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Live Data Lists
  const [readyOrders, setReadyOrders] = useState<ReadyForFulfillmentOrderDto[]>([]);
  const [pickTasks, setPickTasks] = useState<PickTaskDto[]>([]);
  const [packTasks, setPackTasks] = useState<PackTaskDto[]>([]);
  const [dispatches, setDispatches] = useState<DispatchDto[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Modals & Inspectors
  const [selectedPickTask, setSelectedPickTask] = useState<PickTaskDto | null>(null);
  const [selectedPackTask, setSelectedPackTask] = useState<PackTaskDto | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchDto | null>(null);

  // Dialog States
  const [showCreatePickModal, setShowCreatePickModal] = useState(false);
  const [targetOrderForPick, setTargetOrderForPick] = useState<ReadyForFulfillmentOrderDto | null>(null);
  const [selectedPickerId, setSelectedPickerId] = useState('');
  const [pickNotes, setPickNotes] = useState('');

  const [showCompletePickModal, setShowCompletePickModal] = useState(false);
  const [pickVerificationTask, setPickVerificationTask] = useState<PickTaskDto | null>(null);
  const [pickVerifications, setPickVerifications] = useState<{ [lineId: string]: { qty: number; batch: string } }>({});

  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [targetPickForPack, setTargetPickForPack] = useState<PickTaskDto | null>(null);
  const [selectedPackerId, setSelectedPackerId] = useState('');

  const [showCompletePackModal, setShowCompletePackModal] = useState(false);
  const [packTaskForComplete, setPackTaskForComplete] = useState<PackTaskDto | null>(null);
  const [packageType, setPackageType] = useState('Carton');
  const [grossWeight, setGrossWeight] = useState('');
  const [sealNumber, setSealNumber] = useState('');

  const [showCreateDispatchModal, setShowCreateDispatchModal] = useState(false);
  const [targetOrderForDispatch, setTargetOrderForDispatch] = useState<any | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [waybillNumber, setWaybillNumber] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'ready') {
        const data = await inventoryService.fetchReadyOrders({ search: searchTerm });
        setReadyOrders(data || []);
      } else if (subTab === 'picking') {
        const data = await inventoryService.fetchPickTasks();
        setPickTasks(data || []);
      } else if (subTab === 'packing') {
        const data = await inventoryService.fetchPackTasks();
        setPackTasks(data || []);
      } else if (subTab === 'dispatch') {
        const data = await inventoryService.fetchDispatches();
        setDispatches(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching fulfillment data', err);
      onTriggerToast('error', 'Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  }, [subTab, searchTerm, onTriggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const emps = await fetchEmployees();
        setEmployees(emps || []);
        const comps = await fetchCompanies();
        setCompanies(comps || []);
      } catch (e) {
        console.error('Error fetching employees/companies', e);
      }
    };
    loadMasters();
  }, []);

  // ----------------------------------------------------
  // PICKING ACTIONS
  // ----------------------------------------------------
  const handleOpenCreatePick = (order: ReadyForFulfillmentOrderDto) => {
    setTargetOrderForPick(order);
    setSelectedPickerId(order.salesEmployeeId || '');
    setPickNotes('');
    setShowCreatePickModal(true);
  };

  const handleCreatePickTask = async () => {
    if (!targetOrderForPick) return;
    try {
      await inventoryService.createPickTask({
        salesOrderId: targetOrderForPick.id,
        assignedEmployeeId: selectedPickerId || null,
        notes: pickNotes || null
      });
      onTriggerToast('success', 'Pick Task Created', `Pick task created for Order ${targetOrderForPick.orderNumber}`);
      setShowCreatePickModal(false);
      setTargetOrderForPick(null);
      setSubTab('picking');
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to create pick task', err.message);
    }
  };

  const handleStartPick = async (task: PickTaskDto) => {
    try {
      await inventoryService.startPickTask(task.id);
      onTriggerToast('success', 'Picking Started', `Stock allocated for Pick Task ${task.pickTaskNumber}`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to start pick task', err.message);
    }
  };

  const handleOpenCompletePick = (task: PickTaskDto) => {
    setPickVerificationTask(task);
    const initial: { [lineId: string]: { qty: number; batch: string } } = {};
    task.lines.forEach(l => {
      initial[l.id] = { qty: l.allocatedQuantity, batch: l.batchNumber || '' };
    });
    setPickVerifications(initial);
    setShowCompletePickModal(true);
  };

  const handleCompletePick = async () => {
    if (!pickVerificationTask) return;
    try {
      const verifs: CompletePickItemVerification[] = pickVerificationTask.lines.map(l => ({
        pickTaskLineId: l.id,
        pickedQuantity: pickVerifications[l.id]?.qty ?? l.allocatedQuantity,
        batchNumber: pickVerifications[l.id]?.batch || null
      }));
      await inventoryService.completePickTask(pickVerificationTask.id, verifs);
      onTriggerToast('success', 'Picking Verified', `Pick task ${pickVerificationTask.pickTaskNumber} completed`);
      setShowCompletePickModal(false);
      setPickVerificationTask(null);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Pick Verification Failed', err.message);
    }
  };

  const handleCancelPick = async (task: PickTaskDto) => {
    if (!window.confirm(`Are you sure you want to cancel Pick Task ${task.pickTaskNumber}?`)) return;
    try {
      await inventoryService.cancelPickTask(task.id);
      onTriggerToast('info', 'Pick Task Cancelled', `Pick Task ${task.pickTaskNumber} cancelled`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to cancel pick task', err.message);
    }
  };

  // ----------------------------------------------------
  // PACKING ACTIONS
  // ----------------------------------------------------
  const handleOpenCreatePack = (pick: PickTaskDto) => {
    setTargetPickForPack(pick);
    setSelectedPackerId(pick.assignedEmployeeId || '');
    setShowCreatePackModal(true);
  };

  const handleCreatePackTask = async () => {
    if (!targetPickForPack) return;
    try {
      await inventoryService.createPackTask({
        pickTaskId: targetPickForPack.id,
        assignedEmployeeId: selectedPackerId || null
      });
      onTriggerToast('success', 'Pack Task Created', `Packing task initialized for Pick ${targetPickForPack.pickTaskNumber}`);
      setShowCreatePackModal(false);
      setTargetPickForPack(null);
      setSubTab('packing');
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to create pack task', err.message);
    }
  };

  const handleOpenCompletePack = (task: PackTaskDto) => {
    setPackTaskForComplete(task);
    setPackageType('Carton');
    setGrossWeight('');
    setSealNumber('');
    setShowCompletePackModal(true);
  };

  const handleCompletePack = async () => {
    if (!packTaskForComplete) return;
    try {
      const pkgs: PackageInput[] = [
        {
          packageNumber: null,
          packageType: packageType || 'Carton',
          grossWeightKg: grossWeight ? parseFloat(grossWeight) : null,
          sealNumber: sealNumber || null,
          items: []
        }
      ];
      await inventoryService.completePackTask(packTaskForComplete.id, pkgs);
      onTriggerToast('success', 'Order Packed', `Pack Task ${packTaskForComplete.packTaskNumber} completed`);
      setShowCompletePackModal(false);
      setPackTaskForComplete(null);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to complete pack task', err.message);
    }
  };

  // ----------------------------------------------------
  // DISPATCH ACTIONS
  // ----------------------------------------------------
  const handleOpenCreateDispatch = (pack: PackTaskDto) => {
    setTargetOrderForDispatch(pack);
    setVehicleNumber('');
    setDriverName('');
    setDriverPhone('');
    setTransporterName('');
    setWaybillNumber('');
    setShowCreateDispatchModal(true);
  };

  const handleCreateDispatch = async () => {
    if (!targetOrderForDispatch) return;
    try {
      await inventoryService.createDispatch({
        salesOrderId: targetOrderForDispatch.salesOrderId,
        packTaskId: targetOrderForDispatch.id,
        vehicleNumber: vehicleNumber || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        transporterName: transporterName || null,
        waybillNumber: waybillNumber || null
      });
      onTriggerToast('success', 'Dispatch Prepared', 'Shipment record created and ready for final confirmation');
      setShowCreateDispatchModal(false);
      setTargetOrderForDispatch(null);
      setSubTab('dispatch');
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Failed to create dispatch', err.message);
    }
  };

  const handleConfirmDispatch = async (dispatch: DispatchDto) => {
    if (!window.confirm(`Confirm dispatch for ${dispatch.dispatchNumber}? This will post Goods Issue and reduce physical stock.`)) return;
    try {
      await inventoryService.confirmDispatch(dispatch.id);
      onTriggerToast('success', 'Dispatched & Goods Issued', `Dispatch ${dispatch.dispatchNumber} confirmed successfully. Physical stock issued.`);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Dispatch Confirmation Failed', err.message);
    }
  };

  // Helper Badge Renderers
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Assigned':
        return <Badge variant="info">{status}</Badge>;
      case 'InProgress':
      case 'Picking':
      case 'Packing':
        return <Badge variant="indigo">{status === 'InProgress' ? 'In Progress' : status}</Badge>;
      case 'Completed':
      case 'Packed':
      case 'ReadyForDispatch':
        return <Badge variant="success">{status === 'ReadyForDispatch' ? 'Ready for Dispatch' : status}</Badge>;
      case 'Dispatched':
        return <Badge variant="purple">{status}</Badge>;
      case 'PartiallyPicked':
        return <Badge variant="warning">Partially Picked</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* FULFILLMENT SECTION HEADER */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Fulfillment</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage orders through picking, packing and dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content="Refresh fulfillment queues and tasks">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* COMPACT SUB-NAVIGATION TABS */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex overflow-x-auto gap-1">
        {[
          { id: 'ready' as SubTabType, label: 'Ready', count: readyOrders.length, icon: Box },
          { id: 'picking' as SubTabType, label: 'Picking', count: pickTasks.length, icon: UserCheck },
          { id: 'packing' as SubTabType, label: 'Packing', count: packTasks.length, icon: Package },
          { id: 'dispatch' as SubTabType, label: 'Dispatch', count: dispatches.length, icon: Truck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SEARCH / FILTER TOOLBAR */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search orders, pick tasks, products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {subTab === 'ready' && `${readyOrders.length} order(s) ready for fulfillment`}
          {subTab === 'picking' && `${pickTasks.length} pick task(s) active`}
          {subTab === 'packing' && `${packTasks.length} pack task(s) in queue`}
          {subTab === 'dispatch' && `${dispatches.length} dispatch shipment(s)`}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* WORKFLOW VIEW 1: READY FOR FULFILLMENT */}
      {/* ---------------------------------------------------- */}
      {subTab === 'ready' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {readyOrders.length === 0 ? (
            <EmptyState
              title="No sales orders are ready for fulfillment."
              description="Customer orders in 'Reserved' or 'ReadyForFulfillment' status will automatically appear here for pick task creation. (Manual stock reservations are internal holds and do not enter this queue)."
              icon={Box}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Sales Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Inventory Location</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3 text-right">Reserved Quantity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readyOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ord.customerCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{ord.inventoryLocationName || 'Central Hub'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ord.inventoryLocationCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {ord.itemsCount} lines ({ord.totalQuantity} units)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {ord.totalReservedQuantity} units
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(ord.orderStatus)}</td>
                      <td className="px-4 py-3 text-right">
                        {ord.hasActivePickTask ? (
                          <span className="text-xs text-blue-600 font-semibold inline-flex items-center justify-end gap-1">
                            <CheckCircle2 size={14} /> Pick Task Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenCreatePick(ord)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
                          >
                            <Plus size={14} />
                            Create Pick Task
                          </button>
                        )}
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
      {/* WORKFLOW VIEW 2: PICKING TASKS */}
      {/* ---------------------------------------------------- */}
      {subTab === 'picking' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {pickTasks.length === 0 ? (
            <EmptyState
              title="No active picking tasks"
              description="Create a pick task from the Ready queue to begin warehouse picking."
              icon={UserCheck}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Pick Task</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Picker</th>
                    <th className="px-4 py-3">Products</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {t.pickTaskNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{t.salesOrderNumber}</div>
                        <div className="text-[11px] text-slate-400">{t.customerName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{t.inventoryLocationName}</td>
                      <td className="px-4 py-3">
                        {t.assignedEmployeeName ? (
                          <span className="font-medium text-slate-900">{t.assignedEmployeeName}</span>
                        ) : (
                          <span className="text-xs text-amber-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {t.lines.length} items
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedPickTask(t)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {(t.status === 'Pending' || t.status === 'Assigned') && (
                          <button
                            onClick={() => handleStartPick(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <Play size={13} />
                            Start Picking
                          </button>
                        )}

                        {t.status === 'InProgress' && (
                          <button
                            onClick={() => handleOpenCompletePick(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 size={13} />
                            Verify & Complete
                          </button>
                        )}

                        {(t.status === 'Completed' || t.status === 'PartiallyPicked') && (
                          <button
                            onClick={() => handleOpenCreatePack(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <Package size={13} />
                            Create Pack
                          </button>
                        )}

                        {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelPick(t)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Cancel Pick"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
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
      {/* WORKFLOW VIEW 3: PACKING TASKS */}
      {/* ---------------------------------------------------- */}
      {subTab === 'packing' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {packTasks.length === 0 ? (
            <EmptyState
              title="No packing tasks awaiting action"
              description="Complete a pick task to generate and pack shipping cartons."
              icon={Package}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Pack Task</th>
                    <th className="px-4 py-3">Order / Pick</th>
                    <th className="px-4 py-3">Packer</th>
                    <th className="px-4 py-3">Packages</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {t.packTaskNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{t.salesOrderNumber}</div>
                        <div className="text-[11px] text-slate-400">Pick: {t.pickTaskNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        {t.assignedEmployeeName || <span className="text-xs text-amber-600 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {t.totalPackagesCount} packages
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedPackTask(t)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {t.status !== 'Packed' && t.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleOpenCompletePack(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 size={13} />
                            Build Packages & Complete
                          </button>
                        )}

                        {t.status === 'Packed' && (
                          <button
                            onClick={() => handleOpenCreateDispatch(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <Truck size={13} />
                            Prepare Dispatch
                          </button>
                        )}
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
      {/* WORKFLOW VIEW 4: DISPATCH QUEUE */}
      {/* ---------------------------------------------------- */}
      {subTab === 'dispatch' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {dispatches.length === 0 ? (
            <EmptyState
              title="No shipments in dispatch queue"
              description="Complete order packaging to prepare shipments for carrier loading and Goods Issue."
              icon={Truck}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Dispatch Number</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Transport / Vehicle</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {d.dispatchNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{d.salesOrderNumber}</div>
                        <div className="text-[11px] text-slate-400">{d.customerName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{d.vehicleNumber || 'No Vehicle'}</div>
                        <div className="text-[11px] text-slate-400">{d.transporterName || 'Self Transport'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{d.driverName || 'No Driver'}</div>
                        <div className="text-[11px] text-slate-400">{d.driverPhone}</div>
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(d.dispatchStatus)}</td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedDispatch(d)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {d.dispatchStatus === 'ReadyForDispatch' && (
                          <button
                            onClick={() => handleConfirmDispatch(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            Confirm Dispatch & Issue Goods
                          </button>
                        )}
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
      {/* MODAL 1: CREATE PICK TASK */}
      {/* ---------------------------------------------------- */}
      {showCreatePickModal && targetOrderForPick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Create Pick Task</h3>
              </div>
              <button onClick={() => setShowCreatePickModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Order:</span>
                  <span className="font-semibold text-slate-900">{targetOrderForPick.orderNumber} ({targetOrderForPick.customerName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fulfillment Location:</span>
                  <span className="font-semibold text-slate-800">{targetOrderForPick.inventoryLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Volume:</span>
                  <span className="font-bold text-emerald-700">{targetOrderForPick.totalReservedQuantity} units ({targetOrderForPick.itemsCount} lines)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assign Warehouse Picker (Optional)
                </label>
                <select
                  value={selectedPickerId}
                  onChange={(e) => setSelectedPickerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Picker Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Picking Instructions / Notes
                </label>
                <textarea
                  value={pickNotes}
                  onChange={(e) => setPickNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Special warehouse instructions for picking..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreatePickModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePickTask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Create Pick Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: COMPLETE PICK VERIFICATION */}
      {/* ---------------------------------------------------- */}
      {showCompletePickModal && pickVerificationTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Pick Verification — {pickVerificationTask.pickTaskNumber}
                </h3>
              </div>
              <button onClick={() => setShowCompletePickModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Verify physical picked quantities and capture batch/lot numbers for inventory tracking.
            </p>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1 text-xs">
              {pickVerificationTask.lines.map((line) => (
                <div key={line.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{line.productName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Allocated: {line.allocatedQuantity} {line.uomName} {line.sku ? `| SKU: ${line.sku}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Picked Qty</label>
                      <input
                        type="number"
                        min="0"
                        max={line.allocatedQuantity}
                        value={pickVerifications[line.id]?.qty ?? line.allocatedQuantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPickVerifications(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id], qty: val }
                          }));
                        }}
                        className="w-24 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-right font-medium focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Batch Number</label>
                      <input
                        type="text"
                        placeholder="Batch / Lot #"
                        value={pickVerifications[line.id]?.batch ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPickVerifications(prev => ({
                            ...prev,
                            [line.id]: { ...prev[line.id], batch: val }
                          }));
                        }}
                        className="w-32 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCompletePickModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePick}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Submit Pick Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: CREATE PACK TASK */}
      {/* ---------------------------------------------------- */}
      {showCreatePackModal && targetPickForPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Create Pack Task</h3>
              </div>
              <button onClick={() => setShowCreatePackModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pick Task:</span>
                  <span className="font-semibold text-slate-900">{targetPickForPack.pickTaskNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Order:</span>
                  <span className="font-semibold text-slate-800">{targetPickForPack.salesOrderNumber}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assign Warehouse Packer (Optional)
                </label>
                <select
                  value={selectedPackerId}
                  onChange={(e) => setSelectedPackerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Packer Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreatePackModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePackTask}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Create Pack Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: COMPLETE PACKING & CARTON BUILDER */}
      {/* ---------------------------------------------------- */}
      {showCompletePackModal && packTaskForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Build Packages — {packTaskForComplete.packTaskNumber}
                </h3>
              </div>
              <button onClick={() => setShowCompletePackModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Package Type / Container
                </label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Carton">Carton Box</option>
                  <option value="Pallet">Wooden Pallet</option>
                  <option value="Crate">Crate</option>
                  <option value="Polybag">Polybag / Pouch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Gross Weight (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 14.5"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Seal Number / Barcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SEAL-9901"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCompletePackModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePack}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Confirm Packed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: PREPARE DISPATCH */}
      {/* ---------------------------------------------------- */}
      {showCreateDispatchModal && targetOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Prepare Dispatch</h3>
              </div>
              <button onClick={() => setShowCreateDispatchModal(false)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Transporter / Carrier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BlueDart / Self"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Waybill / LR Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WB-88219"
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateDispatchModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDispatch}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Save Dispatch Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INSPECTOR 1: PICK TASK DETAILS */}
      {/* ---------------------------------------------------- */}
      {selectedPickTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pick Task Details — {selectedPickTask.pickTaskNumber}
                </h3>
                <p className="text-xs text-slate-500">Order: {selectedPickTask.salesOrderNumber} ({selectedPickTask.customerName})</p>
              </div>
              <button onClick={() => setSelectedPickTask(null)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div><span className="text-slate-500">Status:</span> {renderStatusBadge(selectedPickTask.status)}</div>
                <div><span className="text-slate-500">Location:</span> <strong>{selectedPickTask.inventoryLocationName}</strong></div>
                <div><span className="text-slate-500">Picker:</span> <strong>{selectedPickTask.assignedEmployeeName || 'Unassigned'}</strong></div>
                <div><span className="text-slate-500">Created:</span> {new Date(selectedPickTask.createdAtUtc).toLocaleString()}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Itemized Lines</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedPickTask.lines.map((l) => (
                    <div key={l.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{l.productName}</div>
                        <div className="text-[11px] text-slate-500">SKU: {l.sku || 'N/A'} {l.batchNumber ? `| Batch: ${l.batchNumber}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-800">
                          {l.pickedQuantity} / {l.allocatedQuantity} {l.uomName}
                        </div>
                        {l.shortQuantity > 0 && (
                          <div className="text-[11px] text-amber-600 font-semibold">Short: {l.shortQuantity}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedPickTask(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INSPECTOR 2: PACK TASK DETAILS */}
      {/* ---------------------------------------------------- */}
      {selectedPackTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pack Task Details — {selectedPackTask.packTaskNumber}
                </h3>
                <p className="text-xs text-slate-500">Order: {selectedPackTask.salesOrderNumber} (Pick: {selectedPackTask.pickTaskNumber})</p>
              </div>
              <button onClick={() => setSelectedPackTask(null)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div><span className="text-slate-500">Status:</span> {renderStatusBadge(selectedPackTask.status)}</div>
                <div><span className="text-slate-500">Packer:</span> <strong>{selectedPackTask.assignedEmployeeName || 'Unassigned'}</strong></div>
                <div><span className="text-slate-500">Total Packages:</span> <strong>{selectedPackTask.totalPackagesCount}</strong></div>
                <div><span className="text-slate-500">Packed Date:</span> {selectedPackTask.completedAtUtc ? new Date(selectedPackTask.completedAtUtc).toLocaleString() : 'Pending'}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Packages ({selectedPackTask.packages.length})</h4>
                <div className="space-y-2">
                  {selectedPackTask.packages.map((pkg) => (
                    <div key={pkg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span>{pkg.packageNumber} ({pkg.packageType})</span>
                        <span className="text-slate-500">{pkg.grossWeightKg ? `${pkg.grossWeightKg} kg` : ''}</span>
                      </div>
                      {pkg.sealNumber && <div className="text-[11px] text-slate-500">Seal: {pkg.sealNumber}</div>}
                      <div className="divide-y divide-slate-200 pt-1">
                        {pkg.items.map((itm) => (
                          <div key={itm.id} className="py-1 flex justify-between text-[11px]">
                            <span>{itm.productName} {itm.batchNumber ? `(Batch: ${itm.batchNumber})` : ''}</span>
                            <span className="font-semibold">{itm.packedQuantity} {itm.uomName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedPackTask(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INSPECTOR 3: DISPATCH DETAILS */}
      {/* ---------------------------------------------------- */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dispatch Details — {selectedDispatch.dispatchNumber}
                </h3>
                <p className="text-xs text-slate-500">Order: {selectedDispatch.salesOrderNumber} ({selectedDispatch.customerName})</p>
              </div>
              <button onClick={() => setSelectedDispatch(null)} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div><span className="text-slate-500">Status:</span> {renderStatusBadge(selectedDispatch.dispatchStatus)}</div>
                <div><span className="text-slate-500">Vehicle:</span> <strong>{selectedDispatch.vehicleNumber || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Driver:</span> <strong>{selectedDispatch.driverName || 'N/A'}</strong> ({selectedDispatch.driverPhone || 'N/A'})</div>
                <div><span className="text-slate-500">Transporter:</span> <strong>{selectedDispatch.transporterName || 'Self'}</strong></div>
                <div><span className="text-slate-500">Waybill:</span> <strong>{selectedDispatch.waybillNumber || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Dispatched At:</span> {selectedDispatch.dispatchedAtUtc ? new Date(selectedDispatch.dispatchedAtUtc).toLocaleString() : 'Pending'}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Dispatched Lines</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedDispatch.lines.map((l) => (
                    <div key={l.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{l.productName}</div>
                        <div className="text-[11px] text-slate-500">SKU: {l.sku || 'N/A'} {l.batchNumber ? `| Batch: ${l.batchNumber}` : ''}</div>
                      </div>
                      <div className="font-medium text-slate-800">
                        {l.dispatchedQuantity} {l.uomName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
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
