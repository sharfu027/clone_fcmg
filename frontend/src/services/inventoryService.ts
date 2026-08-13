import { apiClient } from '../api/apiClient';
import {
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
  }
};
