import { apiClient } from '../api/apiClient';
import {
  SfaSalesRep,
  SalesBeat,
  SalesRepCustomerAssignment,
  SalesVisit,
  SfaDashboardMetrics,
  CreateSalesBeatPayload,
  UpdateSalesBeatPayload,
  AssignCustomerPayload,
  CheckInVisitPayload,
  CheckOutVisitPayload
} from '../types/sfa';

export const sfaService = {
  // Sales Reps (derived from Master Data Employees)
  async getSalesReps(companyId?: string, search?: string): Promise<SfaSalesRep[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<SfaSalesRep[]>(`/api/v1/sfa/reps${queryString}`);
  },

  // Beats & Routes
  async getBeats(companyId?: string, salesEmployeeId?: string, search?: string): Promise<SalesBeat[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (salesEmployeeId) params.append('salesEmployeeId', salesEmployeeId);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<SalesBeat[]>(`/api/v1/sfa/beats${queryString}`);
  },

  async createBeat(payload: CreateSalesBeatPayload): Promise<SalesBeat> {
    return apiClient.post<SalesBeat>('/api/v1/sfa/beats', payload);
  },

  async updateBeat(id: string, payload: UpdateSalesBeatPayload): Promise<SalesBeat> {
    return apiClient.put<SalesBeat>(`/api/v1/sfa/beats/${id}`, payload);
  },

  async deleteBeat(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/sfa/beats/${id}`);
  },

  // Customer Assignments
  async getCustomerAssignments(companyId?: string, employeeId?: string, customerId?: string): Promise<SalesRepCustomerAssignment[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (employeeId) params.append('employeeId', employeeId);
    if (customerId) params.append('customerId', customerId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<SalesRepCustomerAssignment[]>(`/api/v1/sfa/customer-assignments${queryString}`);
  },

  async assignCustomer(payload: AssignCustomerPayload): Promise<SalesRepCustomerAssignment> {
    return apiClient.post<SalesRepCustomerAssignment>('/api/v1/sfa/customer-assignments', payload);
  },

  async removeCustomerAssignment(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/sfa/customer-assignments/${id}`);
  },

  // Store Visits & GPS Check-in
  async getVisits(companyId?: string, salesEmployeeId?: string, customerId?: string, fromDate?: string, toDate?: string, outcome?: string): Promise<SalesVisit[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (salesEmployeeId) params.append('salesEmployeeId', salesEmployeeId);
    if (customerId) params.append('customerId', customerId);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (outcome) params.append('outcome', outcome);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<SalesVisit[]>(`/api/v1/sfa/visits${queryString}`);
  },

  async checkInVisit(payload: CheckInVisitPayload): Promise<SalesVisit> {
    return apiClient.post<SalesVisit>('/api/v1/sfa/visits/checkin', payload);
  },

  async checkOutVisit(id: string, payload: CheckOutVisitPayload): Promise<SalesVisit> {
    return apiClient.post<SalesVisit>(`/api/v1/sfa/visits/${id}/checkout`, payload);
  },

  // Dashboard Metrics
  async getDashboardMetrics(companyId?: string, salesEmployeeId?: string): Promise<SfaDashboardMetrics> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (salesEmployeeId) params.append('salesEmployeeId', salesEmployeeId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<SfaDashboardMetrics>(`/api/v1/sfa/dashboard/metrics${queryString}`);
  }
};
