import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X, AlertCircle, Package } from 'lucide-react';
import { fetchProducts } from '../services/masterDataService';
import { ProductDto } from '../types/masterData';
import { Tooltip } from './ui/Tooltip';

interface ProductAutocompleteProps {
  companyId: string;
  selectedProductId?: string;
  selectedProductLabel?: string;
  onSelectProduct: (product: ProductDto | null) => void;
  error?: string;
  disabled?: boolean;
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  companyId,
  selectedProductId,
  selectedProductLabel,
  onSelectProduct,
  error,
  disabled = false,
}) => {
  const [query, setQuery] = useState<string>('');
  const [options, setOptions] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync displayed label if selectedProductLabel is passed from parent (e.g. edit mode)
  useEffect(() => {
    if (selectedProductLabel && !selectedProduct) {
      setQuery(selectedProductLabel);
    }
  }, [selectedProductLabel, selectedProduct]);

  // Handle Outside Click to Close Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Product Search API call
  const performSearch = useCallback(
    async (searchTerm: string) => {
      setLoading(true);
      setApiError(null);
      try {
        let res = await fetchProducts({
          companyId: companyId || undefined,
          search: searchTerm.trim() || undefined,
          status: 'Active',
          pageSize: 20,
        });

        let productList: ProductDto[] = [];
        if (res && res.items) {
          productList = res.items;
        } else if (Array.isArray(res)) {
          productList = res;
        }

        // Fallback search if specific companyId returns no items
        if (productList.length === 0 && companyId) {
          res = await fetchProducts({
            search: searchTerm.trim() || undefined,
            status: 'Active',
            pageSize: 20,
          });
          if (res && res.items) {
            productList = res.items;
          } else if (Array.isArray(res)) {
            productList = res;
          }
        }

        // Only show active products
        setOptions(productList.filter((p) => p.isActive !== false));
      } catch (err: any) {
        console.error('Error searching products:', err);
        setApiError('Failed to load products. Please check network or retry.');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (selectedProduct) {
      setSelectedProduct(null);
      onSelectProduct(null);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      if (options.length === 0 && !loading) {
        performSearch(query);
      }
    }
  };

  const handleSelectOption = (product: ProductDto) => {
    setSelectedProduct(product);
    setQuery(`${product.code} - ${product.name}`);
    setIsOpen(false);
    onSelectProduct(product);
  };

  const handleClear = () => {
    setSelectedProduct(null);
    setQuery('');
    setOptions([]);
    onSelectProduct(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder="Search product code, name, SKU or barcode..."
          className={`w-full pl-8 pr-7 py-1.5 border rounded text-xs outline-none transition ${
            error || apiError
              ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 bg-white text-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
          } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
        />
        {loading && <Loader2 size={13} className="absolute right-2.5 text-emerald-600 animate-spin" />}
        {!loading && query && !disabled && (
          <Tooltip content="Clear Product Selection">
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear Product Selection"
              className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          </Tooltip>
        )}
      </div>

      {error && <p className="text-[10px] text-red-600 font-medium mt-0.5">{error}</p>}

      {/* DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
          {loading && options.length === 0 && (
            <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <Loader2 size={13} className="animate-spin text-emerald-600" /> Searching products...
            </div>
          )}

          {apiError && (
            <div className="p-3 text-xs text-red-600 bg-red-50/50 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {!loading && !apiError && options.length === 0 && (
            <div className="p-3 text-center text-xs text-gray-500 flex flex-col items-center gap-1">
              <Package size={18} className="text-gray-400" />
              <span>No active products found matching "{query}"</span>
              <span className="text-[10px] text-gray-400">Try searching by product code, name, or SKU</span>
            </div>
          )}

          {!apiError &&
            options.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectOption(product)}
                  className={`p-2.5 hover:bg-emerald-50/70 cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected ? 'bg-emerald-50 font-semibold' : ''
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <span className="font-mono text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px]">
                        {product.code}
                      </span>
                      <span>{product.name}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span>SKU: {product.sku || 'N/A'}</span>
                      <span>•</span>
                      <span>UOM: {product.baseUomCode || 'PCS'}</span>
                      {product.barcode && (
                        <>
                          <span>•</span>
                          <span>Barcode: {product.barcode}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
