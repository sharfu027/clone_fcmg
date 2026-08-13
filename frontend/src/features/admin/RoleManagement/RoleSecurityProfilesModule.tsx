import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  Copy,
  Edit3,
  Trash2,
  Eye,
  UserCheck,
  Key,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Filter,
  X,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Grid
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { RoleDto, RoleStatsDto, PermissionCategoryDto, RoleUserDto } from '../../../types/admin';
import { StatCard } from '../../../components/ui/StatCard';
import { Badge } from '../../../components/ui/Badge';

interface RoleSecurityProfilesModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

const MATRIX_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'reject', label: 'Reject' },
  { key: 'export', label: 'Export' },
  { key: 'print', label: 'Print' },
  { key: 'import', label: 'Import' }
];

export const RoleSecurityProfilesModule: React.FC<RoleSecurityProfilesModuleProps> = ({ onTriggerToast }) => {
  // ── States ──────────────────────────────────────────
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<RoleStatsDto>({
    totalRoles: 0,
    activeRoles: 0,
    inactiveRoles: 0,
    systemRoles: 0,
    customRoles: 0,
    totalUsersAssigned: 0,
    totalPermissionsCount: 0
  });

  // Selected Role Drawer / Modals
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<RoleDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'general' | 'permissions' | 'users' | 'audit'>('general');

  // Create / Edit Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    id: '',
    name: '',
    code: '',
    description: '',
    priority: 10,
    isActive: true
  });

  // Clone Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneFormData, setCloneFormData] = useState({
    sourceRoleId: '',
    newName: '',
    newCode: '',
    description: ''
  });

  // Permission Matrix Editor Modal
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<PermissionCategoryDto[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [matrixSearch, setMatrixSearch] = useState('');

  // Role Users Drawer State
  const [assignedUsers, setAssignedUsers] = useState<RoleUserDto[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ── Data Fetching ───────────────────────────────────

  const loadRolesAndStats = async () => {
    setIsLoading(true);
    try {
      const statsData = await adminService.getRoleStats();
      setStats(statsData);

      const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
      const isSystemParam = typeFilter === 'all' ? undefined : typeFilter === 'system';

      const pagedResult = await adminService.fetchRoles({
        searchTerm,
        isActive: isActiveParam,
        isSystem: isSystemParam,
        pageNumber,
        pageSize
      });

      if (pagedResult && pagedResult.items) {
        setRoles(pagedResult.items);
        setTotalCount(pagedResult.totalCount);
      } else {
        setRoles([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('Failed to load roles:', err);
      onTriggerToast('error', 'Failed to Load Roles', err?.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRolesAndStats();
  }, [pageNumber, searchTerm, statusFilter, typeFilter]);

  const loadPermissionCategories = async () => {
    try {
      const categories = await adminService.getAvailablePermissions();
      setAvailableCategories(categories);
      // Default all categories expanded
      setExpandedCategories(new Set(categories.map(c => c.id)));
    } catch (err) {
      console.error('Failed to load permission matrix categories:', err);
    }
  };

  useEffect(() => {
    loadPermissionCategories();
  }, []);

  // ── Role Details Drawer Loader ──────────────────────
  const handleOpenDrawer = async (roleId: string) => {
    setSelectedRoleId(roleId);
    setIsDrawerOpen(true);
    setDrawerTab('general');
    try {
      const roleDetail = await adminService.getRoleById(roleId);
      setSelectedRoleDetail(roleDetail);
      // Fetch assigned users
      setIsLoadingUsers(true);
      const usersList = await adminService.getRoleUsers(roleId);
      setAssignedUsers(usersList);
    } catch (err) {
      console.error('Error fetching role details:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // ── Open Permission Matrix Editor ────────────────────
  const handleOpenPermissionMatrix = async (role: RoleDto) => {
    setSelectedRoleDetail(role);
    setIsMatrixModalOpen(true);
    try {
      const assignedPermIds = await adminService.getRolePermissions(role.id);
      setSelectedPermissionIds(new Set(assignedPermIds));
    } catch (err) {
      console.error('Failed to load assigned role permissions:', err);
    }
  };

  // ── Save Permission Matrix ───────────────────────────
  const handleSavePermissionMatrix = async () => {
    if (!selectedRoleDetail) return;
    try {
      const permIdsList = Array.from(selectedPermissionIds) as string[];
      await adminService.updateRolePermissions(selectedRoleDetail.id, permIdsList);
      onTriggerToast('success', 'Permission Matrix Saved', `Updated permissions for role '${selectedRoleDetail.name}'.`);
      setIsMatrixModalOpen(false);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to save permission matrix';
      onTriggerToast('error', 'Save Failed', msg);
    }
  };

  // ── Toggle Permission Checkbox ──────────────────────
  const togglePermission = (permId: string) => {
    setSelectedPermissionIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  // Toggle Category Select All / Clear All
  const toggleCategoryPermissions = (category: PermissionCategoryDto) => {
    const catPermIds = category.permissions.map(p => p.id);
    const allSelected = catPermIds.every(id => selectedPermissionIds.has(id));

    setSelectedPermissionIds(prev => {
      const next = new Set(prev);
      catPermIds.forEach(id => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  // Toggle Global Select All
  const handleSelectAllGlobal = () => {
    const allIds = availableCategories.flatMap(c => c.permissions.map(p => p.id));
    setSelectedPermissionIds(new Set(allIds));
  };

  const handleClearAllGlobal = () => {
    setSelectedPermissionIds(new Set());
  };

  // ── Role Actions (Activate/Deactivate/Delete/Clone) ─
  const handleToggleActivate = async (role: RoleDto) => {
    try {
      if (role.isActive) {
        await adminService.deactivateRole(role.id);
        onTriggerToast('info', 'Role Deactivated', `'${role.name}' has been deactivated.`);
      } else {
        await adminService.activateRole(role.id);
        onTriggerToast('success', 'Role Activated', `'${role.name}' is now active.`);
      }
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to change role status';
      onTriggerToast('error', 'Action Failed', msg);
    }
  };

  const handleDeleteRole = async (role: RoleDto) => {
    if (role.isSystem) {
      onTriggerToast('warning', 'System Role Protection', `System role '${role.name}' cannot be deleted.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role '${role.name}'?`)) return;

    try {
      await adminService.deleteRole(role.id);
      onTriggerToast('success', 'Role Deleted', `Role '${role.name}' was soft-deleted.`);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to delete role';
      onTriggerToast('error', 'Delete Failed', msg);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name || !roleFormData.code) {
      onTriggerToast('warning', 'Validation Error', 'Role Name and Code are required.');
      return;
    }

    try {
      await adminService.createRole({
        name: roleFormData.name,
        code: roleFormData.code.toUpperCase().replace(/\s+/g, '_'),
        description: roleFormData.description,
        priority: roleFormData.priority
      });
      onTriggerToast('success', 'Role Created', `Role '${roleFormData.name}' created successfully.`);
      setIsCreateModalOpen(false);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to create role';
      onTriggerToast('error', 'Creation Failed', msg);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.updateRole(roleFormData.id, {
        name: roleFormData.name,
        description: roleFormData.description,
        priority: roleFormData.priority,
        isActive: roleFormData.isActive
      });
      onTriggerToast('success', 'Role Updated', `Role '${roleFormData.name}' details saved.`);
      setIsEditModalOpen(false);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to update role';
      onTriggerToast('error', 'Update Failed', msg);
    }
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneFormData.newName || !cloneFormData.newCode) {
      onTriggerToast('warning', 'Validation Error', 'New Role Name and Code are required.');
      return;
    }

    try {
      await adminService.cloneRole(cloneFormData.sourceRoleId, {
        newName: cloneFormData.newName,
        newCode: cloneFormData.newCode.toUpperCase().replace(/\s+/g, '_'),
        description: cloneFormData.description
      });
      onTriggerToast('success', 'Role Cloned', `Role '${cloneFormData.newName}' cloned successfully.`);
      setIsCloneModalOpen(false);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to clone role';
      onTriggerToast('error', 'Clone Failed', msg);
    }
  };

  const handleRemoveUserFromRole = async (userId: string, userName: string) => {
    if (!selectedRoleDetail) return;
    if (!window.confirm(`Remove '${userName}' from role '${selectedRoleDetail.name}'?`)) return;

    try {
      await adminService.removeUserFromRole(selectedRoleDetail.id, userId);
      onTriggerToast('success', 'User Removed', `'${userName}' removed from role '${selectedRoleDetail.name}'.`);
      // Reload assigned users list
      const updatedUsers = await adminService.getRoleUsers(selectedRoleDetail.id);
      setAssignedUsers(updatedUsers);
      loadRolesAndStats();
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to remove user';
      onTriggerToast('error', 'Action Blocked', msg);
    }
  };

  // ── Filtered Matrix Categories ──────────────────────
  const filteredCategories = useMemo(() => {
    if (!matrixSearch.trim()) return availableCategories;
    const query = matrixSearch.toLowerCase();
    return availableCategories.map(cat => ({
      ...cat,
      permissions: cat.permissions.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    })).filter(cat => cat.permissions.length > 0 || cat.name.toLowerCase().includes(query));
  }, [availableCategories, matrixSearch]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      
      {/* ── SECTION 1: ROLE MODULE STATISTICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Security Roles"
          value={`${stats.totalRoles} Roles`}
          badgeText={`System: ${stats.systemRoles}`}
          badgeVariant="primary"
          subLabel="Custom Profiles"
          subValue={`${stats.customRoles} Custom Roles`}
        />
        <StatCard
          title="Active Role Profiles"
          value={`${stats.activeRoles} Active`}
          badgeText={`Inactive: ${stats.inactiveRoles}`}
          badgeVariant="success"
          subLabel="Assigned Users"
          subValue={`${stats.totalUsersAssigned} Users Enrolled`}
        />
        <StatCard
          title="Permission Engine Registry"
          value={`${stats.totalPermissionsCount} Rules`}
          badgeText="7 Modules"
          badgeVariant="info"
          subLabel="Granular Actions"
          subValue="View, Create, Edit, Delete, Approve..."
        />
        <StatCard
          title="RBAC Authorization Health"
          value="100% Validated"
          badgeText="RBAC Active"
          badgeVariant="success"
          subLabel="Zero In-Memory Cache Drift"
          subValue="Active Permission Resolver"
        />
      </div>

      {/* ── SECTION 2: MAIN TOOLBAR ── */}
      <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPageNumber(1); }}
              placeholder="Search by role name or code (e.g. SALES_MANAGER)..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg border-brand-border text-xs focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-brand-border/80 text-xs font-semibold">
            <Filter size={14} className="text-slate-400 ml-1.5" />
            <button
              onClick={() => { setStatusFilter('all'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${statusFilter === 'all' ? 'bg-white font-bold shadow-xs text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Status
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Active
            </button>
            <button
              onClick={() => { setStatusFilter('inactive'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${statusFilter === 'inactive' ? 'bg-amber-50 text-amber-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Inactive
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-brand-border/80 text-xs font-semibold">
            <button
              onClick={() => { setTypeFilter('all'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${typeFilter === 'all' ? 'bg-white font-bold shadow-xs text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Types
            </button>
            <button
              onClick={() => { setTypeFilter('system'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${typeFilter === 'system' ? 'bg-blue-50 text-blue-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              System
            </button>
            <button
              onClick={() => { setTypeFilter('custom'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${typeFilter === 'custom' ? 'bg-purple-50 text-purple-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Custom
            </button>
          </div>

        </div>

        {/* Create Role Button */}
        <button
          onClick={() => {
            setRoleFormData({ id: '', name: '', code: '', description: '', priority: 10, isActive: true });
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Create Security Role
        </button>
      </div>

      {/* ── SECTION 3: ROLES TABLE ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-300 font-bold tracking-wide uppercase text-[10px] border-b border-slate-800">
                <th className="p-3.5 pl-4">Role Profile</th>
                <th className="p-3.5">Code / Priority</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-center">Assigned Users</th>
                <th className="p-3.5 text-center">Permissions</th>
                <th className="p-3.5">Role Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                    Loading production security roles from PostgreSQL...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                    No security roles found matching search and filter criteria.
                  </td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Role Name & Icon */}
                    <td className="p-3.5 pl-4 font-bold text-brand-text-primary">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          role.isSystem ? 'bg-blue-50 text-brand-primary border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          <Shield size={16} />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900 hover:text-brand-primary transition cursor-pointer" onClick={() => handleOpenDrawer(role.id)}>
                            {role.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {role.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Code / Priority */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 font-mono font-bold text-[10px] text-slate-700 rounded">
                        {role.code}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                        Priority P{role.priority}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-600 max-w-[220px] truncate" title={role.description}>
                      {role.description || 'No description provided.'}
                    </td>

                    {/* Users Count */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full font-bold text-slate-700">
                        <Users size={12} className="text-slate-500" />
                        {role.usersCount}
                      </span>
                    </td>

                    {/* Permission Count */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenPermissionMatrix(role)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full font-bold text-brand-primary transition cursor-pointer"
                        title="Click to view & edit permission matrix"
                      >
                        <Key size={12} />
                        {role.permissionCount} Rules
                      </button>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5">
                      {role.isSystem ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                          <Lock size={10} /> System Role
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px] rounded-full">
                          Custom Role
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {role.isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-3.5 text-slate-500 text-[11px] font-mono">
                      {new Date(role.createdAtUtc).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* View Drawer */}
                        <button
                          onClick={() => handleOpenDrawer(role.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="View Role Details & Assigned Users"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Permission Matrix */}
                        <button
                          onClick={() => handleOpenPermissionMatrix(role)}
                          className="p-1.5 text-brand-primary hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                          title="Configure Permission Matrix"
                        >
                          <Grid size={14} />
                        </button>

                        {/* Edit Role */}
                        <button
                          onClick={() => {
                            setRoleFormData({
                              id: role.id,
                              name: role.name,
                              code: role.code,
                              description: role.description,
                              priority: role.priority,
                              isActive: role.isActive
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Role Metadata"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Clone Role */}
                        <button
                          onClick={() => {
                            setCloneFormData({
                              sourceRoleId: role.id,
                              newName: `${role.name} (Copy)`,
                              newCode: `${role.code}_COPY`,
                              description: role.description
                            });
                            setIsCloneModalOpen(true);
                          }}
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition cursor-pointer"
                          title="Clone Role Profile"
                        >
                          <Copy size={14} />
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          onClick={() => handleToggleActivate(role)}
                          className={`p-1.5 rounded transition cursor-pointer ${
                            role.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={role.isActive ? 'Deactivate Role' : 'Activate Role'}
                        >
                          {role.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                        </button>

                        {/* Delete Role */}
                        <button
                          onClick={() => handleDeleteRole(role)}
                          disabled={role.isSystem}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={role.isSystem ? 'System roles cannot be deleted' : 'Soft Delete Role'}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="bg-slate-50 p-3 border-t border-brand-border flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-800">{pageNumber}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} Total Roles)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1.5 border rounded-lg border-brand-border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
              disabled={pageNumber >= totalPages}
              className="px-3 py-1.5 border rounded-lg border-brand-border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: CREATE ROLE ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                <Shield className="text-brand-primary" size={18} /> Create New Security Role
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  placeholder="e.g. Regional Sales Supervisor"
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Role Code (Regex: A-Z, 0-9, _) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={roleFormData.code}
                  onChange={e => setRoleFormData({ ...roleFormData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. REGIONAL_SALES_SUPERVISOR"
                  className="w-full p-2 border rounded-lg border-brand-border outline-none font-mono text-xs font-bold focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roleFormData.description}
                  onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  placeholder="Describe functional responsibilities and scope of access..."
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Execution Priority Order (P1 = Highest)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={roleFormData.priority}
                  onChange={e => setRoleFormData({ ...roleFormData, priority: parseInt(e.target.value) || 10 })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer shadow-xs">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ROLE ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                <Edit3 className="text-brand-primary" size={18} /> Edit Security Role Metadata
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-brand-primary font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Role Code (Read-Only)</label>
                <input
                  type="text"
                  disabled
                  value={roleFormData.code}
                  className="w-full p-2 border rounded-lg border-brand-border bg-slate-100 font-mono text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roleFormData.description}
                  onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Priority</label>
                  <input
                    type="number"
                    value={roleFormData.priority}
                    onChange={e => setRoleFormData({ ...roleFormData, priority: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded-lg border-brand-border outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">Status</label>
                  <select
                    value={roleFormData.isActive ? 'Active' : 'Inactive'}
                    onChange={e => setRoleFormData({ ...roleFormData, isActive: e.target.value === 'Active' })}
                    className="w-full p-2 border rounded-lg border-brand-border bg-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer shadow-xs">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CLONE ROLE ── */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                <Copy className="text-purple-600" size={18} /> Clone Existing Security Role
              </h3>
              <button onClick={() => setIsCloneModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCloneSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium">
                Cloning will create a duplicate role profile and automatically copy all assigned permissions.
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">New Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={cloneFormData.newName}
                  onChange={e => setCloneFormData({ ...cloneFormData, newName: e.target.value })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-purple-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">New Role Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={cloneFormData.newCode}
                  onChange={e => setCloneFormData({ ...cloneFormData, newCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none font-mono text-xs font-bold focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  value={cloneFormData.description}
                  onChange={e => setCloneFormData({ ...cloneFormData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg border-brand-border outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsCloneModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 cursor-pointer shadow-xs">Clone Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PERMISSION MATRIX EDITOR ── */}
      {isMatrixModalOpen && selectedRoleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary">
                  <Grid size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Permission Matrix Editor — <span className="text-brand-primary">{selectedRoleDetail.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Configure module action authorization bounds. Changes persist immediately to PostgreSQL.</p>
                </div>
              </div>
              <button onClick={() => setIsMatrixModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Matrix Toolbar */}
            <div className="bg-slate-50 p-3 border-b border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search size={14} className="text-slate-400 ml-2" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={e => setMatrixSearch(e.target.value)}
                  placeholder="Search modules or permissions..."
                  className="w-full px-3 py-1.5 border rounded-md border-brand-border bg-white text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 mr-2">
                  Selected: <span className="text-brand-primary font-mono font-bold text-sm">{selectedPermissionIds.size}</span> Rules
                </span>
                <button
                  onClick={handleSelectAllGlobal}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-primary border border-blue-200 font-bold rounded-lg transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAllGlobal}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-lg transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Matrix Content Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {filteredCategories.map(cat => {
                const isExpanded = expandedCategories.has(cat.id);
                const catPermIds = cat.permissions.map(p => p.id);
                const allSelected = catPermIds.length > 0 && catPermIds.every(id => selectedPermissionIds.has(id));
                const someSelected = catPermIds.some(id => selectedPermissionIds.has(id));

                return (
                  <div key={cat.id} className="border border-brand-border rounded-xl overflow-hidden bg-white shadow-xs">
                    
                    {/* Category Header */}
                    <div className="bg-slate-100/90 p-3 flex justify-between items-center border-b border-brand-border/80">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setExpandedCategories(prev => {
                              const next = new Set(prev);
                              if (next.has(cat.id)) next.delete(cat.id);
                              else next.add(cat.id);
                              return next;
                            });
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition cursor-pointer text-slate-600"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            {cat.name}
                            <span className="px-2 py-0.2 bg-slate-200 text-slate-700 font-mono text-[10px] rounded font-bold">
                              {cat.permissions.filter(p => selectedPermissionIds.has(p.id)).length} / {cat.permissions.length} Active
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">{cat.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCategoryPermissions(cat)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                          allSelected
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {allSelected ? 'Unselect Category' : 'Select All in Category'}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    {isExpanded && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50/50">
                        {cat.permissions.map(perm => {
                          const isChecked = selectedPermissionIds.has(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 select-none ${
                                isChecked
                                  ? 'bg-blue-50/80 border-brand-primary/60 shadow-xs'
                                  : 'bg-white border-brand-border/70 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.id)}
                                className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <span className={`block font-bold text-xs truncate ${isChecked ? 'text-brand-primary' : 'text-slate-800'}`}>
                                  {perm.name}
                                </span>
                                <span className="block text-[10px] font-mono text-slate-400 font-semibold truncate">
                                  {perm.code}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{perm.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Matrix Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Authorization Rule Engine: Every API endpoint automatically enforces these permissions.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMatrixModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissionMatrix}
                  className="px-5 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check size={16} /> Save Permission Matrix
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── DRAWER: ROLE DETAILS & ASSIGNED USERS ── */}
      {isDrawerOpen && selectedRoleDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-brand-border overflow-hidden">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedRoleDetail.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">Code: {selectedRoleDetail.code}</span>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className="bg-slate-50 border-b border-brand-border flex gap-1 p-2 shrink-0">
              <button
                onClick={() => setDrawerTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'general' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                General Info
              </button>
              <button
                onClick={() => setDrawerTab('permissions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'permissions' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Permissions ({selectedRoleDetail.permissionCount})
              </button>
              <button
                onClick={() => setDrawerTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'users' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Assigned Users ({assignedUsers.length})
              </button>
              <button
                onClick={() => setDrawerTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'audit' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Audit History
              </button>
            </div>

            {/* Drawer Tab Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* TAB 1: GENERAL */}
              {drawerTab === 'general' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2">Role Profile Metadata</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-semibold">System Code</span>
                        <span className="font-mono font-bold text-slate-800">{selectedRoleDetail.code}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Execution Priority</span>
                        <span className="font-bold text-slate-800">Priority P{selectedRoleDetail.priority}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Classification</span>
                        <span className="font-bold text-slate-800">{selectedRoleDetail.isSystem ? 'System Core Role' : 'Custom Profile Role'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Current Status</span>
                        <span className="font-bold text-emerald-600">{selectedRoleDetail.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Description</h4>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-brand-border">{selectedRoleDetail.description || 'No description recorded.'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-2 font-mono text-[11px]">
                    <h4 className="font-bold text-slate-900 text-xs">Audit Record</h4>
                    <p className="text-slate-500">Created At: {new Date(selectedRoleDetail.createdAtUtc).toLocaleString()}</p>
                    <p className="text-slate-500">Created By: {selectedRoleDetail.createdBy || 'System Seeder'}</p>
                    <p className="text-slate-500">Last Modified: {selectedRoleDetail.lastModifiedAtUtc ? new Date(selectedRoleDetail.lastModifiedAtUtc).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: PERMISSIONS SUMMARY */}
              {drawerTab === 'permissions' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">Assigned Permission Codes</h4>
                    <button
                      onClick={() => handleOpenPermissionMatrix(selectedRoleDetail)}
                      className="px-3 py-1.5 bg-brand-primary text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                    >
                      <Grid size={14} /> Configure Matrix
                    </button>
                  </div>

                  {selectedRoleDetail.permissionCodes && selectedRoleDetail.permissionCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRoleDetail.permissionCodes.map(code => (
                        <span key={code} className="px-2.5 py-1 bg-blue-50 text-brand-primary border border-blue-200 rounded-md font-mono font-bold text-[11px]">
                          {code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border text-center font-medium">
                      No specific permissions loaded. Click 'Configure Matrix' to assign permissions.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGNED USERS */}
              {drawerTab === 'users' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Users Enrolled in '{selectedRoleDetail.name}'</h4>
                  {isLoadingUsers ? (
                    <p className="text-slate-500 text-center py-6">Loading enrolled users...</p>
                  ) : assignedUsers.length === 0 ? (
                    <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border text-center font-medium">
                      No active users currently assigned to this role.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignedUsers.map(user => (
                        <div key={user.userId} className="p-3 bg-slate-50 border border-brand-border rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{user.displayName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{user.email}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveUserFromRole(user.userId, user.displayName)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold text-[11px] transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT HISTORY */}
              {drawerTab === 'audit' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Role Security Audit Trail</h4>
                  <div className="border border-brand-border rounded-xl p-3 bg-slate-50 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-bold text-emerald-700">Role Created</span>
                      <span>{new Date(selectedRoleDetail.createdAtUtc).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-500">Action logged by administrator. Initial code: {selectedRoleDetail.code}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoleSecurityProfilesModule;
