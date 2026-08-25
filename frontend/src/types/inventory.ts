export type LocationType = 'Standard' | 'Transit' | 'VanStock' | 'Quarantine' | 'Damaged' | string;

export interface InventoryLocation {
  id: string;
  companyId: string;
  companyName?: string;
  branchId?: string | null;
  branchName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  code: string;
  name: string;
  locationType: LocationType;
  isActive: boolean;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
}

export interface InventoryBalance {
  id: string;
  companyId: string;
  companyName?: string;
  inventoryLocationId: string;
  inventoryLocationName?: string;
  inventoryLocationCode?: string;
  productId: string;
  productName?: string;
  productCode?: string;
  sku?: string;
  baseUomId: string;
  baseUomName?: string;
  onHandQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  lastMovementAtUtc?: string | null;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
}

export type InventoryBalanceDto = InventoryBalance;

export interface OpeningBalanceRequest {
  companyId: string;
  inventoryLocationId: string;
  productId: string;
  openingQuantity: number;
}

export type InventoryTransactionType =
  | 'OpeningBalance'
  | 'GoodsReceipt'
  | 'GoodsIssue'
  | 'AdjustmentIncrease'
  | 'AdjustmentDecrease'
  | 'TransferIn'
  | 'TransferOut'
  | string;

export interface InventoryTransaction {
  id: string;
  companyId: string;
  companyName?: string;
  inventoryLocationId: string;
  inventoryLocationName?: string;
  inventoryLocationCode?: string;
  productId: string;
  productName?: string;
  productCode?: string;
  sku?: string;
  baseUomId: string;
  baseUomName?: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  signedQuantity: number;
  balanceAfter: number;
  referenceDocumentType?: string | null;
  referenceDocumentId?: string | null;
  referenceDocumentNumber?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  performedByEmployeeId?: string | null;
  performedByEmployeeName?: string | null;
  notes?: string | null;
  createdAtUtc: string;
}

export type InventoryTransactionDto = InventoryTransaction;

export interface PostInventoryTransactionRequest {
  companyId: string;
  inventoryLocationId: string;
  productId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceDocumentType?: string | null;
  referenceDocumentId?: string | null;
  referenceDocumentNumber?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  performedByEmployeeId?: string | null;
  notes?: string | null;
}

export interface InventoryReconciliationDto {
  companyId: string;
  companyName?: string;
  inventoryLocationId: string;
  inventoryLocationName?: string;
  productId: string;
  productName?: string;
  baseUomName?: string;
  currentOnHandQuantity: number;
  ledgerCalculatedQuantity: number;
  discrepancy: number;
  isReconciled: boolean;
  totalTransactionsCount: number;
}

export type MovementType =
  | 'GoodsReceipt'
  | 'GoodsIssue'
  | 'StockAdjustment'
  | 'StockTransfer'
  | 'PurchaseReceipt'
  | 'SalesIssue'
  | 'ProductionConsumption'
  | 'ReturnReceipt'
  | 'ReturnIssue'
  | 'ManualAdjustment';

export type ReservationType = 'SalesOrder' | 'ProductionOrder' | 'Manual';
export type CountStatus = 'Draft' | 'InProgress' | 'PendingApproval' | 'Reconciled';
export type AdjustmentReason = 'Damaged' | 'Lost' | 'Found' | 'Expired' | 'Shrinkage' | 'Manual';
export type ValuationMethod = 'FIFO' | 'WeightedAverage' | 'StandardCost' | 'LIFO';
export type ABCClass = 'A' | 'B' | 'C';
export type XYZClass = 'X' | 'Y' | 'Z';

export interface StockItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  unit: string;
  warehouseName: string;
  binCode: string;
  availableQty: number;
  reservedQty: number;
  allocatedQty: number;
  damagedQty: number;
  inTransitQty: number;
  totalQty: number;
  unitCost: number;
  totalValuation: number;
  status: 'InStock' | 'LowStock' | 'OutOfStock' | 'Overstock';
}

export interface BatchInfo {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  mfgDate: string;
  expiryDate: string;
  shelfLifeDays: number;
  availableQty: number;
  status: 'Active' | 'NearExpiry' | 'Expired' | 'Quarantine';
}

export interface SerialNumber {
  id: string;
  serialCode: string;
  productId: string;
  productName: string;
  warrantyUntil: string;
  activationStatus: 'Active' | 'InWarehouse' | 'Sold' | 'Returned';
}

export interface StockMovement {
  id: string;
  code: string;
  timestamp: string;
  movementType: MovementType;
  productName: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  referenceDoc: string;
  performedBy: string;
}

export type InventoryReservationStatus =
  | 'Pending'
  | 'Active'
  | 'Allocated'
  | 'Fulfilled'
  | 'Released'
  | 'Cancelled'
  | 'Expired'
  | string;

