import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  DollarSign,
  Percent,
  Gift,
  Receipt,
  Globe,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Send,
  Archive,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  Power,
  PowerOff,
  X,
  RefreshCw,
  Calculator,
  Layers,
  Calendar,
  CheckCircle2,
  Info,
  TrendingUp,
  ArrowUpDown,
  Star
} from 'lucide-react';
import {
  PriceList,
  PriceListItem,
  PriceListStatus,
  CustomerPricingRule,
  DiscountRule,
  CreateDiscountRulePayload,
  UpdateDiscountRulePayload,
  DiscountCalculationRequest,
  DiscountCalculationResult,
  DiscountRuleHistory,
  DiscountMethod,
  DiscountScope,
  DiscountRuleStatus,
  Promotion,
  TaxConfig,
  CurrencyConfig,
  CurrencyDto,
  ExchangeRateDto,
  CurrencyDashboardDto
} from '../../types/pricing';
import { pricingService } from '../../services/pricingService';
import * as masterDataService from '../../services/masterDataService';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tooltip } from '../../components/ui/Tooltip';
import { formatINR, formatDate } from '../../utils/formatters';

interface PricingModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function PricingModule({ onTriggerToast }: PricingModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'lists' | 'customer' | 'discounts' | 'promotions' | 'taxes' | 'currencies'
  >('lists');

  // Filter & Pagination States for Price Lists
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [currencyFilter, setCurrencyFilter] = useState<string>('All');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Price Lists State
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer Pricing States (Sprint 2)
  const [customerPrices, setCustomerPrices] = useState<CustomerPricingRule[]>([]);
  const [customerTotalCount, setCustomerTotalCount] = useState(0);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [custStatusFilter, setCustStatusFilter] = useState<string>('All');
  const [custPriceListFilter, setCustPriceListFilter] = useState<string>('All');
  const [custCurrencyFilter, setCustCurrencyFilter] = useState<string>('All');
  const [custPageNumber, setCustPageNumber] = useState(1);
  const custPageSize = 10;

  // Discount Engine States (Sprint 4)
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [discountTotalCount, setDiscountTotalCount] = useState(0);
  const [discountTotalPages, setDiscountTotalPages] = useState(1);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [discountSearchQuery, setDiscountSearchQuery] = useState('');
  const [discountScopeFilter, setDiscountScopeFilter] = useState<string>('All');
  const [discountMethodFilter, setDiscountMethodFilter] = useState<string>('All');
  const [discountStatusFilter, setDiscountStatusFilter] = useState<string>('All');
  const [discountEffectiveDateFilter, setDiscountEffectiveDateFilter] = useState('');
  const [discountPageNumber, setDiscountPageNumber] = useState(1);

  // Master Data States
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // Price List Modals & Selections
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState<Record<string, string>>({});

  // Customer Price Modals & Selections
  const [selectedCustPrice, setSelectedCustPrice] = useState<CustomerPricingRule | null>(null);
  const [isCustViewDrawerOpen, setIsCustViewDrawerOpen] = useState(false);
  const [isCustFormModalOpen, setIsCustFormModalOpen] = useState(false);
  const [editingCustPrice, setEditingCustPrice] = useState<CustomerPricingRule | null>(null);
  const [isCustDeletingId, setIsCustDeletingId] = useState<string | null>(null);
  const [isCustSubmitting, setIsCustSubmitting] = useState(false);
  const [custFormValidationErrors, setCustFormValidationErrors] = useState<Record<string, string>>({});

  // Discount Rule Modals & Selections
  const [selectedDiscountRule, setSelectedDiscountRule] = useState<DiscountRule | null>(null);
  const [isDiscountDrawerOpen, setIsDiscountDrawerOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscountRule, setEditingDiscountRule] = useState<DiscountRule | null>(null);
  const [isDiscountDeletingId, setIsDiscountDeletingId] = useState<string | null>(null);
  const [isDiscountSubmitting, setIsDiscountSubmitting] = useState(false);
  const [discountFormError, setDiscountFormError] = useState<string | null>(null);
  const [discountHistory, setDiscountHistory] = useState<DiscountRuleHistory[]>([]);

  // Discount Form Fields State
  const [dscRuleName, setDscRuleName] = useState('');
  const [dscRuleCode, setDscRuleCode] = useState('');
  const [dscDescription, setDscDescription] = useState('');
  const [dscMethod, setDscMethod] = useState<DiscountMethod>('Percentage');
  const [dscValue, setDscValue] = useState<number>(10);
  const [dscScope, setDscScope] = useState<DiscountScope>('Global');
  const [dscCustomerId, setDscCustomerId] = useState('');
  const [dscCustomerSearchInput, setDscCustomerSearchInput] = useState('');
  const [isDscCustomerSearching, setIsDscCustomerSearching] = useState(false);
  const [dscProductId, setDscProductId] = useState('');
  const [dscProductSearchInput, setDscProductSearchInput] = useState('');
  const [isDscProductSearching, setIsDscProductSearching] = useState(false);
  const [dscCategoryId, setDscCategoryId] = useState('');
  const [dscPriceListId, setDscPriceListId] = useState('');
  const [dscMinQty, setDscMinQty] = useState('');
  const [dscMaxQty, setDscMaxQty] = useState('');
  const [dscMaxDiscountAmount, setDscMaxDiscountAmount] = useState('');
  const [dscEffectiveFrom, setDscEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dscEffectiveTo, setDscEffectiveTo] = useState('');
  const [dscPriority, setDscPriority] = useState<number>(10);
  const [dscStatus, setDscStatus] = useState<DiscountRuleStatus>('Draft');

  // Diagnostic Calculator State (Admin Tool)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcCustomerId, setCalcCustomerId] = useState('');
  const [calcCustomerSearch, setCalcCustomerSearch] = useState('');
  const [isCalcCustSearching, setIsCalcCustSearching] = useState(false);
  const [calcProductId, setCalcProductId] = useState('');
  const [calcProductSearch, setCalcProductSearch] = useState('');
  const [isCalcProdSearching, setIsCalcProdSearching] = useState(false);
  const [calcCategoryId, setCalcCategoryId] = useState('');
  const [calcPriceListId, setCalcPriceListId] = useState('');
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  const [calcResolvedPrice, setCalcResolvedPrice] = useState<number>(100);
  const [calcEffectiveDate, setCalcEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [calcResult, setCalcResult] = useState<DiscountCalculationResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Price List Form Data
  const [formData, setFormData] = useState<{
    companyId: string;
    code: string;
    name: string;
    type: 'Retail' | 'Wholesale' | 'Distributor' | 'Customer Specific' | 'Promotional' | 'Internal Transfer';
    currency: string;
    status: PriceListStatus;
    description: string;
    effectiveFrom: string;
    effectiveTo: string;
    items: (PriceListItem & { searchInput?: string; isSearching?: boolean })[];
  }>({
    companyId: '',
    code: '',
    name: '',
    type: 'Retail',
    currency: 'INR',
    status: 'Draft',
    description: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    items: []
  });

  // Customer Price Form Data
  const [custFormData, setCustFormData] = useState<{
    companyId: string;
    customerId: string;
    customerSearchInput: string;
    isCustomerSearching: boolean;
    priceListId: string;
    productId: string;
    productSearchInput: string;
    isProductSearching: boolean;
    uom: string;
    basePrice: number;
    minAllowedPrice: number;
    customerPriceValue: number;
    currencyCode: string;
    effectiveFrom: string;
    effectiveTo: string;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived' | 'Expired';
  }>({
    companyId: '',
    customerId: '',
    customerSearchInput: '',
    isCustomerSearching: false,
    priceListId: '',
    productId: '',
    productSearchInput: '',
    isProductSearching: false,
    uom: 'Pcs',
    basePrice: 0,
    minAllowedPrice: 0,
    customerPriceValue: 0,
    currencyCode: 'INR',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    status: 'Draft'
  });

  // ── Multi-Currency State (Sprint 5) ────────────────────────────────────────
  // Currency list
  const [currencyList, setCurrencyList] = useState<CurrencyDto[]>([]);
  const [currencyDashboard, setCurrencyDashboard] = useState<CurrencyDashboardDto | null>(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Exchange rates list
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateDto[]>([]);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateStatusFilter, setRateStatusFilter] = useState('All');
  const [rateFromFilter, setRateFromFilter] = useState('');

  // Currency create/edit modal
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyDto | null>(null);
  const [isCurrencySubmitting, setIsCurrencySubmitting] = useState(false);
  const [currencyFormErrors, setCurrencyFormErrors] = useState<Record<string, string>>({});
  const [currencyFormData, setCurrencyFormData] = useState<{
    code: string; name: string; symbol: string; decimalPlaces: number; isBaseCurrency: boolean;
  }>({ code: '', name: '', symbol: '', decimalPlaces: 2, isBaseCurrency: false });

  // Exchange rate create/edit modal
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRateDto | null>(null);
  const [isRateSubmitting, setIsRateSubmitting] = useState(false);
  const [rateFormErrors, setRateFormErrors] = useState<Record<string, string>>({});
  const [rateFormData, setRateFormData] = useState<{
    fromCurrencyCode: string; toCurrencyCode: string; rate: number;
    effectiveFrom: string; effectiveTo: string; source: 'Manual' | 'Imported';
  }>({ fromCurrencyCode: '', toCurrencyCode: '', rate: 0, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', source: 'Manual' });

  // Legacy mock state (kept for backward compat / unused tabs)
  const [promotions] = useState<Promotion[]>([]);
  const [taxes] = useState<TaxConfig[]>([]);
  const [currencies] = useState<CurrencyConfig[]>([]);

  const toastRef = React.useRef(onTriggerToast);
  useEffect(() => {
    toastRef.current = onTriggerToast;
  }, [onTriggerToast]);

  // Fetch Master Data
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [prodData, compData, custData, catData] = await Promise.all([
          masterDataService.fetchProducts({}),
          masterDataService.fetchCompanies({}),
          masterDataService.fetchCustomers({}),
          masterDataService.fetchCategories({})
        ]);

        const prods = Array.isArray(prodData) ? prodData : (prodData && Array.isArray(prodData.items) ? prodData.items : []);
        setAvailableProducts(prods);

        const comps = Array.isArray(compData) ? compData : (compData && Array.isArray(compData.items) ? compData.items : []);
        setAvailableCompanies(comps);

        const custs = Array.isArray(custData) ? custData : (custData && Array.isArray(custData.items) ? custData.items : []);
        setAvailableCustomers(custs);

        const cats = Array.isArray(catData) ? catData : (catData && Array.isArray(catData.items) ? catData.items : []);
        setAvailableCategories(cats.length > 0 ? cats : [
          { id: 'cat-01', code: 'CAT-015', name: 'Personal Care' },
          { id: 'cat-02', code: 'CAT-016', name: 'Home Care' },
          { id: 'cat-03', code: 'CAT-017', name: 'Beverages' }
        ]);
      } catch {
        // Fallback data if unseeded
        setAvailableProducts([
          { id: '76b29511-ea74-422a-928f-f5ef3abd8d80', code: 'SOAP001', name: 'Soap 100g Classic', sku: 'SKU-SOAP-100', baseUom: 'Pcs', basePrice: 35, mrp: 45 },
          { id: 'a59e6217-3baa-426c-aff5-ba8fa06e48ac', code: 'SOAP002', name: 'Soap 250g Family Pack', sku: 'SKU-SOAP-250', baseUom: 'Pcs', basePrice: 80, mrp: 100 },
          { id: 'b28f1122-3c44-5566-7788-9900aabbccdd', code: 'DET001', name: 'Surf Washing Powder 1kg', sku: 'SKU-DET-1000', baseUom: 'Kg', basePrice: 180, mrp: 220 }
        ]);

        setAvailableCustomers([
          { id: 'c1111111-2222-3333-4444-555555555555', code: 'CUST-001', legalName: 'Reliance Retail Chain', tradeName: 'Reliance Fresh', customerType: 'Key Account', city: 'Mumbai' },
          { id: 'c2222222-3333-4444-5555-666666666666', code: 'CUST-002', legalName: 'Metro Cash & Carry India', tradeName: 'Metro Wholesalers', customerType: 'Wholesaler', city: 'Delhi' }
        ]);

        setAvailableCategories([
          { id: 'cat-01', code: 'CAT-015', name: 'Personal Care' },
          { id: 'cat-02', code: 'CAT-016', name: 'Home Care' },
          { id: 'cat-03', code: 'CAT-017', name: 'Beverages' }
        ]);
      }
    }
    loadMasterData();
  }, []);

  // Load Price Lists
  const fetchPriceLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        pageNumber,
        pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        currency: currencyFilter !== 'All' ? currencyFilter : undefined
      };
      const res = await pricingService.getPriceLists(params);
      if (res && 'items' in res) {
        setPriceLists(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages || Math.ceil(res.totalCount / pageSize) || 1);
      } else if (Array.isArray(res)) {
        setPriceLists(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else {
        setPriceLists([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch price lists');
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, searchQuery, statusFilter, typeFilter, currencyFilter]);

  // Load Customer Prices
  const fetchCustomerPrices = useCallback(async () => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const params: Record<string, any> = {
        pageNumber: custPageNumber,
        pageSize: custPageSize,
        search: custSearchQuery || undefined,
        status: custStatusFilter !== 'All' ? custStatusFilter : undefined,
        priceListId: custPriceListFilter !== 'All' ? custPriceListFilter : undefined,
        currency: custCurrencyFilter !== 'All' ? custCurrencyFilter : undefined
      };
      const res = await pricingService.getCustomerPrices(params);
      if (res && res.items) {
        setCustomerPrices(res.items);
        setCustomerTotalCount(res.totalCount || 0);
        setCustomerTotalPages(res.totalPages || Math.ceil((res.totalCount || 0) / custPageSize) || 1);
      } else if (Array.isArray(res)) {
        setCustomerPrices(res);
        setCustomerTotalCount(res.length);
        setCustomerTotalPages(1);
      } else {
        setCustomerPrices([]);
      }
    } catch (err: any) {
      setCustomerError(err.message || 'Failed to fetch customer prices');
    } finally {
      setCustomerLoading(false);
    }
  }, [custPageNumber, custPageSize, custSearchQuery, custStatusFilter, custPriceListFilter, custCurrencyFilter]);

  // Load Discount Rules (Sprint 4)
  const fetchDiscountRules = useCallback(async () => {
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const params: Record<string, any> = {
        pageNumber: discountPageNumber,
        pageSize: 10,
        companyId: availableCompanies[0]?.id || undefined,
        search: discountSearchQuery || undefined,
        scope: discountScopeFilter !== 'All' ? discountScopeFilter : undefined,
        method: discountMethodFilter !== 'All' ? discountMethodFilter : undefined,
        status: discountStatusFilter !== 'All' ? discountStatusFilter : undefined,
        effectiveDate: discountEffectiveDateFilter || undefined
      };
      const res = await pricingService.getDiscountRules(params);
      if (res && res.items) {
        setDiscountRules(res.items);
        setDiscountTotalCount(res.totalCount || 0);
        setDiscountTotalPages(res.totalPages || Math.ceil((res.totalCount || 0) / 10) || 1);
      } else if (Array.isArray(res)) {
        setDiscountRules(res);
        setDiscountTotalCount(res.length);
        setDiscountTotalPages(1);
      } else {
        setDiscountRules([]);
      }
    } catch (err: any) {
      setDiscountError(err.message || 'Failed to fetch discount rules');
    } finally {
      setDiscountLoading(false);
    }
  }, [discountPageNumber, discountSearchQuery, discountScopeFilter, discountMethodFilter, discountStatusFilter, discountEffectiveDateFilter]);

  // ── Multi-Currency Fetch Functions (Sprint 5) ──────────────────────────────
  const fetchCurrencies = useCallback(async () => {
    setCurrencyLoading(true);
    setCurrencyError(null);
    try {
      const [currData, dashData] = await Promise.all([
        pricingService.getCurrenciesData(),
        pricingService.getCurrencyDashboard()
      ]);
      setCurrencyList(Array.isArray(currData) ? currData : []);
      setCurrencyDashboard(dashData || null);
    } catch (err: any) {
      setCurrencyError(err.message || 'Failed to load currencies');
    } finally {
      setCurrencyLoading(false);
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    setRateLoading(true);
    setRateError(null);
    try {
      const data = await pricingService.getExchangeRatesList();
      setExchangeRates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRateError(err.message || 'Failed to load exchange rates');
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'lists') fetchPriceLists();
    else if (activeTab === 'customer') fetchCustomerPrices();
    else if (activeTab === 'discounts') fetchDiscountRules();
    else if (activeTab === 'currencies') {
      fetchCurrencies();
      fetchExchangeRates();
    }
  }, [activeTab, fetchPriceLists, fetchCustomerPrices, fetchDiscountRules, fetchCurrencies, fetchExchangeRates]);

  // Price List Handlers
  const handleViewPriceList = async (id: string) => {
    try {
      const data = await pricingService.getPriceListById(id);
      setSelectedPriceList(data);
      setIsViewDrawerOpen(true);
    } catch (err: any) {
      toastRef.current('error', 'Error Fetching Price List', err.message);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPriceList(null);
    setFormData({
      companyId: availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
      code: '',
      name: '',
      type: 'Retail',
      currency: 'INR',
      status: 'Draft',
      description: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      items: [
        { productId: availableProducts[0]?.id || '', productCode: availableProducts[0]?.code || 'SOAP001', productName: availableProducts[0]?.name || 'Soap 100g Classic', basePrice: availableProducts[0]?.basePrice || 35, sellingPrice: 35 }
      ]
    });
    setFormValidationErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    try {
      const data = await pricingService.getPriceListById(id);
      setEditingPriceList(data);
      setFormData({
        companyId: data.companyId || availableCompanies[0]?.id || '',
        code: data.code || '',
        name: data.name,
        type: data.type || 'Retail',
        currency: data.currency || 'INR',
        status: data.status,
        description: data.description || '',
        effectiveFrom: data.effectiveFrom ? data.effectiveFrom.split('T')[0] : '',
        effectiveTo: data.effectiveTo ? data.effectiveTo.split('T')[0] : '',
        items: data.items ? data.items.map(i => ({ ...i, searchInput: `${i.productCode || ''} - ${i.productName || ''}` })) : []
      });
      setFormValidationErrors({});
      setIsFormModalOpen(true);
    } catch (err: any) {
      toastRef.current('error', 'Error Loading Price List', err.message);
    }
  };

  const handleAddProductRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', productCode: '', productName: '', basePrice: 0, sellingPrice: 0, searchInput: '', isSearching: false }
      ]
    }));
  };

  const handleRemoveProductRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleProductRowChange = (index: number, field: keyof PriceListItem | 'searchInput' | 'isSearching', value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleSelectProductRow = (index: number, prod: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        sku: prod.sku,
        uom: prod.baseUom || 'Pcs',
        basePrice: prod.basePrice || 0,
        msrp: prod.mrp || 0,
        minSellingPrice: prod.basePrice ? Math.round(prod.basePrice * 0.8) : 0,
        sellingPrice: prod.basePrice || 0,
        searchInput: `${prod.code} - ${prod.name}`,
        isSearching: false
      };
      return { ...prev, items: newItems };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormValidationErrors({ name: 'Price List Name is required. Example: Standard Wholesale 2026' });
      return;
    }
    if (!formData.effectiveFrom) {
      setFormValidationErrors({ effectiveFrom: 'Effective From date is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<PriceList> = {
        companyId: formData.companyId || availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
        code: formData.code.trim() || undefined,
        name: formData.name.trim(),
        type: formData.type,
        currency: formData.currency,
        status: formData.status,
        description: formData.description.trim() || undefined,
        effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : undefined,
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).toISOString() : undefined,
        items: formData.items.map(i => ({
          productId: i.productId,
          basePrice: i.basePrice,
          sellingPrice: i.sellingPrice
        }))
      };

      if (editingPriceList) {
        await pricingService.updatePriceList(editingPriceList.id, payload);
        toastRef.current('success', 'Price List Updated', `Tariff "${formData.name}" updated successfully.`);
      } else {
        await pricingService.createPriceList(payload);
        toastRef.current('success', 'Price List Created', `New tariff "${formData.name}" created successfully.`);
      }
      setIsFormModalOpen(false);
      fetchPriceLists();
    } catch (err: any) {
      toastRef.current('error', 'Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicatePriceList = async (list: PriceList) => {
    try {
      const payload: Partial<PriceList> = {
        companyId: list.companyId || availableCompanies[0]?.id,
        name: `Copy of ${list.name}`,
        type: list.type,
        currency: list.currency,
        status: 'Draft',
        description: list.description,
        effectiveFrom: new Date().toISOString()
      };
      await pricingService.createPriceList(payload);
      toastRef.current('success', 'Price List Duplicated', `Created Draft copy of "${list.name}".`);
      fetchPriceLists();
    } catch (err: any) {
      toastRef.current('error', 'Duplication Failed', err.message);
    }
  };

  const handlePublish = async (list: PriceList) => {
    try {
      await pricingService.publishPriceList(list.id, list.concurrencyToken || '');
      toastRef.current('success', 'Price List Published', `"${list.name}" is now Active.`);
      fetchPriceLists();
    } catch (err: any) {
      toastRef.current('error', 'Publish Failed', err.message);
    }
  };

  const handleArchive = async (list: PriceList) => {
    try {
      await pricingService.archivePriceList(list.id, list.concurrencyToken || '');
      toastRef.current('warning', 'Price List Archived', `"${list.name}" has been archived.`);
      fetchPriceLists();
    } catch (err: any) {
      toastRef.current('error', 'Archive Failed', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await pricingService.deletePriceList(id);
      toastRef.current('info', 'Price List Deleted', 'Soft deleted successfully.');
      setIsDeletingId(null);
      fetchPriceLists();
    } catch (err: any) {
      toastRef.current('error', 'Delete Failed', err.message);
    }
  };

  // Customer Price Handlers (Sprint 2)
  const handleOpenCreateCustPriceModal = () => {
    setEditingCustPrice(null);
    setCustFormData({
      companyId: availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
      customerId: '',
      customerSearchInput: '',
      isCustomerSearching: false,
      priceListId: priceLists[0]?.id || '',
      productId: '',
      productSearchInput: '',
      isProductSearching: false,
      uom: 'Pcs',
      basePrice: 0,
      minAllowedPrice: 0,
      customerPriceValue: 0,
      currencyCode: 'INR',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      status: 'Draft'
    });
    setCustFormValidationErrors({});
    setIsCustFormModalOpen(true);
  };

  const handleOpenEditCustPriceModal = async (id: string) => {
    try {
      const data = await pricingService.getCustomerPriceById(id);
      setEditingCustPrice(data);
      setCustFormData({
        companyId: data.companyId || availableCompanies[0]?.id || '',
        customerId: data.customerId,
        customerSearchInput: data.customerCode ? `${data.customerCode} - ${data.customerName}` : (data.customerName || ''),
        isCustomerSearching: false,
        priceListId: data.priceListId || priceLists[0]?.id || '',
        productId: data.productId,
        productSearchInput: data.productCode ? `${data.productCode} - ${data.productName}` : (data.productName || ''),
        isProductSearching: false,
        uom: data.uom || 'Pcs',
        basePrice: data.basePrice || 0,
        minAllowedPrice: data.minAllowedPrice || 0,
        customerPriceValue: data.customerPriceValue ?? data.specialPrice ?? 0,
        currencyCode: data.currencyCode || 'INR',
        effectiveFrom: data.effectiveFrom ? data.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
        effectiveTo: data.effectiveTo ? data.effectiveTo.split('T')[0] : '',
        status: data.status
      });
      setCustFormValidationErrors({});
      setIsCustFormModalOpen(true);
    } catch (err: any) {
      toastRef.current('error', 'Error Loading Customer Price', err.message);
    }
  };

  const handleSelectCustomerForCustModal = (cust: any) => {
    setCustFormData(p => ({
      ...p,
      customerId: cust.id,
      customerSearchInput: `${cust.code || 'CUST'} - ${cust.tradeName || cust.legalName}`,
      isCustomerSearching: false
    }));
    setCustFormValidationErrors(p => ({ ...p, customer: '' }));
  };

  const handleSelectProductForCustModal = (prod: any) => {
    setCustFormData(p => ({
      ...p,
      productId: prod.id,
      productSearchInput: `${prod.code} - ${prod.name}`,
      isProductSearching: false,
      uom: prod.baseUom || 'Pcs',
      basePrice: prod.basePrice || 100,
      minAllowedPrice: prod.basePrice ? Math.round(prod.basePrice * 0.8) : 80,
      customerPriceValue: prod.basePrice || 100
    }));
    setCustFormValidationErrors(p => ({ ...p, product: '' }));
  };

  const handleSelectPriceListForCustModal = (priceListId: string) => {
    const selectedPl = priceLists.find(p => p.id === priceListId);
    setCustFormData(p => ({
      ...p,
      priceListId,
      currencyCode: selectedPl?.currency || 'INR'
    }));
    setCustFormValidationErrors(p => ({ ...p, priceList: '' }));
  };

  const handleSubmitCustForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!custFormData.customerId) errors.customer = 'Customer selection is required. Example: CUS-001 - Reliance Retail';
    if (!custFormData.priceListId) errors.priceList = 'Price List selection is required. Example: Standard Wholesale 2026';
    if (!custFormData.productId) errors.product = 'Product selection is required. Example: PRO-971 - ABC Soap';
    if (custFormData.customerPriceValue <= 0) errors.customerPriceValue = 'Customer price must be greater than 0. Example: ₹90.00';

    if (Object.keys(errors).length > 0) {
      setCustFormValidationErrors(errors);
      return;
    }

    setIsCustSubmitting(true);
    try {
      const payload = {
        companyId: custFormData.companyId || availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
        customerId: custFormData.customerId,
        priceListId: custFormData.priceListId,
        productId: custFormData.productId,
        customerPriceValue: custFormData.customerPriceValue,
        currencyCode: custFormData.currencyCode,
        effectiveFrom: new Date(custFormData.effectiveFrom).toISOString(),
        effectiveTo: custFormData.effectiveTo ? new Date(custFormData.effectiveTo).toISOString() : undefined,
        status: custFormData.status
      };

      if (editingCustPrice) {
        await pricingService.updateCustomerPrice(editingCustPrice.id, payload);
        toastRef.current('success', 'Customer Price Updated', 'Customer price contract updated successfully.');
      } else {
        await pricingService.createCustomerPrice(payload);
        toastRef.current('success', 'Customer Price Created', 'Customer-specific contract price established.');
      }
      setIsCustFormModalOpen(false);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Operation Failed', err.message);
    } finally {
      setIsCustSubmitting(false);
    }
  };

  const handleViewCustPrice = async (id: string) => {
    try {
      const data = await pricingService.getCustomerPriceById(id);
      setSelectedCustPrice(data);
      setIsCustViewDrawerOpen(true);
    } catch (err: any) {
      toastRef.current('error', 'Error Fetching Customer Price', err.message);
    }
  };

  const handleDuplicateCustPrice = async (rule: CustomerPricingRule) => {
    try {
      await pricingService.duplicateCustomerPrice(rule.id);
      toastRef.current('success', 'Contract Duplicated', `Duplicated rule as Draft.`);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Duplication Failed', err.message);
    }
  };

  const handleActivateCustPrice = async (rule: CustomerPricingRule) => {
    try {
      await pricingService.activateCustomerPrice(rule.id);
      toastRef.current('success', 'Rule Activated', `Customer price rule is now Active.`);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Activation Failed', err.message);
    }
  };

  const handleDeactivateCustPrice = async (rule: CustomerPricingRule) => {
    try {
      await pricingService.deactivateCustomerPrice(rule.id);
      toastRef.current('warning', 'Rule Deactivated', `Customer price rule is now Inactive.`);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Deactivation Failed', err.message);
    }
  };

  const handleArchiveCustPrice = async (rule: CustomerPricingRule) => {
    try {
      await pricingService.archiveCustomerPrice(rule.id);
      toastRef.current('warning', 'Rule Archived', `Customer price rule has been archived.`);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Archive Failed', err.message);
    }
  };

  const handleDeleteCustPrice = async (id: string) => {
    try {
      await pricingService.deleteCustomerPrice(id);
      toastRef.current('info', 'Rule Deleted', 'Customer pricing rule soft deleted.');
      setIsCustDeletingId(null);
      fetchCustomerPrices();
    } catch (err: any) {
      toastRef.current('error', 'Delete Failed', err.message);
    }
  };

  // DISCOUNT ENGINE HANDLERS (Sprint 4)
  const handleOpenCreateDiscountModal = () => {
    setEditingDiscountRule(null);
    setDscRuleName('');
    setDscRuleCode('');
    setDscDescription('');
    setDscMethod('Percentage');
    setDscValue(10);
    setDscScope('Global');
    setDscCustomerId('');
    setDscCustomerSearchInput('');
    setDscProductId('');
    setDscProductSearchInput('');
    setDscCategoryId('');
    setDscPriceListId('');
    setDscMinQty('');
    setDscMaxQty('');
    setDscMaxDiscountAmount('');
    setDscEffectiveFrom(new Date().toISOString().split('T')[0]);
    setDscEffectiveTo('');
    setDscPriority(10);
    setDscStatus('Draft');
    setDiscountFormError(null);
    setIsDiscountModalOpen(true);
  };

  const handleOpenEditDiscountModal = (rule: DiscountRule) => {
    setEditingDiscountRule(rule);
    setDscRuleName(rule.ruleName);
    setDscRuleCode(rule.ruleCode);
    setDscDescription(rule.description || '');
    setDscMethod(rule.discountMethod);
    setDscValue(rule.discountValue);
    setDscScope(rule.scope);
    setDscCustomerId(rule.customerId || '');
    setDscCustomerSearchInput(rule.customerCode ? `${rule.customerCode} - ${rule.customerName}` : '');
    setDscProductId(rule.productId || '');
    setDscProductSearchInput(rule.productCode ? `${rule.productCode} - ${rule.productName}` : '');
    setDscCategoryId(rule.categoryId || '');
    setDscPriceListId(rule.priceListId || '');
    setDscMinQty(rule.minimumQuantity ? String(rule.minimumQuantity) : '');
    setDscMaxQty(rule.maximumQuantity ? String(rule.maximumQuantity) : '');
    setDscMaxDiscountAmount(rule.maximumDiscountAmount ? String(rule.maximumDiscountAmount) : '');
    setDscEffectiveFrom(rule.effectiveFrom ? rule.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDscEffectiveTo(rule.effectiveTo ? rule.effectiveTo.split('T')[0] : '');
    setDscPriority(rule.priority || 10);
    setDscStatus(rule.status);
    setDiscountFormError(null);
    setIsDiscountModalOpen(true);
  };

  const handleSubmitDiscountForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountFormError(null);

    // Inline Validations with concrete examples
    if (!dscRuleName.trim()) {
      setDiscountFormError('Rule Name is required. Example: Monsoon Festive Bulk Discount');
      return;
    }
    if (dscMethod === 'Percentage' && (dscValue <= 0 || dscValue > 100)) {
      setDiscountFormError('Discount percentage must be between 0 and 100. Example: 10%');
      return;
    }
    if (dscMethod === 'FixedAmount' && dscValue <= 0) {
      setDiscountFormError('Fixed discount amount must be greater than 0. Example: 50');
      return;
    }
    if (dscEffectiveTo && dscEffectiveFrom > dscEffectiveTo) {
      setDiscountFormError('Effective From date must be earlier than or equal to Effective To date.');
      return;
    }
    if (dscMinQty && parseInt(dscMinQty, 10) <= 0) {
      setDiscountFormError('Minimum Quantity must be greater than 0.');
      return;
    }
    if (dscMaxQty && dscMinQty && parseInt(dscMaxQty, 10) < parseInt(dscMinQty, 10)) {
      setDiscountFormError('Maximum Quantity must be greater than or equal to Minimum Quantity.');
      return;
    }
    if ((dscScope === 'Product' || dscScope === 'CustomerProduct') && !dscProductId) {
      setDiscountFormError('Product selection is required. Example: PRO-971 - ABC Soap');
      return;
    }
    if ((dscScope === 'Customer' || dscScope === 'CustomerProduct') && !dscCustomerId) {
      setDiscountFormError('Customer selection is required. Example: CUS-001 - Reliance Retail');
      return;
    }
    if (dscScope === 'Category' && !dscCategoryId) {
      setDiscountFormError('Product Category selection is required. Example: CAT-015 - Personal Care');
      return;
    }
    if (dscScope === 'PriceList' && !dscPriceListId) {
      setDiscountFormError('Price List selection is required. Example: Standard Wholesale 2026');
      return;
    }

    setIsDiscountSubmitting(true);
    try {
      const payload: CreateDiscountRulePayload = {
        companyId: availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
        ruleCode: dscRuleCode.trim() || undefined,
        ruleName: dscRuleName.trim(),
        description: dscDescription.trim() || undefined,
        discountMethod: dscMethod,
        discountValue: dscValue,
        scope: dscScope,
        customerId: (dscScope === 'Customer' || dscScope === 'CustomerProduct') ? dscCustomerId : undefined,
        productId: (dscScope === 'Product' || dscScope === 'CustomerProduct') ? dscProductId : undefined,
        categoryId: dscScope === 'Category' ? dscCategoryId : undefined,
        priceListId: dscScope === 'PriceList' ? dscPriceListId : undefined,
        minimumQuantity: dscMinQty ? parseInt(dscMinQty, 10) : undefined,
        maximumQuantity: dscMaxQty ? parseInt(dscMaxQty, 10) : undefined,
        maximumDiscountAmount: dscMaxDiscountAmount ? parseFloat(dscMaxDiscountAmount) : undefined,
        effectiveFrom: new Date(dscEffectiveFrom).toISOString(),
        effectiveTo: dscEffectiveTo ? new Date(dscEffectiveTo).toISOString() : undefined,
        priority: dscPriority,
        status: dscStatus
      };

      if (editingDiscountRule) {
        await pricingService.updateDiscountRule(editingDiscountRule.id, payload as UpdateDiscountRulePayload);
        toastRef.current('success', 'Discount Rule Updated', `Rule "${dscRuleName}" updated successfully.`);
      } else {
        await pricingService.createDiscountRule(payload);
        toastRef.current('success', 'Discount Rule Created', `New rule "${dscRuleName}" created successfully.`);
      }

      setIsDiscountModalOpen(false);
      fetchDiscountRules();
    } catch (err: any) {
      setDiscountFormError(err.message || 'Failed to save discount rule');
      toastRef.current('error', 'Save Failed', err.message);
    } finally {
      setIsDiscountSubmitting(false);
    }
  };

  const handleDuplicateDiscountRule = async (rule: DiscountRule) => {
    try {
      await pricingService.duplicateDiscountRule(rule.id);
      toastRef.current('success', 'Discount Rule Duplicated', `Duplicated "${rule.ruleName}" in Draft status.`);
      fetchDiscountRules();
    } catch (err: any) {
      toastRef.current('error', 'Duplication Failed', err.message);
    }
  };

  const handleActivateDiscountRule = async (rule: DiscountRule) => {
    try {
      await pricingService.activateDiscountRule(rule.id);
      toastRef.current('success', 'Rule Activated', `Discount rule "${rule.ruleName}" is now Active.`);
      fetchDiscountRules();
    } catch (err: any) {
      toastRef.current('error', 'Activation Failed', err.message);
    }
  };

  const handleDeactivateDiscountRule = async (rule: DiscountRule) => {
    try {
      await pricingService.deactivateDiscountRule(rule.id);
      toastRef.current('warning', 'Rule Deactivated', `Discount rule "${rule.ruleName}" is now Inactive.`);
      fetchDiscountRules();
    } catch (err: any) {
      toastRef.current('error', 'Deactivation Failed', err.message);
    }
  };

  const handleArchiveDiscountRule = async (rule: DiscountRule) => {
    try {
      await pricingService.archiveDiscountRule(rule.id);
      toastRef.current('warning', 'Rule Archived', `Discount rule "${rule.ruleName}" has been archived.`);
      fetchDiscountRules();
    } catch (err: any) {
      toastRef.current('error', 'Archive Failed', err.message);
    }
  };

  const handleDeleteDiscountRule = async (id: string) => {
    try {
      await pricingService.deleteDiscountRule(id);
      toastRef.current('info', 'Rule Deleted', 'Discount rule soft deleted.');
      setIsDiscountDeletingId(null);
      fetchDiscountRules();
    } catch (err: any) {
      toastRef.current('error', 'Delete Failed', err.message);
    }
  };

  // ── Multi-Currency Handlers (Sprint 5) ──────────────────────────────────
  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!editingCurrency) {
      if (!currencyFormData.code.trim()) {
        errors.code = 'Currency Code is required. Example: USD';
      } else if (!/^[A-Z]{3}$/.test(currencyFormData.code.trim().toUpperCase())) {
        errors.code = 'Currency Code must be exactly 3 uppercase letters (e.g. USD, EUR, INR)';
      }
    }

    if (!currencyFormData.name.trim()) {
      errors.name = 'Currency Name is required. Example: US Dollar';
    }

    if (!currencyFormData.symbol.trim()) {
      errors.symbol = 'Currency Symbol is required. Example: $';
    }

    if (currencyFormData.decimalPlaces < 0 || currencyFormData.decimalPlaces > 6) {
      errors.decimalPlaces = 'Decimal places must be between 0 and 6';
    }

    if (Object.keys(errors).length > 0) {
      setCurrencyFormErrors(errors);
      return;
    }

    setIsCurrencySubmitting(true);
    try {
      if (editingCurrency) {
        await pricingService.updateCurrencyRecord(editingCurrency.id, {
          id: editingCurrency.id,
          name: currencyFormData.name.trim(),
          symbol: currencyFormData.symbol.trim(),
          decimalPlaces: currencyFormData.decimalPlaces,
        });
        toastRef.current('success', 'Currency Updated', `${editingCurrency.code} updated successfully.`);
      } else {
        await pricingService.createCurrencyRecord({
          code: currencyFormData.code.trim().toUpperCase(),
          name: currencyFormData.name.trim(),
          symbol: currencyFormData.symbol.trim(),
          decimalPlaces: currencyFormData.decimalPlaces,
          isBaseCurrency: currencyFormData.isBaseCurrency,
        });
        toastRef.current('success', 'Currency Created', `${currencyFormData.code.trim().toUpperCase()} created successfully.`);
      }

      setIsCurrencyModalOpen(false);
      fetchCurrencies();
    } catch (err: any) {
      toastRef.current('error', 'Save Failed', err.message || 'Failed to save currency');
    } finally {
      setIsCurrencySubmitting(false);
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!rateFormData.fromCurrencyCode.trim()) {
      errors.fromCurrencyCode = 'From Currency is required';
    }

    if (!rateFormData.toCurrencyCode.trim()) {
      errors.toCurrencyCode = 'To Currency is required';
    } else if (rateFormData.fromCurrencyCode.trim().toUpperCase() === rateFormData.toCurrencyCode.trim().toUpperCase()) {
      errors.toCurrencyCode = 'From and To currencies must be different';
    }

    if (!rateFormData.rate || rateFormData.rate <= 0) {
      errors.rate = 'Exchange rate must be a positive number greater than 0 (e.g. 86.50)';
    }

    if (!rateFormData.effectiveFrom) {
      errors.effectiveFrom = 'Effective From date is required';
    }

    if (rateFormData.effectiveTo && rateFormData.effectiveFrom > rateFormData.effectiveTo) {
      errors.effectiveTo = 'Effective To date must be on or after Effective From date';
    }

    if (Object.keys(errors).length > 0) {
      setRateFormErrors(errors);
      return;
    }

    setIsRateSubmitting(true);
    try {
      if (editingRate) {
        await pricingService.updateExchangeRate(editingRate.id, {
          id: editingRate.id,
          rate: rateFormData.rate,
          effectiveFrom: new Date(rateFormData.effectiveFrom).toISOString(),
          effectiveTo: rateFormData.effectiveTo ? new Date(rateFormData.effectiveTo).toISOString() : undefined,
        });
        toastRef.current('success', 'Exchange Rate Updated', `Exchange rate updated successfully.`);
      } else {
        await pricingService.createExchangeRate({
          fromCurrencyCode: rateFormData.fromCurrencyCode.trim().toUpperCase(),
          toCurrencyCode: rateFormData.toCurrencyCode.trim().toUpperCase(),
          rate: rateFormData.rate,
          effectiveFrom: new Date(rateFormData.effectiveFrom).toISOString(),
          effectiveTo: rateFormData.effectiveTo ? new Date(rateFormData.effectiveTo).toISOString() : undefined,
          source: rateFormData.source,
        });
        toastRef.current('success', 'Exchange Rate Created', `Exchange rate for ${rateFormData.fromCurrencyCode} → ${rateFormData.toCurrencyCode} created successfully.`);
      }

      setIsRateModalOpen(false);
      fetchExchangeRates();
      fetchCurrencies();
    } catch (err: any) {
      toastRef.current('error', 'Save Failed', err.message || 'Failed to save exchange rate');
    } finally {
      setIsRateSubmitting(false);
    }
  };

  const handleViewDiscountRule = async (rule: DiscountRule) => {
    setSelectedDiscountRule(rule);
    setIsDiscountDrawerOpen(true);
    try {
      const hist = await pricingService.getDiscountRuleHistory(rule.id);
      setDiscountHistory(hist);
    } catch {
      setDiscountHistory([]);
    }
  };

  // Run Diagnostic Calculator (Admin Tool)
  const handleRunDiagnosticCalculator = async () => {
    setCalcLoading(true);
    setCalcError(null);
    try {
      const req: DiscountCalculationRequest = {
        companyId: availableCompanies[0]?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80',
        customerId: calcCustomerId || undefined,
        productId: calcProductId || undefined,
        categoryId: calcCategoryId || undefined,
        priceListId: calcPriceListId || undefined,
        quantity: calcQuantity > 0 ? calcQuantity : 1,
        resolvedUnitPrice: calcResolvedPrice >= 0 ? calcResolvedPrice : 100,
        effectiveDate: calcEffectiveDate ? new Date(calcEffectiveDate).toISOString() : undefined
      };
      const result = await pricingService.calculateDiscount(req);
      setCalcResult(result);
    } catch (err: any) {
      setCalcError(err.message || 'Diagnostic calculation failed.');
    } finally {
      setCalcLoading(false);
    }
  };

  // Utility Badges
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Published': return 'success';
      case 'Draft': return 'neutral';
      case 'Inactive': return 'warning';
      case 'Archived':
      case 'Expired': return 'neutral';
      default: return 'neutral';
    }
  };

  const getTypeBadgeVariant = (type?: string) => {
    switch (type) {
      case 'Wholesale': return 'info';
      case 'Customer Specific': return 'primary';
      case 'Promotional': return 'warning';
      case 'Internal Transfer': return 'neutral';
      default: return 'neutral';
    }
  };

  const getScopeBadge = (scope: DiscountScope) => {
    switch (scope) {
      case 'CustomerProduct': return <Badge variant="primary">Customer + Product</Badge>;
      case 'Customer': return <Badge variant="info">Customer</Badge>;
      case 'Product': return <Badge variant="success">Product</Badge>;
      case 'Category': return <Badge variant="warning">Category</Badge>;
      case 'PriceList': return <Badge variant="neutral">Price List</Badge>;
      case 'Global': return <Badge variant="neutral">Global</Badge>;
      default: return <Badge variant="neutral">{scope}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER TITLE & ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-text-primary tracking-tight">Pricing & Promotions Engine</h1>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Enterprise pricing architecture, customer contracts, discount precedence rules, and promotion management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'lists' && (
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-blue-700 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} /> Create Price List
            </button>
          )}
          {activeTab === 'customer' && (
            <button
              onClick={handleOpenCreateCustPriceModal}
              className="px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-blue-700 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} /> Create Customer Price
            </button>
          )}
          {activeTab === 'discounts' && (
            <>
              <button
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md cursor-pointer transition flex items-center gap-1.5 border ${isCalculatorOpen ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-brand-text-primary border-brand-border hover:bg-brand-bg-secondary'}`}
              >
                <Calculator size={15} /> Diagnostic Calculator
              </button>
              <button
                onClick={handleOpenCreateDiscountModal}
                className="px-3.5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-blue-700 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={15} /> Create Discount Rule
              </button>
            </>
          )}
        </div>
      </div>

      {/* MODULE TABS NAVIGATION */}
      <div className="border-b border-brand-border flex gap-6 text-xs font-semibold text-brand-text-secondary overflow-x-auto">
        <button
          onClick={() => setActiveTab('lists')}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer border-b-2 transition ${activeTab === 'lists' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent hover:text-brand-text-primary'}`}
        >
          <Tag size={15} /> Price Lists
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer border-b-2 transition ${activeTab === 'customer' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent hover:text-brand-text-primary'}`}
        >
          <DollarSign size={15} /> Customer Pricing
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer border-b-2 transition ${activeTab === 'discounts' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent hover:text-brand-text-primary'}`}
        >
          <Percent size={15} /> Discount Engine
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`pb-3 flex items-center gap-1.5 cursor-pointer border-b-2 transition ${activeTab === 'currencies' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent hover:text-brand-text-primary'}`}
        >
          <Globe size={15} /> Multi-Currency
        </button>
      </div>

      {/* TAB 1: PRICE LISTS TARIFF MODULE */}
      {activeTab === 'lists' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          
          {/* SEARCH & FILTERS HEADER */}
          <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search tariff code, name..." />
              
              {/* FILTER: STATUS */}
              <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                <Filter size={13} className="text-brand-text-secondary" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }}
                  className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* FILTER: TARIFF TYPE */}
              <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPageNumber(1); }}
                  className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                >
                  <option value="All">All Tariff Types</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Customer Specific">Customer Specific</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Internal Transfer">Internal Transfer</option>
                </select>
              </div>

              {/* FILTER: CURRENCY */}
              <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                <select
                  value={currencyFilter}
                  onChange={(e) => { setCurrencyFilter(e.target.value); setPageNumber(1); }}
                  className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                >
                  <option value="All">All Currencies</option>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <button
                onClick={fetchPriceLists}
                className="p-1.5 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-secondary cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="p-12 text-center text-brand-text-secondary flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-brand-primary" />
              <span className="text-xs font-semibold">Fetching price lists from API...</span>
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="p-6 text-center text-red-600 bg-red-50 space-y-2 border-b">
              <AlertCircle size={24} className="mx-auto" />
              <p className="text-xs font-bold">{error}</p>
              <button onClick={fetchPriceLists} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-semibold cursor-pointer">Retry</button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && priceLists.length === 0 && (
            <EmptyState icon={Tag} title="No Price Lists Found" description="No price lists match your search parameters. Click Create Price List to configure a new price list." />
          )}

          {/* DATA TABLE */}
          {!loading && !error && priceLists.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Price List Name & Code</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Currency</th>
                    <th className="p-3">Effective Period</th>
                    <th className="p-3 text-center">Total Products</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {priceLists.map(list => (
                    <tr key={list.id} className="hover:bg-brand-bg-secondary/30 transition text-brand-text-primary">
                      <td className="p-3">
                        <div className="font-bold text-brand-primary text-xs">{list.name}</div>
                        <div className="font-mono text-[10px] text-brand-text-secondary">{list.code || 'PL-AUTO'}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={getTypeBadgeVariant(list.type) as any}>{list.type || 'Retail'}</Badge>
                      </td>
                      <td className="p-3 font-mono font-semibold">{list.currency || 'INR'}</td>
                      <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                        {list.effectiveFrom ? formatDate(list.effectiveFrom) : (list.effectiveDate || '—')}
                        <span className="mx-1 text-gray-400">→</span>
                        {list.effectiveTo ? formatDate(list.effectiveTo) : (list.expiryDate || 'Open')}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-xs">
                        {list.itemsCount ?? (list.items ? list.items.length : 0)} Products
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={getStatusBadgeVariant(list.status)}>{list.status}</Badge>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Tooltip content="View Price List Details">
                          <button onClick={() => handleViewPriceList(list.id)} aria-label="View Price List Details" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Eye size={13} /></button>
                        </Tooltip>
                        <Tooltip content="Edit Price List">
                          <button onClick={() => handleOpenEditModal(list.id)} aria-label="Edit Price List" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Edit2 size={13} /></button>
                        </Tooltip>
                        <Tooltip content="Duplicate / Copy Price List">
                          <button onClick={() => handleDuplicatePriceList(list)} aria-label="Duplicate / Copy Price List" className="p-1 border border-brand-border rounded hover:bg-purple-50 text-purple-600 cursor-pointer"><Copy size={13} /></button>
                        </Tooltip>
                        {list.status === 'Draft' && (
                          <Tooltip content="Publish Price List">
                            <button onClick={() => handlePublish(list)} aria-label="Publish Price List" className="p-1 border border-brand-border rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"><Send size={13} /></button>
                          </Tooltip>
                        )}
                        {list.status !== 'Archived' && (
                          <Tooltip content="Archive Price List">
                            <button onClick={() => handleArchive(list)} aria-label="Archive Price List" className="p-1 border border-brand-border rounded hover:bg-amber-50 text-amber-600 cursor-pointer"><Archive size={13} /></button>
                          </Tooltip>
                        )}
                        <Tooltip content="Delete Price List">
                          <button onClick={() => setIsDeletingId(list.id)} aria-label="Delete Price List" className="p-1 border border-brand-border rounded hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 size={13} /></button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && !error && priceLists.length > 0 && (
            <div className="p-3 border-t border-brand-border bg-brand-bg-secondary/10 flex items-center justify-between text-xs">
              <span className="text-brand-text-secondary">Showing <strong>{priceLists.length}</strong> of <strong>{totalCount}</strong> price lists</span>
              <div className="flex items-center gap-2">
                <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => Math.max(1, p - 1))} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
                <span className="font-mono text-brand-text-secondary">Page {pageNumber} of {totalPages}</span>
                <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => p + 1)} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER PRICING MODULE */}
      {activeTab === 'customer' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          
          {/* SEARCH & FILTERS HEADER */}
          <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={custSearchQuery} onChange={setCustSearchQuery} placeholder="Search customer, product..." />
              
              <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                <Tag size={13} className="text-brand-text-secondary" />
                <select
                  value={custPriceListFilter}
                  onChange={(e) => { setCustPriceListFilter(e.target.value); setCustPageNumber(1); }}
                  className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                >
                  <option value="All">All Price Lists</option>
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.name} ({pl.status})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                <Filter size={13} className="text-brand-text-secondary" />
                <select
                  value={custStatusFilter}
                  onChange={(e) => { setCustStatusFilter(e.target.value); setCustPageNumber(1); }}
                  className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <button
                onClick={fetchCustomerPrices}
                className="p-1.5 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-secondary cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={customerLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <button
              onClick={handleOpenCreateCustPriceModal}
              className="px-3 py-1.5 bg-brand-primary hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer transition shadow-sm"
            >
              <Plus size={14} /> Create Customer Price
            </button>
          </div>

          {/* LOADING STATE */}
          {customerLoading && (
            <div className="p-12 text-center text-brand-text-secondary flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-brand-primary" />
              <span className="text-xs font-semibold">Fetching customer prices from API...</span>
            </div>
          )}

          {/* ERROR STATE */}
          {!customerLoading && customerError && (
            <div className="p-6 text-center text-red-600 bg-red-50 space-y-2 border-b">
              <AlertCircle size={24} className="mx-auto" />
              <p className="text-xs font-bold">{customerError}</p>
              <button onClick={fetchCustomerPrices} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-semibold cursor-pointer">Retry</button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!customerLoading && !customerError && customerPrices.length === 0 && (
            <EmptyState
              icon={DollarSign}
              title="No Customer Prices Configured"
              description="No customer-specific pricing rules match your filters. Click Create Customer Price to configure a contract price."
            />
          )}

          {/* DATA TABLE */}
          {!customerLoading && !customerError && customerPrices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-brand-bg-secondary border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Price List</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Base Price</th>
                    <th className="p-3 text-right">Customer Price</th>
                    <th className="p-3 text-right">Min Allowed</th>
                    <th className="p-3 text-center">Currency</th>
                    <th className="p-3">Effective Period</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {customerPrices.map(rule => (
                    <tr key={rule.id} className="hover:bg-brand-bg-secondary/30 transition text-brand-text-primary">
                      <td className="p-3">
                        <div className="font-bold text-brand-primary text-xs">{rule.customerName || rule.customerId}</div>
                        <div className="font-mono text-[10px] text-brand-text-secondary">{rule.customerCode || 'CUST'}</div>
                      </td>
                      <td className="p-3 font-semibold text-brand-text-primary">
                        {rule.priceListName || 'Published List'}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-brand-text-primary">{rule.productName || rule.productId}</div>
                        <div className="font-mono text-[10px] text-brand-text-secondary">{rule.productCode || 'PRD'}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-gray-500">{formatINR(rule.basePrice || 0)}</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-primary">{formatINR(rule.customerPriceValue ?? rule.specialPrice ?? 0)}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700">{formatINR(rule.minAllowedPrice || 0)}</td>
                      <td className="p-3 text-center font-mono font-semibold">{rule.currencyCode || 'INR'}</td>
                      <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                        {rule.effectiveFrom ? formatDate(rule.effectiveFrom) : '—'}
                        <span className="mx-1 text-gray-400">→</span>
                        {rule.effectiveTo ? formatDate(rule.effectiveTo) : 'Open'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={getStatusBadgeVariant(rule.status) as any}>{rule.status}</Badge>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Tooltip content="View Details">
                          <button onClick={() => handleViewCustPrice(rule.id)} aria-label="View Details" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Eye size={13} /></button>
                        </Tooltip>
                        <Tooltip content="Edit Customer Price">
                          <button onClick={() => handleOpenEditCustPriceModal(rule.id)} aria-label="Edit Customer Price" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Edit2 size={13} /></button>
                        </Tooltip>
                        <Tooltip content="Duplicate Customer Price">
                          <button onClick={() => handleDuplicateCustPrice(rule)} aria-label="Duplicate Customer Price" className="p-1 border border-brand-border rounded hover:bg-purple-50 text-purple-600 cursor-pointer"><Copy size={13} /></button>
                        </Tooltip>
                        {rule.status === 'Inactive' || rule.status === 'Draft' ? (
                          <Tooltip content="Activate Rule">
                            <button onClick={() => handleActivateCustPrice(rule)} aria-label="Activate Rule" className="p-1 border border-brand-border rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"><Power size={13} /></button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Deactivate Rule">
                            <button onClick={() => handleDeactivateCustPrice(rule)} aria-label="Deactivate Rule" className="p-1 border border-brand-border rounded hover:bg-amber-50 text-amber-600 cursor-pointer"><PowerOff size={13} /></button>
                          </Tooltip>
                        )}
                        {rule.status !== 'Archived' && (
                          <Tooltip content="Archive Rule">
                            <button onClick={() => handleArchiveCustPrice(rule)} aria-label="Archive Rule" className="p-1 border border-brand-border rounded hover:bg-amber-50 text-amber-700 cursor-pointer"><Archive size={13} /></button>
                          </Tooltip>
                        )}
                        <Tooltip content="Delete Rule">
                          <button onClick={() => setIsCustDeletingId(rule.id)} aria-label="Delete Rule" className="p-1 border border-brand-border rounded hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 size={13} /></button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!customerLoading && !customerError && customerPrices.length > 0 && (
            <div className="p-3 border-t border-brand-border bg-brand-bg-secondary/10 flex items-center justify-between text-xs">
              <span className="text-brand-text-secondary">Showing <strong>{customerPrices.length}</strong> of <strong>{customerTotalCount}</strong> customer prices</span>
              <div className="flex items-center gap-2">
                <button disabled={custPageNumber <= 1} onClick={() => setCustPageNumber(p => Math.max(1, p - 1))} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
                <span className="font-mono text-brand-text-secondary">Page {custPageNumber} of {customerTotalPages}</span>
                <button disabled={custPageNumber >= customerTotalPages} onClick={() => setCustPageNumber(p => p + 1)} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISCOUNT ENGINE MODULE (Sprint 4) */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">

          {/* DIAGNOSTIC CALCULATOR PANEL */}
          {isCalculatorOpen && (
            <div className="p-5 bg-slate-900 text-white rounded-lg border border-slate-700 shadow-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Diagnostic Discount Calculator</h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold border border-amber-500/30">
                    Admin Simulation Tool
                  </span>
                </div>
                <button onClick={() => setIsCalculatorOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                
                {/* CUSTOMER SELECTOR */}
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Customer (Optional)</label>
                  <input
                    type="text"
                    value={calcCustomerSearch}
                    onChange={(e) => { setCalcCustomerSearch(e.target.value); setIsCalcCustSearching(true); }}
                    onFocus={() => setIsCalcCustSearching(true)}
                    placeholder="Search Customer..."
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs outline-none focus:border-amber-400"
                  />
                  {isCalcCustSearching && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl max-h-36 overflow-y-auto text-xs">
                      <div onClick={() => { setCalcCustomerId(''); setCalcCustomerSearch('None (All Customers)'); setIsCalcCustSearching(false); }} className="p-2 hover:bg-slate-700 cursor-pointer text-slate-400 italic">None (All Customers)</div>
                      {availableCustomers.map(c => (
                        <div key={c.id} onClick={() => { setCalcCustomerId(c.id); setCalcCustomerSearch(`${c.code || 'CUST'} - ${c.tradeName || c.legalName}`); setIsCalcCustSearching(false); }} className="p-2 hover:bg-amber-500/20 cursor-pointer text-white border-b border-slate-700/50">
                          {c.code} - {c.tradeName || c.legalName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PRODUCT SELECTOR */}
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Product (Optional)</label>
                  <input
                    type="text"
                    value={calcProductSearch}
                    onChange={(e) => { setCalcProductSearch(e.target.value); setIsCalcProdSearching(true); }}
                    onFocus={() => setIsCalcProdSearching(true)}
                    placeholder="Search Product..."
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs outline-none focus:border-amber-400"
                  />
                  {isCalcProdSearching && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl max-h-36 overflow-y-auto text-xs">
                      <div onClick={() => { setCalcProductId(''); setCalcProductSearch('None (All Products)'); setIsCalcProdSearching(false); }} className="p-2 hover:bg-slate-700 cursor-pointer text-slate-400 italic">None (All Products)</div>
                      {availableProducts.map(p => (
                        <div key={p.id} onClick={() => { setCalcProductId(p.id); setCalcProductSearch(`${p.code} - ${p.name}`); setIsCalcProdSearching(false); }} className="p-2 hover:bg-amber-500/20 cursor-pointer text-white border-b border-slate-700/50">
                          {p.code} - {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CATEGORY SELECTOR */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Category (Optional)</label>
                  <select
                    value={calcCategoryId}
                    onChange={(e) => setCalcCategoryId(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">None (All Categories)</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.code} - {cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* PRICE LIST SELECTOR */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Price List (Optional)</label>
                  <select
                    value={calcPriceListId}
                    onChange={(e) => setCalcPriceListId(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="">None (All Price Lists)</option>
                    {priceLists.map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))}
                  </select>
                </div>

                {/* QUANTITY */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono font-bold outline-none"
                  />
                </div>

                {/* RESOLVED PRICE */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resolved Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calcResolvedPrice}
                    onChange={(e) => setCalcResolvedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-amber-300 text-xs font-mono font-bold outline-none"
                  />
                </div>

                {/* EFFECTIVE DATE */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={calcEffectiveDate}
                    onChange={(e) => setCalcEffectiveDate(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white text-xs outline-none"
                  />
                </div>

                {/* RUN BUTTON */}
                <div className="flex items-end">
                  <button
                    onClick={handleRunDiagnosticCalculator}
                    disabled={calcLoading}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {calcLoading ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                    Simulate Discount
                  </button>
                </div>
              </div>

              {/* CALCULATION RESULT READOUT */}
              {calcError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{calcError}</span>
                </div>
              )}

              {calcResult && !calcLoading && (
                <div className="p-4 bg-slate-850 border border-amber-500/30 rounded-lg space-y-3 animate-fade-in text-xs">
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-700 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Winning Discount Rule</span>
                      <span className="font-bold text-amber-300 text-sm">
                        {calcResult.appliedRuleCode ? `${calcResult.appliedRuleCode} — ${calcResult.appliedRuleName}` : 'No Applicable Discount Rule (Resolved Price Kept)'}
                      </span>
                    </div>
                    {calcResult.appliedRuleScope && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Matching Scope</span>
                        <span className="font-mono font-bold text-purple-300">{calcResult.appliedRuleScope} (Priority {calcResult.appliedRulePriority})</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                    <div className="p-2 bg-slate-800 rounded border border-slate-700">
                      <span className="block text-[9px] text-slate-400 uppercase font-sans font-bold">Resolved Unit Price</span>
                      <span className="text-sm font-bold text-slate-200">{formatINR(calcResult.originalUnitPrice)}</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded border border-slate-700">
                      <span className="block text-[9px] text-amber-400 uppercase font-sans font-bold">Unit Discount Amount</span>
                      <span className="text-sm font-bold text-amber-400">- {formatINR(calcResult.discountAmount)} ({calcResult.discountPercentage}%)</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded border border-slate-700">
                      <span className="block text-[9px] text-emerald-400 uppercase font-sans font-bold">Final Unit Price</span>
                      <span className="text-sm font-bold text-emerald-400">{formatINR(calcResult.finalUnitPrice)}</span>
                    </div>
                    <div className="p-2 bg-emerald-950/80 rounded border border-emerald-500/50">
                      <span className="block text-[9px] text-emerald-300 uppercase font-sans font-bold">Final Total ({calcQuantity} Qty)</span>
                      <span className="text-base font-bold text-emerald-300">{formatINR(calcResult.finalTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAIN RULES TABLE CONTAINER */}
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            
            {/* SEARCH & FILTERS BAR */}
            <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={discountSearchQuery} onChange={setDiscountSearchQuery} placeholder="Search rule code, name, description..." />
                
                {/* SCOPE FILTER */}
                <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                  <Layers size={13} className="text-brand-text-secondary" />
                  <select
                    value={discountScopeFilter}
                    onChange={(e) => { setDiscountScopeFilter(e.target.value); setDiscountPageNumber(1); }}
                    className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                  >
                    <option value="All">All Scopes</option>
                    <option value="CustomerProduct">Customer + Product</option>
                    <option value="Customer">Customer</option>
                    <option value="Product">Product</option>
                    <option value="Category">Product Category</option>
                    <option value="PriceList">Price List</option>
                    <option value="Global">Global</option>
                  </select>
                </div>

                {/* METHOD FILTER */}
                <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                  <Percent size={13} className="text-brand-text-secondary" />
                  <select
                    value={discountMethodFilter}
                    onChange={(e) => { setDiscountMethodFilter(e.target.value); setDiscountPageNumber(1); }}
                    className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                  >
                    <option value="All">All Methods</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FixedAmount">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* STATUS FILTER */}
                <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                  <Filter size={13} className="text-brand-text-secondary" />
                  <select
                    value={discountStatusFilter}
                    onChange={(e) => { setDiscountStatusFilter(e.target.value); setDiscountPageNumber(1); }}
                    className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Archived">Archived</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                {/* REFRESH BUTTON */}
                <button
                  onClick={fetchDiscountRules}
                  className="p-1.5 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-secondary cursor-pointer"
                  title="Refresh Table"
                >
                  <RefreshCw size={14} className={discountLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* LOADING STATE */}
            {discountLoading && (
              <div className="p-12 text-center text-brand-text-secondary flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-brand-primary" />
                <span className="text-xs font-semibold">Fetching discount rules from API...</span>
              </div>
            )}

            {/* ERROR STATE */}
            {!discountLoading && discountError && (
              <div className="p-6 text-center text-red-600 bg-red-50 space-y-2 border-b">
                <AlertCircle size={24} className="mx-auto" />
                <p className="text-xs font-bold">{discountError}</p>
                <button onClick={fetchDiscountRules} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-semibold cursor-pointer">Retry</button>
              </div>
            )}

            {/* EMPTY STATE */}
            {!discountLoading && !discountError && discountRules.length === 0 && (
              <EmptyState
                icon={Percent}
                title="No Discount Rules Configured"
                description="No discount rules match your filter parameters. Click Create Discount Rule to set up a new rule."
              />
            )}

            {/* DATA TABLE */}
            {!discountLoading && !discountError && discountRules.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-brand-bg-secondary border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Rule Code & Name</th>
                      <th className="p-3">Scope</th>
                      <th className="p-3">Discount Method & Value</th>
                      <th className="p-3">Applies To</th>
                      <th className="p-3">Effective Period</th>
                      <th className="p-3 text-center">Priority</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {discountRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-brand-bg-secondary/30 transition text-brand-text-primary">
                        <td className="p-3">
                          <div className="font-bold text-brand-primary text-xs">{rule.ruleName}</div>
                          <div className="font-mono text-[10px] text-brand-text-secondary">{rule.ruleCode}</div>
                        </td>
                        <td className="p-3">
                          {getScopeBadge(rule.scope)}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {rule.discountMethod === 'Percentage' ? `${rule.discountValue}% Off` : `${formatINR(rule.discountValue)} Off`}
                        </td>
                        <td className="p-3 text-brand-text-primary font-semibold text-[11px]">
                          {rule.scope === 'CustomerProduct' && `${rule.customerName || rule.customerCode || 'Customer'} + ${rule.productName || rule.productCode || 'Product'}`}
                          {rule.scope === 'Customer' && (rule.customerName || rule.customerCode || 'Customer Specific')}
                          {rule.scope === 'Product' && (rule.productName || rule.productCode || 'Product Specific')}
                          {rule.scope === 'Category' && (rule.categoryName || 'Product Category')}
                          {rule.scope === 'PriceList' && (rule.priceListName || 'Price List Specific')}
                          {rule.scope === 'Global' && 'Global (All Items)'}
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                          {rule.effectiveFrom ? formatDate(rule.effectiveFrom) : '—'}
                          <span className="mx-1 text-gray-400">→</span>
                          {rule.effectiveTo ? formatDate(rule.effectiveTo) : 'Open'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-purple-700">
                          Priority {rule.priority}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={getStatusBadgeVariant(rule.status) as any}>{rule.status}</Badge>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Tooltip content="View Rule Details">
                            <button onClick={() => handleViewDiscountRule(rule)} aria-label="View Rule Details" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Eye size={13} /></button>
                          </Tooltip>
                          <Tooltip content="Edit Rule">
                            <button onClick={() => handleOpenEditDiscountModal(rule)} aria-label="Edit Rule" className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-primary cursor-pointer"><Edit2 size={13} /></button>
                          </Tooltip>
                          <Tooltip content="Duplicate Rule (Draft)">
                            <button onClick={() => handleDuplicateDiscountRule(rule)} aria-label="Duplicate Rule (Draft)" className="p-1 border border-brand-border rounded hover:bg-purple-50 text-purple-600 cursor-pointer"><Copy size={13} /></button>
                          </Tooltip>
                          
                          {rule.status === 'Inactive' || rule.status === 'Draft' ? (
                            <Tooltip content="Activate Rule">
                              <button onClick={() => handleActivateDiscountRule(rule)} aria-label="Activate Rule" className="p-1 border border-brand-border rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"><Power size={13} /></button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Deactivate Rule">
                              <button onClick={() => handleDeactivateDiscountRule(rule)} aria-label="Deactivate Rule" className="p-1 border border-brand-border rounded hover:bg-amber-50 text-amber-600 cursor-pointer"><PowerOff size={13} /></button>
                            </Tooltip>
                          )}

                          {rule.status !== 'Archived' && (
                            <Tooltip content="Archive Rule">
                              <button onClick={() => handleArchiveDiscountRule(rule)} aria-label="Archive Rule" className="p-1 border border-brand-border rounded hover:bg-amber-50 text-amber-700 cursor-pointer"><Archive size={13} /></button>
                            </Tooltip>
                          )}

                          <Tooltip content="Delete Rule">
                            <button onClick={() => setIsDiscountDeletingId(rule.id)} aria-label="Delete Rule" className="p-1 border border-brand-border rounded hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 size={13} /></button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            {!discountLoading && !discountError && discountRules.length > 0 && (
              <div className="p-3 border-t border-brand-border bg-brand-bg-secondary/10 flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Showing <strong>{discountRules.length}</strong> of <strong>{discountTotalCount}</strong> discount rules</span>
                <div className="flex items-center gap-2">
                  <button disabled={discountPageNumber <= 1} onClick={() => setDiscountPageNumber(p => Math.max(1, p - 1))} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
                  <span className="font-mono text-brand-text-secondary">Page {discountPageNumber} of {discountTotalPages}</span>
                  <button disabled={discountPageNumber >= discountTotalPages} onClick={() => setDiscountPageNumber(p => p + 1)} className="p-1 border border-brand-border rounded hover:bg-brand-bg-secondary disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* TAB 6: MULTI-CURRENCY & EXCHANGE RATES */}
      {activeTab === 'currencies' && (
        <div className="space-y-5">

          {/* MODULE HEADER */}
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10">
                <Globe size={20} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-brand-text-primary">Multi-Currency & Exchange Rates</h2>
                <p className="text-[11px] text-brand-text-secondary">Manage supported currencies and manual exchange rate tables for FMCG billing.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingCurrency(null);
                  setCurrencyFormData({ code: '', name: '', symbol: '', decimalPlaces: 2, isBaseCurrency: false });
                  setCurrencyFormErrors({});
                  setIsCurrencyModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <Plus size={13} /> Add Currency
              </button>
              <button
                onClick={() => {
                  setEditingRate(null);
                  setRateFormData({ fromCurrencyCode: '', toCurrencyCode: '', rate: 0, effectiveFrom: new Date().toISOString().split('T')[0], effectiveTo: '', source: 'Manual' });
                  setRateFormErrors({});
                  setIsRateModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-primary text-brand-primary text-xs font-semibold rounded hover:bg-brand-primary/5 cursor-pointer"
              >
                <TrendingUp size={13} /> Add Exchange Rate
              </button>
              <button
                onClick={() => { fetchCurrencies(); fetchExchangeRates(); }}
                className="p-1.5 border border-brand-border rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* SUMMARY STAT CARDS */}
          {currencyDashboard && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Star size={14} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Base Currency</span>
                </div>
                <p className="text-xl font-black text-brand-primary">{currencyDashboard.baseCurrencyCode}</p>
                <p className="text-[10px] text-brand-text-secondary mt-0.5">Company Default</p>
              </div>
              <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Currencies</span>
                </div>
                <p className="text-xl font-black text-emerald-700">{currencyDashboard.activeCurrenciesCount}</p>
                <p className="text-[10px] text-brand-text-secondary mt-0.5">Active</p>
              </div>
              <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat">
                <div className="flex items-center gap-2 mb-1.5">
                  <ArrowUpDown size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Exchange Rates</span>
                </div>
                <p className="text-xl font-black text-blue-700">{currencyDashboard.activeExchangeRatesCount}</p>
                <p className="text-[10px] text-brand-text-secondary mt-0.5">Active rates</p>
              </div>
              {currencyDashboard.latestUsdToInrRate && (
                <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">USD → INR</span>
                  </div>
                  <p className="text-xl font-black text-indigo-700">₹{currencyDashboard.latestUsdToInrRate.toFixed(2)}</p>
                  <p className="text-[10px] text-brand-text-secondary mt-0.5">Live rate</p>
                </div>
              )}
              {currencyDashboard.latestEurToInrRate && (
                <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp size={14} className="text-purple-600" />
                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">EUR → INR</span>
                  </div>
                  <p className="text-xl font-black text-purple-700">₹{currencyDashboard.latestEurToInrRate.toFixed(2)}</p>
                  <p className="text-[10px] text-brand-text-secondary mt-0.5">Live rate</p>
                </div>
              )}
              {currencyDashboard.latestAedToInrRate && (
                <div className="bg-white rounded-lg border border-brand-border p-3 shadow-sm-flat">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp size={14} className="text-orange-600" />
                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">AED → INR</span>
                  </div>
                  <p className="text-xl font-black text-orange-700">₹{currencyDashboard.latestAedToInrRate.toFixed(2)}</p>
                  <p className="text-[10px] text-brand-text-secondary mt-0.5">Live rate</p>
                </div>
              )}
            </div>
          )}

          {/* CURRENCY MANAGEMENT TABLE */}
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-brand-primary" />
                <span className="text-sm font-bold text-brand-text-primary">Currency Registry</span>
                <Badge variant="neutral">{currencyList.length} currencies</Badge>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput value={currencySearchQuery} onChange={setCurrencySearchQuery} placeholder="Search currency code or name..." />
              </div>
            </div>

            {currencyLoading ? (
              <div className="p-8 text-center">
                <Loader2 size={20} className="animate-spin text-brand-primary mx-auto mb-2" />
                <p className="text-xs text-brand-text-secondary">Loading currencies...</p>
              </div>
            ) : currencyError ? (
              <div className="p-6 text-center">
                <AlertCircle size={18} className="text-red-500 mx-auto mb-1" />
                <p className="text-xs text-red-600">{currencyError}</p>
                <button onClick={fetchCurrencies} className="mt-2 text-xs text-brand-primary underline cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg-secondary/20">
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Code</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Name</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Symbol</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Decimals</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Base</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Last Modified</th>
                      <th className="px-4 py-2.5 text-right font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {currencyList.filter(c =>
                      !currencySearchQuery ||
                      c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                      c.name.toLowerCase().includes(currencySearchQuery.toLowerCase())
                    ).map(c => (
                      <tr key={c.id} className="hover:bg-brand-bg-secondary/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-bold text-brand-text-primary">{c.code}</span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-brand-text-primary">{c.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-brand-text-secondary">{c.symbol}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-mono text-brand-text-secondary">{c.decimalPlaces}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.isBaseCurrency ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              <Star size={9} fill="currentColor" /> Base
                            </span>
                          ) : (
                            <span className="text-brand-text-secondary text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary font-mono text-[10px]">
                          {c.lastModifiedAtUtc ? formatDate(c.lastModifiedAtUtc) : formatDate(c.createdAtUtc)}
                          {(c.modifiedBy || c.createdBy) && (
                            <span className="block text-[9px] text-brand-text-secondary/60">{c.modifiedBy || c.createdBy}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCurrency(c);
                                setCurrencyFormData({ code: c.code, name: c.name, symbol: c.symbol, decimalPlaces: c.decimalPlaces, isBaseCurrency: c.isBaseCurrency });
                                setCurrencyFormErrors({});
                                setIsCurrencyModalOpen(true);
                              }}
                              className="p-1 rounded text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-colors"
                              title="Edit Currency"
                            >
                              <Edit2 size={13} />
                            </button>
                            {c.status === 'Active' ? (
                              <button
                                disabled={c.isBaseCurrency}
                                onClick={async () => {
                                  try {
                                    await pricingService.deactivateCurrencyRecord(c.id);
                                    toastRef.current('warning', 'Currency Deactivated', `${c.code} has been deactivated.`);
                                    fetchCurrencies();
                                  } catch (err: any) { toastRef.current('error', 'Operation Failed', err.message); }
                                }}
                                className="p-1 rounded text-brand-text-secondary hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={c.isBaseCurrency ? 'Base currency cannot be deactivated' : 'Deactivate Currency'}
                              >
                                <PowerOff size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    await pricingService.activateCurrencyRecord(c.id);
                                    toastRef.current('success', 'Currency Activated', `${c.code} is now Active.`);
                                    fetchCurrencies();
                                  } catch (err: any) { toastRef.current('error', 'Operation Failed', err.message); }
                                }}
                                className="p-1 rounded text-brand-text-secondary hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                                title="Activate Currency"
                              >
                                <Power size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {currencyList.length === 0 && (
                  <EmptyState icon={Globe} title="No currencies configured" description="Add your first currency to start managing multi-currency billing." />
                )}
              </div>
            )}
          </div>

          {/* EXCHANGE RATES TABLE */}
          <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={15} className="text-brand-primary" />
                <span className="text-sm font-bold text-brand-text-primary">Exchange Rate Table</span>
                <Badge variant="neutral">{exchangeRates.length} rates</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="From currency..."
                  value={rateFromFilter}
                  onChange={e => setRateFromFilter(e.target.value.toUpperCase())}
                  className="px-2 py-1 text-xs border border-brand-border rounded w-28 focus:outline-none focus:border-brand-primary"
                />
                <div className="flex items-center gap-1 bg-white border border-brand-border rounded px-2 py-1 text-xs">
                  <Filter size={12} className="text-brand-text-secondary" />
                  <select
                    value={rateStatusFilter}
                    onChange={e => setRateStatusFilter(e.target.value)}
                    className="bg-transparent text-xs text-brand-text-primary font-semibold border-none outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {rateLoading ? (
              <div className="p-8 text-center">
                <Loader2 size={20} className="animate-spin text-brand-primary mx-auto mb-2" />
                <p className="text-xs text-brand-text-secondary">Loading exchange rates...</p>
              </div>
            ) : rateError ? (
              <div className="p-6 text-center">
                <AlertCircle size={18} className="text-red-500 mx-auto mb-1" />
                <p className="text-xs text-red-600">{rateError}</p>
                <button onClick={fetchExchangeRates} className="mt-2 text-xs text-brand-primary underline cursor-pointer">Retry</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg-secondary/20">
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">From</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">To</th>
                      <th className="px-4 py-2.5 text-right font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Rate</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Effective From</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Effective To</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Source</th>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Created By</th>
                      <th className="px-4 py-2.5 text-right font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {exchangeRates
                      .filter(r =>
                        (rateStatusFilter === 'All' || r.status === rateStatusFilter) &&
                        (!rateFromFilter || r.fromCurrencyCode.includes(rateFromFilter))
                      )
                      .map(r => (
                        <tr key={r.id} className="hover:bg-brand-bg-secondary/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-mono font-bold text-brand-text-primary bg-blue-50 px-1.5 py-0.5 rounded text-[11px] border border-blue-100">{r.fromCurrencyCode}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono font-bold text-brand-text-primary bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-100">{r.toCurrencyCode}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-mono font-bold text-brand-text-primary">{r.rate.toFixed(4)}</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-brand-text-secondary text-[11px]">{formatDate(r.effectiveFrom)}</td>
                          <td className="px-4 py-2.5 font-mono text-brand-text-secondary text-[11px]">{r.effectiveTo ? formatDate(r.effectiveTo) : <span className="text-brand-text-secondary/50 italic">Open-ended</span>}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={
                              r.status === 'Active' ? 'success' :
                              r.status === 'Draft' ? 'warning' :
                              r.status === 'Archived' ? 'neutral' : 'danger'
                            }>{r.status}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.source === 'Manual' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>{r.source}</span>
                          </td>
                          <td className="px-4 py-2.5 text-brand-text-secondary text-[11px]">
                            <span>{r.createdBy || '—'}</span>
                            <span className="block font-mono text-[9px] text-brand-text-secondary/60">{formatDate(r.createdAtUtc)}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              {r.status !== 'Archived' && (
                                <button
                                  onClick={() => {
                                    setEditingRate(r);
                                    setRateFormData({
                                      fromCurrencyCode: r.fromCurrencyCode,
                                      toCurrencyCode: r.toCurrencyCode,
                                      rate: r.rate,
                                      effectiveFrom: r.effectiveFrom.split('T')[0],
                                      effectiveTo: r.effectiveTo ? r.effectiveTo.split('T')[0] : '',
                                      source: r.source
                                    });
                                    setRateFormErrors({});
                                    setIsRateModalOpen(true);
                                  }}
                                  className="p-1 rounded text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-colors"
                                  title="Edit Rate"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {r.status === 'Draft' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await pricingService.activateExchangeRate(r.id);
                                      toastRef.current('success', 'Rate Activated', `${r.fromCurrencyCode}→${r.toCurrencyCode} is now Active.`);
                                      fetchExchangeRates(); fetchCurrencies();
                                    } catch (err: any) { toastRef.current('error', 'Operation Failed', err.message); }
                                  }}
                                  className="p-1 rounded text-brand-text-secondary hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                                  title="Activate Rate"
                                >
                                  <Power size={13} />
                                </button>
                              )}
                              {(r.status === 'Active' || r.status === 'Expired') && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await pricingService.archiveExchangeRate(r.id);
                                      toastRef.current('warning', 'Rate Archived', `${r.fromCurrencyCode}→${r.toCurrencyCode} archived.`);
                                      fetchExchangeRates(); fetchCurrencies();
                                    } catch (err: any) { toastRef.current('error', 'Operation Failed', err.message); }
                                  }}
                                  className="p-1 rounded text-brand-text-secondary hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                  title="Archive Rate"
                                >
                                  <Archive size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {exchangeRates.length === 0 && (
                  <EmptyState icon={ArrowUpDown} title="No exchange rates configured" description="Add exchange rates to enable multi-currency conversion in billing and invoicing." />
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW DISCOUNT RULE DRAWER */}
      {isDiscountDrawerOpen && selectedDiscountRule && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl animate-fade-in border-l border-brand-border overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/20 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-brand-text-primary">{selectedDiscountRule.ruleName}</h3>
                  <Badge variant={getStatusBadgeVariant(selectedDiscountRule.status) as any}>{selectedDiscountRule.status}</Badge>
                </div>
                <p className="text-xs font-mono text-brand-text-secondary">Code: {selectedDiscountRule.ruleCode}</p>
              </div>
              <button onClick={() => setIsDiscountDrawerOpen(false)} className="p-1.5 rounded-md text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
              
              {/* RULE SPECIFICATION */}
              <div className="space-y-3">
                <h4 className="font-bold text-brand-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
                  <Percent size={14} className="text-brand-primary" /> Discount Rule Specification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-brand-bg-secondary/20 rounded-lg border border-brand-border/60">
                  <div>
                    <span className="block text-[10px] text-brand-text-secondary font-bold uppercase">Discount Scope</span>
                    {getScopeBadge(selectedDiscountRule.scope)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-brand-text-secondary font-bold uppercase">Discount Value</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedDiscountRule.discountMethod === 'Percentage' ? `${selectedDiscountRule.discountValue}%` : formatINR(selectedDiscountRule.discountValue)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-brand-text-secondary font-bold uppercase">Priority Level</span>
                    <span className="font-mono font-bold text-purple-700">Priority {selectedDiscountRule.priority}</span>
                  </div>
                </div>
              </div>

              {/* APPLICABILITY TARGET */}
              <div className="space-y-3">
                <h4 className="font-bold text-brand-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
                  <Layers size={14} className="text-brand-primary" /> Applicability Target
                </h4>
                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Customer</span>
                      <span className="font-semibold text-brand-text-primary">{selectedDiscountRule.customerName || selectedDiscountRule.customerCode || 'Any Customer'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Product</span>
                      <span className="font-semibold text-brand-text-primary">{selectedDiscountRule.productName || selectedDiscountRule.productCode || 'Any Product'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Category</span>
                      <span className="font-semibold text-brand-text-primary">{selectedDiscountRule.categoryName || 'Any Category'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase font-sans">Price List</span>
                      <span className="font-semibold text-brand-text-primary">{selectedDiscountRule.priceListName || 'Any Price List'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUDIT TRAIL */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-bold text-brand-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-brand-primary" /> Rule Change History & Audit Trail
                </h4>
                <div className="space-y-2">
                  {discountHistory.length === 0 ? (
                    <p className="text-gray-400 italic">No audit trail records found.</p>
                  ) : (
                    discountHistory.map((h, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border rounded-md flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-brand-primary">{h.action}</span>
                          <span className="block text-gray-600">{h.details}</span>
                        </div>
                        <div className="text-right font-mono text-[10px] text-gray-400">
                          <div>{h.actionBy}</div>
                          <div>{formatDate(h.timestampUtc)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-brand-border bg-brand-bg-secondary/20 flex justify-end">
              <button onClick={() => setIsDiscountDrawerOpen(false)} className="px-4 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-xs">
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DISCOUNT RULE MODAL */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                {editingDiscountRule ? 'Edit Discount Rule' : 'Create New Discount Rule'}
              </h3>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {discountFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{discountFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDiscountForm} className="space-y-4 text-xs">
              
              {/* SECTION: BASIC INFORMATION */}
              <div className="space-y-3">
                <h4 className="font-bold text-brand-primary uppercase text-[11px] border-b pb-1">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Rule Name *</label>
                    <input
                      type="text"
                      value={dscRuleName}
                      onChange={(e) => setDscRuleName(e.target.value)}
                      placeholder="e.g. Monsoon Festive Bulk Discount"
                      className="w-full p-2 border border-brand-border rounded outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Rule Code (Auto-generated if blank)</label>
                    <input
                      type="text"
                      value={dscRuleCode}
                      onChange={(e) => setDscRuleCode(e.target.value)}
                      placeholder="e.g. DSC-2026-1049"
                      className="w-full p-2 border border-brand-border rounded font-mono uppercase outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={dscDescription}
                    onChange={(e) => setDscDescription(e.target.value)}
                    placeholder="Optional business description of this discount rule..."
                    className="w-full p-2 border border-brand-border rounded outline-none"
                  />
                </div>
              </div>

              {/* SECTION: DISCOUNT SPECIFICATION */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-brand-primary uppercase text-[11px] border-b pb-1">Discount Method & Priority</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Discount Scope *</label>
                    <select
                      value={dscScope}
                      onChange={(e) => setDscScope(e.target.value as DiscountScope)}
                      className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                    >
                      <option value="CustomerProduct">Customer + Product</option>
                      <option value="Customer">Customer Specific</option>
                      <option value="Product">Product Specific</option>
                      <option value="Category">Product Category</option>
                      <option value="PriceList">Price List Specific</option>
                      <option value="Global">Global (All Items)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Discount Method *</label>
                    <select
                      value={dscMethod}
                      onChange={(e) => setDscMethod(e.target.value as DiscountMethod)}
                      className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="FixedAmount">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Discount Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dscValue}
                      onChange={(e) => setDscValue(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-brand-border rounded font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Priority *</label>
                    <input
                      type="number"
                      min="1"
                      value={dscPriority}
                      onChange={(e) => setDscPriority(parseInt(e.target.value, 10) || 1)}
                      className="w-full p-2 border border-brand-border rounded font-mono font-bold text-purple-700"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC APPLICABILITY SELECTORS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-brand-primary uppercase text-[11px] border-b pb-1">Rule Applicability Targets</h4>
                
                {dscScope === 'Global' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs flex items-center gap-2">
                    <Info size={16} />
                    <span>Global scope applies automatically to all products and customers across the company.</span>
                  </div>
                )}

                {(dscScope === 'Customer' || dscScope === 'CustomerProduct') && (
                  <div className="relative">
                    <label className="block font-bold text-brand-text-primary mb-1">Select Customer *</label>
                    <input
                      type="text"
                      value={dscCustomerSearchInput}
                      onChange={(e) => { setDscCustomerSearchInput(e.target.value); setIsDscCustomerSearching(true); }}
                      onFocus={() => setIsDscCustomerSearching(true)}
                      placeholder="Search Customer Code, Legal Name, City..."
                      className="w-full p-2 border border-brand-border rounded bg-white outline-none focus:border-brand-primary"
                    />
                    {isDscCustomerSearching && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg max-h-40 overflow-y-auto text-[11px]">
                        {availableCustomers.filter(c => {
                          if (!dscCustomerSearchInput) return true;
                          const q = dscCustomerSearchInput.toLowerCase();
                          return (c.code && c.code.toLowerCase().includes(q)) ||
                                 (c.legalName && c.legalName.toLowerCase().includes(q)) ||
                                 (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
                                 (c.city && c.city.toLowerCase().includes(q));
                        }).map(c => (
                          <div key={c.id} onClick={() => { setDscCustomerId(c.id); setDscCustomerSearchInput(`${c.code || 'CUST'} - ${c.tradeName || c.legalName}`); setIsDscCustomerSearching(false); }} className="p-2 hover:bg-brand-primary/10 cursor-pointer border-b border-gray-100">
                            <div className="font-bold text-brand-primary">{c.code || 'CUST'} - {c.tradeName || c.legalName}</div>
                            <div className="text-[10px] text-gray-500">{c.customerType} | {c.city}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(dscScope === 'Product' || dscScope === 'CustomerProduct') && (
                  <div className="relative">
                    <label className="block font-bold text-brand-text-primary mb-1">Select Product *</label>
                    <input
                      type="text"
                      value={dscProductSearchInput}
                      onChange={(e) => { setDscProductSearchInput(e.target.value); setIsDscProductSearching(true); }}
                      onFocus={() => setIsDscProductSearching(true)}
                      placeholder="Search Product Code, Name, SKU..."
                      className="w-full p-2 border border-brand-border rounded bg-white outline-none focus:border-brand-primary"
                    />
                    {isDscProductSearching && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg max-h-40 overflow-y-auto text-[11px]">
                        {availableProducts.filter(p => {
                          if (!dscProductSearchInput) return true;
                          const q = dscProductSearchInput.toLowerCase();
                          return (p.code && p.code.toLowerCase().includes(q)) ||
                                 (p.name && p.name.toLowerCase().includes(q)) ||
                                 (p.sku && p.sku.toLowerCase().includes(q));
                        }).map(p => (
                          <div key={p.id} onClick={() => { setDscProductId(p.id); setDscProductSearchInput(`${p.code} - ${p.name}`); setIsDscProductSearching(false); }} className="p-2 hover:bg-brand-primary/10 cursor-pointer border-b border-gray-100">
                            <div className="font-bold text-brand-primary">{p.code} - {p.name}</div>
                            <div className="text-[10px] text-gray-500">Base Price: ₹{p.basePrice || 100}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {dscScope === 'Category' && (
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Select Product Category *</label>
                    <select
                      value={dscCategoryId}
                      onChange={(e) => setDscCategoryId(e.target.value)}
                      className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                    >
                      <option value="">-- Select Product Category --</option>
                      {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.code} - {cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {dscScope === 'PriceList' && (
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Select Price List *</label>
                    <select
                      value={dscPriceListId}
                      onChange={(e) => setDscPriceListId(e.target.value)}
                      className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                    >
                      <option value="">-- Select Price List --</option>
                      {priceLists.map(pl => (
                        <option key={pl.id} value={pl.id}>{pl.name} ({pl.currency || 'INR'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SECTION: QUANTITY & CAP PROTECTION */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-brand-primary uppercase text-[11px] border-b pb-1">Quantity Limits & Max Cap</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Minimum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={dscMinQty}
                      onChange={(e) => setDscMinQty(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full p-2 border border-brand-border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Maximum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={dscMaxQty}
                      onChange={(e) => setDscMaxQty(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full p-2 border border-brand-border rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Max Discount Amount (₹ Cap)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dscMaxDiscountAmount}
                      onChange={(e) => setDscMaxDiscountAmount(e.target.value)}
                      placeholder="e.g. ₹500.00"
                      className="w-full p-2 border border-brand-border rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DATES & STATUS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-brand-primary uppercase text-[11px] border-b pb-1">Effective Period & Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Effective From *</label>
                    <input
                      type="date"
                      value={dscEffectiveFrom}
                      onChange={(e) => setDscEffectiveFrom(e.target.value)}
                      className="w-full p-2 border border-brand-border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Effective To (Optional)</label>
                    <input
                      type="date"
                      value={dscEffectiveTo}
                      onChange={(e) => setDscEffectiveTo(e.target.value)}
                      className="w-full p-2 border border-brand-border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Initial Status *</label>
                    <select
                      value={dscStatus}
                      onChange={(e) => setDscStatus(e.target.value as DiscountRuleStatus)}
                      className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active (Live Production)</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDiscountSubmitting}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isDiscountSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editingDiscountRule ? 'Update Discount Rule' : 'Create Discount Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRICE LIST MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                {editingPriceList ? 'Edit Price List Tariff' : 'Create New Price Tariff'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Price List Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(p => ({ ...p, name: e.target.value }));
                      setFormValidationErrors(p => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. Standard Pan-India Wholesale 2026"
                    className={`w-full p-2 border rounded outline-none ${formValidationErrors.name ? 'border-red-500 bg-red-50/50' : 'border-brand-border focus:border-brand-primary'}`}
                  />
                  {formValidationErrors.name && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{formValidationErrors.name}</p>}
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Company</label>
                  <div className="w-full p-2 border border-brand-border rounded bg-brand-bg-secondary/20 font-semibold text-brand-text-primary flex items-center justify-between">
                    <span>{availableCompanies.find(c => c.id === formData.companyId)?.legalName || availableCompanies[0]?.legalName || 'Main Enterprise Company'}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({availableCompanies.find(c => c.id === formData.companyId)?.code || availableCompanies[0]?.code || 'COMP-01'})</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective From *</label>
                  <input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => {
                      setFormData(p => ({ ...p, effectiveFrom: e.target.value }));
                      setFormValidationErrors(p => ({ ...p, effectiveFrom: '' }));
                    }}
                    className={`w-full p-2 border rounded ${formValidationErrors.effectiveFrom ? 'border-red-500 bg-red-50/50' : 'border-brand-border'}`}
                  />
                  {formValidationErrors.effectiveFrom && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{formValidationErrors.effectiveFrom}</p>}
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData(p => ({ ...p, effectiveTo: e.target.value }))}
                    className="w-full p-2 border rounded border-brand-border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Additional tariff description or notes..."
                  className="w-full p-2 border rounded border-brand-border outline-none"
                />
              </div>

              {/* LINE ITEMS FORM SECTION */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-brand-text-primary uppercase tracking-wider">Line Items Configuration</h4>
                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="px-2 py-1 bg-brand-bg-secondary text-brand-text-primary font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-2 border rounded bg-brand-bg-secondary/20 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-[11px]">
                      <div className="sm:col-span-2 relative">
                        <label className="block font-bold text-brand-text-secondary">Product *</label>
                        <input
                          type="text"
                          value={item.searchInput || (item.productCode && item.productName ? `${item.productCode} - ${item.productName}` : (item.productName || item.productCode || ''))}
                          onChange={(e) => {
                            handleProductRowChange(idx, 'searchInput', e.target.value);
                            handleProductRowChange(idx, 'isSearching', true);
                          }}
                          onFocus={() => handleProductRowChange(idx, 'isSearching', true)}
                          placeholder="Search Product Code, Name, SKU..."
                          className="w-full p-1 border border-brand-border rounded font-medium text-xs outline-none bg-white focus:border-brand-primary"
                        />
                        {item.isSearching && (
                          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg max-h-40 overflow-y-auto text-[11px]">
                            {availableProducts.filter(p => {
                              if (!item.searchInput) return true;
                              const q = item.searchInput.toLowerCase();
                              return (p.code && p.code.toLowerCase().includes(q)) ||
                                     (p.name && p.name.toLowerCase().includes(q)) ||
                                     (p.sku && p.sku.toLowerCase().includes(q));
                            }).map(p => (
                              <div key={p.id} onClick={() => handleSelectProductRow(idx, p)} className="p-2 hover:bg-brand-primary/10 cursor-pointer border-b border-gray-100">
                                <div className="font-bold text-brand-primary">{p.code} - {p.name}</div>
                                <div className="text-[10px] text-gray-500">Base Price: ₹{p.basePrice || 100}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block font-bold text-brand-text-secondary">Base Price</label>
                        <input
                          type="number"
                          value={item.basePrice}
                          readOnly
                          className="w-full p-1 border border-brand-border rounded bg-gray-100 font-mono text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-brand-text-secondary">Tariff Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.sellingPrice}
                          onChange={(e) => handleProductRowChange(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-brand-border rounded font-mono font-bold text-brand-primary bg-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(idx)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer mt-4"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editingPriceList ? 'Update Tariff' : 'Create Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER PRICE MODAL */}
      {isCustFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                {editingCustPrice ? 'Edit Customer Specific Price' : 'Create Customer Contract Price'}
              </h3>
              <button
                onClick={() => setIsCustFormModalOpen(false)}
                className="p-1 rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustForm} className="space-y-4 text-xs">
              
              {/* CUSTOMER AUTOCOMPLETE SEARCH */}
              <div className="relative">
                <label className="block font-bold text-brand-text-primary mb-1">Customer *</label>
                <input
                  type="text"
                  value={custFormData.customerSearchInput}
                  onChange={(e) => setCustFormData(p => ({ ...p, customerSearchInput: e.target.value, isCustomerSearching: true }))}
                  onFocus={() => setCustFormData(p => ({ ...p, isCustomerSearching: true }))}
                  placeholder="Search Customer Code, Legal Name, Trade Name..."
                  className={`w-full p-2 border rounded font-medium ${custFormValidationErrors.customer ? 'border-red-500 bg-red-50/50' : 'border-brand-border'}`}
                />
                {custFormValidationErrors.customer && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{custFormValidationErrors.customer}</p>}

                {custFormData.isCustomerSearching && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg max-h-40 overflow-y-auto text-[11px]">
                    {availableCustomers.filter(c => {
                      if (!custFormData.customerSearchInput) return true;
                      const q = custFormData.customerSearchInput.toLowerCase();
                      return (c.code && c.code.toLowerCase().includes(q)) ||
                             (c.legalName && c.legalName.toLowerCase().includes(q)) ||
                             (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
                             (c.city && c.city.toLowerCase().includes(q));
                    }).map(c => (
                      <div key={c.id} onClick={() => handleSelectCustomerForCustModal(c)} className="p-2 hover:bg-brand-primary/10 cursor-pointer border-b border-gray-100">
                        <div className="font-bold text-brand-primary">{c.code || 'CUST'} - {c.tradeName || c.legalName}</div>
                        <div className="text-[10px] text-gray-500">{c.customerType} | {c.city}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PRICE LIST SELECTOR */}
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Published Price List *</label>
                <select
                  value={custFormData.priceListId}
                  onChange={(e) => handleSelectPriceListForCustModal(e.target.value)}
                  className={`w-full p-2 border rounded font-semibold ${custFormValidationErrors.priceList ? 'border-red-500 bg-red-50/50' : 'border-brand-border bg-white'}`}
                >
                  <option value="">-- Select Published Price List --</option>
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.name} ({pl.currency || 'INR'})</option>
                  ))}
                </select>
                {custFormValidationErrors.priceList && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{custFormValidationErrors.priceList}</p>}
              </div>

              {/* PRODUCT AUTOCOMPLETE SEARCH */}
              <div className="relative">
                <label className="block font-bold text-brand-text-primary mb-1">Product *</label>
                <input
                  type="text"
                  value={custFormData.productSearchInput}
                  onChange={(e) => setCustFormData(p => ({ ...p, productSearchInput: e.target.value, isProductSearching: true }))}
                  onFocus={() => setCustFormData(p => ({ ...p, isProductSearching: true }))}
                  placeholder="Search Product Code, Name, SKU..."
                  className={`w-full p-2 border rounded font-medium ${custFormValidationErrors.product ? 'border-red-500 bg-red-50/50' : 'border-brand-border'}`}
                />
                {custFormValidationErrors.product && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{custFormValidationErrors.product}</p>}

                {custFormData.isProductSearching && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg max-h-40 overflow-y-auto text-[11px]">
                    {availableProducts.filter(p => {
                      if (!custFormData.productSearchInput) return true;
                      const q = custFormData.productSearchInput.toLowerCase();
                      return (p.code && p.code.toLowerCase().includes(q)) ||
                             (p.name && p.name.toLowerCase().includes(q)) ||
                             (p.sku && p.sku.toLowerCase().includes(q));
                    }).map(p => (
                      <div key={p.id} onClick={() => handleSelectProductForCustModal(p)} className="p-2 hover:bg-brand-primary/10 cursor-pointer border-b border-gray-100">
                        <div className="font-bold text-brand-primary">{p.code} - {p.name}</div>
                        <div className="text-[10px] text-gray-500">Base Price: ₹{p.basePrice || 100}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CUSTOMER PRICE VALUE INPUT */}
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Customer Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={custFormData.customerPriceValue}
                  onChange={(e) => {
                    setCustFormData(p => ({ ...p, customerPriceValue: parseFloat(e.target.value) || 0 }));
                    setCustFormValidationErrors(p => ({ ...p, customerPriceValue: '' }));
                  }}
                  className={`w-full p-2 border rounded font-mono font-bold text-sm text-brand-primary ${custFormValidationErrors.customerPriceValue ? 'border-red-500 bg-red-50/50' : 'border-brand-border'}`}
                />
                {custFormValidationErrors.customerPriceValue && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{custFormValidationErrors.customerPriceValue}</p>}
              </div>

              {/* EFFECTIVE DATES */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective From *</label>
                  <input
                    type="date"
                    value={custFormData.effectiveFrom}
                    onChange={(e) => setCustFormData(p => ({ ...p, effectiveFrom: e.target.value }))}
                    className="w-full p-2 border rounded border-brand-border"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={custFormData.effectiveTo}
                    onChange={(e) => setCustFormData(p => ({ ...p, effectiveTo: e.target.value }))}
                    className="w-full p-2 border rounded border-brand-border"
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCustFormModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCustSubmitting}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isCustSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editingCustPrice ? 'Update Customer Price' : 'Create Customer Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CURRENCY MODAL */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                {editingCurrency ? `Edit Currency: ${editingCurrency.code}` : 'Create New Currency'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCurrencyModalOpen(false)}
                className="p-1 rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCurrencySubmit} className="space-y-4 text-xs">
              {/* CODE */}
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Currency Code (ISO 4217) *</label>
                <input
                  type="text"
                  maxLength={3}
                  disabled={!!editingCurrency}
                  value={currencyFormData.code}
                  onChange={(e) => {
                    setCurrencyFormData(p => ({ ...p, code: e.target.value.toUpperCase() }));
                    setCurrencyFormErrors(p => ({ ...p, code: '' }));
                  }}
                  placeholder="e.g. USD, EUR, GBP, AED"
                  className={`w-full p-2 border rounded font-mono uppercase font-bold text-brand-primary ${
                    currencyFormErrors.code ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                  } ${editingCurrency ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
                {currencyFormErrors.code && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{currencyFormErrors.code}</p>}
              </div>

              {/* NAME */}
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Currency Name *</label>
                <input
                  type="text"
                  value={currencyFormData.name}
                  onChange={(e) => {
                    setCurrencyFormData(p => ({ ...p, name: e.target.value }));
                    setCurrencyFormErrors(p => ({ ...p, name: '' }));
                  }}
                  placeholder="e.g. US Dollar, Euro, Indian Rupee"
                  className={`w-full p-2 border rounded text-brand-text-primary ${
                    currencyFormErrors.name ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                  }`}
                />
                {currencyFormErrors.name && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{currencyFormErrors.name}</p>}
              </div>

              {/* SYMBOL & DECIMALS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Symbol *</label>
                  <input
                    type="text"
                    value={currencyFormData.symbol}
                    onChange={(e) => {
                      setCurrencyFormData(p => ({ ...p, symbol: e.target.value }));
                      setCurrencyFormErrors(p => ({ ...p, symbol: '' }));
                    }}
                    placeholder="e.g. $, €, ₹, £, AED"
                    className={`w-full p-2 border rounded font-mono font-bold text-brand-text-primary ${
                      currencyFormErrors.symbol ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                    }`}
                  />
                  {currencyFormErrors.symbol && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{currencyFormErrors.symbol}</p>}
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Decimal Places *</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={currencyFormData.decimalPlaces}
                    onChange={(e) => {
                      setCurrencyFormData(p => ({ ...p, decimalPlaces: parseInt(e.target.value) || 0 }));
                      setCurrencyFormErrors(p => ({ ...p, decimalPlaces: '' }));
                    }}
                    className={`w-full p-2 border rounded font-mono text-brand-text-primary ${
                      currencyFormErrors.decimalPlaces ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                    }`}
                  />
                  {currencyFormErrors.decimalPlaces && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{currencyFormErrors.decimalPlaces}</p>}
                </div>
              </div>

              {/* IS BASE CURRENCY CHECKBOX */}
              {(!editingCurrency || !editingCurrency.isBaseCurrency) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md">
                  <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currencyFormData.isBaseCurrency}
                      onChange={(e) => setCurrencyFormData(p => ({ ...p, isBaseCurrency: e.target.checked }))}
                      className="rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <span>Set as Company Base Currency</span>
                  </label>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Setting this as base currency will automatically demote any existing base currency.
                  </p>
                </div>
              )}

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCurrencyModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCurrencySubmitting}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isCurrencySubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editingCurrency ? 'Update Currency' : 'Create Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EXCHANGE RATE MODAL */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary">
                {editingRate ? `Edit Exchange Rate: ${editingRate.fromCurrencyCode} → ${editingRate.toCurrencyCode}` : 'Create New Exchange Rate'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="p-1 rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRateSubmit} className="space-y-4 text-xs">
              {/* FROM & TO CURRENCY CODES */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">From Currency *</label>
                  {editingRate ? (
                    <input
                      type="text"
                      disabled
                      value={rateFormData.fromCurrencyCode}
                      className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={rateFormData.fromCurrencyCode}
                      onChange={(e) => {
                        setRateFormData(p => ({ ...p, fromCurrencyCode: e.target.value }));
                        setRateFormErrors(p => ({ ...p, fromCurrencyCode: '', toCurrencyCode: '' }));
                      }}
                      className={`w-full p-2 border rounded font-mono font-bold text-brand-text-primary bg-white ${
                        rateFormErrors.fromCurrencyCode ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                      }`}
                    >
                      <option value="">Select Currency</option>
                      {currencyList.map(c => (
                        <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  )}
                  {rateFormErrors.fromCurrencyCode && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{rateFormErrors.fromCurrencyCode}</p>}
                </div>

                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">To Currency *</label>
                  {editingRate ? (
                    <input
                      type="text"
                      disabled
                      value={rateFormData.toCurrencyCode}
                      className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={rateFormData.toCurrencyCode}
                      onChange={(e) => {
                        setRateFormData(p => ({ ...p, toCurrencyCode: e.target.value }));
                        setRateFormErrors(p => ({ ...p, toCurrencyCode: '' }));
                      }}
                      className={`w-full p-2 border rounded font-mono font-bold text-brand-text-primary bg-white ${
                        rateFormErrors.toCurrencyCode ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                      }`}
                    >
                      <option value="">Select Currency</option>
                      {currencyList.map(c => (
                        <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  )}
                  {rateFormErrors.toCurrencyCode && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{rateFormErrors.toCurrencyCode}</p>}
                </div>
              </div>

              {/* RATE */}
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Exchange Rate *</label>
                <input
                  type="number"
                  step="0.0001"
                  min={0.000001}
                  value={rateFormData.rate || ''}
                  onChange={(e) => {
                    setRateFormData(p => ({ ...p, rate: parseFloat(e.target.value) || 0 }));
                    setRateFormErrors(p => ({ ...p, rate: '' }));
                  }}
                  placeholder="e.g. 86.5000"
                  className={`w-full p-2 border rounded font-mono font-bold text-sm text-brand-primary ${
                    rateFormErrors.rate ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                  }`}
                />
                {rateFormErrors.rate ? (
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">{rateFormErrors.rate}</p>
                ) : (
                  rateFormData.fromCurrencyCode && rateFormData.toCurrencyCode && rateFormData.rate > 0 && (
                    <p className="text-[10px] text-emerald-700 font-mono mt-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      1 {rateFormData.fromCurrencyCode} = {rateFormData.rate.toFixed(4)} {rateFormData.toCurrencyCode}
                    </p>
                  )
                )}
              </div>

              {/* EFFECTIVE DATES */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective From *</label>
                  <input
                    type="date"
                    value={rateFormData.effectiveFrom}
                    onChange={(e) => {
                      setRateFormData(p => ({ ...p, effectiveFrom: e.target.value }));
                      setRateFormErrors(p => ({ ...p, effectiveFrom: '' }));
                    }}
                    className={`w-full p-2 border rounded text-brand-text-primary ${
                      rateFormErrors.effectiveFrom ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                    }`}
                  />
                  {rateFormErrors.effectiveFrom && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{rateFormErrors.effectiveFrom}</p>}
                </div>
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={rateFormData.effectiveTo}
                    onChange={(e) => {
                      setRateFormData(p => ({ ...p, effectiveTo: e.target.value }));
                      setRateFormErrors(p => ({ ...p, effectiveTo: '' }));
                    }}
                    className={`w-full p-2 border rounded text-brand-text-primary ${
                      rateFormErrors.effectiveTo ? 'border-red-500 bg-red-50/50' : 'border-brand-border'
                    }`}
                  />
                  {rateFormErrors.effectiveTo && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{rateFormErrors.effectiveTo}</p>}
                </div>
              </div>

              {/* SOURCE */}
              {!editingRate && (
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Rate Source</label>
                  <select
                    value={rateFormData.source}
                    onChange={(e) => setRateFormData(p => ({ ...p, source: e.target.value as 'Manual' | 'Imported' }))}
                    className="w-full p-2 border border-brand-border rounded text-brand-text-primary bg-white font-semibold"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Imported">Imported Rate</option>
                  </select>
                </div>
              )}

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRateSubmitting}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                >
                  {isRateSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {editingRate ? 'Update Exchange Rate' : 'Create Exchange Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODALS */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle size={18} />
              <span>Confirm Price List Delete</span>
            </div>
            <p className="text-xs text-brand-text-secondary">Are you sure you want to soft-delete this price list?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsDeletingId(null)} className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(isDeletingId)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 cursor-pointer">Delete Price List</button>
            </div>
          </div>
        </div>
      )}

      {isCustDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle size={18} />
              <span>Confirm Customer Price Delete</span>
            </div>
            <p className="text-xs text-brand-text-secondary">Are you sure you want to soft-delete this customer pricing rule?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsCustDeletingId(null)} className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteCustPrice(isCustDeletingId)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 cursor-pointer">Delete Rule</button>
            </div>
          </div>
        </div>
      )}

      {isDiscountDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle size={18} />
              <span>Confirm Discount Rule Delete</span>
            </div>
            <p className="text-xs text-brand-text-secondary">Are you sure you want to soft-delete this discount rule?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsDiscountDeletingId(null)} className="px-3 py-1.5 border border-brand-border text-brand-text-primary text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteDiscountRule(isDiscountDeletingId)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 cursor-pointer">Delete Rule</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
