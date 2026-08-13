export type BinType = 'Standard' | 'ColdStorage' | 'Hazardous' | 'HighDensity' | 'StagingArea';
export type BinStatus = 'Available' | 'Full' | 'Blocked' | 'Reserved';
export type TransferStatus = 'Draft' | 'Requested' | 'In Transit' | 'Received' | 'Cancelled';
export type PickingStatus = 'Assigned' | 'In Progress' | 'Picked' | 'Verified';
export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  name: string;
  type: 'DryStorage' | 'Refrigerated' | 'BulkPallet' | 'FastMoving';
  totalBins: number;
  occupancyPercent: number;
}

export interface WarehouseBin {
  id: string;
  zoneId: string;
  zoneCode: string;
  code: string; // e.g. A-01-R02-S3-B04
  aisle: string;
  rack: string;
  shelf: string;
  binNumber: string;
  type: BinType;
  maxWeightKg: number;
  currentWeightKg: number;
  capacityUtilization: number; // 0 to 100 %
  status: BinStatus;
}

export interface ReceivingOperation {
  id: string;
  grnCode: string;
  warehouseName: string;
  receiptDate: string;
  itemsReceivedCount: number;
  qualityPassedCount: number;
  status: 'Inspected' | 'Putaway Pending' | 'Completed';
}

export interface PutawayTask {
  id: string;
  receivingId: string;
  productName: string;
  quantity: number;
  suggestedBinCode: string;
  assignedBinCode?: string;
  assignedWorker: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface StockTransfer {
  id: string;
  code: string;
  fromWarehouse: string;
  toWarehouse: string;
  transferDate: string;
  itemsCount: number;
  status: TransferStatus;
}

export interface PickList {
  id: string;
  code: string;
  salesOrderRef: string;
  pickerName: string;
  pickingType: 'Wave' | 'Batch' | 'Zone';
  itemsCount: number;
  status: PickingStatus;
}

export interface PackingSlip {
  id: string;
  code: string;
  pickListCode: string;
  packingStation: string;
  totalBoxes: number;
  totalWeightKg: number;
  status: 'Packed' | 'Staged for Dispatch';
}

export interface DispatchOrder {
  id: string;
  code: string;
  salesOrderRef: string;
  customerName: string;
  truckNo: string;
  driverPhone: string;
  dispatchDate: string;
  status: 'Staged' | 'Loading' | 'Dispatched';
}

export interface WarehouseTask {
  id: string;
  code: string;
  taskType: 'Putaway' | 'Picking' | 'Replenishment' | 'Count';
  assignedWorker: string;
  priority: TaskPriority;
  targetBin: string;
  status: 'Open' | 'In Progress' | 'Completed';
}

export interface WarehouseMetrics {
  totalCapacitySft: number;
  overallOccupancyPercent: number;
  openPutawayCount: number;
  activePickListsCount: number;
  dailyDispatchesCount: number;
  receivingEfficiencyScore: number;
}
