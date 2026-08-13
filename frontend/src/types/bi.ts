export interface BiFilterParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  departmentId?: string;
  warehouseId?: string;
}

export interface ExecutiveKpiSummary {
  revenueToday: number;
  revenueMtd: number;
  grossSales: number;
  netSales: number;
  purchaseValueMtd: number;
  collectionValueMtd: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  inventoryValue: number;
  inventoryTurnoverRatio: number;
  orderFulfillmentRatePercent: number;
  deliverySuccessRatePercent: number;
  csatScorePercent: number;
  employeeAttendancePercent: number;
  activeUsersCount: number;
  systemHealthScorePercent: number;
}

export interface BiSalesAnalytics {
  monthlyRevenueTrend: { month: string; sales: number; target: number }[];
  salesByBranch: { branch: string; revenue: number }[];
  salesByCategory: { category: string; revenue: number }[];
  targetAchievementPercent: number;
}

export interface BiProcurementAnalytics {
  monthlyPurchaseTrend: { month: string; amount: number }[];
  topVendorsBySpend: { vendorName: string; totalSpend: number; ratingStars: number }[];
  grnOnTimeRatePercent: number;
}

export interface BiInventoryAnalytics {
  fastMovingItemsCount: number;
  slowMovingItemsCount: number;
  deadStockValue: number;
  expiryRiskValue30Days: number;
}

export interface BiFinanceAnalytics {
  arAging0to30: number;
  arAging31to60: number;
  arAging61to90: number;
  arAging90Plus: number;
  netCashFlowForecast30Days: number;
}

export interface BiLogisticsAnalytics {
  totalDeliveriesMonth: number;
  routeEfficiencyPercent: number;
  vehicleUtilizationPercent: number;
  deliveryExceptionsCount: number;
}

export interface BiCrmAnalytics {
  customerRetentionPercent: number;
  openComplaintsCount: number;
  avgResolutionTimeHours: number;
  csatPercent: number;
}

export interface BiHrmsAnalytics {
  totalHeadcount: number;
  todayAttendancePercent: number;
  avgLeaveDaysPerEmp: number;
  turnoverRatePercent: number;
}

export interface BiWorkflowAnalytics {
  pendingApprovalsCount: number;
  slaCompliancePercent: number;
  avgApprovalTimeHours: number;
}

export interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  category: string;
  metricValue: string;
  growthPercent?: number;
}

export interface RiskAlertItem {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  module: string;
  title: string;
  description: string;
  timestamp: string;
}
