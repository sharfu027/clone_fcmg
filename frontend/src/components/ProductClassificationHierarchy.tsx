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
import { Tooltip } from './ui/Tooltip';

export interface ProductClassificationHierarchyProps {
  products: any[];
  categories: any[];
  brands: any[];
  unitsOfMeasure: any[];
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  onEditProduct: (productId: string) => void;
  onViewFullRegistry: () => void;
  onCreateCategory?: () => void;
  isLoading?: boolean;
}

export interface CategoryTreeNode {
  id: string;
  code: string;
  name: string;
  parentCategoryId: string | null;
  parentCategoryName?: string | null;
  companyId?: string;
  companyName?: string;
  depth: number;
  ancestorNames: string[];
  children: CategoryTreeNode[];
  directProducts: any[];
  directBrandGroups: { brand: any; products: any[] }[];
  directUnbrandedProducts: any[];
  totalProductsCount: number;
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
  onCreateCategory,
  isLoading = false
}: ProductClassificationHierarchyProps) {
  const [treeSearch, setTreeSearch] = useState('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [expandedBrandKeys, setExpandedBrandKeys] = useState<Set<string>>(new Set());

  // Helper to separate products into branded groups vs unbranded direct products
  const resolveCategoryProducts = (catProducts: any[]) => {
    const brandGroupsMap = new Map<string, { brand: any; products: any[] }>();
    const unbrandedProducts: any[] = [];

    catProducts.forEach(prod => {
      const bId = normalizeId(prod.brandId);
      if (!bId || bId === 'null' || bId === 'undefined') {
        unbrandedProducts.push(prod);
        return;
      }

      const matchingBrand = brands.find(b => normalizeId(b.id) === bId) || {
        id: prod.brandId,
        name: prod.brandName || prod.brand || 'Brand',
        code: 'BRD'
      };

      if (!brandGroupsMap.has(bId)) {
        brandGroupsMap.set(bId, {
          brand: matchingBrand,
          products: []
        });
      }
      brandGroupsMap.get(bId)!.products.push(prod);
    });

    return {
      brandGroups: Array.from(brandGroupsMap.values()),
      unbrandedProducts
    };
  };

  // Build the complete recursive Category Tree data structure
  const hierarchicalTree: CategoryTreeNode[] = useMemo(() => {
    const catMap = new Map<string, any>();
    categories.forEach(c => catMap.set(normalizeId(c.id), c));

    // Recursive node builder
    const buildNode = (cat: any, depth: number, parentAncestors: string[]): CategoryTreeNode => {
      const catKey = normalizeId(cat.id);
      const directProds = products.filter(p => normalizeId(p.categoryId) === catKey);
      const { brandGroups, unbrandedProducts } = resolveCategoryProducts(directProds);
      const currentAncestors = [...parentAncestors, cat.name];

      // Find children whose parentCategoryId points to this category
      const childCats = categories.filter(c => {
        const pId = normalizeId(c.parentCategoryId);
        return pId && pId === catKey && pId !== normalizeId(c.id);
      });

      const childNodes = childCats.map(child => buildNode(child, depth + 1, currentAncestors));
      const totalCount = directProds.length + childNodes.reduce((acc, c) => acc + c.totalProductsCount, 0);

      return {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        parentCategoryId: cat.parentCategoryId || null,
        parentCategoryName: cat.parentCategoryName || null,
        companyId: cat.companyId,
        companyName: cat.companyName,
        depth,
        ancestorNames: currentAncestors,
        children: childNodes,
        directProducts: directProds,
        directBrandGroups: brandGroups,
        directUnbrandedProducts: unbrandedProducts,
        totalProductsCount: totalCount
      };
    };

    // Root categories are those with no parentCategoryId or whose parent is not in the categories array
    const rootCats = categories.filter(c => {
      const pId = normalizeId(c.parentCategoryId);
      return !pId || pId === normalizeId(c.id) || !catMap.has(pId);
    });

    return rootCats.map(root => buildNode(root, 0, []));
  }, [categories, products, brands]);

  // Collect all category IDs and brand keys in the tree
  const allTreeKeys = useMemo(() => {
    const catIds = new Set<string>();
    const brandKeys = new Set<string>();

    const traverse = (node: CategoryTreeNode) => {
      catIds.add(normalizeId(node.id));
      node.directBrandGroups.forEach(bg => {
        brandKeys.add(`${normalizeId(node.id)}_${normalizeId(bg.brand.id)}`);
      });
      node.children.forEach(traverse);
    };

    hierarchicalTree.forEach(traverse);
    return { catIds, brandKeys };
  }, [hierarchicalTree]);

  // Auto-expand all loaded category and brand nodes by default
  useEffect(() => {
    if (hierarchicalTree.length > 0) {
      setExpandedCategoryIds(new Set(allTreeKeys.catIds));
      setExpandedBrandKeys(new Set(allTreeKeys.brandKeys));
    }
  }, [allTreeKeys]);

  // Selected product resolution (defaults to first available product)
  const activeProduct = useMemo(() => {
    if (selectedProductId) {
      const found = products.find(p => normalizeId(p.id) === normalizeId(selectedProductId));
      if (found) return found;
    }
    return products[0] || null;
  }, [products, selectedProductId]);

  // Product Category Ancestry path for Inspector
  const productCategoryAncestry = useMemo(() => {
    if (!activeProduct?.categoryId) return [];
    const ancestry: any[] = [];
    const catMap = new Map<string, any>();
    categories.forEach(c => catMap.set(normalizeId(c.id), c));

    let curr = catMap.get(normalizeId(activeProduct.categoryId));
    const seen = new Set<string>();
    while (curr && !seen.has(normalizeId(curr.id))) {
      ancestry.unshift(curr);
      seen.add(normalizeId(curr.id));
      const parentId = normalizeId(curr.parentCategoryId);
      curr = parentId && parentId !== normalizeId(curr.id) ? catMap.get(parentId) : null;
    }
    return ancestry;
  }, [categories, activeProduct]);

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

  // Expand All (all depths)
  const handleExpandAll = () => {
    setExpandedCategoryIds(new Set(allTreeKeys.catIds));
    setExpandedBrandKeys(new Set(allTreeKeys.brandKeys));
  };

  // Collapse All (all depths)
  const handleCollapseAll = () => {
    setExpandedCategoryIds(new Set());
    setExpandedBrandKeys(new Set());
  };

  // Recursive Filtered Tree based on search term
  const filteredTree = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    if (!q) return hierarchicalTree;

    const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
      const nodeMatch = (node.name && node.name.toLowerCase().includes(q)) ||
        (node.code && node.code.toLowerCase().includes(q));

      // Filter direct unbranded products
      const matchingUnbranded = node.directUnbrandedProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );

      // Filter direct brand groups
      const matchingBrandGroups = node.directBrandGroups
        .map(bg => {
          const brandMatch = (bg.brand.name && bg.brand.name.toLowerCase().includes(q)) ||
            (bg.brand.code && bg.brand.code.toLowerCase().includes(q));

          const matchingProducts = bg.products.filter(p =>
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
        .filter(Boolean) as { brand: any; products: any[] }[];

      // Filter children recursively
      const matchingChildren = node.children
        .map(child => filterNode(child))
        .filter(Boolean) as CategoryTreeNode[];

      if (nodeMatch || matchingUnbranded.length > 0 || matchingBrandGroups.length > 0 || matchingChildren.length > 0) {
        return {
          ...node,
          directUnbrandedProducts: (nodeMatch && matchingUnbranded.length === 0) ? node.directUnbrandedProducts : matchingUnbranded,
          directBrandGroups: (nodeMatch && matchingBrandGroups.length === 0) ? node.directBrandGroups : matchingBrandGroups,
          children: matchingChildren
        };
      }
      return null;
    };

    return hierarchicalTree
      .map(filterNode)
      .filter(Boolean) as CategoryTreeNode[];
  }, [hierarchicalTree, treeSearch]);

  // Total Summary Stats
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = products.length;
    const totalBrands = brands.length;
    return { totalCategories, totalProducts, totalBrands };
  }, [categories, products, brands]);

  // Helper to render product leaf row
  const renderProductItem = (prod: any) => {
    const isSelected = activeProduct && normalizeId(activeProduct.id) === normalizeId(prod.id);
    return (
      <div
        key={prod.id}
        onClick={() => onSelectProduct(prod.id)}
        className={`ml-3 sm:ml-4 p-1.5 px-2.5 rounded transition cursor-pointer flex items-center justify-between text-xs ${
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
  };

  // Recursive Category Node Renderer
  const renderCategoryNode = (node: CategoryTreeNode) => {
    const isCatExpanded = expandedCategoryIds.has(normalizeId(node.id));
    const hasChildren = node.children.length > 0 || node.directBrandGroups.length > 0 || node.directUnbrandedProducts.length > 0;

    return (
      <div key={node.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        {/* CATEGORY HEADER */}
        <div
          onClick={(e) => toggleCategory(node.id, e)}
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
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
              node.depth === 0
                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                : node.depth === 1
                  ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
            }`}>
              <Layers size={13} />
            </div>
            <div className="truncate flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs text-brand-text-primary truncate">{node.name}</span>
              <span className="font-mono text-[11px] text-slate-400 font-normal">({node.code || 'CAT'})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {node.totalProductsCount} {node.totalProductsCount === 1 ? 'SKU' : 'SKUs'}
            </span>
          </div>
        </div>

        {/* EXPANDED CONTENT: DIRECT PRODUCTS, BRANDS & CHILDREN */}
        {isCatExpanded && (
          <div className="p-2.5 space-y-2.5 bg-slate-50/40">
            
            {/* 1. DIRECT UNBRANDED PRODUCTS UNDER THIS CATEGORY NODE */}
            {node.directUnbrandedProducts.length > 0 && (
              <div className="ml-3 sm:ml-4 p-2 space-y-1 bg-white border border-slate-200/60 rounded shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 mb-1 flex items-center gap-1.5">
                  <Package size={11} /> Unbranded Products
                </div>
                {node.directUnbrandedProducts.map(prod => renderProductItem(prod))}
              </div>
            )}

            {/* 2. DIRECT BRAND GROUPS UNDER THIS CATEGORY NODE */}
            {node.directBrandGroups.map(bg => {
              const brandCompositeKey = `${normalizeId(node.id)}_${normalizeId(bg.brand.id)}`;
              const isBrandExpanded = expandedBrandKeys.has(brandCompositeKey);

              return (
                <div key={brandCompositeKey} className="ml-3 sm:ml-4 border border-slate-200/80 rounded bg-white overflow-hidden shadow-2xs">
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
                      {bg.products.map(prod => renderProductItem(prod))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 3. RECURSIVE CHILD CATEGORIES */}
            {node.children.length > 0 && (
              <div className="ml-3 sm:ml-4 space-y-2 border-l-2 border-slate-200 pl-2">
                {node.children.map(child => renderCategoryNode(child))}
              </div>
            )}

            {/* EMPTY STATE FOR NODE */}
            {!hasChildren && (
              <div className="py-2.5 px-4 text-center text-[11px] text-slate-400 italic bg-white rounded border border-dashed border-slate-200">
                No child categories or products registered under {node.name}.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP SUMMARY METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-brand-border shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Layers size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Category Nodes</span>
            <span className="text-sm font-bold text-brand-text-primary">{stats.totalCategories}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Tags size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Brands</span>
            <span className="text-sm font-bold text-brand-text-primary">{stats.totalBrands}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
            <Boxes size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered SKUs</span>
            <span className="text-sm font-bold text-brand-text-primary">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onViewFullRegistry}
            className="px-3 py-1.5 border border-brand-border text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Table size={13} /> Flat Table
          </button>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: LEFT TREE (7 COLS), RIGHT INSPECTOR (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: RECURSIVE CATEGORY TREE (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-brand-border rounded-lg shadow-sm-flat overflow-hidden">
          
          {/* SEARCH & EXPAND CONTROLS */}
          <div className="p-3 border-b border-brand-border bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={treeSearch}
                onChange={e => setTreeSearch(e.target.value)}
                placeholder="Search Category, Brand, SKU..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-brand-border rounded bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <Tooltip content="Expand All Nodes">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  aria-label="Expand All Nodes"
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 size={11} /> Expand All
                </button>
              </Tooltip>
              <Tooltip content="Collapse All Nodes">
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  aria-label="Collapse All Nodes"
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <Minimize2 size={11} /> Collapse All
                </button>
              </Tooltip>
            </div>
          </div>

          {/* TREE SCROLL CONTAINER */}
          <div className="p-3 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-brand-text-secondary space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto text-brand-primary flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <p>Loading classification relational hierarchy...</p>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="py-16 text-center text-xs text-brand-text-secondary space-y-3">
                <AlertCircle size={28} className="mx-auto text-slate-400" />
                <div>
                  <p className="font-semibold text-brand-text-primary text-sm">
                    {treeSearch ? 'No matching nodes found' : 'No categories registered yet.'}
                  </p>
                </div>
                {treeSearch ? (
                  <Tooltip content="Reset search query">
                    <button
                      type="button"
                      onClick={() => setTreeSearch('')}
                      aria-label="Clear Filter"
                      className="px-3 py-1 bg-brand-primary text-white font-bold rounded text-xs hover:bg-blue-700 transition"
                    >
                      Clear Filter
                    </button>
                  </Tooltip>
                ) : onCreateCategory ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onCreateCategory}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white font-bold rounded text-xs hover:bg-blue-700 transition shadow-xs cursor-pointer"
                    >
                      <Plus size={13} /> Add Category
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              filteredTree.map(node => renderCategoryNode(node))
            )}
            {/* UNCLASSIFIED PRODUCTS VIRTUAL GROUP */}
            {(() => {
              const unclassified = products.filter(p => {
                const cId = normalizeId(p.categoryId);
                return !cId || cId === 'null' || cId === 'undefined';
              });
              if (unclassified.length === 0) return null;
              const q = treeSearch.trim().toLowerCase();
              const filtered = q
                ? unclassified.filter(p =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.code && p.code.toLowerCase().includes(q)) ||
                    (p.sku && p.sku.toLowerCase().includes(q))
                  )
                : unclassified;
              if (filtered.length === 0) return null;
              return (
                <div className="border border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50/60">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 border bg-slate-100 text-slate-500 border-slate-300">
                        <Package size={13} />
                      </div>
                      <span className="font-bold text-xs text-slate-600">Unclassified Products</span>
                      <span className="text-[10px] italic text-slate-400">(no category assigned)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                      {filtered.length} {filtered.length === 1 ? 'SKU' : 'SKUs'}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1 bg-white">
                    {filtered.map(prod => renderProductItem(prod))}
                  </div>
                </div>
              );
            })()}
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
                  <Tooltip content="Switch to Master Registry Table view">
                    <button
                      type="button"
                      onClick={onViewFullRegistry}
                      aria-label="View in Table"
                      className="px-3 py-1.5 border border-brand-border text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Table size={13} /> View in Table
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* CARD 1: CLASSIFICATION HIERARCHY / ANCESTRY PATH */}
              <div className="p-4 space-y-2.5">
                <h4 className="font-bold text-[11px] text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5 text-brand-primary">
                  <Layers size={14} /> Category Path & Brand
                </h4>
                <div className="space-y-3 bg-slate-50/60 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Category Hierarchy Path</span>
                    {productCategoryAncestry.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {productCategoryAncestry.map((cat, idx) => {
                          const isLast = idx === productCategoryAncestry.length - 1;
                          return (
                            <React.Fragment key={cat.id}>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isLast ? 'bg-blue-100 text-blue-800 border border-blue-200 font-bold' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {cat.name}
                              </span>
                              {!isLast && <span className="text-slate-400 text-xs font-bold">›</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No Category Assigned</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Brand</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {activeProduct.brandId && normalizeId(activeProduct.brandId) ? (
                          activeProduct.brandName || activeProduct.brand || (brands.find(b => normalizeId(b.id) === normalizeId(activeProduct.brandId))?.name) || 'Brand'
                        ) : (
                          <span className="text-slate-400 font-normal italic">Not Applicable</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Base UOM</span>
                      <span className="font-mono font-semibold text-slate-800 text-xs">
                        {activeProduct.baseUomCode || activeProduct.unit || (unitsOfMeasure.find(u => normalizeId(u.id) === normalizeId(activeProduct.baseUomId))?.code) || '—'}
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
