import { apiClient } from '../api/apiClient';
import {
  PurchaseRequisition,
  ProcurementMetrics,
  RequisitionStatus,
  RequisitionPriority,
} from '../types/procurement';

const BASE_URL = '/api/v1/procurement/purchase-requisitions';

export interface FetchPRsParams {
  companyId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RequisitionStatus;
  priority?: RequisitionPriority;
  fromDate?: string;
  toDate?: string;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreatePRItemPayload {
  productId: string;
  requestedQuantity: number;
  estimatedUnitPrice: number;
  notes?: string;
}

export interface CreatePRPayload {
  companyId: string;
  departmentId?: string;
  departmentName?: string;
  warehouseId?: string;
  warehouseName?: string;
  requestDate: string;
  requiredByDate: string;
  priority: RequisitionPriority;
  purpose: string;
  notes?: string;
  items: CreatePRItemPayload[];
}

export interface UpdatePRPayload {
  id: string;
  departmentId?: string;
  departmentName?: string;
  warehouseId?: string;
  warehouseName?: string;
  requestDate: string;
  requiredByDate: string;
  priority: RequisitionPriority;
  purpose: string;
  notes?: string;
  items: CreatePRItemPayload[];
}

export const procurementService = {
  async getPurchaseRequisitions(params: FetchPRsParams): Promise<PagedResponse<PurchaseRequisition>> {
    return apiClient.get<PagedResponse<PurchaseRequisition>>(BASE_URL, {
      params: {
        companyId: params.companyId,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status,
        priority: params.priority,
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
    });
  },

  async getNextRequisitionNumber(companyId: string): Promise<string> {
    return apiClient.get<string>(`${BASE_URL}/next-number`, {
      params: { companyId },
    });
  },

  async getProcurementMetrics(companyId: string): Promise<ProcurementMetrics> {
    return apiClient.get<ProcurementMetrics>(`${BASE_URL}/metrics`, {
      params: { companyId },
    });
  },

  async getPurchaseRequisitionById(id: string): Promise<PurchaseRequisition> {
    return apiClient.get<PurchaseRequisition>(`${BASE_URL}/${id}`);
  },

  async createPurchaseRequisition(payload: CreatePRPayload): Promise<PurchaseRequisition> {
    return apiClient.post<PurchaseRequisition>(BASE_URL, payload);
  },

  async updatePurchaseRequisition(id: string, payload: UpdatePRPayload): Promise<PurchaseRequisition> {
    return apiClient.put<PurchaseRequisition>(`${BASE_URL}/${id}`, payload);
  },

  async deletePurchaseRequisition(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_URL}/${id}`);
  },

  async submitPurchaseRequisition(id: string): Promise<PurchaseRequisition> {
    return apiClient.post<PurchaseRequisition>(`${BASE_URL}/${id}/submit`, {});
  },

  async approvePurchaseRequisition(id: string, comment?: string): Promise<PurchaseRequisition> {
    return apiClient.post<PurchaseRequisition>(`${BASE_URL}/${id}/approve`, { comment });
  },

  async rejectPurchaseRequisition(id: string, reason: string): Promise<PurchaseRequisition> {
    return apiClient.post<PurchaseRequisition>(`${BASE_URL}/${id}/reject`, { reason });
  },

  async cancelPurchaseRequisition(id: string, reason?: string): Promise<PurchaseRequisition> {
    return apiClient.post<PurchaseRequisition>(`${BASE_URL}/${id}/cancel`, { reason });
  },
};
