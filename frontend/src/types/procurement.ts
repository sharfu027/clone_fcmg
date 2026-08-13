export type RequisitionStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Cancelled' | 'Converted' | 'Closed';
export type RequisitionPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type POApprovalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
export type POOrderStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Closed' | 'Cancelled';
export type GRNStatus = 'Pending Inspection' | 'Received' | 'Damage Recorded' | 'Completed';
export type InvoiceMatchingStatus = 'Unmatched' | 'Matched' | 'Discrepancy';

export interface VendorBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  rating: number; // 1 to 5 stars
  gstNo: string;
  panNo: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  paymentTerms: string;
  bankDetails: VendorBankDetails;
  status: 'Active' | 'Inactive';
}

export interface RequisitionItem {
  id: string;
  purchaseRequisitionId: string;
  productId: string;
  productCode: string;
  productName: string;
  uom: string;
  requestedQuantity: number;
  estimatedUnitPrice: number;
  estimatedLineTotal: number;
  notes?: string;
}

export interface RequisitionStatusHistory {
  id: string;
  purchaseRequisitionId: string;
  fromStatus: string;
  toStatus: string;
  changedByUserId: string;
  changedByName: string;
  comment?: string;
  timestampUtc: string;
}

export interface PurchaseRequisition {
  id: string;
  companyId: string;
  requisitionNumber: string;
  requestedByUserId: string;
  requestedByName: string;
  departmentId?: string;
  departmentName?: string;
  warehouseId?: string;
  warehouseName?: string;
  requestDate: string;
  requiredByDate: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  purpose: string;
  notes?: string;
  estimatedTotalAmount: number;
  currencyCode: string;
  submittedAtUtc?: string;
  approvedAtUtc?: string;
  rejectedAtUtc?: string;
  cancelledAtUtc?: string;
  createdAtUtc: string;
  createdBy?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  items: RequisitionItem[];
  statusHistories: RequisitionStatusHistory[];
}

export type RfqStatus = 'Draft' | 'Submitted' | 'Sent' | 'Closed' | 'Cancelled';
export type RfqSupplierRecipientStatus = 'Pending' | 'Sent';

export interface RfqItem {
  id: string;
  rfqId: string;
  productId: string;
  productCode: string;
  productName: string;
  uom: string;
  requestedQuantity: number;
  requiredByDate?: string;
  notes?: string;
}

export interface RfqSupplier {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  deliveryStatus: RfqSupplierRecipientStatus;
  sentAtUtc?: string;
}

export interface Rfq {
  id: string;
  companyId: string;
  rfqNumber: string;
  purchaseRequisitionId: string;
  purchaseRequisitionNumber: string;
  rfqDate: string;
  responseDueDate: string;
  departmentId?: string;
  departmentName?: string;
  requestedByUserId: string;
  requestedByName: string;
  buyerUserId?: string;
  buyerName?: string;
  currencyCode: string;
  status: RfqStatus;
  notes?: string;
  cancelReason?: string;
  closeReason?: string;
  submittedAtUtc?: string;
  sentAtUtc?: string;
  closedAtUtc?: string;
  cancelledAtUtc?: string;
  createdAtUtc: string;
  createdBy?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  items: RfqItem[];
  suppliers: RfqSupplier[];
}

export interface CreateRfqItemRequest {
  productId: string;
  requestedQuantity: number;
  requiredByDate?: string;
  notes?: string;
}

export interface CreateRfqSupplierRequest {
  supplierId: string;
}

export interface CreateRfqRequest {
  companyId: string;
  purchaseRequisitionId: string;
  responseDueDate: string;
  notes?: string;
  suppliers: CreateRfqSupplierRequest[];
  items?: CreateRfqItemRequest[];
}

export interface UpdateRfqRequest {
  id: string;
  responseDueDate: string;
  notes?: string;
  suppliers: CreateRfqSupplierRequest[];
  items: CreateRfqItemRequest[];
}

export interface RfqMetrics {
  totalRfqsCount: number;
  draftRfqsCount: number;
  submittedRfqsCount: number;
  sentRfqsCount: number;
  closedRfqsCount: number;
  cancelledRfqsCount: number;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  vendorId: string;
  vendorName: string;
  poDate: string;
  expectedDeliveryDate: string;
  approvalStatus: POApprovalStatus;
  orderStatus: POOrderStatus;
  totalAmount: number;
  itemsCount?: number;
  items?: PurchaseOrderItem[];
}

export interface GRNItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  batchNumber: string;
  expiryDate: string;
}

export interface GRN {
  id: string;
  code: string;
  poCode: string;
  vendorName: string;
  warehouseName: string;
  receiptDate: string;
  receivedBy: string;
  status: GRNStatus;
  items?: GRNItem[];
}

export interface PurchaseInvoice {
  id: string;
  code: string;
  invoiceNumber: string;
  poCode: string;
  grnCode: string;
  vendorName: string;
  invoiceDate: string;
  subtotal: number;
  taxAmount: number;
  freightAmount: number;
  netAmount: number;
  matchingStatus: InvoiceMatchingStatus;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
}

export interface VendorReturn {
  id: string;
  code: string;
  vendorName: string;
  grnCode: string;
  returnDate: string;
  reason: string;
  returnAmount: number;
  creditNoteRef?: string;
  status: 'Pending Approval' | 'Approved' | 'Credit Note Issued';
}

export interface ProcurementMetrics {
  openRequisitionsCount: number;
  pendingApprovalsCount: number;
  approvedRequisitionsCount: number;
  rejectedRequisitionsCount: number;
  estimatedPRValue: number;
}
