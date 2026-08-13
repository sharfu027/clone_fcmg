import { apiClient } from '../api/apiClient';
import {
  SalesQuotation,
  SalesOrder,
  DeliveryOrder,
  SalesInvoice,
  O2CPaymentRecord,
  CustomerLedgerEntry,
  CreditNote,
  DebitNote,
  O2CMetrics
} from '../types/o2c';

export const o2cService = {
  // Quotations
  async getQuotations(): Promise<SalesQuotation[]> {
    return apiClient.get<SalesQuotation[]>('/api/v1/o2c/quotations');
  },

  async createQuotation(payload: Partial<SalesQuotation>): Promise<SalesQuotation> {
    return apiClient.post<SalesQuotation>('/api/v1/o2c/quotations', payload);
  },

  async convertQuotationToSO(id: string): Promise<SalesOrder> {
    return apiClient.post<SalesOrder>(`/api/v1/o2c/quotations/${id}/convert`);
  },

  // Sales Orders
  async getSalesOrders(): Promise<SalesOrder[]> {
    return apiClient.get<SalesOrder[]>('/api/v1/o2c/orders');
  },

  async createSalesOrder(payload: Partial<SalesOrder>): Promise<SalesOrder> {
    return apiClient.post<SalesOrder>('/api/v1/o2c/orders', payload);
  },

  async approveSalesOrder(id: string): Promise<SalesOrder> {
    return apiClient.post<SalesOrder>(`/api/v1/o2c/orders/${id}/approve`);
  },

  // Deliveries
  async getDeliveryOrders(): Promise<DeliveryOrder[]> {
    return apiClient.get<DeliveryOrder[]>('/api/v1/o2c/deliveries');
  },

  // Invoices
  async getSalesInvoices(): Promise<SalesInvoice[]> {
    return apiClient.get<SalesInvoice[]>('/api/v1/o2c/invoices');
  },

  async createSalesInvoice(payload: Partial<SalesInvoice>): Promise<SalesInvoice> {
    return apiClient.post<SalesInvoice>('/api/v1/o2c/invoices', payload);
  },

  // Payments
  async getPayments(): Promise<O2CPaymentRecord[]> {
    return apiClient.get<O2CPaymentRecord[]>('/api/v1/o2c/payments');
  },

  async recordPayment(payload: Partial<O2CPaymentRecord>): Promise<O2CPaymentRecord> {
    return apiClient.post<O2CPaymentRecord>('/api/v1/o2c/payments', payload);
  },

  // Customer Ledger
  async getCustomerLedger(customerId: string): Promise<CustomerLedgerEntry[]> {
    return apiClient.get<CustomerLedgerEntry[]>(`/api/v1/o2c/ledger/${customerId}`);
  },

  // Credit / Debit Notes
  async getCreditNotes(): Promise<CreditNote[]> {
    return apiClient.get<CreditNote[]>('/api/v1/o2c/credit-notes');
  },

  async getDebitNotes(): Promise<DebitNote[]> {
    return apiClient.get<DebitNote[]>('/api/v1/o2c/debit-notes');
  },

  // Metrics & DSO
  async getO2CMetrics(): Promise<O2CMetrics> {
    return apiClient.get<O2CMetrics>('/api/v1/o2c/metrics');
  }
};
