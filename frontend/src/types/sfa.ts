export type VisitOutcome = 'Planned' | 'OrderBooked' | 'NoOrder' | 'StoreClosed' | 'CollectionDone';

export interface SfaSalesRep {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  designationName?: string;
  departmentName?: string;
  companyId: string;
  companyName: string;
  assignedCustomerCount: number;
  assignedBeatCount: number;
  isActive: boolean;
}

export interface SalesBeatCustomer {
  id: string;
  salesBeatId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  sequenceOrder: number;
}

export interface SalesBeat {
  id: string;
  companyId: string;
  companyName: string;
  salesEmployeeId?: string;
  salesEmployeeName?: string;
  salesEmployeeCode?: string;
  code: string;
  name: string;
  frequency: string;
  isActive: boolean;
  totalCustomers: number;
  customers: SalesBeatCustomer[];
  createdAtUtc: string;
}

export interface SalesRepCustomerAssignment {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  assignedFromUtc: string;
  assignedToUtc?: string;
  isActive: boolean;
}

export interface SalesVisit {
  id: string;
  companyId: string;
  salesEmployeeId: string;
  salesEmployeeName: string;
  salesEmployeeCode: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  visitDateUtc: string;
  checkInLatitude: number;
  checkInLongitude: number;
  distanceToCustomerMeters: number;
  isGpsVerified: boolean;
  isFaceVerified: boolean;
  checkInAtUtc: string;
  checkOutAtUtc?: string;
  outcome: VisitOutcome;
  notes?: string;
}

export interface SfaDashboardMetrics {
  todayVisitsCount: number;
  completedVisitsCount: number;
  pendingVisitsCount: number;
  ordersBookedTodayCount: number;
  ordersBookedTodayValue: number;
  gpsSuccessRatePercentage: number;
}

export interface CreateSalesBeatPayload {
  companyId: string;
  code: string;
  name: string;
  salesEmployeeId?: string;
  frequency: string;
  customerIds?: string[];
}

export interface UpdateSalesBeatPayload {
  name: string;
  salesEmployeeId?: string;
  frequency: string;
  isActive: boolean;
  customerIds?: string[];
}

export interface AssignCustomerPayload {
  companyId: string;
  employeeId: string;
  customerId: string;
  assignedFromUtc?: string;
  assignedToUtc?: string;
}

export interface CheckInVisitPayload {
  companyId: string;
  customerId: string;
  salesEmployeeId?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  isFaceVerified: boolean;
  notes?: string;
}

export interface CheckOutVisitPayload {
  outcome: string;
  notes?: string;
}
