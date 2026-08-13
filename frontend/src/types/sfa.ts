export type VisitType = 'Planned' | 'Unplanned';
export type VisitOutcome = 'OrderBooked' | 'CollectionDone' | 'NoOrder' | 'StoreClosed';
export type PaymentMode = 'Cash' | 'Cheque' | 'UPI' | 'BankTransfer';
export type ExpenseStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Paid';

export interface SalesRepMaster {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  territoryName: string;
  reportingManager: string;
  monthlyTarget: number;
  monthlyAchievement: number;
  rating: number;
  status: 'Active' | 'Inactive';
}

export interface Territory {
  id: string;
  code: string;
  name: string;
  region: string;
  zone: string;
  assignedRepCount: number;
  totalCustomers: number;
}

export interface BeatPlan {
  id: string;
  code: string;
  name: string;
  territoryName: string;
  repName: string;
  frequency: 'Daily' | 'Weekly' | 'BiWeekly';
  totalOutlets: number;
  sequenceOrder: number[];
  status: 'Active' | 'Inactive';
}

export interface CustomerVisit {
  id: string;
  code: string;
  visitDate: string;
  repName: string;
  customerName: string;
  visitType: VisitType;
  checkinTime: string;
  checkoutTime?: string;
  durationMinutes?: number;
  gpsDistanceMeters?: number;
  isGeofenceValid: boolean;
  outcome: VisitOutcome;
  orderValue?: number;
  notes?: string;
}

export interface GpsCheckin {
  id: string;
  repName: string;
  customerName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  distanceFromOutletMeters: number;
  status: 'ValidGeofence' | 'OutofRangeAlert';
  timestamp: string;
}

export interface FaceAttendanceRecord {
  id: string;
  repName: string;
  checkinTime: string;
  checkoutTime?: string;
  confidenceScore: number;
  livenessVerified: boolean;
  status: 'Present' | 'Late' | 'Absent';
}

export interface SfaOrderBooking {
  id: string;
  orderNo: string;
  bookingDate: string;
  customerName: string;
  repName: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  status: 'Booked' | 'Confirmed' | 'Dispatched';
}

export interface CollectionRecord {
  id: string;
  receiptNo: string;
  collectionDate: string;
  customerName: string;
  repName: string;
  paymentMode: PaymentMode;
  amountCollected: number;
  referenceNo?: string; // Cheque or UPI Txn Ref
  status: 'Received' | 'Cleared' | 'Bounced';
}

export interface DailyCallReport {
  id: string;
  dcrDate: string;
  repName: string;
  plannedVisits: number;
  actualVisits: number;
  ordersCount: number;
  totalOrderValue: number;
  totalCollectionValue: number;
  competitorRemarks?: string;
  status: 'Submitted' | 'Approved';
}

export interface SfaExpense {
  id: string;
  code: string;
  expenseDate: string;
  repName: string;
  category: 'Travel' | 'Food' | 'Accommodation' | 'Misc';
  amount: number;
  receiptUrl?: string;
  status: ExpenseStatus;
}

export interface CustomerFeedbackRecord {
  id: string;
  customerName: string;
  repName: string;
  feedbackType: 'Complaint' | 'ProductFeedback' | 'ServiceRating';
  rating: number;
  remarks: string;
  followupStatus: 'Open' | 'Resolved';
}

export interface SalesTarget {
  id: string;
  repName: string;
  period: 'Monthly' | 'Quarterly' | 'Annual';
  targetAmount: number;
  achievedAmount: number;
  achievementPercent: number;
  incentiveEarned: number;
}

export interface SfaMetrics {
  totalCallsToday: number;
  productiveCallsToday: number;
  strikeRatePercent: number;
  dailyCollectionValue: number;
  monthlyRevenueAchieved: number;
  activeSalesRepsCount: number;
}