export interface InventoryReservation {
  id: string;
  companyId: string;
  inventoryLocationId: string;
  inventoryLocationName: string;
  inventoryLocationCode: string;
  productId: string;
  productName: string;
  productCode: string;
  sku?: string | null;
  baseUomName?: string | null;
  reservedQuantity: number;
  status: InventoryReservationStatus;
  salesOrderId?: string | null;
  salesOrderLineId?: string | null;
  reservedAtUtc: string;
  releasedAtUtc?: string | null;
  expiresAtUtc?: string | null;
  createdAtUtc: string;
}

export type InventoryReservationDto = InventoryReservation;

export interface ReserveStockRequest {
  companyId: string;
  inventoryLocationId: string;
  productId: string;
  requestedQuantity: number;
  salesOrderId?: string | null;
  salesOrderLineId?: string | null;
  expiresAtUtc?: string | null;
}

export interface InventoryAvailabilityDto {
  companyId: string;
  productId: string;
  productName: string;
  productCode: string;
  sku?: string | null;
  baseUomName?: string | null;
  inventoryLocationId: string;
  inventoryLocationName: string;
  inventoryLocationCode: string;
  onHandQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  requestedQuantity: number;
  isAvailable: boolean;
  shortfallQuantity: number;
}

export interface InventoryAlternativeLocationDto {
  id: string;
  code: string;
  name: string;
  locationType: string;
  companyId: string;
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  onHandQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  recommendedRank: number;
  rankReason: string;
}

export type StockTransferStatus =
  | 'Draft'
  | 'Requested'
  | 'Approved'
  | 'Rejected'
  | 'Dispatched'
  | 'InTransit'
  | 'Received'
  | 'Completed'
  | 'Cancelled'
  | string;

export interface StockTransferLine {
  id: string;
  stockTransferId: string;
  productId: string;
  productName: string;
  productCode: string;
  productSku?: string | null;
  uomName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  createdAtUtc: string;
}

export interface StockTransfer {
  id: string;
  companyId: string;
  companyName: string;
  transferNumber: string;
  sourceLocationId: string;
  sourceLocationName: string;
  sourceLocationCode: string;
  destinationLocationId: string;
  destinationLocationName: string;
  destinationLocationCode: string;
  salesOrderId?: string | null;
  salesOrderNumber?: string | null;
  status: StockTransferStatus;
  requestedByEmployeeId: string;
  requestedByEmployeeName: string;
  approvedByEmployeeId?: string | null;
  approvedByEmployeeName?: string | null;
  dispatchedAtUtc?: string | null;
  receivedAtUtc?: string | null;
  notes?: string | null;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
  lines: StockTransferLine[];
}

export type StockTransferDto = StockTransfer;

export interface CreateStockTransferLineRequest {
  productId: string;
  requestedQuantity: number;
}

export interface CreateStockTransferRequest {
  companyId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  salesOrderId?: string | null;
  requestedByEmployeeId: string;
  notes?: string | null;
  lines: CreateStockTransferLineRequest[];
}

export interface ApproveTransferLineItem {
  lineId: string;
  approvedQuantity: number;
}

export interface ApproveStockTransferRequest {
  approvedByEmployeeId: string;
  lineApprovals?: ApproveTransferLineItem[];
}

export interface ReceiveTransferLineItem {
  lineId: string;
  receivedQuantity: number;
}

export interface ReceiveStockTransferRequest {
  lineReceipts?: ReceiveTransferLineItem[];
}

export interface PhysicalCountSheet {
  id: string;
  code: string;
  warehouseName: string;
  countType: 'CycleCount' | 'AnnualCount' | 'BlindCount';
  scheduledDate: string;
  itemsCounted: number;
  varianceFoundCount: number;
  status: CountStatus;
}

export interface InventoryAdjustment {
  id: string;
  code: string;
  productName: string;
  warehouseName: string;
  binCode: string;
  adjustmentQty: number; // positive or negative
  reason: AdjustmentReason;
  unitCost: number;
  totalValueChange: number;
  approvedBy: string;
  timestamp: string;
}

export interface ReorderRule {
  id: string;
  productId: string;
  productName: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  safetyStock: number;
  eoq: number;
  status: 'Normal' | 'Triggered';
}

export interface InventoryAnalytics {
  abcClass: ABCClass;
  xyzClass: XYZClass;
  productId: string;
  productName: string;
  turnoverRatio: number;
  agingDays: number;
}

export interface InventoryMetrics {
  totalInventoryValue: number;
  totalStockQuantity: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  overstockItemsCount: number;
  nearExpiryItemsCount: number;
  avgTurnoverRatio: number;
}
