import { apiClient } from '../api/apiClient';
import {
  ApprovalWorkflow,
  ApprovalMatrixRule,
  ApprovalRequest,
  ApprovalActionPayload,
  ApprovalDelegation,
  NotificationItem,
  WorkflowMetrics
} from '../types/workflow';

export const workflowService = {
  // Workflows
  async getWorkflows(): Promise<ApprovalWorkflow[]> {
    return apiClient.get<ApprovalWorkflow[]>('/api/v1/workflow/definitions');
  },

  async createWorkflow(payload: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
    return apiClient.post<ApprovalWorkflow>('/api/v1/workflow/definitions', payload);
  },

  // Matrix Rules
  async getApprovalMatrix(): Promise<ApprovalMatrixRule[]> {
    return apiClient.get<ApprovalMatrixRule[]>('/api/v1/workflow/matrix');
  },

  // Approval Requests & Actions
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    return apiClient.get<ApprovalRequest[]>('/api/v1/workflow/pending');
  },

  async submitApprovalAction(payload: ApprovalActionPayload): Promise<void> {
    return apiClient.post<void>('/api/v1/workflow/actions', payload);
  },

  // Delegations
  async getDelegations(): Promise<ApprovalDelegation[]> {
    return apiClient.get<ApprovalDelegation[]>('/api/v1/workflow/delegations');
  },

  async createDelegation(payload: Partial<ApprovalDelegation>): Promise<ApprovalDelegation> {
    return apiClient.post<ApprovalDelegation>('/api/v1/workflow/delegations', payload);
  },

  // Notifications & Metrics
  async getNotifications(): Promise<NotificationItem[]> {
    return apiClient.get<NotificationItem[]>('/api/v1/workflow/notifications');
  },

  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    return apiClient.get<WorkflowMetrics>('/api/v1/workflow/metrics');
  }
};
