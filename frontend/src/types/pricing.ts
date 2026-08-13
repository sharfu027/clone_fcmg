export type PriceListStatus = 'Draft' | 'Published' | 'Archived' | 'Expired' | 'Active';

export interface PriceListItem {
  id?: string;
  priceListId?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  sku?: string;
  uom?: string;
  basePrice: number;
  costPrice?: number;
  wholesalePrice?: number;
  msrp?: number;
  minSellingPrice?: number;
  sellingPrice?: number;
  currencyCode?: string;
  effectiveDate?: string;
  isActive?: boolean;
  status?: 'Active' | 'Disabled';
}

export interface PriceList {
  id: string;
  companyId?: string;
  code?: string;
  name: string;
  type?: 'Retail' | 'Wholesale' | 'Distributor' | 'Customer Specific' | 'Promotional' | 'Internal Transfer' | 'Standard' | 'Special';
  currency?: string;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version: number;
  status: PriceListStatus;
  concurrencyToken?: string;
  isDeleted?: boolean;
  createdAtUtc?: string;
  createdBy?: string;
  createdByEmail?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  publishedBy?: string;
  publishedAtUtc?: string;
  itemsCount?: number;
  items?: PriceListItem[];
}

export interface PagedPriceListResult {
  items: PriceList[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CustomerPricingRule {
  id: string;
  companyId?: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  customerType?: string;
  priceListId?: string;
  priceListName?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  uom?: string;
  basePrice?: number;
  customerPriceValue?: number;
  specialPrice?: number;
  minAllowedPrice?: number;
  currencyCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived' | 'Expired';
  isActive?: boolean;
  createdAtUtc?: string;
  createdBy?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  activatedBy?: string;
  activatedAtUtc?: string;
  deactivatedBy?: string;
  deactivatedAtUtc?: string;
  archivedBy?: string;
  archivedAtUtc?: string;
}



export type DiscountMethod = 'Percentage' | 'FixedAmount';
export type DiscountScope = 'CustomerProduct' | 'Customer' | 'Product' | 'Category' | 'PriceList' | 'Global';
export type DiscountRuleStatus = 'Draft' | 'Active' | 'Inactive' | 'Archived' | 'Expired';

export interface DiscountRule {
  id: string;
  companyId?: string;
  ruleCode: string;
  ruleName: string;
  description?: string;
  discountMethod: DiscountMethod;
  discountValue: number;
  scope: DiscountScope;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  priceListId?: string;
  priceListName?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  maximumDiscountAmount?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  status: DiscountRuleStatus;
  isActive: boolean;
  createdAtUtc?: string;
  createdBy?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  activatedBy?: string;
  activatedAtUtc?: string;
  deactivatedBy?: string;
  deactivatedAtUtc?: string;
  archivedBy?: string;
  archivedAtUtc?: string;
}

export interface CreateDiscountRulePayload {
  companyId?: string;
  ruleCode?: string;
  ruleName: string;
  description?: string;
  discountMethod: DiscountMethod;
  discountValue: number;
  scope: DiscountScope;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  priceListId?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  maximumDiscountAmount?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  status: DiscountRuleStatus;
}

export interface UpdateDiscountRulePayload {
  ruleName: string;
  description?: string;
  discountMethod: DiscountMethod;
  discountValue: number;
  scope: DiscountScope;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  priceListId?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  maximumDiscountAmount?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  status: DiscountRuleStatus;
}

export interface DiscountCalculationRequest {
  companyId?: string;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  priceListId?: string;
  quantity: number;
  resolvedUnitPrice: number;
  effectiveDate?: string;
}

export interface DiscountCalculationResult {
  originalUnitPrice: number;
  discountAmount: number;
  discountPercentage: number;
  totalBeforeDiscount: number;
  totalDiscount: number;
  finalUnitPrice: number;
  finalTotal: number;
  appliedRuleId?: string;
  appliedRuleCode?: string;
  appliedRuleName?: string;
  appliedRulePriority?: number;
  appliedRuleScope?: string;
}

export interface DiscountRuleHistory {
  ruleId: string;
  action: string;
  actionBy: string;
  timestampUtc: string;
  details: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'BuyXGetY' | 'Bundle' | 'Combo' | 'LimitedTime' | 'Coupon';
  discountValue: number;
  couponCode?: string;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Scheduled' | 'Expired';
}

export interface TaxConfig {
  id: string;
  code: string;
  name: string;
  type: 'GST' | 'VAT';
  ratePercent: number;
  category: 'Standard' | 'Reduced' | 'Zero' | 'Exempt';
  status: 'Active' | 'Inactive';
}

export interface CurrencyConfig {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  status: 'Active' | 'Inactive';
}

// ─── Multi-Currency API DTOs (Sprint 5) ──────────────────────────────────────

export interface CurrencyDto {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdAtUtc: string;
  modifiedBy?: string;
  lastModifiedAtUtc?: string;
}

export interface ExchangeRateDto {
  id: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Draft' | 'Active' | 'Expired' | 'Archived';
  source: 'Manual' | 'Imported';
  createdBy?: string;
  createdAtUtc: string;
  modifiedBy?: string;
  lastModifiedAtUtc?: string;
}

export interface CurrencyDashboardDto {
  baseCurrencyCode: string;
  activeCurrenciesCount: number;
  activeExchangeRatesCount: number;
  latestUsdToInrRate?: number;
  latestEurToInrRate?: number;
  latestAedToInrRate?: number;
}
