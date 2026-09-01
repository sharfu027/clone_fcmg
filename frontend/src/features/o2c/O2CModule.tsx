import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  CreditCard,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Camera,
  RefreshCw,
  XCircle,
  Eye,
  Trash2,
  UserCheck,
  Check,
  Navigation
} from 'lucide-react';
import {
  RealSalesOrder,
  RealSalesOrderItem,
  CreateRealSalesOrderRequest,
  CreateRealSalesOrderItemRequest,
  VerifyFieldLocationResult,
  PriceResolutionResult
} from '../../types/sales';
import { CustomerDto, ProductDto, EmployeeDto } from '../../types/masterData';
import { salesService } from '../../services/salesService';
import { fetchCustomers, fetchProducts, fetchEmployees } from '../../services/masterDataService';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface O2CModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function O2CModule({ onTriggerToast }: O2CModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'quotations' | 'deliveries' | 'invoices' | 'payments' | 'ledger' | 'notes' | 'analytics'
  >('orders');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<RealSalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RealSalesOrder | null>(null);

  // Master Data Cache
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);

  // Standard Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newSalesEmployeeId, setNewSalesEmployeeId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    priceSource: string;
  }[]>([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Field Sales Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldStep, setFieldStep] = useState<1 | 2 | 3 | 4>(1); // 1: Customer, 2: GPS, 3: Face, 4: Items & Submit
  const [fieldCustomer, setFieldCustomer] = useState<CustomerDto | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [gpsResult, setGpsResult] = useState<VerifyFieldLocationResult | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  // Camera & Face Verification State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceScore, setFaceScore] = useState<number | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  // Load Initial Data
  const loadData = async () => {
    setLoadingOrders(true);
    try {
      const [orderData, customerData, productData, employeeData] = await Promise.all([
        salesService.fetchSalesOrders({ status: statusFilter === 'All' ? undefined : statusFilter, search: searchQuery || undefined }),
        fetchCustomers({ pageSize: 100 }),
        fetchProducts({ pageSize: 100 }),
        fetchEmployees({ pageSize: 100 })
      ]);

      setOrders(Array.isArray(orderData) ? orderData : []);
      setCustomers(Array.isArray(customerData?.items) ? customerData.items : Array.isArray(customerData) ? customerData : []);
      setProducts(Array.isArray(productData?.items) ? productData.items : Array.isArray(productData) ? productData : []);
      setEmployees(Array.isArray(employeeData?.items) ? employeeData.items : Array.isArray(employeeData) ? employeeData : []);
    } catch (err: any) {
      console.error('Failed to load O2C data', err);
      onTriggerToast('error', 'Data Load Error', err?.message || 'Unable to fetch sales orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  // Clean up camera stream on modal close
  useEffect(() => {
    if (!isFieldModalOpen && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [isFieldModalOpen]);

  // Start Camera Feed
  const startCamera = async () => {
    try {
      setFaceError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error', err);
      setFaceError('Could not access camera. Please allow camera permissions.');
    }
  };

  // Capture Photo & Verify Face
  const captureAndVerifyFace = async () => {
    if (!videoRef.current) return;
    setVerifyingFace(true);
    setFaceError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64Image = dataUrl.split(',')[1];

      // Get logged in user from localStorage
      const userRaw = localStorage.getItem('ink_user') || localStorage.getItem('user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;
      const userId = currentUser?.id || currentUser?.userId;

      if (!userId) {
        throw new Error('Authenticated user session not found.');
      }

      const res = await salesService.verifyFaceBiometrics({
        userId,
        imageBase64: base64Image
      });

      if (res.success) {
        setFaceVerified(true);
        setFaceScore(res.score);
        onTriggerToast('success', 'Face Verified', `Liveness & biometric match passed (Score: ${(res.score * 100).toFixed(1)}%).`);
        // Stop stream
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      } else {
        setFaceVerified(false);
        setFaceError(res.message || 'Face verification failed. Please try again.');
        onTriggerToast('error', 'Verification Failed', res.message || 'Biometric match did not meet confidence threshold.');
      }
    } catch (err: any) {
      console.error('Face verification error', err);
      setFaceError(err?.message || 'Biometric verification service error.');
      onTriggerToast('error', 'Biometric Error', err?.message || 'Unable to complete face verification.');
    } finally {
      setVerifyingFace(false);
    }
  };

  // Capture GPS & Check Distance
  const captureGpsLocation = async () => {
    if (!fieldCustomer) return;
    setCapturingGps(true);
    setGpsResult(null);

    if (!navigator.geolocation) {
      setCapturingGps(false);
      onTriggerToast('error', 'GPS Unavailable', 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude, accuracy });

        try {
          const res = await salesService.verifyFieldLocation({
            companyId: fieldCustomer.companyId,
            customerId: fieldCustomer.id,
            captureLatitude: latitude,
            captureLongitude: longitude,
            accuracyMeters: accuracy
          });

          setGpsResult(res);
          if (res.isWithinRange) {
            onTriggerToast('success', 'GPS Verified', res.message);
          } else {
            onTriggerToast('warning', 'Location Out of Range', res.message);
          }
        } catch (err: any) {
          console.error('GPS Verification Error', err);
          onTriggerToast('error', 'GPS Validation Error', err?.message || 'Failed to verify location with server.');
        } finally {
          setCapturingGps(false);
        }
      },
      (err) => {
        setCapturingGps(false);
        console.error('Geolocation error', err);
        onTriggerToast('error', 'GPS Permission Denied', 'Please enable location permissions on your device to create field orders.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Add Item to Order with Price Resolution
  const handleAddProduct = async (productId: string) => {
    if (!productId) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const activeCustomerId = isFieldModalOpen ? fieldCustomer?.id : newCustomerId;
    const activeCompanyId = isFieldModalOpen ? fieldCustomer?.companyId : customers.find(c => c.id === newCustomerId)?.companyId;

    let resolvedPrice = prod.basePrice || 100;
    let priceSource = 'ProductBasePrice';

    if (activeCompanyId && activeCustomerId) {
      try {
        const priceRes = await salesService.resolvePrice({
          companyId: activeCompanyId,
          customerId: activeCustomerId,
          productId: prod.id
        });
        resolvedPrice = priceRes.resolvedPrice;
        priceSource = priceRes.source;
      } catch (err) {
        console.warn('Could not resolve tiered price, falling back to base price', err);
      }
    }

    setNewOrderItems(prev => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        quantity: 1,
        unitPrice: resolvedPrice,
        discountAmount: 0,
        taxAmount: Number((resolvedPrice * (prod.gstRate || 0.18) / 100).toFixed(2)),
        priceSource
      }
    ]);
  };

  // Handle Standard Order Submission
  const handleCreateOrder = async (isField = false) => {
    if (newOrderItems.length === 0) {
      onTriggerToast('warning', 'Validation', 'Please add at least one product to the order.');
      return;
    }

    const customerId = isField ? fieldCustomer?.id : newCustomerId;
    const cust = customers.find(c => c.id === customerId);
    if (!cust) {
      onTriggerToast('error', 'Validation', 'Please select a valid customer.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload: CreateRealSalesOrderRequest = {
        companyId: cust.companyId,
        customerId: cust.id,
        salesEmployeeId: newSalesEmployeeId || undefined,
        notes: newNotes || undefined,
        items: newOrderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: item.taxAmount
        })),
        captureLatitude: isField && userCoords ? userCoords.lat : undefined,
        captureLongitude: isField && userCoords ? userCoords.lng : undefined,
        captureAccuracyMeters: isField && userCoords ? userCoords.accuracy : undefined,
        isFaceVerified: isField ? faceVerified : false
      };

      const created = await salesService.createSalesOrder(payload);
      onTriggerToast('success', 'Order Created', `Order ${created.orderNumber} created successfully in Draft status.`);

      // Reset and close
      setIsCreateModalOpen(false);
      setIsFieldModalOpen(false);
      setNewOrderItems([]);
      setNewNotes('');
      setFieldStep(1);
      setFieldCustomer(null);
      setGpsResult(null);
      setFaceVerified(false);
      setFaceScore(null);
      loadData();
    } catch (err: any) {
      console.error('Order creation error', err);
      onTriggerToast('error', 'Order Creation Failed', err?.message || 'Failed to create sales order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Submit Draft Order (Triggers Inventory Reservation)
  const handleSubmitOrder = async (order: RealSalesOrder) => {
    try {
      const updated = await salesService.submitSalesOrder(order.id, order.companyId);
      onTriggerToast('success', 'Order Submitted', `Order ${updated.orderNumber} status is now '${updated.orderStatus}'. Inventory reserved.`);
      loadData();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      console.error('Submit order error', err);
      onTriggerToast('error', 'Submission Failed', err?.message || 'Could not submit sales order.');
    }
  };

  // Cancel Order (Releases Reservations)
  const handleCancelOrder = async (order: RealSalesOrder) => {
    try {
      const updated = await salesService.cancelSalesOrder(order.id, order.companyId);
      onTriggerToast('info', 'Order Cancelled', `Order ${updated.orderNumber} was cancelled and reserved stock released.`);
      loadData();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      console.error('Cancel order error', err);
      onTriggerToast('error', 'Cancellation Failed', err?.message || 'Could not cancel sales order.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Draft': return 'primary';
      case 'Reserved':
      case 'ReadyForFulfillment': return 'success';
      case 'PartiallyAvailable':
      case 'AwaitingTransfer': return 'warning';
      case 'Picking':
      case 'Packing':
      case 'Dispatched': return 'info';
      case 'Cancelled': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: O2C KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Sales Orders" value={orders.filter(o => o.orderStatus !== 'Cancelled').length.toString()} badgeText="Live Orders" badgeVariant="primary" subLabel="Draft Orders" subValue={orders.filter(o => o.orderStatus === 'Draft').length.toString()} />
        <StatCard title="Total Order Value" value={formatINR(orders.reduce((sum, o) => o.orderStatus !== 'Cancelled' ? sum + o.totalAmount : sum, 0))} badgeText="Gross Revenue" badgeVariant="success" subLabel="Reserved Orders" subValue={orders.filter(o => o.orderStatus === 'Reserved').length.toString()} />
        <StatCard title="Field-Verified Orders" value={orders.filter(o => o.isGpsVerified || o.isFaceVerified).length.toString()} badgeText="GPS ≤ 50m / Face" badgeVariant="info" subLabel="Audit Compliance" subValue="100%" />
        <StatCard title="Fulfillment Ready" value={orders.filter(o => o.orderStatus === 'Reserved' || o.orderStatus === 'ReadyForFulfillment').length.toString()} badgeText="Ready to Pick" badgeVariant="warning" subLabel="Awaiting Stock" subValue={orders.filter(o => o.orderStatus === 'AwaitingTransfer' || o.orderStatus === 'PartiallyAvailable').length.toString()} />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'orders', label: 'Sales Orders (Real O2C)', icon: FileSpreadsheet },
          { id: 'dashboard', label: 'Collections Dashboard', icon: TrendingUp },
          { id: 'quotations', label: 'Sales Quotations', icon: FileText },
          { id: 'deliveries', label: 'Deliveries & POD', icon: Truck },
          { id: 'invoices', label: 'Sales Invoices (GST)', icon: Receipt },
          { id: 'payments', label: 'Payments & Receipts', icon: DollarSign },
          { id: 'ledger', label: 'Customer Ledger', icon: CreditCard },
          { id: 'notes', label: 'Credit / Debit Notes', icon: Layers },
          { id: 'analytics', label: 'O2C Analytics', icon: Sparkles }
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

      {/* TAB: SALES ORDERS (REAL BACKEND O2C) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden space-y-4 p-4">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search order number, customer code, rep..." />
              <button onClick={loadData} disabled={loadingOrders} className="p-2 border rounded hover:bg-brand-bg-secondary text-brand-text-secondary cursor-pointer" title="Refresh">
                <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewOrderItems([]);
                  setNewNotes('');
                  setIsCreateModalOpen(true);
                }}
                className="px-3 py-1.5 bg-brand-bg-secondary text-brand-text-primary border border-brand-border text-xs font-semibold rounded flex items-center gap-1 hover:bg-brand-border/40 cursor-pointer"
              >
                <Plus size={14} /> Create Standard Order
              </button>

              <button
                onClick={() => {
                  setFieldStep(1);
                  setFieldCustomer(null);
                  setGpsResult(null);
                  setFaceVerified(false);
                  setFaceScore(null);
                  setNewOrderItems([]);
                  setIsFieldModalOpen(true);
                }}
                className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                <Navigation size={14} /> Field Sales Order (GPS + Face)
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-1.5 border-b pb-3">
            {['All', 'Draft', 'Reserved', 'PartiallyAvailable', 'AwaitingTransfer', 'ReadyForFulfillment', 'Picking', 'Packed', 'Dispatched', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                  statusFilter === st
                    ? 'bg-brand-text-primary text-white'
                    : 'bg-brand-bg-secondary text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {loadingOrders ? (
            <div className="py-12 flex justify-center items-center text-brand-text-secondary gap-2 text-xs">
              <RefreshCw size={16} className="animate-spin text-brand-primary" /> Loading sales orders from database...
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No Sales Orders Found"
              description="No sales orders match your current filter criteria. Create a standard order or field order to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Sales Rep</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3 text-center">Field Audit</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-brand-bg-secondary/30 transition">
                      <td className="p-3 font-mono font-bold text-brand-primary flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-brand-primary" />
                        {order.orderNumber}
                      </td>
                      <td className="p-3 font-semibold text-brand-text-primary">
                        <div>{order.customerName}</div>
                        <span className="text-[10px] text-brand-text-secondary font-mono">{order.customerCode}</span>
                      </td>
                      <td className="p-3 text-brand-text-secondary">
                        {order.salesEmployeeName || '—'}
                      </td>
                      <td className="p-3 text-brand-text-secondary">
                        {new Date(order.orderDateUtc).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {order.isGpsVerified ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800" title={`GPS Distance: ${order.distanceToCustomerMeters?.toFixed(1) || 0}m`}>
                              <MapPin size={10} /> {order.distanceToCustomerMeters ? `${order.distanceToCustomerMeters.toFixed(0)}m` : '0m'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">—</span>
                          )}
                          {order.isFaceVerified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800" title="Biometric Face Verified">
                              <UserCheck size={10} /> Face
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-brand-text-primary">
                        {formatINR(order.totalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={getStatusBadgeVariant(order.orderStatus)}>
                          {order.orderStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye size={13} />
                        </button>
                        {order.orderStatus === 'Draft' && (
                          <button
                            onClick={() => handleSubmitOrder(order)}
                            className="px-2 py-1 bg-brand-success text-white text-[11px] font-semibold rounded hover:bg-green-700 cursor-pointer shadow-xs"
                            title="Submit and Reserve Inventory"
                          >
                            Submit
                          </button>
                        )}
                        {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Dispatched' && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="px-2 py-1 border border-red-200 text-brand-danger text-[11px] font-semibold rounded hover:bg-red-50 cursor-pointer"
                            title="Cancel and Release Reservations"
                          >
                            Cancel
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

      {/* MODAL: VIEW ORDER DETAILS & RESERVATION STATUS */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-3xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                  <span>SALES ORDER: {selectedOrder.orderNumber}</span>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.orderStatus)}>{selectedOrder.orderStatus}</Badge>
                </h3>
                <p className="text-xs text-brand-text-secondary">Created on {new Date(selectedOrder.createdAtUtc).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 border rounded hover:bg-brand-bg-secondary cursor-pointer">
                <XCircle size={16} />
              </button>
            </div>

            {/* Audit & Customer Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-bg-secondary/30 p-3 rounded text-xs">
              <div>
                <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Customer</span>
                <p className="font-semibold text-brand-text-primary">{selectedOrder.customerName}</p>
                <p className="text-[11px] text-brand-text-secondary font-mono">{selectedOrder.customerCode}</p>
              </div>
              <div>
                <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Sales Rep</span>
                <p className="font-semibold text-brand-text-primary">{selectedOrder.salesEmployeeName || 'Direct / Back-Office'}</p>
              </div>
              <div>
                <span className="text-[10px] text-brand-text-secondary uppercase font-bold">GPS Verification</span>
                <p className="font-semibold text-brand-text-primary">
                  {selectedOrder.isGpsVerified ? `≤ 50m (${selectedOrder.distanceToCustomerMeters?.toFixed(1) || 0}m)` : 'Not Tagged'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-brand-text-secondary uppercase font-bold">Face Verification</span>
                <p className="font-semibold text-brand-text-primary">
                  {selectedOrder.isFaceVerified ? 'Passed (1:1 Match)' : 'Not Tagged'}
                </p>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-2">Order Line Items & Reservation</h4>
              <table className="w-full text-left text-xs border-collapse border">
                <thead className="bg-brand-bg-secondary text-[10px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-2 border">Product</th>
                    <th className="p-2 border text-right">Quantity</th>
                    <th className="p-2 border text-right">Unit Price</th>
                    <th className="p-2 border text-right">Tax</th>
                    <th className="p-2 border text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {selectedOrder.items.map(item => (
                    <tr key={item.id}>
                      <td className="p-2 border font-medium">
                        <div>{item.productName}</div>
                        <span className="text-[10px] text-brand-text-secondary font-mono">{item.productCode}</span>
                      </td>
                      <td className="p-2 border text-right font-mono font-bold">{item.quantity} {item.uomName}</td>
                      <td className="p-2 border text-right font-mono">{formatINR(item.unitPrice)}</td>
                      <td className="p-2 border text-right font-mono">{formatINR(item.taxAmount)}</td>
                      <td className="p-2 border text-right font-mono font-bold">{formatINR(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end border-t pt-3">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatINR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Discount:</span>
                  <span className="font-mono text-green-700">-{formatINR(selectedOrder.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-brand-text-secondary">
                  <span>GST / Tax:</span>
                  <span className="font-mono">{formatINR(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-text-primary text-sm border-t pt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-brand-primary">{formatINR(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-3 flex justify-between items-center">
              <div>
                {selectedOrder.orderStatus === 'Draft' && (
                  <button
                    onClick={() => handleSubmitOrder(selectedOrder)}
                    className="px-3 py-1.5 bg-brand-success text-white text-xs font-semibold rounded hover:bg-green-700 cursor-pointer shadow-sm"
                  >
                    Submit & Reserve Stock
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedOrder(null)} className="px-4 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STANDARD CREATE ORDER (BACK-OFFICE) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">Create Standard Sales Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 border rounded hover:bg-brand-bg-secondary cursor-pointer">
                <XCircle size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-brand-text-secondary uppercase font-bold text-[10px] mb-1">Customer *</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-xs focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.legalName} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-brand-text-secondary uppercase font-bold text-[10px] mb-1">Sales Representative</label>
                <select
                  value={newSalesEmployeeId}
                  onChange={(e) => setNewSalesEmployeeId(e.target.value)}
                  className="w-full p-2 border rounded bg-white text-xs focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Select Sales Rep (Optional)...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Addition */}
            <div>
              <label className="block text-brand-text-secondary uppercase font-bold text-[10px] mb-1">Add Products</label>
              <select
                onChange={(e) => {
                  handleAddProduct(e.target.value);
                  e.target.value = '';
                }}
                disabled={!newCustomerId}
                className="w-full p-2 border rounded bg-white text-xs focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
              >
                <option value="">{newCustomerId ? 'Select product to add...' : 'Select customer first...'}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code}) — Base: {formatINR(p.basePrice || 0)}</option>
                ))}
              </select>
            </div>

            {/* Items List */}
            {newOrderItems.length > 0 && (
              <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-secondary text-[10px] font-bold text-brand-text-secondary uppercase">
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {newOrderItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">
                          {item.productName}
                          <span className="block text-[10px] text-brand-text-secondary font-mono">Tier: {item.priceSource}</span>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const q = Math.max(1, parseInt(e.target.value) || 1);
                              setNewOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: q, taxAmount: Number((q * it.unitPrice * 0.18).toFixed(2)) } : it));
                            }}
                            className="w-16 p-1 border rounded text-center text-xs"
                          />
                        </td>
                        <td className="p-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatINR(item.quantity * item.unitPrice + item.taxAmount)}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setNewOrderItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Preview */}
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-xs text-brand-text-secondary">{newOrderItems.length} line items added</span>
              <div className="text-right">
                <span className="text-xs text-brand-text-secondary">Estimated Total: </span>
                <span className="text-base font-mono font-bold text-brand-primary">
                  {formatINR(newOrderItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice) + it.taxAmount, 0))}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t pt-3 flex justify-end gap-2">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => handleCreateOrder(false)}
                disabled={submittingOrder || !newCustomerId || newOrderItems.length === 0}
                className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
              >
                {submittingOrder ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                Create Draft Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GUIDED FIELD SALES ORDER (GPS 50m + FACE LIVENESS) */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                  <Navigation size={18} className="text-brand-primary" />
                  <span>Field Sales Order Wizard</span>
                </h3>
                <p className="text-xs text-brand-text-secondary">Step {fieldStep} of 4: {fieldStep === 1 ? 'Customer Selection' : fieldStep === 2 ? 'GPS Geofence Check (≤ 50m)' : fieldStep === 3 ? 'Biometric Face Verification' : 'Product Selection & Confirmation'}</p>
              </div>
              <button onClick={() => setIsFieldModalOpen(false)} className="p-1 border rounded hover:bg-brand-bg-secondary cursor-pointer">
                <XCircle size={16} />
              </button>
            </div>

            {/* STEP INDICATOR */}
            <div className="flex items-center justify-between border-b pb-3 text-xs font-semibold">
              <span className={fieldStep === 1 ? 'text-brand-primary font-bold' : fieldStep > 1 ? 'text-green-600' : 'text-gray-400'}>1. Customer</span>
              <ArrowRight size={12} className="text-gray-400" />
              <span className={fieldStep === 2 ? 'text-brand-primary font-bold' : fieldStep > 2 ? 'text-green-600' : 'text-gray-400'}>2. GPS (≤50m)</span>
              <ArrowRight size={12} className="text-gray-400" />
              <span className={fieldStep === 3 ? 'text-brand-primary font-bold' : fieldStep > 3 ? 'text-green-600' : 'text-gray-400'}>3. Face Verify</span>
              <ArrowRight size={12} className="text-gray-400" />
              <span className={fieldStep === 4 ? 'text-brand-primary font-bold' : 'text-gray-400'}>4. Order Items</span>
            </div>

            {/* STEP 1: SELECT CUSTOMER */}
            {fieldStep === 1 && (
              <div className="space-y-4 py-2">
                <label className="block text-xs font-bold text-brand-text-primary">Select Target Store / Customer</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded">
                  {customers.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => setFieldCustomer(cust)}
                      className={`p-3 rounded border cursor-pointer transition flex justify-between items-center ${
                        fieldCustomer?.id === cust.id ? 'border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary' : 'hover:bg-brand-bg-secondary/40'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-brand-text-primary">{cust.tradeName || cust.legalName}</p>
                        <p className="text-[11px] text-brand-text-secondary">{cust.addressLine1}, {cust.city}</p>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="font-mono text-brand-text-secondary">{cust.code}</span>
                        {cust.latitude && cust.longitude ? (
                          <span className="block text-[10px] text-green-700 font-semibold flex items-center gap-0.5"><MapPin size={10} /> Enrolled GPS</span>
                        ) : (
                          <span className="block text-[10px] text-amber-600 font-semibold">Initial Tagging</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      if (fieldCustomer) setFieldStep(2);
                    }}
                    disabled={!fieldCustomer}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    Proceed to GPS Check <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: GPS GEOFENCE CHECK */}
            {fieldStep === 2 && fieldCustomer && (
              <div className="space-y-4 py-2 text-center">
                <div className="p-4 bg-brand-bg-secondary/40 rounded border space-y-2">
                  <MapPin size={28} className="mx-auto text-brand-primary animate-bounce" />
                  <h4 className="text-xs font-bold text-brand-text-primary">Verifying Geofence for {fieldCustomer.tradeName || fieldCustomer.legalName}</h4>
                  <p className="text-[11px] text-brand-text-secondary max-w-md mx-auto">
                    Field order confirmation requires your device to be within 50 meters of the registered customer coordinates.
                  </p>
                </div>

                {gpsResult ? (
                  <div className={`p-4 rounded border ${gpsResult.isWithinRange ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <p className="font-bold text-xs">{gpsResult.isWithinRange ? '✓ Geofence Verified' : '✗ Location Out of Range'}</p>
                    <p className="text-xs mt-1">{gpsResult.message}</p>
                    {userCoords && (
                      <p className="text-[10px] text-brand-text-secondary mt-2 font-mono">
                        Device Lat: {userCoords.lat.toFixed(6)}, Lng: {userCoords.lng.toFixed(6)} (Accuracy: {userCoords.accuracy.toFixed(1)}m)
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={captureGpsLocation}
                    disabled={capturingGps}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    {capturingGps ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
                    {capturingGps ? 'Querying Device Coordinates...' : 'Capture & Verify GPS Location'}
                  </button>
                )}

                <div className="flex justify-between border-t pt-3">
                  <button onClick={() => setFieldStep(1)} className="px-3 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Back</button>
                  <button
                    onClick={() => {
                      setFieldStep(3);
                      startCamera();
                    }}
                    disabled={!gpsResult?.isWithinRange}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    Proceed to Face Verification <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: FACE & LIVENESS VERIFICATION */}
            {fieldStep === 3 && (
              <div className="space-y-4 py-2 text-center">
                <div className="p-3 bg-brand-bg-secondary/40 rounded border space-y-1">
                  <h4 className="text-xs font-bold text-brand-text-primary">1:1 Biometric Face & Liveness Verification</h4>
                  <p className="text-[11px] text-brand-text-secondary">
                    Please position your face clearly in the camera. This verifies order authenticity for the authenticated representative.
                  </p>
                </div>

                <div className="relative mx-auto w-64 h-48 bg-black rounded-lg overflow-hidden border border-brand-border flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {verifyingFace && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-2">
                      <RefreshCw size={20} className="animate-spin text-brand-primary" />
                      <span>Verifying Embedding & Liveness...</span>
                    </div>
                  )}
                  {faceVerified && (
                    <div className="absolute inset-0 bg-green-900/80 flex flex-col items-center justify-center text-white text-xs gap-1">
                      <CheckCircle2 size={28} className="text-white" />
                      <span className="font-bold">Face Verified</span>
                      <span className="text-[10px]">Score: {((faceScore || 0.9) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {faceError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {faceError}
                  </div>
                )}

                {!faceVerified ? (
                  <button
                    onClick={captureAndVerifyFace}
                    disabled={verifyingFace}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <Camera size={14} /> Capture & Verify Face
                  </button>
                ) : (
                  <p className="text-xs text-green-700 font-bold">✓ Identity confirmed. You may now input order items.</p>
                )}

                <div className="flex justify-between border-t pt-3">
                  <button onClick={() => setFieldStep(2)} className="px-3 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Back</button>
                  <button
                    onClick={() => setFieldStep(4)}
                    disabled={!faceVerified}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    Proceed to Products <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ORDER ITEMS & SUBMIT */}
            {fieldStep === 4 && fieldCustomer && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-green-900">{fieldCustomer.tradeName || fieldCustomer.legalName}</span>
                    <span className="block text-[10px] text-green-700">GPS & Face Verification Passed</span>
                  </div>
                  <Badge variant="success">Audit Cleared</Badge>
                </div>

                {/* Product Add */}
                <div>
                  <label className="block text-brand-text-secondary uppercase font-bold text-[10px] mb-1">Add Product (Tier Price Applied)</label>
                  <select
                    onChange={(e) => {
                      handleAddProduct(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full p-2 border rounded bg-white text-xs focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Select product to add...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                {newOrderItems.length > 0 && (
                  <div className="border rounded overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand-bg-secondary text-[10px] font-bold text-brand-text-secondary uppercase">
                        <tr>
                          <th className="p-2">Product</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Unit Price</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {newOrderItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">
                              {item.productName}
                              <span className="block text-[10px] text-brand-text-secondary font-mono">{item.priceSource}</span>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const q = Math.max(1, parseInt(e.target.value) || 1);
                                  setNewOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: q, taxAmount: Number((q * it.unitPrice * 0.18).toFixed(2)) } : it));
                                }}
                                className="w-16 p-1 border rounded text-center text-xs"
                              />
                            </td>
                            <td className="p-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
                            <td className="p-2 text-right font-mono font-bold">{formatINR(item.quantity * item.unitPrice + item.taxAmount)}</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => setNewOrderItems(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-xs text-brand-text-secondary">{newOrderItems.length} items</span>
                  <span className="text-base font-mono font-bold text-brand-primary">
                    {formatINR(newOrderItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice) + it.taxAmount, 0))}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-between border-t pt-3">
                  <button onClick={() => setFieldStep(3)} className="px-3 py-1.5 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Back</button>
                  <button
                    onClick={() => handleCreateOrder(true)}
                    disabled={submittingOrder || newOrderItems.length === 0}
                    className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    {submittingOrder ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    Confirm & Create Field Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
