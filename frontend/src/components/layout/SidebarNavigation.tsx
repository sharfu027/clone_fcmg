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

  // Permission-Driven Clearance Resolver (API-First Navigation)
  const hasPermission = (item: NavItem): boolean => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    if (!user || !user.permissions) return true;
    return item.requiredPermissions.some(perm => user.permissions?.includes(perm));
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
            <button
              onClick={() => {
                if (hasChildren) {
                  toggleSubMenu(item.title);
                } else {
                  onNavigate(item.href);
                }
              }}
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

            {!collapsed && hasChildren && isOpen && (
              <div className="pl-6 space-y-0.5 pt-0.5">
                {item.children?.filter(hasPermission).map(child => (
                  <button
                    key={child.href}
                    onClick={() => onNavigate(child.href)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-medium transition cursor-pointer block truncate ${
                      activeView === child.href ? 'text-white font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {child.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
