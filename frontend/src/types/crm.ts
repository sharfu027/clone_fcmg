export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ComplaintStatus = 'Registered' | 'UnderInvestigation' | 'Assigned' | 'Resolved' | 'Closed';
export type TicketSlaStatus = 'WithinSLA' | 'NearBreach' | 'SLABreached';
export type FollowUpType = 'SalesCall' | 'Meeting' | 'PaymentCollection' | 'IssueCheck';
export type ChannelType = 'Phone' | 'Email' | 'WhatsApp' | 'SMS' | 'InPerson';

export interface ContactPerson {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  isPrimary: boolean;
}

export interface CrmCustomerProfile {
  id: string;
  customerCode: string;
  name: string;
  outletType: 'Supermarket' | 'KiranaStore' | 'Wholesaler' | 'Hypermarket';
  gstNumber: string;
  pan: string;
  primaryContact: string;
  mobile: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  assignedSalesman: string;
  creditLimit: number;
  creditUsed: number;
  outstandingBalance: number;
  overdueAmount: number;
  contacts: ContactPerson[];
  status: 'Active' | 'Inactive' | 'CreditHold';
}

export interface CustomerComplaint {
  id: string;
  complaintCode: string;
  customerName: string;
  category: 'DamagedProduct' | 'Shortage' | 'PriceDiscrepancy' | 'LateDelivery' | 'BillingError';
  priority: ComplaintPriority;
  status: ComplaintStatus;
  registeredDate: string;
  assignedTo: string;
  resolutionNotes?: string;
  resolvedDate?: string;
}

export interface CustomerTicket {
  id: string;
  ticketCode: string;
  customerName: string;
  subject: string;
  assignedAgent: string;
  createdDate: string;
  slaDueDate: string;
  slaStatus: TicketSlaStatus;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
}

export interface CustomerFollowUp {
  id: string;
  followUpCode: string;
  customerName: string;
  type: FollowUpType;
  scheduledDate: string;
  assignedSalesman: string;
  notes: string;
  nextActionDate?: string;
  status: 'Pending' | 'Completed' | 'Missed';
}

export interface CommunicationLog {
  id: string;
  customerName: string;
  channel: ChannelType;
  timestamp: string;
  senderOrAgent: string;
  summary: string;
}

export interface CustomerVisitLog {
  id: string;
  visitCode: string;
  customerName: string;
  salesmanName: string;
  checkInTime: string;
  checkOutTime?: string;
  gpsCoordinates: string;
  faceVerified: boolean;
  visitNotes: string;
}

export interface CustomerFeedback {
  id: string;
  customerName: string;
  ratingStars: 1 | 2 | 3 | 4 | 5;
  feedbackType: 'ProductQuality' | 'DeliverySpeed' | 'SalesRepBehavior' | 'Packaging';
  comments: string;
  date: string;
}

export interface CrmMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  openComplaintsCount: number;
  pendingFollowUpsCount: number;
  closedTicketsMonth: number;
  csatScorePercent: number;
}
