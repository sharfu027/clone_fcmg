import { apiClient } from '../api/apiClient';
import {
  WarehouseZone,
  WarehouseBin,
  ReceivingOperation,
  PutawayTask,
  WarehouseStockTransfer,
  PickList,
  PackingSlip,
  DispatchOrder,
  WarehouseTask,
  WarehouseMetrics
} from '../types/warehouse';

export const warehouseService = {
  // Zones & Bins
  async getZones(): Promise<WarehouseZone[]> {
    return apiClient.get<WarehouseZone[]>('/api/v1/warehouse/zones');
  },

  async getBins(params?: Record<string, string | number | boolean | undefined>): Promise<WarehouseBin[]> {
    return apiClient.get<WarehouseBin[]>('/api/v1/warehouse/bins', { params });
  },

  async createBin(payload: Partial<WarehouseBin>): Promise<WarehouseBin> {
    return apiClient.post<WarehouseBin>('/api/v1/warehouse/bins', payload);
  },

  // Receiving & Putaway
  async getReceivingOperations(): Promise<ReceivingOperation[]> {
    return apiClient.get<ReceivingOperation[]>('/api/v1/warehouse/receiving');
  },

  // Stock Transfers
  async getTransfers(): Promise<WarehouseStockTransfer[]> {
    return apiClient.get<WarehouseStockTransfer[]>('/api/v1/warehouse/transfers');
  },

  async getPutawayTasks(): Promise<PutawayTask[]> {
    return apiClient.get<PutawayTask[]>('/api/v1/warehouse/putaway');
  },

  // Internal Transfers
  async getStockTransfers(): Promise<WarehouseStockTransfer[]> {
    return apiClient.get<WarehouseStockTransfer[]>('/api/v1/warehouse/transfers');
  },

  async createStockTransfer(payload: Partial<WarehouseStockTransfer>): Promise<WarehouseStockTransfer> {
    return apiClient.post<WarehouseStockTransfer>('/api/v1/warehouse/transfers', payload);
  },

  // Picking & Packing
  async getPickLists(): Promise<PickList[]> {
    return apiClient.get<PickList[]>('/api/v1/warehouse/pick-lists');
  },

  async getPackingSlips(): Promise<PackingSlip[]> {
    return apiClient.get<PackingSlip[]>('/api/v1/warehouse/packing-slips');
  },

  // Dispatch Orders
  async getDispatchOrders(): Promise<DispatchOrder[]> {
    return apiClient.get<DispatchOrder[]>('/api/v1/warehouse/dispatch');
  },

  // Worker Tasks
  async getWarehouseTasks(): Promise<WarehouseTask[]> {
    return apiClient.get<WarehouseTask[]>('/api/v1/warehouse/tasks');
  },

  // Analytics Metrics
  async getWarehouseMetrics(): Promise<WarehouseMetrics> {
    return apiClient.get<WarehouseMetrics>('/api/v1/warehouse/metrics');
  }
};
