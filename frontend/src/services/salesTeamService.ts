import { apiClient } from '../api/apiClient';
import {
  SalesRepresentativeDto,
  CreateSalesRepresentativeRequest,
  UpdateSalesRepresentativeRequest,
  SalesRepLocationEnrollment,
  RegisterSalesRepLocationRequest,
  SalesRepBiometricStatus
} from '../types/salesTeam';
import { CustomerDto } from '../types/masterData';

export const salesTeamService = {
  /**
   * Fetch sales representatives for the authorized company.
   */
  fetchSalesTeam: async (params?: {
    companyId?: string;
    search?: string;
    status?: string;
    branchId?: string;
  }): Promise<SalesRepresentativeDto[]> => {
    return apiClient.get<SalesRepresentativeDto[]>('/api/v1/sales/team', { params });
  },

  /**
   * Fetch specific sales representative details by ID.
   */
  fetchSalesRepresentativeById: async (id: string): Promise<SalesRepresentativeDto> => {
    return apiClient.get<SalesRepresentativeDto>(`/api/v1/sales/team/${id}`);
  },

  /**
   * Create a new sales representative.
   */
  createSalesRepresentative: async (
    data: CreateSalesRepresentativeRequest,
    companyId?: string
  ): Promise<SalesRepresentativeDto> => {
    return apiClient.post<SalesRepresentativeDto>('/api/v1/sales/team', data, {
      params: companyId ? { companyId } : undefined
    });
  },

  /**
   * Update an existing sales representative.
   */
  updateSalesRepresentative: async (
    id: string,
    data: UpdateSalesRepresentativeRequest
  ): Promise<SalesRepresentativeDto> => {
    return apiClient.put<SalesRepresentativeDto>(`/api/v1/sales/team/${id}`, data);
  },

  /**
   * Activate or deactivate a sales representative.
   */
  toggleSalesRepresentativeStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/api/v1/sales/team/${id}/status`, isActive);
  },

  /**
   * Reset sales representative password.
   */
  resetSalesRepresentativePassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/api/v1/sales/team/${id}/reset-password`, { newPassword });
  },

  /**
   * Fetch customers currently assigned to a sales representative.
   */
  fetchAssignedCustomers: async (id: string): Promise<CustomerDto[]> => {
    return apiClient.get<CustomerDto[]>(`/api/v1/sales/team/${id}/customers`);
  },

  /**
   * Assign or replace customer list for a sales representative.
   */
  assignCustomers: async (id: string, customerIds: string[]): Promise<number> => {
    return apiClient.put<number>(`/api/v1/sales/team/${id}/customers`, { customerIds });
  },

  /**
   * Get enrolled login location for a sales representative.
   */
  getSalesRepLocation: async (id: string): Promise<SalesRepLocationEnrollment | null> => {
    try {
      return await apiClient.get<SalesRepLocationEnrollment>(`/api/v1/sales/team/${id}/location`);
    } catch {
      return null;
    }
  },

  /**
   * Register or update enrolled login location for a sales representative.
   */
  registerSalesRepLocation: async (
    id: string,
    data: RegisterSalesRepLocationRequest
  ): Promise<SalesRepLocationEnrollment> => {
    return apiClient.put<SalesRepLocationEnrollment>(`/api/v1/sales/team/${id}/location`, data);
  },

  /**
   * Delete / deactivate enrolled login location for a sales representative.
   */
  deleteSalesRepLocation: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/sales/team/${id}/location`);
  },

  /**
   * Get biometric face and location enrollment status for a sales representative.
   */
  getSalesRepBiometricStatus: async (id: string): Promise<SalesRepBiometricStatus> => {
    return apiClient.get<SalesRepBiometricStatus>(`/api/v1/sales/team/${id}/biometric-status`);
  },

  /**
   * Enroll face biometric template for a sales representative.
   */
  enrollSalesRepFace: async (
    id: string,
    imageBase64: string,
    algorithmVersion: string = 'v1.0'
  ): Promise<string> => {
    return apiClient.post<string>(`/api/v1/sales/team/${id}/face/enroll`, {
      imageBase64,
      algorithmVersion
    });
  },

  /**
   * Delete / deactivate facial biometric template for a sales representative.
   */
  deleteSalesRepFace: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/sales/team/${id}/face`);
  }
};
