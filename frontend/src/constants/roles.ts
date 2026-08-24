import { UserRole } from '../types';

export const ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
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

export interface MasterDataSubModuleGroup {
  groupName: string;
  groupKey: string;
  items: { code: string; name: string; subRoute: string }[];
}

export const MASTER_DATA_SUBMODULE_GROUPS: MasterDataSubModuleGroup[] = [
  {
    groupName: 'Company Master',
    groupKey: 'company',
    items: [
      { code: 'masters:company', name: 'Company Details', subRoute: 'masters/companies' },
      { code: 'masters:branch', name: 'Branches', subRoute: 'masters/branches' },
      { code: 'masters:department', name: 'Departments', subRoute: 'masters/departments' },
      { code: 'masters:warehouse', name: 'Warehouse / Stockist', subRoute: 'masters/warehouses' },
    ]
  },
  {
    groupName: 'Product Master',
    groupKey: 'product',
    items: [
      { code: 'masters:category', name: 'Category', subRoute: 'masters/categories' },
      { code: 'masters:brand', name: 'Brands', subRoute: 'masters/brands' },
      { code: 'masters:product', name: 'Products (SKUs)', subRoute: 'masters/products' },
      { code: 'masters:unit', name: 'Units (UOM)', subRoute: 'masters/units' },
    ]
  },
  {
    groupName: 'Employee Master',
    groupKey: 'employee',
    items: [
      { code: 'masters:employee', name: 'Employees Roster', subRoute: 'masters/employees' },
      { code: 'masters:employee_role', name: 'Employee Roles', subRoute: 'masters/employee-roles' },
      { code: 'masters:designation', name: 'Designations', subRoute: 'masters/designations' },
    ]
  },
  {
    groupName: 'Customer Master',
    groupKey: 'customer',
    items: [
      { code: 'masters:customer', name: 'Customer Registry', subRoute: 'masters/customers' },
    ]
  },
  {
    groupName: 'Supplier Master',
    groupKey: 'supplier',
    items: [
      { code: 'masters:supplier', name: 'Supplier & Partner Registry', subRoute: 'masters/suppliers' },
    ]
  }
];

export const MASTER_DATA_SUBMODULES = MASTER_DATA_SUBMODULE_GROUPS.flatMap(g => g.items.map(item => ({
  code: item.code,
  name: item.name,
  category: g.groupName,
  subRoutes: [item.subRoute]
})));

export const BRANCH_PARENT_PERMISSION = 'masters:branch';
export const BRANCH_PERMISSION = 'masters:branch';
export const WAREHOUSE_PERMISSION = 'masters:warehouse';
export const DEPARTMENT_PERMISSION = 'masters:department';
export const BRANCH_DEPENDENT_PERMISSIONS = ['masters:warehouse', 'masters:department'];

export const CATEGORY_PERMISSION = 'masters:category';
export const BRAND_PERMISSION = 'masters:brand';
export const UNIT_PERMISSION = 'masters:unit';
export const PRODUCT_PERMISSION = 'masters:product';
export const PRODUCT_PARENT_PERMISSIONS = ['masters:category', 'masters:brand', 'masters:unit'];

export const resolveCascadingPermissions = (explicitPermissions: string[] | Set<string>): {
  resolved: string[];
  inherited: Set<string>;
  explicit: Set<string>;
  inheritedSources: Record<string, string[]>;
} => {
  const explicitSet = new Set(explicitPermissions);
  const resolvedSet = new Set(explicitPermissions);
  const inheritedSet = new Set<string>();
  const inheritedSources: Record<string, string[]> = {};

  // 1. Company Master cascading hierarchy: Branch -> Warehouse -> Department
  if (explicitSet.has(BRANCH_PERMISSION)) {
    if (!explicitSet.has(WAREHOUSE_PERMISSION)) {
      inheritedSet.add(WAREHOUSE_PERMISSION);
      inheritedSources[WAREHOUSE_PERMISSION] = ['Branch'];
    }
    if (!explicitSet.has(DEPARTMENT_PERMISSION)) {
      inheritedSet.add(DEPARTMENT_PERMISSION);
      inheritedSources[DEPARTMENT_PERMISSION] = ['Branch'];
    }
    resolvedSet.add(WAREHOUSE_PERMISSION);
    resolvedSet.add(DEPARTMENT_PERMISSION);
  } else if (explicitSet.has(WAREHOUSE_PERMISSION)) {
    if (!explicitSet.has(DEPARTMENT_PERMISSION)) {
      inheritedSet.add(DEPARTMENT_PERMISSION);
      inheritedSources[DEPARTMENT_PERMISSION] = ['Warehouse / Stockist'];
    }
    resolvedSet.add(DEPARTMENT_PERMISSION);
  }

  // 2. Product Master cascading dependency: Category/Brand/UOM -> Products
  const productParents: string[] = [];
  if (explicitSet.has(CATEGORY_PERMISSION)) productParents.push('Category');
  if (explicitSet.has(BRAND_PERMISSION)) productParents.push('Brand');
  if (explicitSet.has(UNIT_PERMISSION) || explicitSet.has('masters:uom')) productParents.push('UOM');

  if (productParents.length > 0) {
    if (!explicitSet.has(PRODUCT_PERMISSION)) {
      inheritedSet.add(PRODUCT_PERMISSION);
    }
    inheritedSources[PRODUCT_PERMISSION] = productParents;
    resolvedSet.add(PRODUCT_PERMISSION);
  }

  return {
    resolved: Array.from(resolvedSet),
    inherited: inheritedSet,
    explicit: explicitSet,
    inheritedSources
  };
};

export const normalizePermissionDependencies = (permissions: string[]): string[] => {
  return resolveCascadingPermissions(permissions).resolved;
};

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
  'Super Admin': [
    'manage:all', 'read:dashboard', 'iam:manage', 'admin:manage_users', 'masters:manage',
    'pricing:manage', 'procurement:manage', 'wms:manage', 'inventory:manage', 'sfa:manage',
    'o2c:manage', 'returns:manage', 'finance:manage', 'workflow:manage', 'hrms:manage',
    'crm:manage', 'logistics:manage', 'reports:manage', 'bi:manage',
    'manage:masters', 'manage:procurement', 'manage:warehouse', 'manage:inventory',
    'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ],
  'Admin': [
    'read:dashboard'
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
