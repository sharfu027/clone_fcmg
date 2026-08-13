import { apiClient } from '../api/apiClient';
import {
  SalesReturnRequest,
  PurchaseReturnRequest,
  ReturnInspection,
  ReplacementOrder,
  RefundRecord,
  ReturnMetrics
} from '../types/returns';

export const returnsService = {
  // Sales Returns (RMA)
  async getSalesReturns(): Promise<SalesReturnRequest[]> {
    return apiClient.get<SalesReturnRequest[]>('/api/v1/returns/sales');
  },

  async createSalesReturn(payload: Partial<SalesReturnRequest>): Promise<SalesReturnRequest> {
    return apiClient.post<SalesReturnRequest>('/api/v1/returns/sales', payload);
  },

  // Purchase Returns
  async getPurchaseReturns(): Promise<PurchaseReturnRequest[]> {
    return apiClient.get<PurchaseReturnRequest[]>('/api/v1/returns/purchase');
  },

  async createPurchaseReturn(payload: Partial<PurchaseReturnRequest>): Promise<PurchaseReturnRequest> {
    return apiClient.post<PurchaseReturnRequest>('/api/v1/returns/purchase', payload);
  },

  // Inspection & Disposition
  async getInspections(): Promise<ReturnInspection[]> {
    return apiClient.get<ReturnInspection[]>('/api/v1/returns/inspections');
  },

  async inspectReturn(payload: Partial<ReturnInspection>): Promise<ReturnInspection> {
    return apiClient.post<ReturnInspection>('/api/v1/returns/inspect', payload);
  },

  // Replacements
  async getReplacements(): Promise<ReplacementOrder[]> {
    return apiClient.get<ReplacementOrder[]>('/api/v1/returns/replacements');
  },

  // Refunds
  async getRefunds(): Promise<RefundRecord[]> {
    return apiClient.get<RefundRecord[]>('/api/v1/returns/refunds');
  },

  // Metrics
  async getReturnMetrics(): Promise<ReturnMetrics> {
    return apiClient.get<ReturnMetrics>('/api/v1/returns/metrics');
  }
};
