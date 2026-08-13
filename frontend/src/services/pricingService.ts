import { apiClient } from '../api/apiClient';
import {
  PriceList,
  PagedPriceListResult,
  CustomerPricingRule,
  DiscountRule,
  Promotion,
  TaxConfig,
  CurrencyConfig,
  CurrencyDto,
  ExchangeRateDto,
  CurrencyDashboardDto
} from '../types/pricing';

export const pricingService = {
  // Price Lists API
  async getPriceLists(params?: Record<string, string | number | boolean | undefined>): Promise<PagedPriceListResult | PriceList[]> {
    return apiClient.get<PagedPriceListResult | PriceList[]>('/api/v1/pricing/price-lists', { params });
  },

  async getPriceListById(id: string): Promise<PriceList> {
    return apiClient.get<PriceList>(`/api/v1/pricing/price-lists/${id}`);
  },

  async createPriceList(payload: Partial<PriceList>): Promise<PriceList> {
    return apiClient.post<PriceList>('/api/v1/pricing/price-lists', payload);
  },

  async updatePriceList(id: string, payload: Partial<PriceList>): Promise<PriceList> {
    return apiClient.put<PriceList>(`/api/v1/pricing/price-lists/${id}`, payload);
  },

  async publishPriceList(id: string, concurrencyToken: string): Promise<PriceList> {
    return apiClient.post<PriceList>(`/api/v1/pricing/price-lists/${id}/publish?concurrencyToken=${encodeURIComponent(concurrencyToken)}`);
  },

  async archivePriceList(id: string, concurrencyToken: string): Promise<PriceList> {
    return apiClient.post<PriceList>(`/api/v1/pricing/price-lists/${id}/archive?concurrencyToken=${encodeURIComponent(concurrencyToken)}`);
  },

  async deletePriceList(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/pricing/price-lists/${id}`);
  },

  // Customer Pricing API (Production Sprint 2)
  async getCustomerPrices(params?: Record<string, any>): Promise<any> {
    return apiClient.get<any>('/api/v1/pricing/customer-pricing', { params });
  },

  async getCustomerPriceById(id: string): Promise<CustomerPricingRule> {
    return apiClient.get<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}`);
  },

  async createCustomerPrice(payload: any): Promise<CustomerPricingRule> {
    return apiClient.post<CustomerPricingRule>('/api/v1/pricing/customer-pricing', payload);
  },

  async updateCustomerPrice(id: string, payload: any): Promise<CustomerPricingRule> {
    return apiClient.put<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}`, payload);
  },

  async activateCustomerPrice(id: string): Promise<CustomerPricingRule> {
    return apiClient.patch<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}/activate`);
  },

  async deactivateCustomerPrice(id: string): Promise<CustomerPricingRule> {
    return apiClient.patch<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}/deactivate`);
  },

  async archiveCustomerPrice(id: string): Promise<CustomerPricingRule> {
    return apiClient.patch<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}/archive`);
  },

  async deleteCustomerPrice(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/pricing/customer-pricing/${id}`);
  },

  async duplicateCustomerPrice(id: string): Promise<CustomerPricingRule> {
    return apiClient.post<CustomerPricingRule>(`/api/v1/pricing/customer-pricing/${id}/duplicate`);
  },

  async resolvePrice(params: { companyId?: string; customerId: string; productId: string; targetDate?: string }): Promise<any> {
    return apiClient.get<any>('/api/v1/pricing/customer-pricing/resolve', { params });
  },

  // Legacy fallback alias
  async getCustomerPricingRules(): Promise<CustomerPricingRule[]> {
    try {
      const res = await this.getCustomerPrices();
      return Array.isArray(res) ? res : (res?.items || []);
    } catch {
      return [];
    }
  },



  // Discount Engine API (Sprint 4)
  async getDiscountRules(params?: Record<string, any>): Promise<any> {
    return apiClient.get<any>('/api/v1/pricing/discount-rules', { params });
  },

  async getDiscountRuleById(id: string): Promise<DiscountRule> {
    return apiClient.get<DiscountRule>(`/api/v1/pricing/discount-rules/${id}`);
  },

  async createDiscountRule(payload: any): Promise<DiscountRule> {
    return apiClient.post<DiscountRule>('/api/v1/pricing/discount-rules', payload);
  },

  async updateDiscountRule(id: string, payload: any): Promise<DiscountRule> {
    return apiClient.put<DiscountRule>(`/api/v1/pricing/discount-rules/${id}`, payload);
  },

  async activateDiscountRule(id: string): Promise<DiscountRule> {
    return apiClient.patch<DiscountRule>(`/api/v1/pricing/discount-rules/${id}/activate`);
  },

  async deactivateDiscountRule(id: string): Promise<DiscountRule> {
    return apiClient.patch<DiscountRule>(`/api/v1/pricing/discount-rules/${id}/deactivate`);
  },

  async archiveDiscountRule(id: string): Promise<DiscountRule> {
    return apiClient.patch<DiscountRule>(`/api/v1/pricing/discount-rules/${id}/archive`);
  },

  async deleteDiscountRule(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/pricing/discount-rules/${id}`);
  },

  async duplicateDiscountRule(id: string): Promise<DiscountRule> {
    return apiClient.post<DiscountRule>(`/api/v1/pricing/discount-rules/${id}/duplicate`);
  },

  async getDiscountRuleHistory(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/pricing/discount-rules/${id}/history`);
  },

  async calculateDiscount(req: any): Promise<any> {
    return apiClient.post<any>('/api/v1/pricing/discount-rules/calculate', req);
  },

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return apiClient.get<Promotion[]>('/api/v1/pricing/promotions');
  },

  // Tax Configuration
  async getTaxConfigs(): Promise<TaxConfig[]> {
    return apiClient.get<TaxConfig[]>('/api/v1/pricing/taxes');
  },

  // Legacy stub (still used by mock state)
  async getCurrencies(): Promise<CurrencyConfig[]> {
    return apiClient.get<CurrencyConfig[]>('/api/v1/pricing/currencies');
  },

  // ── Multi-Currency: Currency Management (Sprint 5) ────────────────────────

  async getCurrenciesData(): Promise<CurrencyDto[]> {
    return apiClient.get<CurrencyDto[]>('/api/v1/pricing/currencies');
  },

  async getCurrencyDashboard(): Promise<CurrencyDashboardDto> {
    return apiClient.get<CurrencyDashboardDto>('/api/v1/pricing/currencies/dashboard');
  },

  async createCurrencyRecord(payload: {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
    isBaseCurrency: boolean;
  }): Promise<string> {
    return apiClient.post<string>('/api/v1/pricing/currencies', payload);
  },

  async updateCurrencyRecord(id: string, payload: {
    id: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
  }): Promise<void> {
    return apiClient.put<void>(`/api/v1/pricing/currencies/${id}`, payload);
  },

  async activateCurrencyRecord(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/pricing/currencies/${id}/activate`);
  },

  async deactivateCurrencyRecord(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/pricing/currencies/${id}/deactivate`);
  },

  // ── Multi-Currency: Exchange Rate Management (Sprint 5) ───────────────────

  async getExchangeRatesList(): Promise<ExchangeRateDto[]> {
    return apiClient.get<ExchangeRateDto[]>('/api/v1/pricing/exchange-rates');
  },

  async createExchangeRate(payload: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
    rate: number;
    effectiveFrom: string;
    effectiveTo?: string;
    source: 'Manual' | 'Imported';
  }): Promise<string> {
    return apiClient.post<string>('/api/v1/pricing/exchange-rates', payload);
  },

  async updateExchangeRate(id: string, payload: {
    id: string;
    rate: number;
    effectiveFrom: string;
    effectiveTo?: string;
  }): Promise<void> {
    return apiClient.put<void>(`/api/v1/pricing/exchange-rates/${id}`, payload);
  },

  async activateExchangeRate(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/pricing/exchange-rates/${id}/activate`);
  },

  async archiveExchangeRate(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/pricing/exchange-rates/${id}/archive`);
  },
};
