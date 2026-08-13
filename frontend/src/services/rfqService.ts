import { apiClient } from '../api/apiClient';
import {
  Rfq,
  RfqMetrics,
  RfqStatus,
  CreateRfqRequest,
  UpdateRfqRequest,
} from '../types/procurement';

const BASE = '/api/v1/procurement/rfqs';

export interface FetchRfqsParams {
  companyId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RfqStatus;
  purchaseRequisitionId?: string;
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

export const rfqService = {
  async getRfqs(params: FetchRfqsParams): Promise<PagedResponse<Rfq>> {
    return apiClient.get<PagedResponse<Rfq>>(BASE, { params: params as unknown as Record<string, string | number | boolean | undefined> });
  },

  async getRfqById(id: string): Promise<Rfq> {
    return apiClient.get<Rfq>(`${BASE}/${id}`);
  },

  async getNextRfqNumber(companyId: string): Promise<string> {
    return apiClient.get<string>(`${BASE}/next-number`, { params: { companyId } });
  },

  async getRfqMetrics(companyId: string): Promise<RfqMetrics> {
    return apiClient.get<RfqMetrics>(`${BASE}/metrics`, { params: { companyId } });
  },

  async getRfqsByPr(purchaseRequisitionId: string): Promise<Rfq[]> {
    return apiClient.get<Rfq[]>(`${BASE}/from-pr/${purchaseRequisitionId}`);
  },

  async createRfq(payload: CreateRfqRequest): Promise<Rfq> {
    return apiClient.post<Rfq>(BASE, payload);
  },

  async updateRfq(id: string, payload: UpdateRfqRequest): Promise<Rfq> {
    return apiClient.put<Rfq>(`${BASE}/${id}`, payload);
  },

  async submitRfq(id: string): Promise<Rfq> {
    return apiClient.post<Rfq>(`${BASE}/${id}/submit`, {});
  },

  async sendRfq(id: string): Promise<Rfq> {
    return apiClient.post<Rfq>(`${BASE}/${id}/send`, {});
  },

  async cancelRfq(id: string, reason: string): Promise<Rfq> {
    return apiClient.post<Rfq>(`${BASE}/${id}/cancel`, { reason });
  },

  async closeRfq(id: string, reason: string): Promise<Rfq> {
    return apiClient.post<Rfq>(`${BASE}/${id}/close`, { reason });
  },
};
