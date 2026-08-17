import { NavItem } from '../types';

export const NAVIGATION_MENU: NavItem[] = [
  { title: 'Dashboard', href: 'dashboard', icon: 'TrendingUp', requiredPermissions: ['read:dashboard'] },
  {
    title: 'Executive BI & Analytics',
    href: 'bi',
    icon: 'TrendingUp',
    requiredPermissions: ['bi:manage', 'manage:bi'],
    children: [
      { title: 'Sales BI', href: 'bi/sales', icon: 'Layers', requiredPermissions: ['bi:manage', 'manage:sales'] },
      { title: 'Inventory Analytics', href: 'bi/inventory', icon: 'Layers', requiredPermissions: ['bi:manage', 'manage:inventory'] },
      { title: 'Finance Analytics', href: 'bi/finance', icon: 'Layers', requiredPermissions: ['bi:manage', 'manage:finance'] }
    ]
  },
  {
    title: 'Master Data',
    href: 'masters',
    icon: 'Boxes',
    requiredPermissions: ['masters:manage', 'manage:masters'],
    children: [
      {
        title: 'Company',
        href: 'masters/companies',
        icon: 'Building',
        requiredPermissions: ['masters:company'],
        children: [
          { title: 'Branches', href: 'masters/branches', icon: 'Building', requiredPermissions: ['masters:company'] },
          { title: 'Warehouse', href: 'masters/warehouses', icon: 'Building', requiredPermissions: ['masters:company'] },
          { title: 'Department', href: 'masters/departments', icon: 'Building', requiredPermissions: ['masters:company'] }
        ]
      },
      {
        title: 'Product',
        href: 'masters/products',
        icon: 'Boxes',
        requiredPermissions: ['masters:product'],
        children: [
          { title: 'Category', href: 'masters/categories', icon: 'Tags', requiredPermissions: ['masters:product'] },
          { title: 'Brands', href: 'masters/brands', icon: 'ClipboardList', requiredPermissions: ['masters:product'] }
        ]
      },
      {
        title: 'Employee',
        href: 'masters/employees',
        icon: 'UserCheck',
        requiredPermissions: ['masters:employee'],
        children: [
          { title: 'Designation', href: 'masters/designations', icon: 'Briefcase', requiredPermissions: ['masters:employee'] }
        ]
      },
      {
        title: 'Customer',
        href: 'masters/customers',
        icon: 'Users2',
        requiredPermissions: ['masters:customer']
      },
      {
        title: 'Supplier',
        href: 'masters/suppliers',
        icon: 'Truck',
        requiredPermissions: ['masters:supplier']
      }
    ]
  },
  { 
    title: 'Pricing & Promotions', 
    href: 'pricing', 
    icon: 'Tag',
    requiredPermissions: ['pricing:manage', 'manage:pricing']
  },
  {
    title: 'Procurement',
    href: 'procurement',
    icon: 'ShoppingCart',
    requiredPermissions: ['procurement:manage', 'manage:procurement'],
    children: [
      { title: 'Procurement Dashboard', href: 'procurement', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Supplier Management', href: 'procurement/suppliers', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Purchase Requisitions', href: 'procurement/requisition', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'RFQs', href: 'procurement/rfq', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Supplier Quotations', href: 'procurement/quotations', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Purchase Orders', href: 'procurement/orders', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Goods Receipts', href: 'procurement/grn', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Purchase Invoices', href: 'procurement/invoices', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] },
      { title: 'Purchase Returns', href: 'procurement/returns', icon: 'Layers', requiredPermissions: ['procurement:manage', 'manage:procurement'] }
    ]
  },
  {
    title: 'Warehouse Management',
    href: 'warehouse',
    icon: 'Package',
    requiredPermissions: ['wms:manage', 'manage:warehouse'],
    children: [
      { title: 'Inbound Receiving', href: 'warehouse/receiving', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] },
      { title: 'Bin Putaway', href: 'warehouse/putaway', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] },
      { title: 'Picking Waves', href: 'warehouse/picking', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] },
      { title: 'Packing Station', href: 'warehouse/packing', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] },
      { title: 'Outbound Dispatch', href: 'warehouse/dispatch', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] },
      { title: 'Stock Transfers', href: 'warehouse/transfers', icon: 'Layers', requiredPermissions: ['wms:manage', 'manage:warehouse'] }
    ]
  },
  {
    title: 'Inventory Control',
    href: 'inventory',
    icon: 'Package',
    requiredPermissions: ['inventory:manage', 'manage:inventory'],
    children: [
      { title: 'Stock Levels', href: 'inventory/stock', icon: 'Layers', requiredPermissions: ['inventory:manage', 'manage:inventory'] },
      { title: 'FEFO Expiry Tracker', href: 'inventory/expiry', icon: 'Layers', requiredPermissions: ['inventory:manage', 'manage:inventory'] },
      { title: 'Stock Adjustments', href: 'inventory/adjustments', icon: 'Layers', requiredPermissions: ['inventory:manage', 'manage:inventory'] },
      { title: 'Cycle Counting', href: 'inventory/cycle-count', icon: 'Layers', requiredPermissions: ['inventory:manage', 'manage:inventory'] }
    ]
  },
  {
    title: 'Sales Force Automation',
    href: 'sfa',
    icon: 'MapPin',
    requiredPermissions: ['sfa:manage', 'manage:sfa', 'manage:sales'],
    children: [
      { title: 'Beat Planning', href: 'sfa/beat-planning', icon: 'Layers', requiredPermissions: ['sfa:manage', 'manage:sfa', 'manage:sales'] },
      { title: 'Store Visits', href: 'sfa/visits', icon: 'Layers', requiredPermissions: ['sfa:manage', 'manage:sfa', 'manage:sales'] },
      { title: 'DCR Collections', href: 'sfa/collections', icon: 'Layers', requiredPermissions: ['sfa:manage', 'manage:sfa', 'manage:sales'] }
    ]
  },
  {
    title: 'Order-to-Cash',
    href: 'sales',
    icon: 'FileSpreadsheet',
    requiredPermissions: ['o2c:manage', 'manage:sales'],
    children: [
      { title: 'Quotations', href: 'sales/quotations', icon: 'Layers', requiredPermissions: ['o2c:manage', 'manage:sales'] },
      { title: 'Sales Orders', href: 'sales/orders', icon: 'Layers', requiredPermissions: ['o2c:manage', 'manage:sales'] },
      { title: 'Delivery Challans', href: 'sales/delivery-notes', icon: 'Layers', requiredPermissions: ['o2c:manage', 'manage:sales'] },
      { title: 'GST Invoices', href: 'sales/invoices', icon: 'Layers', requiredPermissions: ['o2c:manage', 'manage:sales'] }
    ]
  },
  {
    title: 'Returns Management',
    href: 'returns',
    icon: 'Undo2',
    requiredPermissions: ['returns:manage', 'manage:returns', 'manage:sales'],
    children: [
      { title: 'Sales Returns (RMA)', href: 'returns/sales', icon: 'Layers', requiredPermissions: ['returns:manage', 'manage:sales'] },
      { title: 'Purchase Returns (RTV)', href: 'returns/purchase', icon: 'Layers', requiredPermissions: ['returns:manage', 'manage:procurement'] },
      { title: 'QC Inspection Staging', href: 'returns/inspection', icon: 'Layers', requiredPermissions: ['returns:manage', 'manage:warehouse'] }
    ]
  },
  {
    title: 'Finance & AR/AP',
    href: 'finance',
    icon: 'DollarSign',
    requiredPermissions: ['finance:manage', 'manage:finance'],
    children: [
      { title: 'Accounts Receivable (AR)', href: 'finance/receivable', icon: 'Layers', requiredPermissions: ['finance:manage', 'manage:finance'] },
      { title: 'Accounts Payable (AP)', href: 'finance/payable', icon: 'Layers', requiredPermissions: ['finance:manage', 'manage:finance'] },
      { title: 'General Ledger', href: 'finance/ledger', icon: 'Layers', requiredPermissions: ['finance:manage', 'manage:finance'] }
    ]
  },
  {
    title: 'Approval Workflow',
    href: 'workflow',
    icon: 'FolderLock',
    requiredPermissions: ['workflow:manage', 'manage:workflow'],
    children: [
      { title: 'Workflow Designer', href: 'workflow/designer', icon: 'Layers', requiredPermissions: ['workflow:manage', 'manage:security'] },
      { title: 'Approval Matrix', href: 'workflow/matrix', icon: 'Layers', requiredPermissions: ['workflow:manage', 'manage:security'] },
      { title: 'My Approvals Inbox', href: 'workflow/inbox', icon: 'Layers', requiredPermissions: ['workflow:manage', 'manage:workflow'] },
      { title: 'Delegation Rules', href: 'workflow/delegation', icon: 'Layers', requiredPermissions: ['workflow:manage', 'manage:workflow'] }
    ]
  },
  {
    title: 'HRMS Portal',
    href: 'hrms',
    icon: 'Users2',
    requiredPermissions: ['hrms:manage', 'manage:hrms'],
    children: [
      { title: 'Employee Roster', href: 'hrms/employees', icon: 'Layers', requiredPermissions: ['hrms:manage', 'manage:hrms'] },
      { title: 'Attendance Logs', href: 'hrms/attendance', icon: 'Layers', requiredPermissions: ['hrms:manage', 'manage:hrms'] },
      { title: 'Leave Management', href: 'hrms/leaves', icon: 'Layers', requiredPermissions: ['hrms:manage', 'manage:hrms'] }
    ]
  },
  {
    title: 'CRM & Customer Service',
    href: 'crm',
    icon: 'MessageSquare',
    requiredPermissions: ['crm:manage', 'manage:crm', 'manage:sales'],
    children: [
      { title: 'Customer 360', href: 'crm/customers', icon: 'Layers', requiredPermissions: ['crm:manage', 'manage:crm', 'manage:sales'] },
      { title: 'Complaints', href: 'crm/complaints', icon: 'Layers', requiredPermissions: ['crm:manage', 'manage:crm', 'manage:sales'] },
      { title: 'Service Tickets', href: 'crm/tickets', icon: 'Layers', requiredPermissions: ['crm:manage', 'manage:crm', 'manage:sales'] }
    ]
  },
  {
    title: 'Logistics & Delivery',
    href: 'logistics',
    icon: 'Truck',
    requiredPermissions: ['logistics:manage', 'manage:logistics', 'manage:warehouse'],
    children: [
      { title: 'Fleet Vehicles', href: 'logistics/vehicles', icon: 'Layers', requiredPermissions: ['logistics:manage', 'manage:warehouse'] },
      { title: 'Routes & Stops', href: 'logistics/routes', icon: 'Layers', requiredPermissions: ['logistics:manage', 'manage:warehouse'] },
      { title: 'Proof of Delivery', href: 'logistics/pod', icon: 'Layers', requiredPermissions: ['logistics:manage', 'manage:warehouse'] }
    ]
  },
  { 
    title: 'Reports', 
    href: 'reports', 
    icon: 'BarChart3',
    requiredPermissions: ['reports:manage', 'manage:reports']
  },
  { 
    title: 'Administration & Security', 
    href: 'admin', 
    icon: 'Settings',
    requiredPermissions: ['iam:manage', 'manage:security'],
    children: [
      { title: 'Security Dashboard', href: 'admin/security-center', icon: 'Layers', requiredPermissions: ['iam:manage', 'manage:security'] },
      { title: 'User Management', href: 'admin/security-center/user-management', icon: 'Users2', requiredPermissions: ['admin:manage_users', 'manage:users'] },
      { title: 'Roles & Permissions', href: 'admin/security-center/security-profiles', icon: 'Layers', requiredPermissions: ['iam:manage', 'manage:security'] },
      { title: 'Audit Logs', href: 'admin/security-center/audit-logs', icon: 'Layers', requiredPermissions: ['iam:manage', 'manage:security'] }
    ]
  }
];
