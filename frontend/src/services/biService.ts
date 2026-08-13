import { apiClient } from '../api/apiClient';
import {
  ExecutiveKpiSummary,
  BiSalesAnalytics,
  BiProcurementAnalytics,
  BiInventoryAnalytics,
  BiFinanceAnalytics,
  BiLogisticsAnalytics,
  BiCrmAnalytics,
  BiHrmsAnalytics,
  BiWorkflowAnalytics,
  LeaderboardItem,
  RiskAlertItem,
  BiFilterParams
} from '../types/bi';

export const biService = {
  // Executive Summary KPIs
  async getExecutiveKpiSummary(params?: BiFilterParams): Promise<ExecutiveKpiSummary> {
    return apiClient.post<ExecutiveKpiSummary>('/api/v1/bi/executive-summary', params || {});
  },

  // Sales Analytics
  async getSalesAnalytics(params?: BiFilterParams): Promise<BiSalesAnalytics> {
    return apiClient.post<BiSalesAnalytics>('/api/v1/bi/analytics/sales', params || {});
  },

  // Procurement Analytics
  async getProcurementAnalytics(params?: BiFilterParams): Promise<BiProcurementAnalytics> {
    return apiClient.post<BiProcurementAnalytics>('/api/v1/bi/analytics/procurement', params || {});
  },

  // Inventory Analytics
  async getInventoryAnalytics(params?: BiFilterParams): Promise<BiInventoryAnalytics> {
    return apiClient.post<BiInventoryAnalytics>('/api/v1/bi/analytics/inventory', params || {});
  },

  // Finance Analytics
  async getFinanceAnalytics(params?: BiFilterParams): Promise<BiFinanceAnalytics> {
    return apiClient.post<BiFinanceAnalytics>('/api/v1/bi/analytics/finance', params || {});
  },

  // Logistics Analytics
  async getLogisticsAnalytics(params?: BiFilterParams): Promise<BiLogisticsAnalytics> {
    return apiClient.post<BiLogisticsAnalytics>('/api/v1/bi/analytics/logistics', params || {});
  },

  // Leaderboards & Risk Alerts
  async getTopLeaderboards(): Promise<LeaderboardItem[]> {
    return apiClient.get<LeaderboardItem[]>('/api/v1/bi/insights/leaderboards');
  },

  async getRiskAlerts(): Promise<RiskAlertItem[]> {
    return apiClient.get<RiskAlertItem[]>('/api/v1/bi/insights/risk-alerts');
  }
};
