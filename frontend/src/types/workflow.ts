export type RoutingMode = 'Sequential' | 'Parallel' | 'Conditional';
export type ApprovalRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Escalated' | 'Expired' | 'Cancelled';
export type ApprovalActionType = 'Approve' | 'Reject' | 'Return' | 'Delegate' | 'Forward' | 'Escalate' | 'Cancel';

export interface WorkflowStep {
  stepNumber: number;
  name: string;
  approverRole: string;
  routingMode: RoutingMode;
  timeLimitHours: number;
  allowDelegation: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  code: string;
  name: string;
  documentType: 'PurchaseOrder' | 'SalesOrder' | 'StockAdjustment' | 'PaymentVoucher' | 'RMA' | 'ExpenseClaim';
  version: number;
  totalSteps: number;
  steps: WorkflowStep[];
  status: 'Active' | 'Draft' | 'Inactive';
}

export interface ApprovalMatrixRule {
  id: string;
  documentType: string;
  minAmount: number;
  maxAmount: number;
  requiredRole: string;
  department: string;
  company: string;
}

export interface ApprovalRequest {
  id: string;
  requestCode: string;
  documentType: string;
  documentRef: string;
  requestorName: string;
  amount?: number;
  currentStepNumber: number;
  totalSteps: number;
  assignedApprover: string;
  submissionDate: string;
  dueDate: string;
  status: ApprovalRequestStatus;
}

export interface ApprovalActionPayload {
  requestId: string;
  action: ApprovalActionType;
  approverName: string;
  comments: string;
  delegatedToUser?: string;
}

export interface ApprovalDelegation {
  id: string;
  delegatorName: string;
  proxyName: string;
  startDate: string;
  endDate: string;
  reason: 'Vacation' | 'DutyTravel' | 'Medical' | 'Permanent';
  status: 'Active' | 'Expired';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ApprovalRequired' | 'EscalationAlert' | 'RequestApproved' | 'RequestRejected';
}

export interface WorkflowMetrics {
  pendingApprovalsCount: number;
  escalatedCount: number;
  avgApprovalHours: number;
  slaCompliancePercent: number;
  totalProcessedMonth: number;
}
