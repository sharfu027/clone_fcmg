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
}

export interface CreateRealSalesOrderItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
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
}
