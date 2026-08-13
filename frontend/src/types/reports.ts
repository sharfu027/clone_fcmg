export type ReportCategory =
  | 'MasterData'
  | 'Procurement'
  | 'Warehouse'
  | 'Inventory'
  | 'Sales'
  | 'Finance'
  | 'Returns'
  | 'HRMS'
  | 'CRM'
  | 'Logistics'
  | 'Workflow';

export type DocumentType =
  | 'SalesInvoice'
  | 'PurchaseOrder'
  | 'SalesOrder'
  | 'GoodsReceiptNote'
  | 'DeliveryChallan'
  | 'ReceiptVoucher'
  | 'PaymentVoucher'
  | 'CreditNote'
  | 'DebitNote'
  | 'EmployeeLetter'
  | 'LeaveApproval'
  | 'DeliveryPOD';

export type ExportFormat = 'PDF' | 'Excel' | 'CSV' | 'Print';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  branch?: string;
  department?: string;
  warehouse?: string;
  supplier?: string;
  customer?: string;
  salesman?: string;
  driver?: string;
  vehicle?: string;
  product?: string;
  category?: string;
  status?: string;
}

export interface ReportDefinition {
  id: string;
  code: string;
  title: string;
  category: ReportCategory;
  description: string;
  isFavourite: boolean;
  lastGeneratedDate?: string;
}

export interface GeneratedDocument {
  id: string;
  documentCode: string;
  documentType: DocumentType;
  referenceNumber: string;
  entityName: string;
  generatedDate: string;
  totalAmount?: number;
  pdfUrl?: string;
}

export interface ExportRequest {
  reportId: string;
  format: ExportFormat;
  filterParams: ReportFilterParams;
  emailRecipient?: string;
}

export interface ScheduledReportJob {
  id: string;
  jobName: string;
  reportCode: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  recipients: string[];
  lastRunStatus: 'Success' | 'Failed';
  nextRunDate: string;
}

export interface ReportMetrics {
  reportsGeneratedToday: number;
  scheduledReportsActive: number;
  favouriteReportsCount: number;
  pdfExportsToday: number;
  excelExportsToday: number;
  printJobsCompleted: number;
}
