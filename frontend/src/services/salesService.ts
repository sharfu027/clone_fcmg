import { apiClient } from '../api/apiClient';
import { RealSalesOrder, CreateRealSalesOrderRequest } from '../types/sales';

export const salesService = {
  async fetchSalesOrders(params?: {
    companyId?: string;
    customerId?: string;
    salesEmployeeId?: string;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<RealSalesOrder[]> {
    return apiClient.get<RealSalesOrder[]>('/api/v1/sales/orders', { params });
  },

  async fetchSalesOrderById(id: string): Promise<RealSalesOrder> {
    return apiClient.get<RealSalesOrder>(`/api/v1/sales/orders/${id}`);
  },

  async createSalesOrder(payload: CreateRealSalesOrderRequest): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>('/api/v1/sales/orders', payload);
  },

  async submitSalesOrder(id: string, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>(`/api/v1/sales/orders/${id}/submit`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  async cancelSalesOrder(id: string, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>(`/api/v1/sales/orders/${id}/cancel`, null, {
      params: companyId ? { companyId } : undefined
    });
  }
};
