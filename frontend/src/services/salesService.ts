import { apiClient } from '../api/apiClient';
import {
  RealSalesOrder,
  CreateRealSalesOrderRequest,
  UpdateRealSalesOrderRequest,
  VerifyFieldLocationRequest,
  VerifyFieldLocationResult,
  PriceResolutionResult,
  SalesInvoice,
  DeliveryTracking,
  TemporaryPin,
  ValidateTemporaryPinResult,
  ValidateLoginLocationResult
} from '../types/sales';

export const salesService = {
  // --------------------------------------------------
  // 1. SALES ORDERS
  // --------------------------------------------------
  async fetchSalesOrders(params?: {
    companyId?: string;
    customerId?: string;
    salesEmployeeId?: string;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<RealSalesOrder[]> {
    return apiClient.get<RealSalesOrder[]>('/api/v1/sales/orders', { params });
  },

  async fetchSalesOrderById(id: string): Promise<RealSalesOrder> {
    return apiClient.get<RealSalesOrder>(`/api/v1/sales/orders/${id}`);
  },

  async createSalesOrder(payload: CreateRealSalesOrderRequest): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>('/api/v1/sales/orders', payload);
  },

  async updateSalesOrder(id: string, payload: UpdateRealSalesOrderRequest, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.put<RealSalesOrder>(`/api/v1/sales/orders/${id}`, payload, {
      params: companyId ? { companyId } : undefined
    });
  },

  async submitSalesOrder(id: string, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>(`/api/v1/sales/orders/${id}/submit`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  async cancelSalesOrder(id: string, companyId?: string): Promise<RealSalesOrder> {
    return apiClient.post<RealSalesOrder>(`/api/v1/sales/orders/${id}/cancel`, null, {
      params: companyId ? { companyId } : undefined
    });
  },

  async verifyFieldLocation(payload: VerifyFieldLocationRequest): Promise<VerifyFieldLocationResult> {
    return apiClient.post<VerifyFieldLocationResult>('/api/v1/sales/orders/verify-field-location', payload);
  },

  async resolvePrice(params: {
    companyId: string;
    productId: string;
    customerId?: string;
    targetDate?: string;
  }): Promise<PriceResolutionResult> {
    return apiClient.get<PriceResolutionResult>('/api/v1/sales/orders/resolve-price', { params });
  },

  async verifyFaceBiometrics(payload: {
    userId: string;
    imageBase64: string;
    deviceId?: string;
  }): Promise<{ success: boolean; score: number; message: string; isMatch?: boolean; confidence?: number; requiresLivenessCheck?: boolean }> {
    return apiClient.post('/api/v1/security/face/verify', payload);
  },

  // --------------------------------------------------
  // 2. SALES INVOICES & PAYMENTS & E-INVOICE
  // --------------------------------------------------
  async fetchInvoices(params?: {
    companyId?: string;
    customerId?: string;
    salesOrderId?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<SalesInvoice[]> {
    return apiClient.get<SalesInvoice[]>('/api/v1/sales/invoices', { params });
  },

  async fetchInvoiceById(id: string): Promise<SalesInvoice> {
    return apiClient.get<SalesInvoice>(`/api/v1/sales/invoices/${id}`);
  },

  async createInvoiceFromOrder(salesOrderId: string, options?: {
    invoiceDateUtc?: string;
    dueDateUtc?: string;
    paymentTerms?: string;
    notes?: string;
  }): Promise<SalesInvoice> {
    return apiClient.post<SalesInvoice>('/api/v1/sales/invoices', {
      salesOrderId,
      ...options
    });
  },

  async issueInvoice(id: string): Promise<SalesInvoice> {
    return apiClient.post<SalesInvoice>(`/api/v1/sales/invoices/${id}/issue`);
  },

  async recordInvoicePayment(id: string, payload: {
    amount: number;
    paymentMode?: string;
    referenceNumber?: string;
    notes?: string;
    receivedByEmployeeId?: string;
  }): Promise<SalesInvoice> {
    return apiClient.post<SalesInvoice>(`/api/v1/sales/invoices/${id}/payments`, payload);
  },

  async generateEInvoice(id: string): Promise<{ success: boolean; message: string; irn?: string; ackNo?: string; qrCodeData?: string }> {
    return apiClient.post(`/api/v1/sales/invoices/${id}/e-invoice/generate`);
  },

  // --------------------------------------------------
  // 3. DELIVERY TRACKING
  // --------------------------------------------------
  async fetchDeliveryTracking(salesOrderId: string): Promise<DeliveryTracking> {
    return apiClient.get<DeliveryTracking>(`/api/v1/sales/delivery/orders/${salesOrderId}`);
  },

  async updateDeliveryStatus(salesOrderId: string, payload: {
    status: string;
    dispatchId?: string;
    carrierName?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    receivedByPerson?: string;
    signatureProofUrl?: string;
    currentLatitude?: number;
    currentLongitude?: number;
    notes?: string;
  }): Promise<DeliveryTracking> {
    return apiClient.post<DeliveryTracking>(`/api/v1/sales/delivery/orders/${salesOrderId}`, payload, {
      params: payload.dispatchId ? { dispatchId: payload.dispatchId } : undefined
    });
  },

  // --------------------------------------------------
  // 4. LOCATION-BASED LOGIN & TEMPORARY PIN
  // --------------------------------------------------
  async validateLoginLocation(payload: {
    companyId: string;
    employeeId?: string | null;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    maxAllowedRadiusMeters?: number;
  }): Promise<ValidateLoginLocationResult> {
    return apiClient.post<ValidateLoginLocationResult>('/api/v1/security/pins/validate-location', payload);
  },

  async generateTemporaryPin(payload: {
    companyId: string;
    employeeId?: string | null;
    purpose?: string;
    expiryMinutes?: number;
  }): Promise<TemporaryPin> {
    return apiClient.post<TemporaryPin>('/api/v1/security/pins/generate', payload);
  },

  async validateTemporaryPin(payload: {
    companyId: string;
    pin: string;
    employeeId?: string | null;
    deviceId?: string;
  }): Promise<ValidateTemporaryPinResult> {
    return apiClient.post<ValidateTemporaryPinResult>('/api/v1/security/pins/validate', payload);
  }
};
