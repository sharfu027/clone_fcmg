export type VehicleType = 'LightCommercialVehicle' | 'HeavyCommercialVehicle' | 'ElectricVan' | 'ThreeWheeler';
export type FuelType = 'Diesel' | 'CNG' | 'Electric' | 'Petrol';
export type VehicleStatus = 'Available' | 'OnDelivery' | 'Maintenance' | 'OutofService';
export type DriverStatus = 'Active' | 'OnRoute' | 'OnLeave' | 'OffDuty';
export type DeliveryStatus = 'PendingAssignment' | 'Dispatched' | 'InTransit' | 'Delivered' | 'Failed' | 'PartialDelivery';
export type ExceptionReason = 'CustomerNotAvailable' | 'DamagedGoods' | 'WrongAddress' | 'RefusedDelivery' | 'VehicleBreakdown';

export interface FleetVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacityKg: number;
  fuelType: FuelType;
  assignedDriverName?: string;
  insuranceExpiryDate: string;
  registrationExpiryDate: string;
  status: VehicleStatus;
}

export interface DriverProfile {
  id: string;
  driverCode: string;
  name: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  mobile: string;
  assignedVehicleNumber?: string;
  totalDeliveriesCompleted: number;
  ratingStars: number;
  status: DriverStatus;
}

export interface RouteStop {
  stopNumber: number;
  customerName: string;
  address: string;
  estimatedArrival: string;
  deliverableCartonsCount: number;
}

export interface DeliveryRoute {
  id: string;
  routeCode: string;
  name: string;
  startDepot: string;
  totalDistanceKm: number;
  estimatedDurationHours: number;
  stops: RouteStop[];
}

export interface LogisticsDeliveryOrder {
  id: string;
  deliveryCode: string;
  salesOrderRef: string;
  invoiceRef: string;
  customerName: string;
  destinationAddress: string;
  assignedVehicleNumber?: string;
  assignedDriverName?: string;
  dispatchDate: string;
  estimatedArrival: string;
  cartonsCount: number;
  totalValue: number;
  status: DeliveryStatus;
}

export interface DispatchQueueItem {
  id: string;
  deliveryCode: string;
  customerName: string;
  warehouseBin: string;
  vehicleNumber: string;
  driverName: string;
  dispatchStatus: 'ReadyForLoading' | 'OutForDelivery' | 'Completed';
}

export interface ProofOfDelivery {
  id: string;
  deliveryCode: string;
  customerName: string;
  receivedBy: string;
  signatureUrl?: string;
  photoUrl?: string;
  gpsLocation: string;
  timestamp: string;
  deliveryNotes?: string;
}

export interface DeliveryExceptionRecord {
  id: string;
  deliveryCode: string;
  customerName: string;
  reason: ExceptionReason;
  actionTaken: 'ReturnToWarehouse' | 'ReattemptTomorrow' | 'PartialAcceptance';
  notes: string;
  timestamp: string;
}

export interface LogisticsMetrics {
  deliveriesTodayCount: number;
  pendingDeliveriesCount: number;
  completedDeliveriesCount: number;
  delayedDeliveriesCount: number;
  activeVehiclesCount: number;
  activeDriversCount: number;
  routeEfficiencyPercent: number;
  deliverySuccessRatePercent: number;
  avgDeliveryTimeMinutes: number;
  podPendingCount: number;
}
