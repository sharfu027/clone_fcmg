export type RmaStatus = 'Requested' | 'Authorized' | 'PickupScheduled' | 'Received' | 'Inspected' | 'Completed' | 'Rejected';
export type DamageClassification = 'PackagingDamage' | 'TransitDamage' | 'ExpiredProduct' | 'QualityDefect' | 'WrongItemSent';
export type DispositionType = 'RestockInventory' | 'Scrap' | 'Repair' | 'Replace' | 'VendorReturn' | 'Quarantine';
export type QualityGrade = 'GradeA_Resellable' | 'GradeB_Discounted' | 'GradeC_Scrap';

export interface SalesReturnRequest {
  id: string;
  rmaNumber: string;
  invoiceCode: string;
  customerName: string;
  requestDate: string;
  reason: DamageClassification;
  totalReturnAmount: number;
  status: RmaStatus;
  itemsCount?: number;
}

export interface PurchaseReturnRequest {
  id: string;
  code: string;
  grnCode: string;
  vendorName: string;
  returnDate: string;
  reason: DamageClassification;
  totalAmount: number;
  creditNoteRef?: string;
  status: 'Draft' | 'Approved' | 'Dispatched' | 'CreditReceived';
}

export interface ReturnInspection {
  id: string;
  rmaNumber: string;
  productName: string;
  batchNumber: string;
  quantityReturned: number;
  qualityGrade: QualityGrade;
  disposition: DispositionType;
  inspectorName: string;
  inspectionDate: string;
  remarks: string;
}

export interface ReplacementOrder {
  id: string;
  replacementCode: string;
  originalRmaNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  dispatchDate?: string;
  status: 'PendingApproval' | 'Approved' | 'Dispatched';
}

export interface RefundRecord {
  id: string;
  refundCode: string;
  customerName: string;
  rmaNumber: string;
  refundAmount: number;
  paymentMode: 'Cash' | 'BankTransfer' | 'UPI' | 'CreditNote';
  refundDate: string;
  status: 'Approved' | 'Processed';
}

export interface ReturnMetrics {
  totalReturnRatePercent: number;
  openRmasCount: number;
  pendingInspectionCount: number;
  monthlyReturnCost: number;
  restockedInventoryValue: number;
  scrappedValue: number;
}
