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

  async updateSalesOrder(id: string, payload: import('../types/sales').UpdateRealSalesOrderRequest, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.put<RealSalesOrder>(`/api/v1/sales/orders/${id}`, payload, {
      params: companyId ? { companyId } : undefined
    });
  },

  async verifyFieldLocation(payload: import('../types/sales').VerifyFieldLocationRequest): Promise<import('../types/sales').VerifyFieldLocationResult> {
    return apiClient.post<import('../types/sales').VerifyFieldLocationResult>('/api/v1/sales/orders/verify-field-location', payload);
  },

  async resolvePrice(params: {
    companyId: string;
    productId: string;
    customerId?: string;
    targetDate?: string;
  }): Promise<import('../types/sales').PriceResolutionResult> {
    return apiClient.get<import('../types/sales').PriceResolutionResult>('/api/v1/sales/orders/resolve-price', { params });
  },

  async verifyFaceBiometrics(payload: {
    userId: string;
    imageBase64: string;
    deviceId?: string;
  }): Promise<{ success: boolean; score: number; message: string; requiresLivenessCheck?: boolean }> {
    return apiClient.post('/api/v1/security/face/verify', payload);
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
