import { UserPermission } from './auth';

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  requiredPermissions?: UserPermission[];
  children?: NavItem[];
}

export interface Breadcrumb {
  label: string;
  href: string;
}
