import { UserRole } from '../types';

export const ROLES: UserRole[] = [
  'Super Administrator',
  'Administrator',
  'Procurement Manager',
  'Warehouse Manager',
  'Inventory Controller',
  'Sales Manager',
  'Sales Representative',
  'Finance Manager',
  'Accountant',
  'Branch Manager',
  'Director'
];

export interface FMCGModulePermission {
  code: string;
  name: string;
  category: string;
  description: string;
  protected?: boolean;
}

export const CANONICAL_MODULE_PERMISSIONS: FMCGModulePermission[] = [
  { code: 'manage:all', name: 'Root System Clearance', category: 'Root', description: 'Complete unrestricted access across all 17 FMCG ERP modules', protected: true },
  { code: 'iam:manage', name: 'Authentication & Security Center', category: 'Security', description: 'Global security policies, MFA, biometrics, security profiles', protected: true },
  { code: 'admin:manage_users', name: 'Operational User Management', category: 'Administration', description: 'Manage operational employee user accounts, roster, and status' },
  { code: 'masters:manage', name: 'Master Data Engine', category: 'Core Masters', description: 'Companies, branches, departments, customers, suppliers, products' },
  { code: 'pricing:manage', name: 'Pricing & Promotions', category: 'Sales & Commercial', description: 'Price lists, volume discounts, customer pricing, and taxes' },
  { code: 'procurement:manage', name: 'Procurement & Sourcing', category: 'Supply Chain', description: 'PRs, RFQs, POs, GRN receiving, 3-way invoice matching' },
  { code: 'wms:manage', name: 'Warehouse Management System', category: 'Supply Chain', description: 'Putaway, picking waves, packing staging, stock transfers' },
  { code: 'inventory:manage', name: 'Inventory Control', category: 'Supply Chain', description: 'Stock levels, FEFO expiry tracking, cycle counting' },
  { code: 'sfa:manage', name: 'Sales Force Automation', category: 'Sales & Field', description: 'Beat planning, GPS store visits, live orders, and collections' },
  { code: 'o2c:manage', name: 'Order-to-Cash', category: 'Sales & Commercial', description: 'Quotations, sales orders, GST invoicing, delivery notes' },
  { code: 'returns:manage', name: 'Returns Management', category: 'Operations', description: 'RMA authorization, QC inspection staging, RTV vendor returns' },
  { code: 'finance:manage', name: 'Finance & AR/AP', category: 'Finance', description: 'Accounts receivable, accounts payable, general ledger' },
  { code: 'workflow:manage', name: 'Approval Workflow Engine', category: 'Operations', description: 'Workflow designer, approval matrix, delegation rules' },
  { code: 'hrms:manage', name: 'HRMS Portal', category: 'Human Capital', description: 'Employee roster, attendance tracking, leave management' },
  { code: 'crm:manage', name: 'CRM & Customer Service', category: 'Customer Care', description: 'Customer 360, complaints, service tickets' },
  { code: 'logistics:manage', name: 'Logistics & Delivery', category: 'Supply Chain', description: 'Fleet vehicles, route optimization, proof of delivery' },
  { code: 'reports:manage', name: 'Reports & Document Engine', category: 'Analytics', description: 'Query builder, print-ready document renderer, exports' },
  { code: 'bi:manage', name: 'Executive BI & Analytics', category: 'Analytics', description: 'Executive dashboards, sales & financial analytics charts' }
];

export const ROLE_PERMISSIONS_MAP: Record<UserRole, string[]> = {
  'Super Administrator': [
    'manage:all', 'read:dashboard', 'iam:manage', 'admin:manage_users', 'masters:manage',
    'pricing:manage', 'procurement:manage', 'wms:manage', 'inventory:manage', 'sfa:manage',
    'o2c:manage', 'returns:manage', 'finance:manage', 'workflow:manage', 'hrms:manage',
    'crm:manage', 'logistics:manage', 'reports:manage', 'bi:manage',
    'manage:masters', 'manage:procurement', 'manage:warehouse', 'manage:inventory',
    'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ],
  'Administrator': [
    'read:dashboard', 'admin:manage_users', 'masters:manage', 'procurement:manage',
    'wms:manage', 'inventory:manage', 'sfa:manage', 'o2c:manage', 'returns:manage',
    'finance:manage', 'hrms:manage', 'crm:manage', 'logistics:manage', 'reports:manage',
    'manage:masters', 'manage:procurement', 'manage:warehouse', 'manage:inventory',
    'manage:sales', 'manage:finance', 'manage:users'
  ],
  'Procurement Manager': [
    'read:dashboard', 'procurement:manage', 'returns:manage', 'masters:manage',
    'manage:procurement', 'manage:suppliers'
  ],
  'Warehouse Manager': [
    'read:dashboard', 'wms:manage', 'inventory:manage', 'logistics:manage',
    'manage:warehouse', 'manage:inventory'
  ],
  'Inventory Controller': [
    'read:dashboard', 'inventory:manage', 'wms:manage',
    'manage:inventory', 'manage:warehouse'
  ],
  'Sales Manager': [
    'read:dashboard', 'sfa:manage', 'o2c:manage', 'pricing:manage', 'crm:manage', 'bi:manage',
    'manage:sales', 'manage:pricing', 'manage:sfa', 'manage:crm'
  ],
  'Sales Representative': [
    'read:dashboard', 'sfa:manage', 'o2c:manage', 'crm:manage',
    'manage:sales', 'manage:sfa', 'manage:crm'
  ],
  'Finance Manager': [
    'read:dashboard', 'finance:manage', 'o2c:manage', 'procurement:manage', 'bi:manage',
    'manage:finance', 'manage:sales', 'manage:procurement'
  ],
  'Accountant': [
    'read:dashboard', 'finance:manage',
    'manage:finance'
  ],
  'Branch Manager': [
    'read:dashboard', 'masters:manage', 'o2c:manage', 'inventory:manage', 'procurement:manage',
    'manage:masters', 'manage:sales', 'manage:inventory', 'manage:procurement'
  ],
  'Director': [
    'read:dashboard', 'bi:manage', 'reports:manage', 'finance:manage', 'o2c:manage', 'procurement:manage',
    'manage:masters', 'manage:procurement', 'manage:warehouse', 'manage:inventory',
    'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ]
};

export function getPermissionsForRole(role: UserRole, customPermissions?: string[]): string[] {
  if (customPermissions && customPermissions.length > 0) {
    return Array.from(new Set(['read:dashboard', ...customPermissions]));
  }
  return ROLE_PERMISSIONS_MAP[role] || ['read:dashboard'];
}
