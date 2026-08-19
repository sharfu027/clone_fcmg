import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Layers,
  Tag,
  Tags,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Edit2,
  Table,
  ShieldCheck,
  MapPin,
  Maximize2,
  Minimize2,
  AlertCircle,
  Package,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  Barcode
} from 'lucide-react';

export interface ProductClassificationHierarchyProps {
  products: any[];
  categories: any[];
  brands: any[];
  unitsOfMeasure: any[];
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  onEditProduct: (productId: string) => void;
  onViewFullRegistry: () => void;
  isLoading?: boolean;
}

// Case-insensitive ID comparison helper for GUIDs
const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id).trim().toLowerCase();
};

export default function ProductClassificationHierarchy({
  products,
  categories,
  brands,
  unitsOfMeasure,
  selectedProductId,
  onSelectProduct,
  onEditProduct,
  onViewFullRegistry,
  isLoading = false
}: ProductClassificationHierarchyProps) {
  const [treeSearch, setTreeSearch] = useState('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [expandedSubcategoryIds, setExpandedSubcategoryIds] = useState<Set<string>>(new Set());
  const [expandedBrandKeys, setExpandedBrandKeys] = useState<Set<string>>(new Set());

  // Split categories into Root Categories vs Subcategories (via parentCategoryId self-reference)
  const { rootCategories, subcategoryMap } = useMemo(() => {
    const rootCats: any[] = [];
    const subMap = new Map<string, any[]>();

    categories.forEach(cat => {
      const parentId = normalizeId(cat.parentCategoryId);
      if (parentId && parentId !== normalizeId(cat.id)) {
        const existing = subMap.get(parentId) || [];
        existing.push(cat);
        subMap.set(parentId, existing);
      } else {
        rootCats.push(cat);
      }
    });

    return { rootCategories: rootCats, subcategoryMap: subMap };
  }, [categories]);

  // Build the complete hierarchical tree data structure
  const hierarchicalTree = useMemo(() => {
    // Helper to resolve brands and products for a given category ID
    const resolveCategoryProducts = (catId: string) => {
      const catKey = normalizeId(catId);
      const catProducts = products.filter(p => normalizeId(p.categoryId) === catKey);
      
      // Group products by Brand
      const brandGroupsMap = new Map<string, { brand: any; products: any[] }>();

      catProducts.forEach(prod => {
        const brandKey = normalizeId(prod.brandId);
        const matchingBrand = brands.find(b => normalizeId(b.id) === brandKey) || {
          id: prod.brandId,
          name: prod.brandName || prod.brand || 'Unbranded / General',
          code: 'BRD-GEN'
        };

        if (!brandGroupsMap.has(brandKey)) {
          brandGroupsMap.set(brandKey, {
            brand: matchingBrand,
            products: []
          });
        }
        brandGroupsMap.get(brandKey)!.products.push(prod);
      });

      return {
        products: catProducts,
        brandGroups: Array.from(brandGroupsMap.values())
      };
    };

    return rootCategories.map(rootCat => {
      const subcategories = (subcategoryMap.get(normalizeId(rootCat.id)) || []).map(subCat => {
        const subData = resolveCategoryProducts(subCat.id);
        return {
          ...subCat,
          products: subData.products,
          brandGroups: subData.brandGroups
        };
      });

      const directData = resolveCategoryProducts(rootCat.id);
      const allCategoryProductsCount = directData.products.length + subcategories.reduce((acc, sub) => acc + sub.products.length, 0);

      return {
        ...rootCat,
        subcategories,
        directBrandGroups: directData.brandGroups,
        directProducts: directData.products,
        totalProductsCount: allCategoryProductsCount
      };
    });
  }, [rootCategories, subcategoryMap, products, brands]);

  // Auto-expand all loaded category and brand nodes by default
  useEffect(() => {
    if (hierarchicalTree.length > 0) {
      const catIds = new Set<string>();
      const subCatIds = new Set<string>();
      const brandKeys = new Set<string>();

      hierarchicalTree.forEach(root => {
        catIds.add(normalizeId(root.id));
        root.subcategories.forEach((sub: any) => {
          subCatIds.add(normalizeId(sub.id));
          sub.brandGroups.forEach((bg: any) => {
            brandKeys.add(`${normalizeId(sub.id)}_${normalizeId(bg.brand.id)}`);
          });
        });
        root.directBrandGroups.forEach((bg: any) => {
          brandKeys.add(`${normalizeId(root.id)}_${normalizeId(bg.brand.id)}`);
        });
      });

      setExpandedCategoryIds(catIds);
      setExpandedSubcategoryIds(subCatIds);
      setExpandedBrandKeys(brandKeys);
    }
  }, [hierarchicalTree]);

  // Selected product resolution (defaults to first available product)
  const activeProduct = useMemo(() => {
    if (selectedProductId) {
      const found = products.find(p => normalizeId(p.id) === normalizeId(selectedProductId));
      if (found) return found;
    }
    return products[0] || null;
  }, [products, selectedProductId]);

  // Product Category & Subcategory resolution
  const productCategory = useMemo(() => {
    if (!activeProduct?.categoryId) return null;
    return categories.find(c => normalizeId(c.id) === normalizeId(activeProduct.categoryId)) || null;
  }, [categories, activeProduct]);

  const isSubcategory = Boolean(productCategory?.parentCategoryId);
  const parentCategory = useMemo(() => {
    if (!isSubcategory || !productCategory?.parentCategoryId) return null;
    return categories.find(c => normalizeId(c.id) === normalizeId(productCategory.parentCategoryId)) || null;
  }, [categories, isSubcategory, productCategory]);

  // Toggle Category Expansion
  const toggleCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = normalizeId(id);
    setExpandedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Toggle Subcategory Expansion
  const toggleSubcategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = normalizeId(id);
    setExpandedSubcategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Toggle Brand Group Expansion
  const toggleBrand = (compositeKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBrandKeys(prev => {
      const next = new Set(prev);
      if (next.has(compositeKey)) next.delete(compositeKey);
      else next.add(compositeKey);
      return next;
    });
  };

  // Expand All
  const handleExpandAll = () => {
    const catIds = new Set<string>();
    const subCatIds = new Set<string>();
    const brandKeys = new Set<string>();

    hierarchicalTree.forEach(root => {
      catIds.add(normalizeId(root.id));
      root.subcategories.forEach((sub: any) => {
        subCatIds.add(normalizeId(sub.id));
        sub.brandGroups.forEach((bg: any) => {
          brandKeys.add(`${normalizeId(sub.id)}_${normalizeId(bg.brand.id)}`);
        });
      });
      root.directBrandGroups.forEach((bg: any) => {
        brandKeys.add(`${normalizeId(root.id)}_${normalizeId(bg.brand.id)}`);
      });
    });

    setExpandedCategoryIds(catIds);
    setExpandedSubcategoryIds(subCatIds);
    setExpandedBrandKeys(brandKeys);
  };

  // Collapse All
  const handleCollapseAll = () => {
    setExpandedCategoryIds(new Set());
    setExpandedSubcategoryIds(new Set());
    setExpandedBrandKeys(new Set());
  };

  // Filtered Tree based on search term
  const filteredTree = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    if (!q) return hierarchicalTree;

    return hierarchicalTree
      .map(root => {
        const rootMatch = (root.name && root.name.toLowerCase().includes(q)) ||
          (root.code && root.code.toLowerCase().includes(q));

        // Filter direct brand groups
        const matchingDirectBrandGroups = root.directBrandGroups
          .map((bg: any) => {
            const brandMatch = (bg.brand.name && bg.brand.name.toLowerCase().includes(q)) ||
              (bg.brand.code && bg.brand.code.toLowerCase().includes(q));
            
            const matchingProducts = bg.products.filter((p: any) =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.code && p.code.toLowerCase().includes(q)) ||
              (p.sku && p.sku.toLowerCase().includes(q)) ||
              (p.barcode && p.barcode.toLowerCase().includes(q))
            );

            if (brandMatch || matchingProducts.length > 0) {
              return {
                ...bg,
                products: brandMatch ? bg.products : matchingProducts
              };
            }
            return null;
          })
          .filter(Boolean);

        // Filter subcategories
        const matchingSubcategories = root.subcategories
          .map((sub: any) => {
            const subMatch = (sub.name && sub.name.toLowerCase().includes(q)) ||
              (sub.code && sub.code.toLowerCase().includes(q));

            const matchingSubBrandGroups = sub.brandGroups
              .map((bg: any) => {
                const brandMatch = (bg.brand.name && bg.brand.name.toLowerCase().includes(q)) ||
                  (bg.brand.code && bg.brand.code.toLowerCase().includes(q));

                const matchingProducts = bg.products.filter((p: any) =>
                  (p.name && p.name.toLowerCase().includes(q)) ||
                  (p.code && p.code.toLowerCase().includes(q)) ||
                  (p.sku && p.sku.toLowerCase().includes(q)) ||
                  (p.barcode && p.barcode.toLowerCase().includes(q))
                );

                if (brandMatch || matchingProducts.length > 0) {
                  return {
                    ...bg,
                    products: brandMatch ? bg.products : matchingProducts
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (subMatch || matchingSubBrandGroups.length > 0) {
              return {
                ...sub,
                brandGroups: matchingSubBrandGroups
              };
            }
            return null;
          })
          .filter(Boolean);

        if (rootMatch || matchingDirectBrandGroups.length > 0 || matchingSubcategories.length > 0) {
          return {
            ...root,
            subcategories: matchingSubcategories,
            directBrandGroups: matchingDirectBrandGroups
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [hierarchicalTree, treeSearch]);

  return (
    <div className="space-y-4">
      {/* TWO-PANE HIERARCHY LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANE: PRODUCT CLASSIFICATION TREE (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-brand-border rounded-lg shadow-sm-flat overflow-hidden">
          
          {/* TREE HEADER */}
          <div className="p-4 border-b border-brand-border bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">Product Classification Hierarchy</h3>
                  <p className="text-[11px] text-brand-text-secondary">Category &rarr; Subcategory &rarr; Brand &rarr; Product SKU</p>
                </div>
              </div>

              {/* EXPAND / COLLAPSE ACTIONS */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/10 rounded transition cursor-pointer flex items-center gap-1"
                  title="Expand All Nodes"
                >
                  <Maximize2 size={12} /> Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded transition cursor-pointer flex items-center gap-1"
                  title="Collapse All Nodes"
                >
                  <Minimize2 size={12} /> Collapse All
                </button>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-brand-text-secondary/60" size={14} />
              <input
                type="text"
                placeholder="Search classification by Category, Brand, SKU, Code..."
                value={treeSearch}
                onChange={e => setTreeSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-brand-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition"
              />
              {treeSearch && (
                <button
                  type="button"
                  onClick={() => setTreeSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* TREE BODY */}
          <div className="p-4 overflow-y-auto max-h-[700px] space-y-3">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-brand-text-secondary space-y-2">
                <div className="inline-block animate-spin text-brand-primary">
                  <Layers size={24} />
                </div>
                <p>Loading classification relational hierarchy...</p>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="py-16 text-center text-xs text-brand-text-secondary space-y-3">
                <AlertCircle size={28} className="mx-auto text-slate-400" />
                <div>
                  <p className="font-semibold text-brand-text-primary">No matching classification nodes found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {treeSearch ? `No categories, brands, or products match "${treeSearch}"` : 'No product master data is registered in the database.'}
                  </p>
                </div>
                {treeSearch && (
                  <button
                    type="button"
                    onClick={() => setTreeSearch('')}
                    className="px-3 py-1 bg-brand-primary text-white font-bold rounded text-xs hover:bg-blue-700 transition"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredTree.map(rootCat => {
                const isCatExpanded = expandedCategoryIds.has(normalizeId(rootCat.id));
                const hasChildren = (rootCat.subcategories && rootCat.subcategories.length > 0) ||
                  (rootCat.directBrandGroups && rootCat.directBrandGroups.length > 0);

                return (
                  <div key={rootCat.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    
                    {/* 1. CATEGORY NODE */}
                    <div
                      onClick={(e) => toggleCategory(rootCat.id, e)}
                      className={`flex items-center justify-between p-2.5 transition cursor-pointer select-none ${
                        isCatExpanded ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {hasChildren ? (
                          <span className="text-slate-400 hover:text-slate-700">
                            {isCatExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </span>
                        ) : (
                          <span className="w-[15px]" />
                        )}
                        <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                          <Layers size={13} />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-xs text-brand-text-primary">{rootCat.name}</span>
                          <span className="ml-2 font-mono text-[10px] text-slate-400">({rootCat.code || 'CAT'})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rootCat.subcategories.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {rootCat.subcategories.length} {rootCat.subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {rootCat.totalProductsCount} {rootCat.totalProductsCount === 1 ? 'SKU' : 'SKUs'}
                        </span>
                      </div>
                    </div>

                    {/* CATEGORY CHILDREN CONTAINER */}
                    {isCatExpanded && (
                      <div className="p-2 space-y-2.5 bg-slate-50/40">
                        
                        {/* 2. SUBCATEGORIES (IF PRESENT) */}
                        {rootCat.subcategories.map((subCat: any) => {
                          const isSubExpanded = expandedSubcategoryIds.has(normalizeId(subCat.id));
                          const hasSubChildren = subCat.brandGroups && subCat.brandGroups.length > 0;

                          return (
                            <div key={subCat.id} className="ml-4 border border-blue-100 rounded bg-white overflow-hidden shadow-2xs">
                              {/* SUBCATEGORY HEADER */}
                              <div
                                onClick={(e) => toggleSubcategory(subCat.id, e)}
                                className={`flex items-center justify-between p-2 transition cursor-pointer select-none ${
                                  isSubExpanded ? 'bg-blue-50/40 border-b border-blue-100' : 'hover:bg-blue-50/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {hasSubChildren ? (
                                    <span className="text-blue-500">
                                      {isSubExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                  ) : (
                                    <span className="w-[14px]" />
                                  )}
                                  <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Tag size={12} />
                                  </div>
                                  <span className="font-semibold text-xs text-brand-text-primary truncate">{subCat.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400">({subCat.code || 'SUB'})</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  {subCat.products.length} {subCat.products.length === 1 ? 'SKU' : 'SKUs'}
                                </span>
                              </div>

                              {/* BRANDS UNDER SUBCATEGORY */}
                              {isSubExpanded && (
                                <div className="p-2 space-y-2 bg-white">
                                  {subCat.brandGroups.length === 0 ? (
                                    <div className="py-2 px-3 text-[11px] text-slate-400 italic">
                                      No brands or products registered in this subcategory.
                                    </div>
                                  ) : (
                                    subCat.brandGroups.map((bg: any) => {
                                      const brandCompositeKey = `${normalizeId(subCat.id)}_${normalizeId(bg.brand.id)}`;
                                      const isBrandExpanded = expandedBrandKeys.has(brandCompositeKey);

                                      return (
                                        <div key={brandCompositeKey} className="ml-4 border border-slate-100 rounded bg-slate-50/50 overflow-hidden">
                                          {/* BRAND HEADER */}
                                          <div
                                            onClick={(e) => toggleBrand(brandCompositeKey, e)}
                                            className="flex items-center justify-between p-1.5 px-2 hover:bg-slate-100/80 transition cursor-pointer select-none"
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span className="text-slate-400">
                                                {isBrandExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                              </span>
                                              <Tags size={12} className="text-brand-primary" />
                                              <span className="font-bold text-[11px] text-slate-700 truncate">{bg.brand.name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              {bg.products.length} {bg.products.length === 1 ? 'item' : 'items'}
                                            </span>
                                          </div>

                                          {/* PRODUCTS UNDER BRAND */}
                                          {isBrandExpanded && (
                                            <div className="p-1.5 pt-0 space-y-1 bg-white border-t border-slate-100">
                                              {bg.products.map((prod: any) => {
                                                const isSelected = activeProduct && normalizeId(activeProduct.id) === normalizeId(prod.id);
                                                return (
                                                  <div
                                                    key={prod.id}
                                                    onClick={() => onSelectProduct(prod.id)}
                                                    className={`ml-4 p-1.5 px-2.5 rounded transition cursor-pointer flex items-center justify-between text-xs ${
                                                      isSelected
                                                        ? 'bg-brand-primary text-white shadow-xs font-semibold'
                                                        : 'hover:bg-slate-100 text-brand-text-primary'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <Package size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                                      <div className="truncate">
                                                        <span className="truncate">{prod.name}</span>
                                                        <span className={`ml-2 font-mono text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                                          [{prod.code}]
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <span className={`font-mono text-[11px] ${isSelected ? 'text-white' : 'text-brand-primary font-bold'}`}>
                                                        ₹{Number(prod.basePrice || prod.price || 0).toLocaleString()}
                                                      </span>
                                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                        isSelected
                                                          ? 'bg-white/20 text-white'
                                                          : prod.status === 'Active' || prod.isActive
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-gray-100 text-gray-600'
                                                      }`}>
                                                        {prod.status || (prod.isActive ? 'Active' : 'Inactive')}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 3. DIRECT BRANDS UNDER ROOT CATEGORY (NO SUBCATEGORY) */}
                        {rootCat.directBrandGroups.map((bg: any) => {
                          const brandCompositeKey = `${normalizeId(rootCat.id)}_${normalizeId(bg.brand.id)}`;
                          const isBrandExpanded = expandedBrandKeys.has(brandCompositeKey);

                          return (
                            <div key={brandCompositeKey} className="ml-4 border border-slate-200/80 rounded bg-white overflow-hidden shadow-2xs">
                              {/* BRAND HEADER */}
                              <div
                                onClick={(e) => toggleBrand(brandCompositeKey, e)}
                                className={`flex items-center justify-between p-2 transition cursor-pointer select-none ${
                                  isBrandExpanded ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-slate-400">
                                    {isBrandExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </span>
                                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Tags size={12} />
                                  </div>
                                  <span className="font-bold text-xs text-brand-text-primary truncate">{bg.brand.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400">({bg.brand.code || 'BRD'})</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  {bg.products.length} {bg.products.length === 1 ? 'SKU' : 'SKUs'}
                                </span>
                              </div>

                              {/* PRODUCTS UNDER BRAND */}
                              {isBrandExpanded && (
                                <div className="p-2 space-y-1 bg-white">
                                  {bg.products.map((prod: any) => {
                                    const isSelected = activeProduct && normalizeId(activeProduct.id) === normalizeId(prod.id);
                                    return (
                                      <div
                                        key={prod.id}
                                        onClick={() => onSelectProduct(prod.id)}
                                        className={`ml-4 p-1.5 px-2.5 rounded transition cursor-pointer flex items-center justify-between text-xs ${
                                          isSelected
                                            ? 'bg-brand-primary text-white shadow-xs font-semibold'
                                            : 'hover:bg-slate-100 text-brand-text-primary'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Package size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                          <div className="truncate">
                                            <span className="truncate">{prod.name}</span>
                                            <span className={`ml-2 font-mono text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                              [{prod.code}]
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`font-mono text-[11px] ${isSelected ? 'text-white' : 'text-brand-primary font-bold'}`}>
                                            ₹{Number(prod.basePrice || prod.price || 0).toLocaleString()}
                                          </span>
                                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                            isSelected
                                              ? 'bg-white/20 text-white'
                                              : prod.status === 'Active' || prod.isActive
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {prod.status || (prod.isActive ? 'Active' : 'Inactive')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* EMPTY STATE FOR CATEGORY WITH NO PRODUCTS */}
                        {!hasChildren && (
                          <div className="py-3 px-4 text-center text-[11px] text-slate-400 italic bg-white rounded border border-dashed border-slate-200">
                            No subcategories or products registered in this category.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: SELECTED PRODUCT INSPECTOR (5 COLS) */}
        <div className="lg:col-span-5 bg-white border border-brand-border rounded-lg shadow-sm-flat overflow-hidden sticky top-4">
          {activeProduct ? (
            <div className="divide-y divide-brand-border text-xs">
              
              {/* INSPECTOR HEADER */}
              <div className="p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {activeProduct.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        SKU: {activeProduct.sku || activeProduct.code}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-brand-text-primary leading-tight pt-1">
                      {activeProduct.name}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                    activeProduct.status === 'Active' || activeProduct.isActive
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-slate-600 border-slate-200'
                  }`}>
                    {activeProduct.status || (activeProduct.isActive ? 'Active' : 'Inactive')}
                  </span>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEditProduct(activeProduct.id)}
                    className="flex-1 px-3 py-1.5 bg-brand-primary text-white hover:bg-blue-700 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit2 size={13} /> Edit Product
                  </button>
                  <button
                    type="button"
                    onClick={onViewFullRegistry}
                    className="px-3 py-1.5 border border-brand-border text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table size={13} /> View in Table
                  </button>
                </div>
              </div>

              {/* CARD 1: CLASSIFICATION HIERARCHY */}
              <div className="p-4 space-y-2.5">
                <h4 className="font-bold text-[11px] text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 text-brand-primary">
                  <Layers size={14} /> Classification Hierarchy
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Primary Category</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {isSubcategory ? (parentCategory?.name || 'Parent Category') : (productCategory?.name || activeProduct.categoryName || 'Default Category')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Subcategory</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {isSubcategory ? (productCategory?.name || 'Subcategory') : '— (Direct Root Category)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Brand</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {activeProduct.brandName || activeProduct.brand || 'Default Brand'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Base UOM</span>
                    <span className="font-mono font-semibold text-slate-800 text-xs">
                      {activeProduct.baseUomCode || activeProduct.unit || 'PCS'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">HSN Code</span>
                    <span className="font-mono font-semibold text-slate-800 text-xs">
                      {activeProduct.hsnCode || '1006'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: PRICING & TAXATION */}
              <div className="p-4 space-y-2.5">
                <h4 className="font-bold text-[11px] text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 text-brand-primary">
                  <CreditCard size={14} /> Pricing & Taxation
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100">
                    <span className="text-[10px] font-semibold text-blue-600 uppercase block">MRP</span>
                    <span className="font-mono font-bold text-sm text-blue-900">
                      ₹{Number(activeProduct.mrp || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Base B2B</span>
                    <span className="font-mono font-bold text-sm text-emerald-900">
                      ₹{Number(activeProduct.basePrice || activeProduct.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-purple-50/50 p-2.5 rounded border border-purple-100">
                    <span className="text-[10px] font-semibold text-purple-700 uppercase block">GST Rate</span>
                    <span className="font-mono font-bold text-sm text-purple-900">
                      {activeProduct.gstRatePercent ?? activeProduct.taxRate ?? 5}%
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: LOGISTICS & INVENTORY CONTROLS */}
              <div className="p-4 space-y-2.5">
                <h4 className="font-bold text-[11px] text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 text-brand-primary">
                  <Truck size={14} /> Logistics & Inventory Controls
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Min. Order Quantity (MOQ)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeProduct.minOrderQty || 1} {activeProduct.baseUomCode || activeProduct.unit || 'Units'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Shelf Life</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeProduct.shelfLifeDays ? `${activeProduct.shelfLifeDays} Days` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Batch / FEFO Tracking</span>
                    <span className="flex items-center gap-1 font-semibold text-[11px]">
                      {activeProduct.isBatchTracked !== false ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span className="text-emerald-700">Enabled (FEFO)</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} className="text-slate-400" />
                          <span className="text-slate-500">Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Barcode / EAN</span>
                    <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                      <Barcode size={13} className="text-slate-400" />
                      {activeProduct.barcode || 'Not Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 4: AUDIT & METADATA */}
              <div className="p-3 bg-slate-50/60 text-[10px] text-slate-500 font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span>RECORD GUID:</span>
                  <span className="font-bold text-slate-700">{activeProduct.id}</span>
                </div>
                {activeProduct.companyName && (
                  <div className="flex items-center justify-between">
                    <span>COMPANY:</span>
                    <span className="font-bold text-slate-700">{activeProduct.companyName}</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-brand-text-secondary space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No Product Selected</p>
              <p className="text-[11px] text-slate-400">Click any Product leaf node in the hierarchy to inspect its complete specifications.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
