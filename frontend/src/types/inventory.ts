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

export interface StockReservation {
  id: string;
  code: string;
  type: ReservationType;
  referenceCode: string;
  productName: string;
  reservedQty: number;
  priority: 'High' | 'Normal';
  reservationDate: string;
  status: 'Active' | 'Released' | 'Fulfilled';
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
