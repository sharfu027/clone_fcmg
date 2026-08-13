import { apiClient } from '../api/apiClient';
import {
  CrmCustomerProfile,
  CustomerComplaint,
  CustomerTicket,
  CustomerFollowUp,
  CommunicationLog,
  CustomerVisitLog,
  CustomerFeedback,
  CrmMetrics
} from '../types/crm';

export const crmService = {
  // Customer Profiles CRUD
  async getCustomerProfiles(): Promise<CrmCustomerProfile[]> {
    return apiClient.get<CrmCustomerProfile[]>('/api/v1/crm/customers');
  },

  async createCustomerProfile(payload: Partial<CrmCustomerProfile>): Promise<CrmCustomerProfile> {
    return apiClient.post<CrmCustomerProfile>('/api/v1/crm/customers', payload);
  },

  // Complaints
  async getComplaints(): Promise<CustomerComplaint[]> {
    return apiClient.get<CustomerComplaint[]>('/api/v1/crm/complaints');
  },

  async registerComplaint(payload: Partial<CustomerComplaint>): Promise<CustomerComplaint> {
    return apiClient.post<CustomerComplaint>('/api/v1/crm/complaints', payload);
  },

  // Service Tickets
  async getTickets(): Promise<CustomerTicket[]> {
    return apiClient.get<CustomerTicket[]>('/api/v1/crm/tickets');
  },

  async createTicket(payload: Partial<CustomerTicket>): Promise<CustomerTicket> {
    return apiClient.post<CustomerTicket>('/api/v1/crm/tickets', payload);
  },

  // Follow-ups
  async getFollowUps(): Promise<CustomerFollowUp[]> {
    return apiClient.get<CustomerFollowUp[]>('/api/v1/crm/follow-ups');
  },

  async scheduleFollowUp(payload: Partial<CustomerFollowUp>): Promise<CustomerFollowUp> {
    return apiClient.post<CustomerFollowUp>('/api/v1/crm/follow-ups', payload);
  },

  // Communications & Visits
  async getCommunications(): Promise<CommunicationLog[]> {
    return apiClient.get<CommunicationLog[]>('/api/v1/crm/communications');
  },

  async getVisits(): Promise<CustomerVisitLog[]> {
    return apiClient.get<CustomerVisitLog[]>('/api/v1/crm/visits');
  },

  // Feedback
  async getFeedback(): Promise<CustomerFeedback[]> {
    return apiClient.get<CustomerFeedback[]>('/api/v1/crm/feedback');
  },

  // CRM Metrics
  async getCrmMetrics(): Promise<CrmMetrics> {
    return apiClient.get<CrmMetrics>('/api/v1/crm/metrics');
  }
};
