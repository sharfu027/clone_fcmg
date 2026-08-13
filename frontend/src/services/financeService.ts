import { apiClient } from '../api/apiClient';
import {
  ArReceivableRecord,
  ApPayableRecord,
  PaymentAllocation,
  VendorLedgerEntry,
  BankReconciliationStatus,
  ArApMetrics
} from '../types/finance';

export const financeService = {
  // AR Receivables
  async getReceivables(): Promise<ArReceivableRecord[]> {
    return apiClient.get<ArReceivableRecord[]>('/api/v1/finance/receivables');
  },

  // AP Payables
  async getPayables(): Promise<ApPayableRecord[]> {
    return apiClient.get<ApPayableRecord[]>('/api/v1/finance/payables');
  },

  // Allocation Engine
  async allocatePayment(payload: Partial<PaymentAllocation>): Promise<PaymentAllocation> {
    return apiClient.post<PaymentAllocation>('/api/v1/finance/allocate', payload);
  },

  // Vendor Ledger
  async getVendorLedger(vendorId: string): Promise<VendorLedgerEntry[]> {
    return apiClient.get<VendorLedgerEntry[]>(`/api/v1/finance/vendor-ledger/${vendorId}`);
  },

  // Bank Reconciliation
  async getBankReconciliations(): Promise<BankReconciliationStatus[]> {
    return apiClient.get<BankReconciliationStatus[]>('/api/v1/finance/bank-reconciliation');
  },

  // AR/AP Metrics
  async getArApMetrics(): Promise<ArApMetrics> {
    return apiClient.get<ArApMetrics>('/api/v1/finance/metrics');
  }
};
