import { apiClient } from '../api/apiClient';
import {
  InventoryLocation,
  InventoryBalance,
  InventoryReservation,
  ReserveStockRequest,
  InventoryAvailabilityDto,
  InventoryAlternativeLocationDto,
  OpeningBalanceRequest,
  StockItem,
  BatchInfo,
  SerialNumber,
  StockMovement,
  StockReservation,
  PhysicalCountSheet,
  InventoryAdjustment,
  ReorderRule,
  InventoryAnalytics,
  InventoryMetrics
} from '../types/inventory';

export const inventoryService = {
  // Inventory Locations (Phase 1 Foundation)
  async fetchInventoryLocations(params?: {
    companyId?: string;
    branchId?: string;
    warehouseId?: string;
    departmentId?: string;
    locationType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<InventoryLocation[]> {
    return apiClient.get<InventoryLocation[]>('/api/v1/inventory/locations', { params });
  },

  async fetchInventoryLocationById(id: string): Promise<InventoryLocation> {
    return apiClient.get<InventoryLocation>(`/api/v1/inventory/locations/${id}`);
  },

  async createInventoryLocation(payload: {
    companyId?: string;
    branchId?: string | null;
    warehouseId?: string | null;
    departmentId?: string | null;
    code: string;
    name: string;
    locationType?: string;
  }): Promise<InventoryLocation> {
    return apiClient.post<InventoryLocation>('/api/v1/inventory/locations', payload);
  },

  async updateInventoryLocation(id: string, payload: {
    id: string;
    branchId?: string | null;
    warehouseId?: string | null;
    departmentId?: string | null;
    code: string;
    name: string;
    locationType?: string;
    isActive: boolean;
  }): Promise<InventoryLocation> {
    return apiClient.put<InventoryLocation>(`/api/v1/inventory/locations/${id}`, payload);
  },

  async deleteInventoryLocation(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/inventory/locations/${id}`);
  },

  // Inventory Balances (Phase 1 Foundation - Read Only Snapshots)
  async fetchInventoryBalances(params?: {
    companyId?: string;
    inventoryLocationId?: string;
    productId?: string;
    search?: string;
    isActiveLocation?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<InventoryBalance[]> {
    return apiClient.get<InventoryBalance[]>('/api/v1/inventory/balances', { params });
  },

  async fetchInventoryBalanceById(id: string): Promise<InventoryBalance> {
    return apiClient.get<InventoryBalance>(`/api/v1/inventory/balances/${id}`);
  },

  async adjustInventoryBalance(id: string, payload: {
    newOnHandQuantity: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
    reason?: string;
    releaseExcessReservations?: boolean;
    minStockQuantity?: number;
  }): Promise<InventoryBalance> {
    return apiClient.put<InventoryBalance>(`/api/v1/inventory/balances/${id}`, {
      releaseExcessReservations: true,
      ...payload
    });
  },

  async deleteInventoryBalance(id: string, reason?: string, releaseReservations = true): Promise<void> {
    return apiClient.delete<void>(`/api/v1/inventory/balances/${id}`, {
      params: {
        reason: reason || undefined,
        releaseReservations
      }
    });
  },

  // Inventory Stock Policies (Safety Stock / Reorder Thresholds)
  async fetchStockPolicies(params?: {
    companyId?: string;
    inventoryLocationId?: string;
    productId?: string;
  }): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/inventory/policies', { params });
  },

  async upsertStockPolicy(payload: {
    companyId: string;
    inventoryLocationId: string;
    productId: string;
    minStockQuantity: number;
    reorderPoint?: number | null;
    reorderQuantity?: number | null;
  }): Promise<any> {
    return apiClient.put<any>('/api/v1/inventory/policies', payload);
  },

  // Inventory Transactions Ledger (Phase 1 Foundation - Stock Ledger)
  async postInventoryTransaction(payload: PostInventoryTransactionRequest): Promise<InventoryTransaction> {
    return apiClient.post<InventoryTransaction>('/api/v1/inventory/transactions', payload);
  },

  async fetchInventoryTransactions(params?: {
    companyId?: string;
    inventoryLocationId?: string;
    productId?: string;
    transactionType?: string;
    referenceDocumentType?: string;
    referenceDocumentNumber?: string;
    performedByEmployeeId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<InventoryTransaction[]> {
    return apiClient.get<InventoryTransaction[]>('/api/v1/inventory/transactions', { params });
  },

  async fetchInventoryTransactionById(id: string): Promise<InventoryTransaction> {
    return apiClient.get<InventoryTransaction>(`/api/v1/inventory/transactions/${id}`);
  },

  async fetchLatestInventoryTransaction(params: {
    companyId: string;
    inventoryLocationId: string;
    productId: string;
  }): Promise<InventoryTransaction | null> {
    return apiClient.get<InventoryTransaction | null>('/api/v1/inventory/transactions/latest', { params });
  },

  async fetchTransactionsByReference(referenceDocumentType: string, referenceDocumentId: string, companyId?: string): Promise<InventoryTransaction[]> {
    return apiClient.get<InventoryTransaction[]>(`/api/v1/inventory/transactions/reference/${referenceDocumentType}/${referenceDocumentId}`, {
      params: { companyId }
    });
  },

  async reconcileInventory(params: {
    companyId: string;
    inventoryLocationId: string;
    productId: string;
  }): Promise<InventoryReconciliationDto> {
    return apiClient.get<InventoryReconciliationDto>('/api/v1/inventory/transactions/reconcile', { params });
  },

  async createOpeningBalance(payload: OpeningBalanceRequest): Promise<InventoryTransaction> {
    return this.postInventoryTransaction({
      companyId: payload.companyId,
      inventoryLocationId: payload.inventoryLocationId,
      productId: payload.productId,
      transactionType: 'OpeningBalance',
      quantity: payload.openingQuantity,
      notes: 'Opening stock established via ledger'
    });
  },

  // Stock Availability Engine (Phase 2 Step 1)
  async checkStockAvailability(params: {
    companyId: string;
    productId: string;
    inventoryLocationId: string;
    requestedQuantity?: number;
  }): Promise<InventoryAvailabilityDto> {
    return apiClient.get<InventoryAvailabilityDto>('/api/v1/inventory/availability', { params });
  },

  async fetchAlternativeLocations(params: {
    companyId: string;
    productId: string;
    requestedQuantity?: number;
    excludedLocationId?: string;
  }): Promise<InventoryAlternativeLocationDto[]> {
    return apiClient.get<InventoryAlternativeLocationDto[]>('/api/v1/inventory/availability/alternatives', { params });
  },

  // Inventory Stock Reservations (Phase 2 Step 1)
  async fetchInventoryReservations(params?: {
    companyId?: string;
    inventoryLocationId?: string;
    productId?: string;
    status?: string;
    salesOrderId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<InventoryReservation[]> {
    return apiClient.get<InventoryReservation[]>('/api/v1/inventory/reservations', { params });
  },

  async fetchInventoryReservationById(id: string): Promise<InventoryReservation> {
    return apiClient.get<InventoryReservation>(`/api/v1/inventory/reservations/${id}`);
  },

  async reserveStock(payload: ReserveStockRequest): Promise<InventoryReservation> {
    return apiClient.post<InventoryReservation>('/api/v1/inventory/reservations', payload);
  },

  async releaseReservation(id: string, companyId?: string): Promise<InventoryReservation> {
    return apiClient.post<InventoryReservation>(`/api/v1/inventory/reservations/${id}/release`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  async cancelReservation(id: string, companyId?: string): Promise<InventoryReservation> {
    return apiClient.post<InventoryReservation>(`/api/v1/inventory/reservations/${id}/cancel`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  // Stock Transfers Lifecycle (Phase 2)
  async fetchStockTransfers(params?: {
    companyId?: string;
    sourceLocationId?: string;
    destinationLocationId?: string;
    salesOrderId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<StockTransfer[]> {
    return apiClient.get<StockTransfer[]>('/api/v1/inventory/transfers', { params });
  },

  async fetchStockTransferById(id: string): Promise<StockTransfer> {
    return apiClient.get<StockTransfer>(`/api/v1/inventory/transfers/${id}`);
  },

  async createStockTransfer(payload: CreateStockTransferRequest): Promise<StockTransfer> {
    return apiClient.post<StockTransfer>('/api/v1/inventory/transfers', payload);
  },

  async approveStockTransfer(id: string, payload: ApproveStockTransferRequest, companyId?: string): Promise<StockTransfer> {
    return apiClient.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/approve`, payload, {
      params: companyId ? { companyId } : undefined
    });
  },

  async dispatchStockTransfer(id: string, companyId?: string): Promise<StockTransfer> {
    return apiClient.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/dispatch`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  async receiveStockTransfer(id: string, payload?: ReceiveStockTransferRequest, companyId?: string): Promise<StockTransfer> {
    return apiClient.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/receive`, payload || {}, {
      params: companyId ? { companyId } : undefined
    });
  },

  async cancelStockTransfer(id: string, companyId?: string): Promise<StockTransfer> {
    return apiClient.post<StockTransfer>(`/api/v1/inventory/transfers/${id}/cancel`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  // Stock Master
  async getStockItems(params?: Record<string, string | number | boolean | undefined>): Promise<StockItem[]> {
    return apiClient.get<StockItem[]>('/api/v1/inventory/stock', { params });
  },

  // Batches
  async getBatches(): Promise<BatchInfo[]> {
    return apiClient.get<BatchInfo[]>('/api/v1/inventory/batches');
  },

  // Serial Numbers
  async getSerialNumbers(): Promise<SerialNumber[]> {
    return apiClient.get<SerialNumber[]>('/api/v1/inventory/serials');
  },

  // Stock Movements
  async getMovements(): Promise<StockMovement[]> {
    return apiClient.get<StockMovement[]>('/api/v1/inventory/movements');
  },

  // Reservations
  async getReservations(): Promise<StockReservation[]> {
    return apiClient.get<StockReservation[]>('/api/v1/inventory/reservations');
  },

  // Physical Counts
  async getPhysicalCounts(): Promise<PhysicalCountSheet[]> {
    return apiClient.get<PhysicalCountSheet[]>('/api/v1/inventory/counts');
  },

  async createPhysicalCount(payload: Partial<PhysicalCountSheet>): Promise<PhysicalCountSheet> {
    return apiClient.post<PhysicalCountSheet>('/api/v1/inventory/counts', payload);
  },

  // Adjustments
  async getAdjustments(): Promise<InventoryAdjustment[]> {
    return apiClient.get<InventoryAdjustment[]>('/api/v1/inventory/adjustments');
  },

  async createAdjustment(payload: Partial<InventoryAdjustment>): Promise<InventoryAdjustment> {
    return apiClient.post<InventoryAdjustment>('/api/v1/inventory/adjustments', payload);
  },

  // Reorder Rules
  async getReorderRules(): Promise<ReorderRule[]> {
    return apiClient.get<ReorderRule[]>('/api/v1/inventory/reorder-rules');
  },

  // Analytics
  async getInventoryAnalytics(): Promise<InventoryAnalytics[]> {
    return apiClient.get<InventoryAnalytics[]>('/api/v1/inventory/analytics');
  },

  // Metrics
  async getInventoryMetrics(): Promise<InventoryMetrics> {
    return apiClient.get<InventoryMetrics>('/api/v1/inventory/metrics');
  },

  // -------------------------------------------------------------------------
  // PHASE 3 FULFILLMENT SERVICES
  // -------------------------------------------------------------------------
  async fetchReadyOrders(params?: { companyId?: string; search?: string; locationId?: string }): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/inventory/fulfillment/ready-orders', { params });
  },

  // Pick Tasks
  async fetchPickTasks(params?: {
    companyId?: string;
    salesOrderId?: string;
    locationId?: string;
    employeeId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/inventory/picks', { params });
  },

  async fetchPickTaskById(id: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/inventory/picks/${id}`);
  },

  async createPickTask(payload: { salesOrderId: string; assignedEmployeeId?: string | null; notes?: string | null }): Promise<any> {
    return apiClient.post<any>('/api/v1/inventory/picks', payload);
  },

  async assignPicker(id: string, employeeId: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/picks/${id}/assign`, { employeeId });
  },

  async startPickTask(id: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/picks/${id}/start`);
  },

  async completePickTask(id: string, lineVerifications?: any[]): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/picks/${id}/complete`, { lineVerifications });
  },

  async cancelPickTask(id: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/picks/${id}/cancel`);
  },

  // Pack Tasks
  async fetchPackTasks(params?: {
    companyId?: string;
    salesOrderId?: string;
    pickTaskId?: string;
    employeeId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/inventory/packs', { params });
  },

  async fetchPackTaskById(id: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/inventory/packs/${id}`);
  },

  async createPackTask(payload: { pickTaskId: string; assignedEmployeeId?: string | null; notes?: string | null }): Promise<any> {
    return apiClient.post<any>('/api/v1/inventory/packs', payload);
  },

  async assignPacker(id: string, employeeId: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/packs/${id}/assign`, { employeeId });
  },

  async completePackTask(id: string, packages?: any[]): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/packs/${id}/complete`, { packages });
  },

  async cancelPackTask(id: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/packs/${id}/cancel`);
  },

  // Dispatches
  async fetchDispatches(params?: {
    companyId?: string;
    salesOrderId?: string;
    packTaskId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/inventory/dispatches', { params });
  },

  async fetchDispatchById(id: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/inventory/dispatches/${id}`);
  },

  async createDispatch(payload: {
    salesOrderId: string;
    packTaskId?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    transporterName?: string | null;
    waybillNumber?: string | null;
    notes?: string | null;
  }): Promise<any> {
    return apiClient.post<any>('/api/v1/inventory/dispatches', payload);
  },

  async confirmDispatch(id: string, payload?: { dispatchedByEmployeeId?: string | null; notes?: string | null }): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/dispatches/${id}/confirm`, payload ?? {});
  },

  async cancelDispatch(id: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/inventory/dispatches/${id}/cancel`);
  }
};
