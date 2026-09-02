export type SalesOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'StockChecking'
  | 'PartiallyAvailable'
  | 'AwaitingTransfer'
  | 'Reserved'
  | 'ReadyForFulfillment'
  | 'Cancelled'
  | 'Completed'
  | string;

export interface RealSalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  productName: string;
  productCode: string;
  productSku?: string | null;
  uomName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  shortfallQuantity?: number;
  stockStatus?: 'Available' | 'Partial' | 'Insufficient' | 'FullyReserved' | 'PartiallyReserved' | string;
}

export interface RealSalesOrder {
  id: string;
  companyId: string;
  companyName: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  salesEmployeeId?: string | null;
  salesEmployeeName?: string | null;
  inventoryLocationId?: string | null;
  inventoryLocationName?: string | null;
  inventoryLocationCode?: string | null;
  orderNumber: string;
  orderStatus: SalesOrderStatus;
  orderDateUtc: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
  items: RealSalesOrderItem[];
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  captureAccuracyMeters?: number | null;
  distanceToCustomerMeters?: number | null;
  isGpsVerified?: boolean;
  isFaceVerified?: boolean;
  verifiedAtUtc?: string | null;
}

export interface CreateRealSalesOrderItemRequest {
  productId: string;
  quantity: number;
  unitPrice?: number | null;
  discountAmount?: number;
  taxAmount?: number;
}

export interface CreateRealSalesOrderRequest {
  companyId: string;
  customerId: string;
  salesEmployeeId?: string | null;
  inventoryLocationId?: string | null;
  orderDateUtc?: string | null;
  notes?: string | null;
  items: CreateRealSalesOrderItemRequest[];
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  captureAccuracyMeters?: number | null;
  isFaceVerified?: boolean;
}

export interface UpdateRealSalesOrderRequest {
  salesEmployeeId?: string | null;
  inventoryLocationId?: string | null;
  orderDateUtc?: string | null;
  notes?: string | null;
  items: CreateRealSalesOrderItemRequest[];
}

export interface VerifyFieldLocationRequest {
  companyId: string;
  customerId: string;
  salesEmployeeId?: string | null;
  captureLatitude: number;
  captureLongitude: number;
  accuracyMeters?: number | null;
  faceImageBase64?: string | null;
  requireFaceVerification?: boolean;
}

export interface VerifyFieldLocationResult {
  success: boolean;
  distanceMeters: number;
  isWithinRange: boolean;
  isFaceVerified: boolean;
  faceSimilarityScore?: number | null;
  message: string;
  customerName?: string | null;
  verificationProof?: string | null;
  verifiedAtUtc?: string | null;
}

export interface PriceResolutionResult {
  resolvedPrice: number;
  currency: string;
  source: string;
  priceListId?: string | null;
  customerPriceId?: string | null;
  effectiveDate: string;
  minimumAllowedPrice: number;
  priceListName?: string | null;
  customerName?: string | null;
  productName?: string | null;
}

export type SalesInvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'PartiallyPaid' | 'Cancelled' | string;
export type EInvoiceStatus = 'NotGenerated' | 'Pending' | 'Generated' | 'Failed' | 'Cancelled' | string;
export type PaymentStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue' | string;
export type DeliveryStatus = 'Dispatched' | 'InTransit' | 'OutForDelivery' | 'Delivered' | 'Failed' | string;

export interface SalesInvoiceItem {
  id: string;
  salesInvoiceId: string;
  productId: string;
  productName: string;
  productCode: string;
  sku?: string | null;
  unitOfMeasure?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  batchNumber?: string | null;
}

export interface InvoicePayment {
  id: string;
  salesInvoiceId: string;
  paymentNumber: string;
  paymentDateUtc: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string | null;
  notes?: string | null;
  receivedByEmployeeId?: string | null;
  receivedByEmployeeName?: string | null;
}

export interface SalesInvoice {
  id: string;
  companyId: string;
  companyName: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  salesOrderId: string;
  salesOrderNumber: string;
  dispatchId?: string | null;
  invoiceNumber: string;
  status: SalesInvoiceStatus;
  invoiceDateUtc: string;
  dueDateUtc: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
  paymentTerms?: string | null;
  notes?: string | null;
  eInvoiceStatus: EInvoiceStatus;
  irn?: string | null;
  ackNo?: string | null;
  ackDateUtc?: string | null;
  qrCodeData?: string | null;
  signedInvoiceData?: string | null;
  eInvoiceFailureReason?: string | null;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
  items: SalesInvoiceItem[];
  payments: InvoicePayment[];
}

export interface DeliveryTracking {
  id: string;
  companyId: string;
  companyName: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  dispatchId?: string | null;
  trackingNumber: string;
  status: DeliveryStatus;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  estimatedDeliveryUtc?: string | null;
  actualDeliveryUtc?: string | null;
  receivedByPerson?: string | null;
  signatureProofUrl?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  notes?: string | null;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
}

export interface TemporaryPin {
  id: string;
  companyId: string;
  employeeId?: string | null;
  employeeName?: string | null;
  purpose: string;
  generatedByUserName: string;
  expiresAtUtc: string;
  isUsed: boolean;
  usedAtUtc?: string | null;
  createdAtUtc: string;
  plainPin?: string | null;
}

export interface ValidateTemporaryPinResult {
  isValid: boolean;
  message: string;
  pinId?: string | null;
  validatedAtUtc?: string | null;
}

export interface ValidateLoginLocationResult {
  isAllowed: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  message: string;
  requiresPinOverride: boolean;
  targetLocationName?: string | null;
}
