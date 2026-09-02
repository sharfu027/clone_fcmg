import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Layers,
  Compass,
  FolderLock,
  Settings,
  HelpCircle,
  Tag,
  ShoppingCart,
  Package,
  MapPin,
  FileSpreadsheet,
  Undo2,
  DollarSign,
  BarChart3,
  Users2,
  Truck,
  MessageSquare
} from 'lucide-react';
import { NavItem, UserProfile } from '../../types';
import { NAVIGATION_MENU } from '../../constants/navigation';
import { Tooltip } from '../ui/Tooltip';

const IconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TrendingUp,
  Layers,
  Compass,
  FolderLock,
  Settings,
  HelpCircle,
  Tag,
  ShoppingCart,
  Package,
  MapPin,
  FileSpreadsheet,
  Undo2,
  DollarSign,
  BarChart3,
  Users2,
  Truck,
  MessageSquare
};

function NavIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const IconComponent = IconMap[name] || Layers;
  return <IconComponent size={size} className={className} />;
}

interface SidebarNavigationProps {
  user: UserProfile;
  activeView: string;
  onNavigate: (href: string) => void;
  collapsed: boolean;
}

export default function SidebarNavigation({
  user,
  activeView,
  onNavigate,
  collapsed
}: SidebarNavigationProps) {
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'Master Data': true
  });

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const userPermCodes = React.useMemo(() => {
    if (!user || !user.permissions) return [];
    return user.permissions.map((p: any) => (typeof p === 'string' ? p : p.code || '')).filter(Boolean);
  }, [user]);

  // Dedicated Master Data Effective Access Evaluator
  const hasMasterDataSubmoduleAccess = (subCode: string): boolean => {
    if (userPermCodes.length === 0) return false;

    // Root Super Admin bypass
    const isRootSuper = user.role === 'Super Admin' ||
                        user.role === 'Super Administrator' ||
                        userPermCodes.includes('manage:all') ||
                        (user.email && user.email.toLowerCase().includes('superadmin'));
    if (isRootSuper) return true;

    // Dual-Check Rule: ParentPermission(masters:manage) AND ChildPermission(masters:<submodule>) OR direct granular permission
    const hasParent = userPermCodes.includes('masters:manage');
    const hasChild = userPermCodes.includes(subCode) || userPermCodes.includes(`${subCode}:view`);
    return (hasParent && hasChild) || userPermCodes.includes(subCode) || userPermCodes.includes(`${subCode}:view`);
  };

  // Permission-Driven Clearance Resolver (API-First Navigation)
  const hasPermission = (item: NavItem): boolean => {
    if (item.href === 'dashboard') return true;
    if (userPermCodes.length === 0) return false;

    const isRootSuper = user.role === 'Super Admin' ||
                        user.role === 'Super Administrator' ||
                        userPermCodes.includes('manage:all') ||
                        (user.email && user.email.toLowerCase().includes('superadmin'));
    if (isRootSuper) return true;

    // Restrict Sales Team Management to Company Admins, Admins, and Managers (while hiding strictly from field sales reps)
    if (item.href === 'sales-team' || item.href.startsWith('sales-team')) {
      const isFieldRep = user.role === 'Sales Representative' || user.role === 'SALES_REP';
      if (isFieldRep) return false;
      return isRootSuper ||
             user.role === 'Admin' ||
             user.role === 'Company Admin' ||
             user.role === 'Company Administrator' ||
             user.role === 'Sales Manager' ||
             userPermCodes.includes('sales_team:manage') ||
             userPermCodes.includes('sales_team:view') ||
             userPermCodes.includes('sfa:manage') ||
             userPermCodes.includes('manage:sales') ||
             userPermCodes.includes('admin:manage_users') ||
             userPermCodes.includes('manage:security');
    }

    // Restrict Administration & Security Center to Admins
    if (item.href === 'admin' || item.href.startsWith('admin/')) {
      return isRootSuper || user.role === 'Admin' || userPermCodes.includes('iam:manage') || userPermCodes.includes('manage:security');
    }

    if (item.href.startsWith('masters/')) {
      const subSlug = item.href.split('/')[1];
      const branchMap: Record<string, string> = {
        companies: 'masters:company',
        branches: 'masters:branch',
        warehouses: 'masters:warehouse',
        departments: 'masters:department',
        products: 'masters:product',
        categories: 'masters:category',
        brands: 'masters:brand',
        units: 'masters:unit',
        employees: 'masters:employee',
        'employee-roles': 'masters:employee_role',
        designations: 'masters:designation',
        customers: 'masters:customer',
        suppliers: 'masters:supplier'
      };
      const subCode = branchMap[subSlug] || `masters:${subSlug}`;

      return hasMasterDataSubmoduleAccess(subCode);
    }

    if (item.href === 'masters') {
      const branchPermissions = ['masters:company', 'masters:product', 'masters:employee', 'masters:customer', 'masters:supplier'];
      return branchPermissions.some(b => hasMasterDataSubmoduleAccess(b));
    }

    // Restrict global User Management to Super Admin only (Company Admin uses Sales Team Management)
    if (item.href === 'admin/security-center/user-management' || item.href.includes('user-management')) {
      return isRootSuper;
    }

    return item.requiredPermissions.some(perm => userPermCodes.includes(perm));
  };

  const filteredMenu = NAVIGATION_MENU.filter(hasPermission);

  return (
    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
      {filteredMenu.map(item => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openSubMenus[item.title];
        const isActive = activeView === item.href || activeView.startsWith(`${item.href}/`);

        return (
          <div key={item.href} className="space-y-0.5">
            <Tooltip content={item.title} position="right" disabled={!collapsed}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleSubMenu(item.title);
                  } else {
                    onNavigate(item.href);
                  }
                }}
                aria-label={item.title}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                  isActive ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <NavIcon name={item.icon} size={15} />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </div>
                {!collapsed && hasChildren && (
                  <span className="text-slate-400">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
              </button>
            </Tooltip>

            {!collapsed && hasChildren && isOpen && (
              <div className="pl-4 space-y-1 pt-0.5">
                {item.children?.filter(hasPermission).map(child => {
                  const hasSubChildren = child.children && child.children.length > 0;
                  const isSubOpen = openSubMenus[child.title] !== false;
                  const isSubActive = activeView === child.href || activeView.startsWith(`${child.href}/`);

                  return (
                    <div key={child.href} className="space-y-0.5">
                      <div className="flex items-center justify-between group">
                        <button
                          onClick={() => onNavigate(child.href)}
                          className={`flex-1 text-left px-2.5 py-1.5 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 truncate ${
                            isSubActive ? 'text-white font-bold bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span className="truncate">{child.title}</span>
                        </button>
                        {hasSubChildren && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleSubMenu(child.title); }}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        )}
                      </div>

                      {hasSubChildren && isSubOpen && (
                        <div className="pl-4 space-y-0.5 border-l border-slate-700/60 ml-2.5 my-0.5">
                          {child.children?.filter(hasPermission).map(leaf => (
                            <button
                              key={leaf.href}
                              onClick={() => onNavigate(leaf.href)}
                              className={`w-full text-left px-2 py-1 rounded text-[10.5px] font-medium transition cursor-pointer block truncate ${
                                activeView === leaf.href ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                              }`}
                            >
                              . {leaf.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
