export type ArStatus = 'Current' | 'Overdue' | 'CreditHold' | 'Paid';
export type ApStatus = 'Pending' | 'DueToday' | 'Overdue' | 'Paid' | 'PaymentHold';

export interface ArReceivableRecord {
  id: string;
  invoiceCode: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  allocatedAmount: number;
  balanceDue: number;
  creditLimit: number;
  status: ArStatus;
}

export interface ApPayableRecord {
  id: string;
  billNumber: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  balancePayable: number;
  paymentTerms: string;
  status: ApStatus;
}

export interface PaymentAllocation {
  allocationId: string;
  receiptNumber: string;
  invoiceCode: string;
  allocatedAmount: number;
  discountAdjusted: number;
  allocationDate: string;
}

export interface VendorLedgerEntry {
  id: string;
  entryDate: string;
  documentNo: string;
  type: 'PurchaseBill' | 'VendorPayment' | 'SupplierCreditNote' | 'DebitNote';
  debitAmount: number; // Payments / Credit Notes reduce liability
  creditAmount: number; // Purchase Bills increase liability
  runningBalance: number;
}

export interface BankReconciliationStatus {
  bankAccountId: string;
  accountName: string;
  bankName: string;
  bookBalance: number;
  statementBalance: number;
  unmatchedDeposits: number;
  unmatchedWithdrawals: number;
  status: 'Reconciled' | 'PendingReconciliation';
}

export interface ExtendedAgingBuckets {
  current30: number;
  days31To60: number;
  days61To90: number;
  days91To180: number;
  days180Plus: number;
}

export interface ArApMetrics {
  totalReceivables: number;
  overdueReceivables: number;
  totalPayables: number;
  overduePayables: number;
  dsoDays: number;
  dpoDays: number; // Days Payable Outstanding
  netCashForecast30Days: number;
  arAging: ExtendedAgingBuckets;
  apAging: ExtendedAgingBuckets;
}
