import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Shield,
  ChevronDown,
  ChevronRight,
  Clock,
  LogOut,
  Sparkles,
  Layers,
  Settings,
  HelpCircle,
  TrendingUp,
  X,
  Compass,
  AlertTriangle,
  FolderLock,
  Tag,
  ShoppingCart,
  Package,
  MapPin,
  FileSpreadsheet,
  Undo2,
  DollarSign,
  BarChart3,
  Users2
} from 'lucide-react';
import { UserRole, NavItem, UserProfile } from '../types';
import { NAVIGATION_MENU, ROLES } from '../constants';
import { useAuth } from '../context/AuthContext';

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
  Users2
};

function NavIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const IconComponent = IconMap[name] || Layers;
  return <IconComponent size={size} className={className} />;
}

interface EnterpriseLayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate: (viewId: string) => void;
  activeView: string;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  user: UserProfile;
}

export default function EnterpriseLayout({
  children,
  activeRole,
  onRoleChange,
  onNavigate,
  activeView,
  onTriggerToast,
  user
}: EnterpriseLayoutProps) {
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation setup and roles imported from constants
  const navigationMenu = NAVIGATION_MENU;
  const roles = ROLES;

  // Dynamic Navigation filtering based on Authentication Policy & Security Profile
  const hasPermission = (item: NavItem) => {
    // 1. Super Administrator ALWAYS has complete unrestricted root access to ALL modules by default (no one can disable Super Admin)
    if (
      activeRole === 'Super Administrator' ||
      user?.role === 'Super Administrator' ||
      user?.permissions?.includes('manage:all')
    ) {
      return true;
    }

    // 2. For all other users (Sub-Admins, Sales Representatives, etc.), enforce exact tailored module clearance
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    if (!user || !user.permissions || user.permissions.length === 0) return false;

    return item.requiredPermissions.some(perm => user.permissions?.includes(perm));
  };

  const filteredMenu = navigationMenu.filter(hasPermission);

  // Sub-menu toggle states
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'Master Data': false,
    'Inventory': false,
    'Finance': false
  });

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Mock Notifications
  const notifications = [
    { id: '1', title: 'Critical Credit Hold', desc: 'Britannia Wholesale exceeded credit threshold by ₹45k', type: 'danger', time: '4m ago' },
    { id: '2', title: 'Database Reconciled', desc: 'PostgreSQL Ledger Sync concluded for Eastern Outlet', type: 'success', time: '12m ago' },
    { id: '3', title: 'Pending Approval Request', desc: 'New purchase requisition pending Director signature', type: 'warning', time: '1h ago' }
  ];

  const BREADCRUMB_MAP: Record<string, string> = {
    'dashboard': 'Dashboard',
    'masters': 'Master Data',
    'pricing': 'Pricing & Promotions',
    'procurement': 'Procurement',
    'procurement/suppliers': 'Supplier Management',
    'procurement/requisition': 'Purchase Requisitions',
    'procurement/rfq': 'RFQs',
    'procurement/quotations': 'Supplier Quotations',
    'procurement/orders': 'Purchase Orders',
    'procurement/grn': 'Goods Receipts',
    'procurement/invoices': 'Purchase Invoices',
    'procurement/returns': 'Purchase Returns',
    'warehouse': 'Warehouse Management',
    'inventory': 'Inventory Control',
    'sfa': 'Sales Force Automation',
    'sales': 'Order-to-Cash',
    'returns': 'Returns Management',
    'finance': 'Finance & AR/AP',
    'workflow': 'Approval Workflow',
    'hrms': 'HRMS Portal',
    'crm': 'CRM & Service',
    'logistics': 'Logistics & Delivery',
    'reports': 'Reports',
    'admin': 'Administration & Security',
    'bi': 'Executive BI & Analytics'
  };

  // Dynamic Breadcrumb computation
  const getBreadcrumbs = () => {
    if (activeView === 'procurement') {
      return [
        { label: 'INK ERP', href: 'dashboard' },
        { label: 'Procurement', href: 'procurement' },
        { label: 'Procurement Dashboard', href: 'procurement' }
      ];
    }
    const parts = activeView.split('/');
    const items: { label: string; href: string }[] = [{ label: 'INK ERP', href: 'dashboard' }];
    let accumulated = '';
    parts.forEach(p => {
      accumulated = accumulated ? `${accumulated}/${p}` : p;
      const label = BREADCRUMB_MAP[accumulated] || (p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '));
      items.push({ label, href: accumulated });
    });
    return items;
  };

  // Search filter
  const allFlattenedNavs = navigationMenu.reduce((acc: { title: string; href: string }[], curr) => {
    acc.push({ title: curr.title, href: curr.href });
    if (curr.children) {
      curr.children.forEach(c => acc.push({ title: c.title, href: c.href }));
    }
    return acc;
  }, []);

  const searchResults = searchQuery
    ? allFlattenedNavs.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen flex bg-brand-bg-secondary text-brand-text-primary selection:bg-blue-100 selection:text-brand-primary">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside 
        id="desktop-sidebar"
        className={`bg-white border-r border-brand-border flex flex-col transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen hidden lg:flex ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand / Logo section */}
        <div className="h-16 px-4 border-b border-brand-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            I
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-brand-text-primary">INK FMCG ERP</span>
              <span className="text-[10px] text-brand-text-secondary font-semibold">Enterprise Sales & Distribution</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          
          {/* Main Menu */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-3 text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest block mb-2">
                ERP Modules
              </span>
            )}
            <nav className="space-y-1">
              {filteredMenu.map((item, idx) => {
                const isItemActive = activeView === item.href || activeView.startsWith(item.href + '/');
                const hasChildren = !!item.children;
                const isSubOpen = openSubMenus[item.title] ?? isItemActive;

                return (
                  <div key={idx} className="space-y-1">
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleSubMenu(item.title);
                        } else {
                          onNavigate(item.href);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md flex items-center justify-between transition cursor-pointer ${
                        isItemActive
                          ? 'bg-blue-50/70 text-brand-primary'
                          : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <NavIcon name={item.icon} size={14} className={isItemActive ? 'text-brand-primary' : 'text-brand-text-secondary'} />
                        </div>
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </div>
                      {!sidebarCollapsed && hasChildren && (
                        <ChevronRight 
                          size={12} 
                          className={`transition-transform duration-200 ${isSubOpen ? 'rotate-90' : ''}`} 
                        />
                      )}
                    </button>

                    {/* Nested Children */}
                    {!sidebarCollapsed && hasChildren && isSubOpen && (
                      <div className="pl-4 space-y-1 border-l border-brand-border/60 ml-5.5 mt-1">
                        {item.children?.map((child, cIdx) => {
                          const isChildActive = activeView === child.href;
                          return (
                            <button
                              key={cIdx}
                              onClick={() => onNavigate(child.href)}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded transition flex items-center justify-between cursor-pointer ${
                                isChildActive 
                                  ? 'text-brand-primary font-bold bg-blue-50/40' 
                                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
                              }`}
                            >
                              <span>{child.title}</span>
                              {isChildActive && <span className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info or Collapse Action */}
        <div className="p-3 border-t border-brand-border bg-brand-bg-secondary/40 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-brand-text-secondary">Depot Node</span>
              <span className="text-xs font-semibold text-brand-text-primary">Delhi Central [HQ]</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 border border-brand-border rounded bg-white hover:bg-brand-bg-secondary text-brand-text-secondary transition ml-auto cursor-pointer"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight size={14} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* MOBILE COLLAPSIBLE DRAWER PORTAL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay background */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
          />
          <div className="relative bg-white w-72 h-full flex flex-col p-4 shadow-xl-flat animate-fade-in border-r border-brand-border z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold">I</div>
                <span className="font-bold text-sm text-brand-text-primary">INK FMCG ERP</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-secondary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <span className="px-3 text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest block mb-2">
                ERP Modules
              </span>
              <nav className="space-y-1">
                {filteredMenu.map((item, idx) => {
                  const isItemActive = activeView === item.href || activeView.startsWith(item.href + '/');
                  const hasChildren = !!item.children && item.children.length > 0;
                  const isSubOpen = openSubMenus[item.title] ?? isItemActive;

                  return (
                    <div key={idx} className="space-y-1">
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubMenu(item.title);
                          } else {
                            onNavigate(item.href);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md flex items-center justify-between transition cursor-pointer ${
                          isItemActive
                            ? 'bg-blue-50/70 text-brand-primary'
                            : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <NavIcon name={item.icon} size={14} className={isItemActive ? 'text-brand-primary' : 'text-brand-text-secondary'} />
                          </div>
                          <span>{item.title}</span>
                        </div>
                        {hasChildren && (
                          <ChevronRight 
                            size={12} 
                            className={`transition-transform duration-200 ${isSubOpen ? 'rotate-90' : ''}`} 
                          />
                        )}
                      </button>

                      {/* Nested Children for Mobile Drawer */}
                      {hasChildren && isSubOpen && (
                        <div className="pl-4 space-y-1 border-l border-brand-border/60 ml-5.5 mt-1">
                          {item.children?.map((child, cIdx) => {
                            const isChildActive = activeView === child.href;
                            return (
                              <button
                                key={cIdx}
                                onClick={() => {
                                  onNavigate(child.href);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded transition flex items-center justify-between cursor-pointer ${
                                  isChildActive 
                                    ? 'text-brand-primary font-bold bg-blue-50/40' 
                                    : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
                                }`}
                              >
                                <span>{child.title}</span>
                                {isChildActive && <span className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC APPLICATION WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* GLOBAL STICKY TOP HEADER */}
        <header className="h-16 bg-white border-b border-brand-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm-flat">
          
          {/* Mobile Sidebar Trigger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 border border-brand-border rounded lg:hidden hover:bg-brand-bg-secondary text-brand-text-secondary transition"
            >
              <Menu size={18} />
            </button>
            
            {/* Dynamic Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-brand-text-secondary font-medium">
              {getBreadcrumbs().map((b, bIdx, arr) => (
                <React.Fragment key={bIdx}>
                  <button 
                    onClick={() => onNavigate(b.href)}
                    className="hover:text-brand-text-primary font-semibold transition"
                  >
                    {b.label}
                  </button>
                  {bIdx < arr.length - 1 && <ChevronRight size={12} className="text-brand-border" />}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Global Multi-Search */}
          <div className="hidden sm:flex items-center gap-2 max-w-md w-full relative mx-4">
            <Search size={14} className="text-brand-text-secondary absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search SKUs, suppliers, accounting ledgers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs border border-brand-border bg-brand-bg-secondary/50 rounded focus:outline-none focus:border-brand-primary focus:bg-white transition"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-brand-text-secondary hover:text-brand-text-primary"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="absolute right-3 top-1.5 px-1.5 py-0.5 bg-brand-border rounded text-[9px] font-mono text-brand-text-secondary">
                ⌘K
              </span>
            )}

            {/* Live Global Search Results */}
            {searchQuery && (
              <div className="absolute z-50 left-0 right-0 top-10 bg-white border border-brand-border rounded shadow-lg-flat p-2 max-h-60 overflow-y-auto space-y-1">
                <span className="block text-[10px] font-bold text-brand-text-secondary uppercase px-2 py-1">Quick results</span>
                {searchResults.length > 0 ? (
                  searchResults.map((res, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => {
                        onNavigate(res.href);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-brand-text-primary hover:bg-brand-bg-secondary rounded flex justify-between items-center"
                    >
                      <span>{res.title}</span>
                      <span className="text-[10px] font-mono text-brand-text-secondary">Go to module</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-center text-brand-text-secondary">No matching screens found.</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions & Profiles */}
          <div className="flex items-center gap-3">

            {/* Quick Actions Triggers */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowQuickActions(!showQuickActions);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                className="px-3 py-1.5 border border-brand-border hover:bg-brand-bg-secondary text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <Sparkles size={13} className="text-brand-primary" />
                <span>Quick Actions</span>
                <ChevronDown size={12} className="text-brand-text-secondary" />
              </button>

              {showQuickActions && (
                <div className="absolute z-50 right-0 mt-1 bg-white border border-brand-border rounded shadow-md-flat w-56 p-1">
                  <div className="px-3 py-1.5 border-b border-brand-border bg-brand-bg-secondary text-[10px] uppercase font-bold text-brand-text-secondary">
                    Simulate System Scenarios
                  </div>
                  <button 
                    onClick={() => {
                      setShowQuickActions(false);
                      onNavigate('auth/session-expired');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-brand-bg-secondary text-brand-text-primary rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Clock size={13} className="text-brand-warning" /> Trigger Session Expired
                  </button>
                  <button 
                    onClick={() => {
                      setShowQuickActions(false);
                      onNavigate('auth/access-denied');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-brand-bg-secondary text-brand-text-primary rounded flex items-center gap-2 cursor-pointer"
                  >
                    <FolderLock size={13} className="text-brand-danger" /> Trigger Access Denied
                  </button>
                  <button 
                    onClick={() => {
                      setShowQuickActions(false);
                      onTriggerToast('warning', 'SignalR Resetting', 'Establishing secondary network fallback loops.');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-brand-bg-secondary text-brand-text-primary rounded flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle size={13} className="text-brand-info" /> Cycle SignalR Socket
                  </button>
                </div>
              )}
            </div>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setShowQuickActions(false);
                }}
                className="p-2 border border-brand-border rounded hover:bg-brand-bg-secondary text-brand-text-secondary transition relative cursor-pointer"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-danger rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute z-50 right-0 mt-1 bg-white border border-brand-border rounded shadow-md-flat w-80 p-2">
                  <div className="flex justify-between items-center border-b border-brand-border pb-1.5 mb-1.5 px-2">
                    <span className="text-[10px] font-bold uppercase text-brand-text-secondary">Notifications ({notifications.length})</span>
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        onTriggerToast('success', 'Inbox Cleared', 'All outstanding indicators marked read.');
                      }}
                      className="text-[10px] text-brand-primary font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 hover:bg-brand-bg-secondary rounded flex gap-2.5 transition text-left">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                          n.type === 'danger' ? 'bg-brand-danger' :
                          n.type === 'success' ? 'bg-brand-success' : 'bg-brand-warning'
                        }`} />
                        <div>
                          <h5 className="text-xs font-bold text-brand-text-primary leading-tight">{n.title}</h5>
                          <p className="text-[10px] text-brand-text-secondary mt-0.5 leading-snug">{n.desc}</p>
                          <span className="text-[9px] text-brand-text-secondary font-mono mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                  setShowQuickActions(false);
                }}
                className="flex items-center gap-2 p-1 border border-brand-border rounded hover:border-brand-primary transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-brand-text-primary leading-tight">{user.name}</span>
                  <span className="text-[9px] text-brand-text-secondary leading-none">{activeRole}</span>
                </div>
                <ChevronDown size={14} className="text-brand-text-secondary" />
              </button>

              {showProfileMenu && (
                <div className="absolute z-50 right-0 mt-1 bg-white border border-brand-border rounded shadow-md-flat w-56 p-1 text-xs">
                  <div className="px-3 py-2 border-b border-brand-border bg-brand-bg-secondary">
                    <p className="font-bold text-brand-text-primary">{user.name}</p>
                    <p className="text-[10px] text-brand-text-secondary font-mono leading-tight">{user.email}</p>
                    <p className="text-[10px] text-brand-text-secondary mt-1">Branch: <strong>{user.branch}</strong></p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('docs');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-bg-secondary text-brand-text-primary rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Layers size={13} /> Design System Docs
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-bg-secondary text-brand-text-primary rounded flex items-center gap-2 cursor-pointer"
                  >
                    <TrendingUp size={13} /> Return to Dashboard
                  </button>
                  <button 
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await logout();
                      onNavigate('auth/login');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-brand-bg-secondary text-brand-danger font-semibold rounded border-t border-brand-border mt-1 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={13} /> Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT LAYOUT */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-brand-border py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-brand-text-secondary shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-text-primary">INK FMCG ERP</span>
            <span>|</span>
            <span>Design System & Application Shell Foundation</span>
          </div>
          <div className="flex gap-4 mt-2 md:mt-0 font-mono">
            <span>Server Time: 2026-07-21 01:57 UTC</span>
            <span>API Status: Healthy (SignalR Active)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
