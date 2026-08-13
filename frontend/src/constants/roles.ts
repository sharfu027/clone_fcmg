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

export const ROLE_PERMISSIONS_MAP: Record<UserRole, string[]> = {
  'Super Administrator': [
    'read:dashboard', 'manage:masters', 'manage:procurement', 'manage:warehouse',
    'manage:inventory', 'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ],
  'Administrator': [
    'read:dashboard', 'manage:masters', 'manage:procurement', 'manage:warehouse',
    'manage:inventory', 'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ],
  'Procurement Manager': [
    'read:dashboard', 'manage:procurement', 'manage:suppliers'
  ],
  'Warehouse Manager': [
    'read:dashboard', 'manage:warehouse', 'manage:inventory'
  ],
  'Inventory Controller': [
    'read:dashboard', 'manage:inventory', 'manage:warehouse'
  ],
  'Sales Manager': [
    'read:dashboard', 'manage:sales', 'manage:pricing', 'manage:sfa', 'manage:crm'
  ],
  'Sales Representative': [
    'read:dashboard', 'manage:sales', 'manage:sfa', 'manage:crm'
  ],
  'Finance Manager': [
    'read:dashboard', 'manage:finance', 'manage:sales', 'manage:procurement'
  ],
  'Accountant': [
    'read:dashboard', 'manage:finance'
  ],
  'Branch Manager': [
    'read:dashboard', 'manage:masters', 'manage:sales', 'manage:inventory', 'manage:procurement'
  ],
  'Director': [
    'read:dashboard', 'manage:masters', 'manage:procurement', 'manage:warehouse',
    'manage:inventory', 'manage:sales', 'manage:finance', 'manage:security', 'manage:users'
  ]
};

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS_MAP[role] || ['read:dashboard'];
}
