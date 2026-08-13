export interface OrderItem {
  id: string;
  customerName: string;
  orderDate: string;
  amount: number;
  itemsCount: number;
  status: 'Dispatched' | 'Pending Approval' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
}

export interface DashboardApprovalRequest {
  id: string;
  title: string;
  requestedBy: string;
  module: string;
  timestamp: string;
  details: string;
}

export interface DashboardMetrics {
  grossSales: number;
  salesTarget: number;
  activeTrucksCount: number;
  cartonsShipped: number;
  stockAlertsCount: number;
  dsrOnlineCount: number;
  collectionsAmount: number;
}
