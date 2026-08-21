import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  GitFork,
  Warehouse as WarehouseIcon,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Edit2,
  Table,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Maximize2,
  Minimize2,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from './ui/Tooltip';

export interface CompanyOrganizationHierarchyProps {
  companies: any[];
  branches: any[];
  warehouses: any[];
  departments: any[];
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string) => void;
  onEditCompany: (companyId: string) => void;
  onAddNewBranch?: (companyId: string) => void;
  onAddNewWarehouse?: (companyId: string) => void;
  onAddNewDepartment?: (companyId: string) => void;
  onViewFullRegistry: () => void;
  isLoading?: boolean;
}

// Case-insensitive ID comparison helper for GUIDs
const normalizeId = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id).trim().toLowerCase();
};

export default function CompanyOrganizationHierarchy({
  companies,
  branches,
  warehouses,
  departments,
  selectedCompanyId,
  onSelectCompany,
  onEditCompany,
  onAddNewBranch,
  onAddNewWarehouse,
  onAddNewDepartment,
  onViewFullRegistry,
  isLoading = false
}: CompanyOrganizationHierarchyProps) {
  const { user } = useAuth();
  const userPerms = user?.permissions || [];
  const isSuper = user?.role === 'Super Administrator' ||
                  userPerms.includes('manage:all') ||
                  (user?.email && user.email.toLowerCase().includes('superadmin'));
  const hasMasterParent = userPerms.includes('masters:manage');
  const canAccessCompany = isSuper || (hasMasterParent && userPerms.includes('masters:company'));
  const canAccessBranch = isSuper || (hasMasterParent && userPerms.includes('masters:branch'));
  const canAccessWarehouse = isSuper || (hasMasterParent && userPerms.includes('masters:warehouse'));
  const canAccessDepartment = isSuper || (hasMasterParent && userPerms.includes('masters:department'));

  const [treeSearch, setTreeSearch] = useState('');
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [expandedBranchIds, setExpandedBranchIds] = useState<Set<string>>(new Set());

  // Auto-expand all loaded companies by default
  useEffect(() => {
    if (companies.length > 0) {
      setExpandedCompanyIds(prev => {
        const next = new Set(prev);
        companies.forEach(c => next.add(normalizeId(c.id)));
        return next;
      });
    }
  }, [companies]);

  // Auto-expand all loaded branches by default so children are immediately visible
  useEffect(() => {
    if (branches.length > 0) {
      setExpandedBranchIds(prev => {
        const next = new Set(prev);
        branches.forEach(b => next.add(normalizeId(b.id)));
        return next;
      });
    }
  }, [branches]);

  // Selected company resolution (defaults to first company)
  const activeCompany = useMemo(() => {
    if (selectedCompanyId) {
      const found = companies.find(c => normalizeId(c.id) === normalizeId(selectedCompanyId));
      if (found) return found;
    }
    return companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Toggle company expansion
  const toggleCompany = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = normalizeId(id);
    setExpandedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Toggle branch expansion
  const toggleBranch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = normalizeId(id);
    setExpandedBranchIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Expand All (expands all companies and branches)
  const handleExpandAll = () => {
    setExpandedCompanyIds(new Set(companies.map(c => normalizeId(c.id))));
    setExpandedBranchIds(new Set(branches.map(b => normalizeId(b.id))));
  };

  // Collapse All (collapses all expandable nodes)
  const handleCollapseAll = () => {
    setExpandedCompanyIds(new Set());
    setExpandedBranchIds(new Set());
  };

  // Filter and build tree data with full parent-path preservation
  const filteredTreeData = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();

    return companies.map(company => {
      const compId = normalizeId(company.id);
      const compName = (company.legalName || '').toLowerCase();
      const compCode = (company.code || '').toLowerCase();
      const compGstin = (company.taxRegistrationNumber || company.gstin || '').toLowerCase();
      const compTrade = (company.tradeName || '').toLowerCase();
      const companySelfMatches = !q || compName.includes(q) || compCode.includes(q) || compGstin.includes(q) || compTrade.includes(q);

      // Find branches belonging to this company
      const companyBranches = branches.filter(b => normalizeId(b.companyId) === compId);

      const branchNodes = companyBranches.map(branch => {
        const brId = normalizeId(branch.id);
        const brName = (branch.name || '').toLowerCase();
        const brCode = (branch.code || '').toLowerCase();
        const brCity = (branch.city || '').toLowerCase();
        const branchSelfMatches = !q || brName.includes(q) || brCode.includes(q) || brCity.includes(q);

        // Find warehouses for this branch
        const branchWarehouses = warehouses.filter(w => {
          const wBranchId = normalizeId(w.branchId);
          const wCompanyId = normalizeId(w.companyId);
          return wCompanyId === compId && wBranchId === brId;
        });

        // Filter warehouses matching query
        const matchingWarehouses = branchWarehouses.filter(w => {
          if (!q) return true;
          const whName = (w.name || '').toLowerCase();
          const whCode = (w.code || '').toLowerCase();
          const whType = (w.warehouseType || '').toLowerCase();
          const whCity = (w.city || '').toLowerCase();
          return whName.includes(q) || whCode.includes(q) || whType.includes(q) || whCity.includes(q);
        });

        // Find departments for this branch
        const branchDepartments = departments.filter(d => {
          const dBranchId = normalizeId(d.branchId);
          const dCompanyId = normalizeId(d.companyId);
          return dCompanyId === compId && dBranchId === brId;
        });

        // Filter departments matching query
        const matchingDepartments = branchDepartments.filter(d => {
          if (!q) return true;
          const dpName = (d.name || '').toLowerCase();
          const dpCode = (d.code || '').toLowerCase();
          const dpDesc = (d.description || '').toLowerCase();
          return dpName.includes(q) || dpCode.includes(q) || dpDesc.includes(q);
        });

        const branchHasMatchingChildren = matchingWarehouses.length > 0 || matchingDepartments.length > 0;
        const isBranchVisible = companySelfMatches || branchSelfMatches || branchHasMatchingChildren;

        return {
          branch,
          warehouses: (q && !branchSelfMatches && !companySelfMatches) ? matchingWarehouses : branchWarehouses,
          departments: (q && !branchSelfMatches && !companySelfMatches) ? matchingDepartments : branchDepartments,
          hasChildren: branchWarehouses.length > 0 || branchDepartments.length > 0,
          isVisible: isBranchVisible
        };
      }).filter(b => b.isVisible);

      // Find direct warehouses belonging to this company with no branch or unmatched branch
      const branchIdsSet = new Set(companyBranches.map(b => normalizeId(b.id)));
      const directWarehouses = warehouses.filter(w => {
        const wCompanyId = normalizeId(w.companyId);
        const wBranchId = normalizeId(w.branchId);
        return wCompanyId === compId && (!wBranchId || !branchIdsSet.has(wBranchId));
      });

      const matchingDirectWarehouses = directWarehouses.filter(w => {
        if (!q) return true;
        const whName = (w.name || '').toLowerCase();
        const whCode = (w.code || '').toLowerCase();
        const whType = (w.warehouseType || '').toLowerCase();
        const whCity = (w.city || '').toLowerCase();
        return whName.includes(q) || whCode.includes(q) || whType.includes(q) || whCity.includes(q);
      });

      // Find direct departments belonging to this company with no branch or unmatched branch
      const directDepartments = departments.filter(d => {
        const dCompId = normalizeId(d.companyId);
        const dBranchId = normalizeId(d.branchId);
        return dCompId === compId && (!dBranchId || !branchIdsSet.has(dBranchId));
      });

      const matchingDirectDepartments = directDepartments.filter(d => {
        if (!q) return true;
        const dpName = (d.name || '').toLowerCase();
        const dpCode = (d.code || '').toLowerCase();
        const dpDesc = (d.description || '').toLowerCase();
        return dpName.includes(q) || dpCode.includes(q) || dpDesc.includes(q);
      });

      const companyHasMatchingBranches = branchNodes.length > 0;
      const companyHasMatchingDirectWarehouses = matchingDirectWarehouses.length > 0;
      const companyHasMatchingDirectDepartments = matchingDirectDepartments.length > 0;
      const isCompanyVisible = companySelfMatches || companyHasMatchingBranches || companyHasMatchingDirectWarehouses || companyHasMatchingDirectDepartments;

      return {
        company,
        branches: branchNodes,
        directWarehouses: (q && !companySelfMatches) ? matchingDirectWarehouses : directWarehouses,
        directDepartments: (q && !companySelfMatches) ? matchingDirectDepartments : directDepartments,
        isVisible: isCompanyVisible
      };
    }).filter(c => c.isVisible);
  }, [companies, branches, warehouses, departments, treeSearch]);

  // Dynamic empty-state message based on available child permissions
  const getEmptyChildMessage = () => {
    if (canAccessBranch && !canAccessWarehouse && !canAccessDepartment) {
      return 'No branches registered under this entity.';
    }
    if (!canAccessBranch && canAccessWarehouse && !canAccessDepartment) {
      return 'No warehouses / stockists registered under this entity.';
    }
    if (!canAccessBranch && !canAccessWarehouse && canAccessDepartment) {
      return 'No departments registered under this entity.';
    }
    return 'No organizational records registered under this entity.';
  };

  // Active company's branches for inspector
  const activeCompanyBranches = useMemo(() => {
    if (!activeCompany) return [];
    const compId = normalizeId(activeCompany.id);
    return branches.filter(b => normalizeId(b.companyId) === compId);
  }, [activeCompany, branches]);

  // Active company's warehouses for inspector
  const activeCompanyWarehouses = useMemo(() => {
    if (!activeCompany) return [];
    const compId = normalizeId(activeCompany.id);
    return warehouses.filter(w => normalizeId(w.companyId) === compId);
  }, [activeCompany, warehouses]);

  // Active company's departments for inspector
  const activeCompanyDepartments = useMemo(() => {
    if (!activeCompany) return [];
    const compId = normalizeId(activeCompany.id);
    return departments.filter(d => normalizeId(d.companyId) === compId);
  }, [activeCompany, departments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN (5 cols): ORGANIZATION TREE */}
      {/* ========================================================================= */}
      <div className="lg:col-span-5 bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        {/* Tree Header */}
        <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-50 text-brand-primary flex items-center justify-center">
              <Layers size={15} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Organization Tree</h2>
              <p className="text-[10px] text-brand-text-secondary">Company &gt; Branch &gt; Warehouse / Dept</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Tooltip content="Expand All Nodes (Companies and Branches)">
              <button
                onClick={handleExpandAll}
                aria-label="Expand All Nodes"
                className="px-2 py-1 bg-white hover:bg-brand-bg-secondary border border-brand-border rounded text-[11px] font-semibold text-brand-text-primary flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Maximize2 size={11} /> Expand All
              </button>
            </Tooltip>
            <Tooltip content="Collapse All Nodes">
              <button
                onClick={handleCollapseAll}
                aria-label="Collapse All Nodes"
                className="px-2 py-1 bg-white hover:bg-brand-bg-secondary border border-brand-border rounded text-[11px] font-semibold text-brand-text-secondary hover:text-brand-text-primary flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Minimize2 size={11} /> Collapse
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Tree Search Filter */}
        <div className="p-3 border-b border-brand-border bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-text-secondary" />
            <input
              type="text"
              value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)}
              placeholder="Search organization tree..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-brand-bg-secondary/20 border border-brand-border rounded-md focus:outline-none focus:border-brand-primary text-brand-text-primary"
            />
            {treeSearch && (
              <Tooltip content="Clear search query">
                <button
                  onClick={() => setTreeSearch('')}
                  aria-label="Clear Search Filter"
                  className="absolute right-2.5 top-2 text-[10px] text-brand-text-secondary hover:text-brand-text-primary font-bold cursor-pointer"
                >
                  ✕
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Tree Content Container */}
        <div className="p-3 max-h-[660px] overflow-y-auto space-y-2.5">
          {isLoading ? (
            <div className="p-12 text-center text-brand-text-secondary text-xs">
              <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading organization hierarchy...
            </div>
          ) : filteredTreeData.length === 0 ? (
            <div className="p-10 text-center text-brand-text-secondary text-xs space-y-1">
              <AlertCircle size={20} className="mx-auto text-brand-text-secondary/60 mb-1" />
              <p className="font-semibold">No organization nodes found</p>
              <p className="text-[11px]">No companies match "{treeSearch}"</p>
            </div>
          ) : (
            filteredTreeData.map(({ company, branches: companyBranches, directWarehouses = [], directDepartments = [] }) => {
              const compKey = normalizeId(company.id);
              const isSelected = activeCompany && normalizeId(activeCompany.id) === compKey;
              const isExpanded = expandedCompanyIds.has(compKey) || Boolean(treeSearch);
              const branchCount = companyBranches.length;
              const directWhCount = directWarehouses.length;
              const directDeptCount = directDepartments.length;

              return (
                <div
                  key={company.id}
                  className={`border rounded-lg transition overflow-hidden ${
                    isSelected
                      ? 'border-brand-primary/60 bg-blue-50/20 shadow-2xs ring-1 ring-brand-primary/20'
                      : 'border-brand-border hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* COMPANY ROOT NODE */}
                  <div
                    onClick={() => onSelectCompany(company.id)}
                    className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none transition ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-brand-bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Expansion Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleCompany(company.id, e)}
                        className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-brand-text-primary transition shrink-0 cursor-pointer"
                        title={isExpanded ? "Collapse Company" : "Expand Company"}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {/* Company Icon */}
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-brand-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Building2 size={13} />
                      </div>

                      {/* Company Label */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-brand-primary' : 'text-brand-text-primary'}`}>
                            {company.legalName || 'Unnamed Entity'}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {company.code}
                          </span>
                        </div>
                        {company.tradeName && company.tradeName !== company.legalName && (
                          <span className="text-[10px] text-brand-text-secondary truncate block">
                            {company.tradeName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Facility / Branch Count Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {directWhCount > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {directWhCount} {directWhCount === 1 ? 'Warehouse' : 'Warehouses'}
                        </span>
                      )}
                      {directDeptCount > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {directDeptCount} {directDeptCount === 1 ? 'Dept' : 'Depts'}
                        </span>
                      )}
                      {branchCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BRANCHES & DIRECT FACILITIES SUB-TREE */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 pl-6 space-y-2 text-xs">
                      {companyBranches.length === 0 && directWarehouses.length === 0 && directDepartments.length === 0 ? (
                        <div className="py-2 px-3 text-[11px] text-slate-400 italic">
                          {getEmptyChildMessage()}
                        </div>
                      ) : (
                        <>
                          {/* Direct Standalone Warehouses / Stockists */}
                          {directWarehouses.map(wh => (
                            <div key={wh.id} className="bg-white border border-slate-200/80 rounded-md p-2 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                  <WarehouseIcon size={12} />
                                </div>
                                <span className="font-bold text-slate-800 text-xs truncate">
                                  {wh.name}
                                </span>
                                {wh.code && (
                                  <span className="font-mono text-[10px] font-semibold text-slate-600 px-1 rounded bg-slate-100 border border-slate-200">
                                    {wh.code}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {wh.warehouseType || 'Warehouse / Stockist'}
                              </span>
                            </div>
                          ))}

                          {/* Direct Standalone Departments */}
                          {directDepartments.map(dept => (
                            <div key={dept.id} className="bg-white border border-slate-200/80 rounded-md p-2 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                                  <Users size={12} />
                                </div>
                                <span className="font-bold text-slate-800 text-xs truncate">
                                  {dept.name}
                                </span>
                                {dept.code && (
                                  <span className="font-mono text-[10px] font-semibold text-slate-600 px-1 rounded bg-slate-100 border border-slate-200">
                                    {dept.code}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                Department
                              </span>
                            </div>
                          ))}

                          {companyBranches.map(({ branch, warehouses: bWarehouses, departments: bDepartments, hasChildren }) => {
                          const brKey = normalizeId(branch.id);
                          const isBranchExpanded = expandedBranchIds.has(brKey) || Boolean(treeSearch);

                          return (
                            <div key={branch.id} className="bg-white border border-slate-200/80 rounded-md p-2 space-y-1.5 shadow-2xs">
                              {/* Branch Node Header */}
                              <div className="flex items-center justify-between gap-1.5 select-none">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {/* Expansion Chevron (only if branch has children) */}
                                  {hasChildren ? (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleBranch(branch.id, e)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-brand-text-primary transition cursor-pointer"
                                      title={isBranchExpanded ? "Collapse Branch" : "Expand Branch"}
                                    >
                                      {isBranchExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>
                                  ) : (
                                    <span className="w-4 text-center text-slate-300 font-mono text-xs">└</span>
                                  )}

                                  <div className="w-5 h-5 rounded bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                                    <GitFork size={11} className="rotate-90" />
                                  </div>

                                  <span className="font-bold text-brand-text-primary text-xs truncate">
                                    {branch.name}
                                  </span>

                                  {branch.code && (
                                    <span className="font-mono text-[10px] font-semibold text-slate-600 px-1 rounded bg-slate-100 border border-slate-200">
                                      {branch.code}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {branch.isHeadquarters && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      HQ
                                    </span>
                                  )}
                                  {branch.city && (
                                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                                      {branch.city}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Warehouses & Departments under Branch */}
                              {isBranchExpanded && hasChildren && (
                                <div className="pl-5 pt-1 space-y-1.5 border-l-2 border-slate-200 ml-2.5">
                                  
                                  {/* Child Warehouses */}
                                  {bWarehouses.map(wh => (
                                    <div
                                      key={wh.id}
                                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <WarehouseIcon size={12} className="text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-slate-800 text-[11px] truncate">
                                          {wh.name}
                                        </span>
                                        {wh.code && (
                                          <span className="font-mono text-[9px] text-slate-500">
                                            ({wh.code})
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          {wh.warehouseType || 'Warehouse'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Child Departments */}
                                  {bDepartments.map(dept => (
                                    <div
                                      key={dept.id}
                                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Users size={12} className="text-indigo-600 shrink-0" />
                                        <span className="font-semibold text-slate-800 text-[11px] truncate">
                                          {dept.name}
                                        </span>
                                        {dept.code && (
                                          <span className="font-mono text-[9px] text-slate-500">
                                            ({dept.code})
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          Department
                                        </span>
                                      </div>
                                    </div>
                                  ))}

                                </div>
                              )}
                            </div>
                          );
                        })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Tree Footer Stats */}
        <div className="p-3 border-t border-brand-border bg-brand-bg-secondary/20 text-[10px] text-brand-text-secondary flex items-center justify-between font-mono">
          <span>{companies.length} Active Entities</span>
          <span>{branches.length} Branches • {warehouses.length} Warehouses / Stockists • {departments.length} Depts</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN (7 cols): COMPANY DETAILS INSPECTOR */}
      {/* ========================================================================= */}
      <div className="lg:col-span-7 space-y-4">
        
        {activeCompany ? (
          <div className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden flex flex-col">
            
            {/* Inspector Header */}
            <div className="p-5 border-b border-brand-border bg-gradient-to-r from-brand-bg-secondary/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Company Master
                  </span>
                  <span className="font-mono text-xs font-bold text-brand-text-primary px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    {activeCompany.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeCompany.status === 'Active'
                      ? 'bg-green-50 text-brand-success border border-green-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {activeCompany.status || 'Active'}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-brand-text-primary tracking-tight">
                  {activeCompany.legalName}
                </h1>
                {activeCompany.tradeName && activeCompany.tradeName !== activeCompany.legalName && (
                  <p className="text-xs text-brand-text-secondary font-medium">
                    Trade Name: <span className="text-brand-text-primary font-semibold">{activeCompany.tradeName}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                {isSuper && (
                  <button
                    type="button"
                    onClick={() => onEditCompany(activeCompany.id)}
                    className="px-3 py-1.5 border border-brand-border hover:bg-brand-bg-secondary text-brand-text-primary rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Edit2 size={12} /> Edit Company
                  </button>
                )}

                {canAccessBranch && onAddNewBranch && (
                  <button
                    type="button"
                    onClick={() => onAddNewBranch(activeCompany.id)}
                    className="px-3.5 py-1.5 bg-brand-primary hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add New Branch
                  </button>
                )}

                {canAccessWarehouse && onAddNewWarehouse && (
                  <button
                    type="button"
                    onClick={() => onAddNewWarehouse(activeCompany.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add New Warehouse / Stockist
                  </button>
                )}

                {canAccessDepartment && onAddNewDepartment && (
                  <button
                    type="button"
                    onClick={() => onAddNewDepartment(activeCompany.id)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add New Department
                  </button>
                )}
              </div>
            </div>

            {/* Information Cards Grid */}
            <div className="p-5 space-y-5 text-xs">
              
              {/* Section 1: Business Identification & Tax */}
              <div>
                <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-brand-primary" /> Tax & Corporate Identifiers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">Trade / Store Name</span>
                    <span className="font-semibold text-brand-text-primary text-xs mt-0.5 block truncate">
                      {activeCompany.tradeName || activeCompany.legalName || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">GSTIN / Tax ID</span>
                    <span className="font-mono font-bold text-brand-text-primary text-xs mt-0.5 block">
                      {activeCompany.taxRegistrationNumber || activeCompany.gstin || 'Not Registered'}
                    </span>
                  </div>

                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">PAN Number</span>
                    <span className="font-mono font-bold text-brand-text-primary text-xs mt-0.5 block">
                      {activeCompany.panNumber || activeCompany.pan || 'Not Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Communication & Operating Parameters */}
              <div>
                <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Mail size={12} className="text-brand-primary" /> Communication & Currency
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">Primary Corporate Email</span>
                    <span className="font-medium text-brand-text-primary text-xs mt-0.5 block truncate">
                      {activeCompany.email || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">Primary Phone Number</span>
                    <span className="font-medium text-brand-text-primary text-xs mt-0.5 block">
                      {activeCompany.phone || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <span className="text-[10px] font-semibold text-brand-text-secondary uppercase block">Base Ledger Currency</span>
                    <span className="font-mono font-bold text-brand-primary text-xs mt-0.5 block">
                      {activeCompany.currencyCode || activeCompany.currency || 'INR (₹)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Registered Headquarters Address */}
              <div>
                <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <MapPin size={12} className="text-brand-primary" /> Corporate Headquarters Address
                </h3>
                <div className="p-3.5 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                  <p className="font-medium text-brand-text-primary leading-relaxed">
                    {[
                      activeCompany.addressLine1,
                      activeCompany.city,
                      activeCompany.state ? `${activeCompany.state} - ${activeCompany.postalCode}` : activeCompany.postalCode,
                      activeCompany.country || 'India'
                    ].filter(Boolean).join(', ') || 'Corporate Headquarters Address on File'}
                  </p>
                </div>
              </div>

              {/* Section 4: Operating Branches Table inside Inspector */}
              {canAccessBranch && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <GitFork size={12} className="text-brand-primary rotate-90" /> Registered Operating Branches ({activeCompanyBranches.length})
                    </h3>
                    {canAccessBranch && onAddNewBranch && (
                      <button
                        type="button"
                        onClick={() => onAddNewBranch(activeCompany.id)}
                        className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} /> Add Branch to Entity
                      </button>
                    )}
                  </div>

                  <div className="border border-brand-border rounded-lg overflow-hidden">
                    {activeCompanyBranches.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 space-y-2">
                        <p>No operational branches currently linked to {activeCompany.legalName}.</p>
                        {canAccessBranch && onAddNewBranch && (
                          <button
                            type="button"
                            onClick={() => onAddNewBranch(activeCompany.id)}
                            className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded hover:bg-blue-700 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <Plus size={12} /> Create First Branch
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-brand-bg-secondary/50 border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase">
                          <tr>
                            <th className="p-2.5">Branch Code</th>
                            <th className="p-2.5">Branch Name</th>
                            <th className="p-2.5">Location</th>
                            <th className="p-2.5 text-center">Type</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border bg-white">
                          {activeCompanyBranches.map((br) => (
                            <tr key={br.id} className="hover:bg-slate-50 transition">
                              <td className="p-2.5 font-mono font-bold text-brand-text-primary text-[11px]">
                                {br.code}
                              </td>
                              <td className="p-2.5 font-semibold text-brand-text-primary">
                                {br.name}
                              </td>
                              <td className="p-2.5 text-brand-text-secondary text-[11px]">
                                {br.city ? `${br.city}, ${br.state || ''}` : 'Regional Depot'}
                              </td>
                              <td className="p-2.5 text-center">
                                {br.isHeadquarters ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    Headquarters
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                    Regional Branch
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-brand-success border border-green-200">
                                  {br.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Section 5: Warehouses / Stockists Table inside Inspector */}
              {canAccessWarehouse && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <WarehouseIcon size={12} className="text-emerald-600" /> Registered Warehouses / Facilities ({activeCompanyWarehouses.length})
                    </h3>
                    {canAccessWarehouse && onAddNewWarehouse && (
                      <button
                        type="button"
                        onClick={() => onAddNewWarehouse(activeCompany.id)}
                        className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} /> Add Warehouse to Entity
                      </button>
                    )}
                  </div>

                  <div className="border border-brand-border rounded-lg overflow-hidden">
                    {activeCompanyWarehouses.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 space-y-2">
                        <p>No warehouses or stockist facilities currently linked to {activeCompany.legalName}.</p>
                        {canAccessWarehouse && onAddNewWarehouse && (
                          <button
                            type="button"
                            onClick={() => onAddNewWarehouse(activeCompany.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <Plus size={12} /> Create First Warehouse
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-brand-bg-secondary/50 border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase">
                          <tr>
                            <th className="p-2.5">Warehouse Code</th>
                            <th className="p-2.5">Facility Name</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Location</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border bg-white">
                          {activeCompanyWarehouses.map((wh) => (
                            <tr key={wh.id} className="hover:bg-slate-50 transition">
                              <td className="p-2.5 font-mono font-bold text-brand-text-primary text-[11px]">
                                {wh.code}
                              </td>
                              <td className="p-2.5 font-semibold text-brand-text-primary">
                                {wh.name}
                              </td>
                              <td className="p-2.5 text-brand-text-secondary text-[11px]">
                                {wh.warehouseType || 'Standard Warehouse'}
                              </td>
                              <td className="p-2.5 text-brand-text-secondary text-[11px]">
                                {wh.city ? `${wh.city}, ${wh.state || ''}` : 'Location on File'}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-brand-success border border-green-200">
                                  {wh.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Section 6: Operating Departments Table inside Inspector */}
              {canAccessDepartment && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-indigo-600" /> Registered Operating Departments ({activeCompanyDepartments.length})
                    </h3>
                    {canAccessDepartment && onAddNewDepartment && (
                      <button
                        type="button"
                        onClick={() => onAddNewDepartment(activeCompany.id)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} /> Add Department to Entity
                      </button>
                    )}
                  </div>

                  <div className="border border-brand-border rounded-lg overflow-hidden">
                    {activeCompanyDepartments.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 space-y-2">
                        <p>No operational departments currently linked to {activeCompany.legalName}.</p>
                        {canAccessDepartment && onAddNewDepartment && (
                          <button
                            type="button"
                            onClick={() => onAddNewDepartment(activeCompany.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <Plus size={12} /> Create First Department
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-brand-bg-secondary/50 border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase">
                          <tr>
                            <th className="p-2.5">Dept Code</th>
                            <th className="p-2.5">Department Name</th>
                            <th className="p-2.5">Parent Branch / Unit</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border bg-white">
                          {activeCompanyDepartments.map((dept) => {
                            const parentBr = branches.find(b => normalizeId(b.id) === normalizeId(dept.branchId));
                            return (
                              <tr key={dept.id} className="hover:bg-slate-50 transition">
                                <td className="p-2.5 font-mono font-bold text-brand-text-primary text-[11px]">
                                  {dept.code}
                                </td>
                                <td className="p-2.5 font-semibold text-brand-text-primary">
                                  {dept.name}
                                </td>
                                <td className="p-2.5 text-brand-text-secondary text-[11px]">
                                  {parentBr?.name || 'Direct Company Unit'}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-brand-success border border-green-200">
                                    {dept.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Inspector Footer with Navigation Switch */}
            <div className="p-4 border-t border-brand-border bg-brand-bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-brand-text-secondary">
                Viewing live relational organization hierarchy for <strong className="text-brand-text-primary">{activeCompany.legalName}</strong>.
              </span>

              <button
                type="button"
                onClick={onViewFullRegistry}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-brand-border text-brand-text-primary font-bold rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition self-end sm:self-auto"
              >
                <Table size={13} className="text-brand-primary" /> View Full Master Registry Table
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-lg p-12 text-center text-brand-text-secondary text-xs">
            Select a company from the organization tree to inspect its details and operational structure.
          </div>
        )}

      </div>

    </div>
  );
}
