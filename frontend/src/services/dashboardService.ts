import { apiClient } from '../api/apiClient';

export interface DashboardMetrics {
  grossSales: number;
  salesTarget: number;
  activeTrucksCount: number;
  cartonsShipped: number;
  stockAlertsCount: number;
  dsrOnlineCount: number;
  collectionsAmount: number;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/api/v1/dashboard/metrics');
  },

  async getRevenueDistribution(): Promise<Array<{ month: string; Actual: number; Target: number }>> {
    return apiClient.get<Array<{ month: string; Actual: number; Target: number }>>('/api/v1/dashboard/revenue-distribution');
  },

  async getPendingApprovals(): Promise<Array<{ id: string; title: string; requestedBy: string; module: string; timestamp: string; details: string }>> {
    return apiClient.get('/api/v1/dashboard/pending-approvals');
  },

  async getRecentOrders(): Promise<Array<{ id: string; customerName: string; orderDate: string; amount: number; itemsCount: number; status: string; paymentStatus: string }>> {
    return apiClient.get('/api/v1/dashboard/recent-orders');
  }
};
