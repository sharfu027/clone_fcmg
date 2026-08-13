import { NavItem } from '../types';

export const NAVIGATION_MENU: NavItem[] = [
  { title: 'Dashboard', href: 'dashboard', icon: 'TrendingUp', requiredPermissions: ['read:dashboard'] },
  {
    title: 'Executive BI & Analytics',
    href: 'bi',
    icon: 'TrendingUp',
    requiredPermissions: ['read:dashboard'],
    children: [
      { title: 'Sales BI', href: 'bi/sales', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Inventory Analytics', href: 'bi/inventory', icon: 'Layers', requiredPermissions: ['manage:inventory'] },
      { title: 'Finance Analytics', href: 'bi/finance', icon: 'Layers', requiredPermissions: ['manage:finance'] }
    ]
  },
  {
    title: 'Master Data',
    href: 'masters',
    icon: 'Users2',
    requiredPermissions: ['manage:masters'],
    children: [
      { title: 'Companies', href: 'masters/companies', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Branches', href: 'masters/branches', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Departments', href: 'masters/departments', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Designations', href: 'masters/designations', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Employees', href: 'masters/employees', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Customers', href: 'masters/customers', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Suppliers', href: 'masters/suppliers', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Product Categories', href: 'masters/categories', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Brands', href: 'masters/brands', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Products', href: 'masters/products', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Units', href: 'masters/units', icon: 'Layers', requiredPermissions: ['manage:masters'] },
      { title: 'Warehouses', href: 'masters/warehouses', icon: 'Layers', requiredPermissions: ['manage:masters'] }
    ]
  },
  { 
    title: 'Pricing & Promotions', 
    href: 'pricing', 
    icon: 'Tag',
    requiredPermissions: ['manage:masters']
  },
  {
    title: 'Procurement',
    href: 'procurement',
    icon: 'ShoppingCart',
    requiredPermissions: ['manage:procurement'],
    children: [
      { title: 'Procurement Dashboard', href: 'procurement', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Supplier Management', href: 'procurement/suppliers', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Purchase Requisitions', href: 'procurement/requisition', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'RFQs', href: 'procurement/rfq', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Supplier Quotations', href: 'procurement/quotations', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Purchase Orders', href: 'procurement/orders', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Goods Receipts', href: 'procurement/grn', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Purchase Invoices', href: 'procurement/invoices', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'Purchase Returns', href: 'procurement/returns', icon: 'Layers', requiredPermissions: ['manage:procurement'] }
    ]
  },
  {
    title: 'Warehouse Management',
    href: 'warehouse',
    icon: 'Package',
    requiredPermissions: ['manage:warehouse'],
    children: [
      { title: 'Inbound Receiving', href: 'warehouse/receiving', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Bin Putaway', href: 'warehouse/putaway', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Picking Waves', href: 'warehouse/picking', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Packing Station', href: 'warehouse/packing', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Outbound Dispatch', href: 'warehouse/dispatch', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Stock Transfers', href: 'warehouse/transfers', icon: 'Layers', requiredPermissions: ['manage:warehouse'] }
    ]
  },
  {
    title: 'Inventory Control',
    href: 'inventory',
    icon: 'Package',
    requiredPermissions: ['manage:inventory'],
    children: [
      { title: 'Stock Levels', href: 'inventory/stock', icon: 'Layers', requiredPermissions: ['manage:inventory'] },
      { title: 'FEFO Expiry Tracker', href: 'inventory/expiry', icon: 'Layers', requiredPermissions: ['manage:inventory'] },
      { title: 'Stock Adjustments', href: 'inventory/adjustments', icon: 'Layers', requiredPermissions: ['manage:inventory'] },
      { title: 'Cycle Counting', href: 'inventory/cycle-count', icon: 'Layers', requiredPermissions: ['manage:inventory'] }
    ]
  },
  {
    title: 'Sales Force Automation',
    href: 'sfa',
    icon: 'MapPin',
    requiredPermissions: ['manage:sales'],
    children: [
      { title: 'Beat Planning', href: 'sfa/beat-planning', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Store Visits', href: 'sfa/visits', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'DCR Collections', href: 'sfa/collections', icon: 'Layers', requiredPermissions: ['manage:sales'] }
    ]
  },
  {
    title: 'Order-to-Cash',
    href: 'sales',
    icon: 'FileSpreadsheet',
    requiredPermissions: ['manage:sales'],
    children: [
      { title: 'Quotations', href: 'sales/quotations', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Sales Orders', href: 'sales/orders', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Delivery Challans', href: 'sales/delivery-notes', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'GST Invoices', href: 'sales/invoices', icon: 'Layers', requiredPermissions: ['manage:sales'] }
    ]
  },
  {
    title: 'Returns Management',
    href: 'returns',
    icon: 'Undo2',
    requiredPermissions: ['manage:sales'],
    children: [
      { title: 'Sales Returns (RMA)', href: 'returns/sales', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Purchase Returns (RTV)', href: 'returns/purchase', icon: 'Layers', requiredPermissions: ['manage:procurement'] },
      { title: 'QC Inspection Staging', href: 'returns/inspection', icon: 'Layers', requiredPermissions: ['manage:warehouse'] }
    ]
  },
  {
    title: 'Finance & AR/AP',
    href: 'finance',
    icon: 'DollarSign',
    requiredPermissions: ['manage:finance'],
    children: [
      { title: 'Accounts Receivable (AR)', href: 'finance/receivable', icon: 'Layers', requiredPermissions: ['manage:finance'] },
      { title: 'Accounts Payable (AP)', href: 'finance/payable', icon: 'Layers', requiredPermissions: ['manage:finance'] },
      { title: 'General Ledger', href: 'finance/ledger', icon: 'Layers', requiredPermissions: ['manage:finance'] }
    ]
  },
  {
    title: 'Approval Workflow',
    href: 'workflow',
    icon: 'FolderLock',
    requiredPermissions: ['read:dashboard'],
    children: [
      { title: 'Workflow Designer', href: 'workflow/designer', icon: 'Layers', requiredPermissions: ['manage:security'] },
      { title: 'Approval Matrix', href: 'workflow/matrix', icon: 'Layers', requiredPermissions: ['manage:security'] },
      { title: 'My Approvals Inbox', href: 'workflow/inbox', icon: 'Layers', requiredPermissions: ['read:dashboard'] },
      { title: 'Delegation Rules', href: 'workflow/delegation', icon: 'Layers', requiredPermissions: ['read:dashboard'] }
    ]
  },
  {
    title: 'HRMS Portal',
    href: 'hrms',
    icon: 'Users2',
    requiredPermissions: ['manage:users'],
    children: [
      { title: 'Employee Roster', href: 'hrms/employees', icon: 'Layers', requiredPermissions: ['manage:users'] },
      { title: 'Attendance Logs', href: 'hrms/attendance', icon: 'Layers', requiredPermissions: ['manage:users'] },
      { title: 'Leave Management', href: 'hrms/leaves', icon: 'Layers', requiredPermissions: ['manage:users'] }
    ]
  },
  {
    title: 'CRM & Customer Service',
    href: 'crm',
    icon: 'MessageSquare',
    requiredPermissions: ['manage:sales'],
    children: [
      { title: 'Customer 360', href: 'crm/customers', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Complaints', href: 'crm/complaints', icon: 'Layers', requiredPermissions: ['manage:sales'] },
      { title: 'Service Tickets', href: 'crm/tickets', icon: 'Layers', requiredPermissions: ['manage:sales'] }
    ]
  },
  {
    title: 'Logistics & Delivery',
    href: 'logistics',
    icon: 'Truck',
    requiredPermissions: ['manage:warehouse'],
    children: [
      { title: 'Fleet Vehicles', href: 'logistics/vehicles', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Routes & Stops', href: 'logistics/routes', icon: 'Layers', requiredPermissions: ['manage:warehouse'] },
      { title: 'Proof of Delivery', href: 'logistics/pod', icon: 'Layers', requiredPermissions: ['manage:warehouse'] }
    ]
  },
  { 
    title: 'Reports', 
    href: 'reports', 
    icon: 'BarChart3',
    requiredPermissions: ['read:dashboard']
  },
  { 
    title: 'Administration & Security', 
    href: 'admin', 
    icon: 'Settings',
    requiredPermissions: ['manage:security'],
    children: [
      { title: 'Security Dashboard', href: 'admin/security-center', icon: 'Layers', requiredPermissions: ['manage:security'] },
      { title: 'User Management', href: 'admin/security-center/user-management', icon: 'Users2', requiredPermissions: ['manage:users'] },
      { title: 'Roles & Permissions', href: 'admin/security-center/security-profiles', icon: 'Layers', requiredPermissions: ['manage:security'] },
      { title: 'Audit Logs', href: 'admin/security-center/audit-logs', icon: 'Layers', requiredPermissions: ['manage:security'] }
    ]
  }
];
