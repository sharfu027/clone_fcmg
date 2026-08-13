export const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' => {
  const key = status.toUpperCase();
  const map: Record<string, any> = {
    'ACTIVE': 'success',
    'PENDING': 'warning',
    'PENDING APPROVAL': 'warning',
    'SUSPENDED': 'warning',
    'BLOCKED': 'danger',
    'BLACKLISTED': 'danger',
    'PREFERRED': 'primary',
    'INACTIVE': 'neutral',
    'ARCHIVED': 'neutral',
    'PROSPECT': 'info',
  };
  return map[key] ?? 'neutral';
};

export const getRiskColor = (level: number): string => {
  if (level <= 1) return 'text-brand-success';
  if (level === 2) return 'text-brand-warning';
  return 'text-brand-danger';
};

export const getRiskLabel = (level: number): string => {
  if (level <= 1) return 'Low';
  if (level === 2) return 'Medium';
  if (level === 3) return 'High';
  return 'Critical';
};

export const getPerformanceColor = (pct: number): string => {
  if (pct >= 90) return 'bg-brand-success';
  if (pct >= 70) return 'bg-brand-warning';
  return 'bg-brand-danger';
};

export const getPerformanceTextColor = (pct: number): string => {
  if (pct >= 90) return 'text-brand-success';
  if (pct >= 70) return 'text-brand-warning';
  return 'text-brand-danger';
};

export const hasPermission = (userRole: string, action: string): boolean => {
  const permissions: Record<string, string[]> = {
    'Super Administrator': ['create', 'edit', 'archive', 'block', 'approve', 'export', 'view'],
    'Administrator': ['create', 'edit', 'archive', 'approve', 'export', 'view'],
    'Procurement Manager': ['create', 'edit', 'export', 'view'],
    'Finance Manager': ['view', 'export'],
    'Director': ['view', 'approve', 'export'],
    'Branch Manager': ['view'],
    'Viewer': ['view'],
  };
  return (permissions[userRole] ?? ['view']).includes(action);
};

export const exportSuppliersToCSV = (suppliers: any[]): void => {
  if (!suppliers || suppliers.length === 0) return;

  const headers = [
    'Supplier Code',
    'Legal Entity Name',
    'Trade Name',
    'GSTIN',
    'PAN',
    'Email',
    'Phone',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Postal Code',
    'Country',
    'Payment Terms (Days)',
    'Credit Limit (INR)',
    'Status',
    'Created Date'
  ];

  const rows = suppliers.map(s => [
    `"${(s.code || '').replace(/"/g, '""')}"`,
    `"${(s.legalName || '').replace(/"/g, '""')}"`,
    `"${(s.tradeName || '').replace(/"/g, '""')}"`,
    `"${(s.gstin || '').replace(/"/g, '""')}"`,
    `"${(s.pan || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.addressLine1 || '').replace(/"/g, '""')}"`,
    `"${(s.addressLine2 || '').replace(/"/g, '""')}"`,
    `"${(s.city || '').replace(/"/g, '""')}"`,
    `"${(s.state || '').replace(/"/g, '""')}"`,
    `"${(s.postalCode || '').replace(/"/g, '""')}"`,
    `"${(s.country || '').replace(/"/g, '""')}"`,
    s.paymentTermsDays ?? 30,
    s.creditLimit ?? 0,
    s.isActive ? 'Active' : 'Inactive',
    s.createdAtUtc ? new Date(s.createdAtUtc).toISOString().split('T')[0] : ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Supplier_Master_Export_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
