export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  DOCS: '/docs',
  BI: {
    ROOT: '/bi',
    SALES: '/bi/sales',
    INVENTORY: '/bi/inventory',
    FINANCE: '/bi/finance'
  },
  ADMIN_SECURITY: {
    ROOT: '/admin',
    SECURITY_CENTER: '/admin/security-center',
    SECURITY_AUTH: '/admin/security-center/authentication',
    SECURITY_DEVICES: '/admin/security-center/device-policy',
    SECURITY_PASSWORDS: '/admin/security-center/password-policy',
    SECURITY_PROFILES: '/admin/security-center/security-profiles',
    SECURITY_OVERRIDES: '/admin/security-center/employee-overrides',
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    SETTINGS: '/admin/settings'
  },
  REPORTS: {
    ROOT: '/reports',
    PROCUREMENT: '/reports/procurement',
    SALES: '/reports/sales',
    FINANCE: '/reports/finance',
    INVENTORY: '/reports/inventory'
  },
  LOGISTICS: {
    ROOT: '/logistics',
    VEHICLES: '/logistics/vehicles',
    ROUTES: '/logistics/routes',
    POD: '/logistics/pod'
  },
  CRM: {
    ROOT: '/crm',
    CUSTOMERS: '/crm/customers',
    COMPLAINTS: '/crm/complaints',
    TICKETS: '/crm/tickets'
  },
  HRMS: {
    ROOT: '/hrms',
    EMPLOYEES: '/hrms/employees',
    ATTENDANCE: '/hrms/attendance',
    LEAVES: '/hrms/leaves'
  },
  WORKFLOW: {
    ROOT: '/workflow',
    DESIGNER: '/workflow/designer',
    MATRIX: '/workflow/matrix',
    INBOX: '/workflow/inbox',
    DELEGATION: '/workflow/delegation'
  },
  FINANCE: {
    ROOT: '/finance',
    RECEIVABLE: '/finance/receivable',
    PAYABLE: '/finance/payable',
    LEDGER: '/finance/ledger'
  },
  RETURNS: {
    ROOT: '/returns',
    SALES: '/returns/sales',
    PURCHASE: '/returns/purchase',
    INSPECTION: '/returns/inspection'
  },
  SALES: {
    ROOT: '/sales',
    QUOTATIONS: '/sales/quotations',
    ORDERS: '/sales/orders',
    DELIVERY_NOTES: '/sales/delivery-notes',
    INVOICES: '/sales/invoices'
  },
  SFA: {
    ROOT: '/sfa',
    BEAT_PLANNING: '/sfa/beat-planning',
    VISITS: '/sfa/visits',
    COLLECTIONS: '/sfa/collections'
  },
  INVENTORY: {
    ROOT: '/inventory',
    STOCK: '/inventory/stock',
    EXPIRY: '/inventory/expiry',
    ADJUSTMENTS: '/inventory/adjustments',
    CYCLE_COUNT: '/inventory/cycle-count'
  },
  WAREHOUSE: {
    ROOT: '/warehouse',
    RECEIVING: '/warehouse/receiving',
    PUTAWAY: '/warehouse/putaway',
    PICKING: '/warehouse/picking',
    PACKING: '/warehouse/packing',
    DISPATCH: '/warehouse/dispatch',
    TRANSFERS: '/warehouse/transfers'
  },
  PROCUREMENT: {
    ROOT: '/procurement',
    REQUISITION: '/procurement/requisition',
    RFQ: '/procurement/rfq',
    QUOTATIONS: '/procurement/quotations',
    ORDERS: '/procurement/orders',
    GRN: '/procurement/grn',
    INVOICES: '/procurement/invoices',
    RETURNS: '/procurement/returns'
  },
  PRICING: {
    ROOT: '/pricing',
    LISTS: '/pricing/lists',
    CUSTOMER: '/pricing/customer',
    DISTRIBUTOR: '/pricing/distributor',
    DISCOUNTS: '/pricing/discounts',
    PROMOTIONS: '/pricing/promotions',
    TAXES: '/pricing/taxes',
    CURRENCIES: '/pricing/currencies'
  },
  MASTERS: {
    ROOT: '/masters',
    COMPANIES: '/masters/companies',
    BRANCHES: '/masters/branches',
    DEPARTMENTS: '/masters/departments',
    DESIGNATIONS: '/masters/designations',
    EMPLOYEE_ROLES: '/masters/employee-roles',
    EMPLOYEES: '/masters/employees',
    CUSTOMERS: '/masters/customers',
    SUPPLIERS: '/masters/suppliers',
    CATEGORIES: '/masters/categories',
    BRANDS: '/masters/brands',
    PRODUCTS: '/masters/products',
    UNITS: '/masters/units',
    WAREHOUSES: '/masters/warehouses'
  },
  AUTH: {
    ROOT: '/auth',
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SESSION_EXPIRED: '/auth/expired',
    ACCESS_DENIED: '/auth/access-denied',
    CHANGE_PASSWORD: '/auth/change-password'
  }
} as const;
