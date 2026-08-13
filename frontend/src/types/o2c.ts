export type O2CApprovalStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
export type O2COrderStatus = 'Draft' | 'Confirmed' | 'Allocated' | 'PartiallyDelivered' | 'Delivered' | 'Invoiced' | 'Closed' | 'Cancelled';
export type O2CPaymentMode = 'Cash' | 'UPI' | 'BankTransfer' | 'Cheque' | 'NEFT' | 'RTGS';
export type LedgerEntryType = 'Invoice' | 'Payment' | 'CreditNote' | 'DebitNote' | 'Advance';

export interface QuotationItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxAmount: number;
  lineTotal: number;
}

export interface SalesQuotation {
  id: string;
  code: string;
  customerName: string;
  quotationDate: string;
  expiryDate: string;
  version: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Converted' | 'Expired';
  items?: QuotationItem[];
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  allocatedQty: number;
  deliveredQty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  code: string;
  quotationRef?: string;
  customerName: string;
  creditLimit: number;
  currentOutstanding: number;
  orderDate: string;
  expectedDeliveryDate: string;
  approvalStatus: O2CApprovalStatus;
  orderStatus: O2COrderStatus;
  netAmount: number;
  itemsCount?: number;
  items?: SalesOrderItem[];
}

export interface DeliveryOrder {
  id: string;
  code: string;
  salesOrderCode: string;
  customerName: string;
  warehouseName: string;
  vehicleNo: string;
  driverName: string;
  dispatchDate: string;
  podSigned: boolean;
  status: 'Dispatched' | 'InTransit' | 'Delivered';
}

export interface SalesInvoice {
  id: string;
  code: string;
  invoiceNumber: string;
  salesOrderCode: string;
  deliveryCode: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Cancelled';
}

export interface O2CPaymentRecord {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  customerName: string;
  invoiceCode: string;
  paymentMode: O2CPaymentMode;
  amount: number;
  referenceTxnNo?: string;
  status: 'Cleared' | 'Pending' | 'Bounced';
}

export interface CustomerLedgerEntry {
  id: string;
  entryDate: string;
  documentNo: string;
  type: LedgerEntryType;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export interface CreditNote {
  id: string;
  code: string;
  customerName: string;
  invoiceCode: string;
  reason: 'SalesReturn' | 'DiscountAdjustment' | 'PriceCorrection';
  amount: number;
  issueDate: string;
  status: 'Approved' | 'Applied';
}

export interface DebitNote {
  id: string;
  code: string;
  customerName: string;
  invoiceCode: string;
  reason: 'FreightCharge' | 'PriceCorrection';
  amount: number;
  issueDate: string;
  status: 'Approved' | 'Applied';
}

export interface AgingBucketSummary {
  current30Days: number;
  days31To60: number;
  days61To90: number;
  daysAbove90: number;
}

export interface O2CMetrics {
  totalReceivables: number;
  overdueReceivables: number;
  dsoDays: number;
  orderConversionRate: number;
  monthlyRevenue: number;
  avgFulfillmentHours: number;
  agingSummary: AgingBucketSummary;
}
