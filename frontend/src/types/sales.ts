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
  captureLatitude: number;
  captureLongitude: number;
  accuracyMeters?: number | null;
}

export interface VerifyFieldLocationResult {
  success: boolean;
  distanceMeters: number;
  isWithinRange: boolean;
  message: string;
  customerName?: string | null;
  verificationProof?: string | null;
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
