import { useState, useMemo } from 'react';
import { Supplier } from '../../../types/supplier';

export function useSupplierFilters(suppliers: Supplier[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preferredFilter, setPreferredFilter] = useState(false);
  const [sortField, setSortField] = useState<keyof Supplier>('supplier_code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return suppliers
      .filter(s => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
          s.legal_name.toLowerCase().includes(q) ||
          s.supplier_code.toLowerCase().includes(q) ||
          (s.gst_number ?? '').toLowerCase().includes(q) ||
          (s.display_name ?? '').toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || s.supplier_status_name.toLowerCase() === statusFilter.toLowerCase();
        const matchType = typeFilter === 'all' || s.supplier_type_name.toLowerCase() === typeFilter.toLowerCase();
        const matchPref = !preferredFilter || s.is_preferred;
        return matchSearch && matchStatus && matchType && matchPref;
      })
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === 'string' && typeof bv === 'string')
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        if (typeof av === 'number' && typeof bv === 'number')
          return sortDir === 'asc' ? av - bv : bv - av;
        return 0;
      });
  }, [suppliers, searchQuery, statusFilter, typeFilter, preferredFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: keyof Supplier) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  return {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    preferredFilter, setPreferredFilter,
    sortField, sortDir, toggleSort,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    filtered, paginated, totalPages,
  };
}
