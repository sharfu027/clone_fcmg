import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Trash2,
  Edit3,
  Shield,
  ShieldCheck,
  Key,
  Eye,
  Camera,
  History,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  MapPin,
  ArrowUpDown
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { authService } from '../../../services/authService';
import { Badge } from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { StatCard } from '../../../components/ui/StatCard';
import { Tooltip } from '../../../components/ui/Tooltip';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import AssignRoleModal from './AssignRoleModal';
import AssignCompanyModal from './AssignCompanyModal';
import { AdminTeamInspectorModal } from './AdminTeamInspectorModal';
import { EmployeeSecurityDetailsDrawer, EmployeeSecurityDetails } from '../SecurityCenter/components/EmployeeSecurityDetailsDrawer';
import { WebcamEnrollmentModal } from '../SecurityCenter/components/WebcamEnrollmentModal';
import { FaceVerificationHistoryModal } from '../SecurityCenter/components/FaceVerificationHistoryModal';
import { LocationEnrollmentModal } from '../SecurityCenter/components/LocationEnrollmentModal';
import { getUserAccessSettings } from '../../../services/userPermissionsService';
import { useAuth } from '../../../context/AuthContext';

interface UserManagementModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({ onTriggerToast }) => {
  const { user: currentUser } = useAuth();
  // Server-side State
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Server-side Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'>('ALL');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('CreatedAtUtc');
  const [sortDescending, setSortDescending] = useState(true);

  // Face biometrics status cache per user ID
  const [faceStatusMap, setFaceStatusMap] = useState<Record<string, { status: string; version?: number }>>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Subordinates data map for expanded admins
  const [subordinatesMap, setSubordinatesMap] = useState<Record<string, { loading: boolean; error?: string; data?: any }>>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<any | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<any | null>(null);
  const [assignCompanyTarget, setAssignCompanyTarget] = useState<any | null>(null);
  const [inspectAdminTarget, setInspectAdminTarget] = useState<any | null>(null);

  // Security Drawer & Face Modals State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSecurityDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [enrollmentTarget, setEnrollmentTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [locationTarget, setLocationTarget] = useState<any | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [expandedAdminIds, setExpandedAdminIds] = useState<Record<string, boolean>>({});

  const toggleAdminExpand = async (adminId: string) => {
    const willExpand = !expandedAdminIds[adminId];
    setExpandedAdminIds(prev => ({
      ...prev,
      [adminId]: willExpand
    }));

    if (willExpand && !subordinatesMap[adminId]?.data && !subordinatesMap[adminId]?.loading) {
      setSubordinatesMap(prev => ({
        ...prev,
        [adminId]: { loading: true }
      }));
      try {
        const res = await adminService.getAdminSubordinates(adminId);
        setSubordinatesMap(prev => ({
          ...prev,
          [adminId]: { loading: false, data: res }
        }));
      } catch (err: any) {
        setSubordinatesMap(prev => ({
          ...prev,
          [adminId]: { loading: false, error: err?.message || 'Failed to load subordinates' }
        }));
      }
    }
  };

  const [searchParams] = useSearchParams();

  // Read URL query parameters for context-aware KPI navigation
  useEffect(() => {
    const statusParam = searchParams.get('status')?.toLowerCase();
    if (statusParam === 'active') setStatusFilter('ACTIVE');
    else if (statusParam === 'locked') setStatusFilter('LOCKED');
    else if (statusParam === 'inactive') setStatusFilter('INACTIVE');
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load ONLY Administrators from Backend
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch official Administrator assignments from backend (server-side filtered to Administrator role)
      let assignments: any[] = [];
      try {
        assignments = await adminService.getAdminCompanyAssignments();
      } catch (err) {
        console.warn('Assignments fetch fallback:', err);
      }

      // 2. Fetch full user registry to augment profile details
      let isActive: boolean | undefined = undefined;
      let isLocked: boolean | undefined = undefined;

      if (statusFilter === 'ACTIVE') isActive = true;
      if (statusFilter === 'INACTIVE') isActive = false;
      if (statusFilter === 'LOCKED') isLocked = true;

      let allUsersRes: any = { items: [] };
      try {
        allUsersRes = await adminService.fetchUsers({
          isActive,
          isLocked,
          pageNumber: 1,
          pageSize: 100,
          sortBy,
          sortDescending,
        });
      } catch (err) {
        console.warn('Users fetch fallback:', err);
      }

      const userMap = new Map<string, any>();
      (allUsersRes.items || []).forEach((u: any) => {
        userMap.set(u.id, u);
      });

      // Combine assignment records and users, ensuring ONLY Administrator role is displayed
      const adminList: any[] = [];
      const processedIds = new Set<string>();

      (assignments || []).forEach((a: any) => {
        const u = userMap.get(a.adminUserId) || {};
        const rawRole = (u.roles && u.roles.length > 0) ? u.roles[0] : (u.role || 'Administrator');
        
        // Exclude Super Admin explicitly
        if (rawRole === 'Super Administrator' || rawRole === 'Super Admin' || a.email?.toLowerCase().includes('superadmin')) {
          return;
        }

        const accessSettings = getUserAccessSettings(a.adminUserId, a.email);
        processedIds.add(a.adminUserId);

        adminList.push({
          id: a.adminUserId,
          username: a.username || u.username,
          email: a.email || u.email,
          displayName: a.displayName || u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || a.username,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phoneNumber: u.phoneNumber || '',
          profileImageUrl: u.profileImageUrl || '',
          role: 'Administrator',
          roles: ['Administrator'],
          assignedCompanyId: a.companyId || null,
          assignedCompanyName: a.companyLegalName || null,
          assignedCompanyCode: a.companyCode || null,
          assignedAtUtc: a.assignedAtUtc || null,
          isActive: a.isActive !== undefined ? a.isActive : (u.isActive !== undefined ? u.isActive : true),
          isLocked: u.isLocked || false,
          adminCode: accessSettings.adminCode || u.employeeId || u.userCode || null,
          createdAtUtc: u.createdAtUtc,
        });
      });

      // Also check if any users in userMap have role === 'Administrator' or 'Admin' not in assignments yet
      (allUsersRes.items || []).forEach((u: any) => {
        if (processedIds.has(u.id)) return;
        const rawRole = (u.roles && u.roles.length > 0) ? u.roles[0] : (u.role || '');
        const isSuper = rawRole === 'Super Administrator' || rawRole === 'Super Admin' || (u.email && u.email.toLowerCase().includes('superadmin'));
        const isAdmin = !isSuper && (rawRole === 'Administrator' || rawRole === 'Admin');

        if (isAdmin) {
          const accessSettings = getUserAccessSettings(u.id, u.email);
          adminList.push({
            id: u.id,
            username: u.username,
            email: u.email,
            displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phoneNumber: u.phoneNumber || '',
            profileImageUrl: u.profileImageUrl || '',
            role: 'Administrator',
            roles: ['Administrator'],
            assignedCompanyId: null,
            assignedCompanyName: null,
            assignedCompanyCode: null,
            assignedAtUtc: null,
            isActive: u.isActive !== undefined ? u.isActive : true,
            isLocked: u.isLocked || false,
            adminCode: accessSettings.adminCode || u.employeeId || u.userCode || null,
            createdAtUtc: u.createdAtUtc,
          });
        }
      });

      // Filter by search query
      let filteredAdmins = adminList;
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        filteredAdmins = filteredAdmins.filter(admin => 
          admin.displayName?.toLowerCase().includes(q) ||
          admin.email?.toLowerCase().includes(q) ||
          admin.username?.toLowerCase().includes(q) ||
          admin.adminCode?.toLowerCase().includes(q) ||
          admin.assignedCompanyName?.toLowerCase().includes(q) ||
          admin.assignedCompanyCode?.toLowerCase().includes(q)
        );
      }

      // Filter by status
      if (statusFilter === 'ACTIVE') {
        filteredAdmins = filteredAdmins.filter(a => a.isActive && !a.isLocked);
      } else if (statusFilter === 'INACTIVE') {
        filteredAdmins = filteredAdmins.filter(a => !a.isActive);
      } else if (statusFilter === 'LOCKED') {
        filteredAdmins = filteredAdmins.filter(a => a.isLocked);
      }

      setUsers(filteredAdmins);
      setTotalCount(filteredAdmins.length);
      setTotalPages(Math.ceil(filteredAdmins.length / pageSize) || 1);

      // Fetch face status in background for loaded admins
      filteredAdmins.forEach(async (u) => {
        try {
          const profile = await authService.getFaceStatus(u.id);
          if (profile) {
            const rawStatus = profile.status;
            const isRegistered = rawStatus === 'Enrolled' || rawStatus === 'Registered' || (profile.isActive && profile.activeTemplateVersion > 0);
            const resolvedStatus = isRegistered ? 'Registered' : (rawStatus || (profile.isActive ? 'Registered' : 'Disabled'));
            setFaceStatusMap((prev) => ({
              ...prev,
              [u.id]: {
                status: resolvedStatus,
                version: profile.activeTemplateVersion,
              },
            }));
          }
        } catch {
          // Ignore
        }
      });
    } catch (err: any) {
      onTriggerToast('error', 'Failed to Load Admins', err?.message || 'Unable to fetch admin registry from server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, pageSize, sortBy, sortDescending]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handler for Sorting Toggle
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDescending(!sortDescending);
    } else {
      setSortBy(field);
      setSortDescending(true);
    }
    setPageNumber(1);
  };

  // User Lifecycle Actions (Call Real API + Reload Grid)
  const handleActivate = async (user: any) => {
    try {
      await adminService.activateUser(user.id);
      onTriggerToast('success', 'User Activated', `User account '${user.username}' has been activated.`);
      loadUsers();
    } catch (err: any) {
      onTriggerToast('error', 'Activation Failed', err?.message || 'Failed to activate user account.');
    }
  };

  const isSuperUser = (u: any) => {
    const r = u?.roles?.[0] || u?.role || '';
    return r === 'Super Administrator' || r === 'Super Admin';
  };

  const handleDeactivate = async (user: any) => {
    if (isSuperUser(user)) {
      onTriggerToast('warning', 'Root Account Protected', 'The Super Admin account cannot be deactivated.');
      return;
    }
    if (!window.confirm(`Deactivate account for ${user.displayName}? User will be unable to log in.`)) return;
    try {
      await adminService.deactivateUser(user.id);
      onTriggerToast('success', 'User Deactivated', `User account '${user.username}' has been deactivated.`);
      loadUsers();
    } catch (err: any) {
      onTriggerToast('error', 'Deactivation Failed', err?.message || 'Failed to deactivate user account.');
    }
  };

  const handleLock = async (user: any) => {
    if (isSuperUser(user)) {
      onTriggerToast('warning', 'Root Account Protected', 'The Super Admin account cannot be locked.');
      return;
    }
    try {
      await adminService.lockUser(user.id);
      onTriggerToast('warning', 'User Account Locked', `Account for '${user.username}' has been locked.`);
      loadUsers();
    } catch (err: any) {
      onTriggerToast('error', 'Lock Failed', err?.message || 'Failed to lock user account.');
    }
  };

  const handleUnlock = async (user: any) => {
    try {
      await adminService.unlockUser(user.id);
      onTriggerToast('success', 'User Account Unlocked', `Account for '${user.username}' has been unlocked.`);
      loadUsers();
    } catch (err: any) {
      onTriggerToast('error', 'Unlock Failed', err?.message || 'Failed to unlock user account.');
    }
  };

  const handleDelete = async (user: any) => {
    if (isSuperUser(user)) {
      onTriggerToast('warning', 'Root Account Protected', 'The Super Admin account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Soft delete user '${user.displayName}' (${user.username})? This action will archive the record in PostgreSQL.`)) return;
    try {
      await adminService.deleteUser(user.id);
      onTriggerToast('success', 'User Deleted', `User '${user.username}' was soft-deleted.`);
      loadUsers();
    } catch (err: any) {
      onTriggerToast('error', 'Delete Failed', err?.message || 'Failed to delete user.');
    }
  };

  const handleResetPassword = async (user: any) => {
    if (!window.confirm(`Trigger password reset for ${user.email}?`)) return;
    try {
      await authService.requestPasswordReset({ email: user.email });
      onTriggerToast('info', 'Password Reset Initiated', `Password reset token generated for ${user.email}.`);
    } catch (err: any) {
      onTriggerToast('error', 'Reset Failed', err?.message || 'Failed to trigger password reset.');
    }
  };

  // Convert API user object to EmployeeSecurityDetails for Drawer/Face Modals
  const toEmployeeDetails = (u: any): EmployeeSecurityDetails => {
    const faceInfo = faceStatusMap[u.id];
    return {
      id: u.id,
      userId: u.id,
      userCode: u.employeeId || u.username,
      fullName: u.displayName || `${u.firstName} ${u.lastName}`,
      email: u.email,
      mobile: u.phoneNumber || '—',
      role: u.roles && u.roles.length > 0 ? u.roles.join(', ') : 'User',
      department: 'Operations',
      designation: u.roles && u.roles.length > 0 ? u.roles[0] : 'Staff',
      mappedEmployeeCode: u.employeeId || u.username,
      branch: 'Delhi Central',
      status: u.isLocked ? 'Locked' : u.isActive ? 'Enabled' : 'Disabled',
      securityProfileName: 'Standard Security Profile',
      faceStatus: (faceInfo?.status as any) || 'Not Registered',
      activeTemplateVersion: faceInfo?.version,
      registeredDate: u.createdAtUtc ? new Date(u.createdAtUtc).toLocaleDateString() : undefined,
    };
  };

  const handleViewDetails = (user: any) => {
    setSelectedEmployee(toEmployeeDetails(user));
    setIsDrawerOpen(true);
  };

  const handleOpenEnrollment = (emp: EmployeeSecurityDetails) => {
    setEnrollmentTarget(emp);
    setIsEnrollmentModalOpen(true);
    setIsDrawerOpen(false);
  };

  const handleOpenHistory = (emp: EmployeeSecurityDetails) => {
    setHistoryTarget(emp);
    setIsHistoryModalOpen(true);
    setIsDrawerOpen(false);
  };

  const handleQuickDeleteFace = async (user: any) => {
    if (!window.confirm(`Delete face biometric template for ${user.displayName}?`)) return;
    setDeletingUserId(user.id);
    try {
      await authService.deleteFace(user.id);
      setFaceStatusMap((prev) => ({
        ...prev,
        [user.id]: { status: 'Not Registered', version: undefined },
      }));
      onTriggerToast('success', 'Face Template Deleted', `Face biometric deactivated for ${user.displayName}.`);
    } catch {
      onTriggerToast('error', 'Action Failed', 'Unable to delete face template.');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Helper for Initials Avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Active / Locked / Total counts dynamically from loaded admin list
  const activeCount = users.filter((u) => u.isActive && !u.isLocked).length;
  const lockedCount = users.filter((u) => u.isLocked).length;
  const assignedCount = users.filter((u) => Boolean(u.assignedCompanyId)).length;
  const unassignedCount = users.filter((u) => !u.assignedCompanyId).length;

  const paginatedUsers = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, pageNumber, pageSize]);

  return (
    <div className="space-y-5">
      
      {/* ── SECTION 1: DYNAMIC IAM STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Administrators"
          value={`${totalCount} Registered`}
          badgeText="Admin Directory"
          badgeVariant="primary"
          subLabel="Current Query Result"
          subValue={`Page ${pageNumber} of ${totalPages}`}
        />
        <StatCard
          title="Company-Assigned Admins"
          value={`${assignedCount} Assigned`}
          badgeText="Assigned"
          badgeVariant="success"
          subLabel="Enterprise Scope"
          subValue="Scoped to Companies"
        />
        <StatCard
          title="Unassigned Admins"
          value={`${unassignedCount} Pending`}
          badgeText={unassignedCount > 0 ? 'Action Needed' : 'Complete'}
          badgeVariant={unassignedCount > 0 ? 'warning' : 'success'}
          subLabel="Awaiting Assignment"
          subValue="Super Admin to assign"
        />
        <StatCard
          title="Active Administrators"
          value={`${activeCount} Active`}
          badgeText="Operational"
          badgeVariant="info"
          subLabel="System Access"
          subValue={`${lockedCount} Locked Accounts`}
        />
      </div>

      {/* ── SECTION 2: PRODUCTION ADMIN USER MANAGEMENT MODULE ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
        
        {/* Module Header Toolbar */}
        <div className="p-4 border-b bg-brand-bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentUser?.companyLogo ? (
              <img
                src={currentUser.companyLogo}
                alt={currentUser.companyName || 'Company Logo'}
                className="w-10 h-10 object-contain rounded-lg border border-brand-border bg-white p-0.5 shadow-xs shrink-0"
              />
            ) : (
              <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg shrink-0">
                <ShieldCheck size={20} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-brand-text-primary">Administrator Management</h2>
                {currentUser?.companyName && (
                  <span className="px-2 py-0.5 bg-blue-50 text-brand-primary border border-blue-200 text-[10px] font-bold rounded-full">
                    {currentUser.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-text-secondary">
                Manage Enterprise Administrators, company assignments, and inspect company-scoped operational rosters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip content="Refresh Data">
              <button
                onClick={() => loadUsers()}
                disabled={isLoading}
                aria-label="Refresh Data"
                className="p-2 border border-brand-border rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary transition cursor-pointer"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </Tooltip>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={15} />
              Add New Admin
            </button>
          </div>
        </div>

        {/* Server-side Search & Filters Control Bar */}
        <div className="p-4 border-b bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by Admin name, email, username, code, company..."
            />

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-brand-text-secondary">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPageNumber(1);
                }}
                className="p-2 border rounded-lg border-brand-border bg-white font-semibold text-brand-text-primary cursor-pointer outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="LOCKED">Locked Only</option>
              </select>
            </div>
          </div>

          {/* Rows per page & Sort selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-brand-text-secondary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPageNumber(1);
                }}
                className="p-2 border rounded-lg border-brand-border bg-white text-brand-text-primary cursor-pointer outline-none"
              >
                <option value="CreatedAtUtc">Created Date</option>
                <option value="Username">Username</option>
                <option value="Email">Email</option>
                <option value="FirstName">First Name</option>
                <option value="LastLoginUtc">Last Login</option>
              </select>

              <button
                onClick={() => setSortDescending(!sortDescending)}
                className="p-2 border border-brand-border rounded-lg hover:bg-brand-bg-secondary text-brand-text-secondary cursor-pointer"
                title={sortDescending ? 'Sort Descending' : 'Sort Ascending'}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold text-brand-text-secondary">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="p-2 border rounded-lg border-brand-border bg-white text-brand-text-primary cursor-pointer outline-none font-semibold"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: ADMINISTRATORS DATA TABLE ── */}
        <div className="min-h-[350px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
              <tr>
                <th className="p-3 w-8 text-center"></th>
                <th className="p-3">Administrator / Profile</th>
                <th className="p-3">Admin Code</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Company</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-brand-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-brand-primary" />
                      <span>Fetching Administrator registry from ASP.NET Core backend...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-brand-text-secondary">
                    No Administrator accounts match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isExpanded = Boolean(expandedAdminIds[u.id]);
                  const accessSettings = getUserAccessSettings(u.id, u.email);
                  
                  let formattedAdminCode = u.adminCode;
                  if (!formattedAdminCode || !String(formattedAdminCode).startsWith('ADM-')) {
                    formattedAdminCode = `ADM-${String(idx + 1).padStart(3, '0')}`;
                  }

                  const subordinatesState = subordinatesMap[u.id];
                  const subordinatesList = subordinatesState?.data?.subordinates || [];

                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-brand-bg-secondary/30 transition group">
                        
                        {/* Chevron Accordion Expand Button */}
                        <td className="p-3 text-center w-8">
                          <Tooltip content={isExpanded ? "Hide Users Under Administrator" : "Show Users Under Administrator"}>
                            <button
                              type="button"
                              onClick={() => toggleAdminExpand(u.id)}
                              aria-label={isExpanded ? "Hide Users Under Administrator" : "Show Users Under Administrator"}
                              className="p-1 hover:bg-blue-50 rounded text-slate-400 hover:text-brand-primary transition cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} className="text-brand-primary font-bold" />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          </Tooltip>
                        </td>

                        {/* Admin User / Profile (Avatar + Name + Username + Email) */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {u.profileImageUrl ? (
                              <img
                                src={u.profileImageUrl}
                                alt={u.displayName}
                                className="w-8 h-8 rounded-full object-cover border border-brand-border shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs border border-brand-primary/20 shrink-0">
                                {getInitials(u.displayName || `${u.firstName} ${u.lastName}`)}
                              </div>
                            )}
                            <div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => toggleAdminExpand(u.id)}
                                  className="font-bold text-brand-text-primary hover:text-brand-primary text-left cursor-pointer transition block text-xs"
                                >
                                  {u.displayName || `${u.firstName} ${u.lastName}`}
                                </button>
                              </div>
                              <span className="text-[10.5px] text-brand-text-secondary flex items-center gap-1">
                                <Mail size={10} /> {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Admin Code */}
                        <td className="p-3 font-mono text-brand-primary font-bold text-xs">
                          {formattedAdminCode}
                        </td>

                        {/* Role Badge (Admin) */}
                        <td className="p-3">
                          <Tooltip content={isExpanded ? "Hide Users Under Administrator" : "Show Users Under Administrator"}>
                            <button
                              type="button"
                              onClick={() => toggleAdminExpand(u.id)}
                              aria-label="Toggle subordinate users list"
                              className="px-2.5 py-1 bg-blue-50 text-brand-primary font-bold text-xs rounded-lg border border-blue-200 hover:bg-blue-100 hover:scale-105 transition cursor-pointer shadow-2xs"
                            >
                              Admin
                            </button>
                          </Tooltip>
                        </td>

                        {/* Assigned Company */}
                        <td className="p-3 text-brand-text-secondary text-xs">
                          {u.assignedCompanyName ? (
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Building size={14} className="text-brand-primary shrink-0" />
                              <span>{u.assignedCompanyName}</span>
                              {u.assignedCompanyCode && (
                                <span className="text-[10px] font-mono text-slate-400">({u.assignedCompanyCode})</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                              <Building size={13} className="text-amber-500 shrink-0" />
                              <span>Not Assigned</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <Tooltip content={u.isActive ? 'Deactivate Account' : 'Activate Account'}>
                            <button
                              type="button"
                              onClick={() => (u.isActive ? handleDeactivate(u) : handleActivate(u))}
                              aria-label={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                              className="cursor-pointer transition transform hover:scale-105 active:scale-95 inline-block"
                            >
                              {u.isLocked ? (
                                <Badge variant="danger">Locked</Badge>
                              ) : u.isActive ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="warning">Inactive</Badge>
                              )}
                            </button>
                          </Tooltip>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-1">
                            {(currentUser?.role === 'Super Administrator' || isSuperUser(currentUser)) && (
                              <Tooltip content="Assign / Reassign Company">
                                <button
                                  onClick={() => setAssignCompanyTarget(u)}
                                  aria-label="Assign / Reassign Company"
                                  className="p-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                >
                                  <Building size={14} />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip content="View Administrator">
                              <button
                                onClick={() => handleViewDetails(u)}
                                aria-label="View Administrator"
                                className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-brand-text-primary rounded-md hover:bg-brand-bg-secondary transition cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Edit Profile & Security Clearances">
                              <button
                                onClick={() => setEditUserTarget(u)}
                                aria-label="Edit Profile & Security Clearances"
                                className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-brand-primary rounded-md hover:bg-brand-bg-secondary transition cursor-pointer"
                              >
                                <Edit3 size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Reset Password">
                              <button
                                onClick={() => handleResetPassword(u)}
                                aria-label="Reset Password"
                                className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-amber-600 rounded-md hover:bg-amber-50 transition cursor-pointer"
                              >
                                <Key size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Archive Administrator">
                              <button
                                onClick={() => handleDelete(u)}
                                aria-label="Archive Administrator"
                                className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED AREA: USERS / EMPLOYEES UNDER THIS ADMIN ── */}
                      {isExpanded && (
                        <tr key={`${u.id}-expanded`} className="bg-slate-50/80">
                          <td colSpan={7} className="p-4 border-y border-slate-200">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
                              
                              {/* Header summary */}
                              <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold border border-brand-primary/20">
                                    <ShieldCheck size={18} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-slate-800">
                                        {u.displayName || u.username}
                                      </h4>
                                      <span className="px-2 py-0.5 bg-blue-100 text-brand-primary text-[10px] font-extrabold rounded-full uppercase">
                                        Admin
                                      </span>
                                      <span className="text-xs font-mono font-bold text-brand-primary">
                                        {formattedAdminCode}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span><Mail size={11} className="inline mr-1" />{u.email}</span>
                                      {u.phoneNumber && <span><Phone size={11} className="inline mr-1" />{u.phoneNumber}</span>}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {u.assignedCompanyName ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-primary rounded-lg border border-blue-200 text-xs font-bold">
                                      <Building size={14} />
                                      <span>Assigned Company: {u.assignedCompanyName}</span>
                                      {u.assignedCompanyCode && <span className="font-mono text-slate-500">({u.assignedCompanyCode})</span>}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs font-bold">
                                        <Building size={14} />
                                        <span>Company: Not Assigned</span>
                                      </div>
                                      {(currentUser?.role === 'Super Administrator' || isSuperUser(currentUser)) && (
                                        <button
                                          onClick={() => setAssignCompanyTarget(u)}
                                          className="px-2.5 py-1 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                        >
                                          <Plus size={12} />
                                          Assign Company
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Content Area */}
                              {!u.assignedCompanyId ? (
                                <div className="p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center space-y-2">
                                  <Building size={28} className="mx-auto text-slate-400" />
                                  <h5 className="text-xs font-bold text-slate-700">No Company Assigned</h5>
                                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    This Admin has no assigned Company. No subordinate users or operational employees can be resolved yet.
                                  </p>
                                  {(currentUser?.role === 'Super Administrator' || isSuperUser(currentUser)) && (
                                    <button
                                      onClick={() => setAssignCompanyTarget(u)}
                                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer transition shadow-xs"
                                    >
                                      <Building size={13} />
                                      Assign Company Now
                                    </button>
                                  )}
                                </div>
                              ) : subordinatesState?.loading ? (
                                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                                  <RefreshCw size={20} className="animate-spin text-brand-primary mx-auto" />
                                  <p>Fetching company-scoped employee roster for {u.assignedCompanyName} from server...</p>
                                </div>
                              ) : subordinatesState?.error ? (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
                                  <span>{subordinatesState.error}</span>
                                  <button
                                    onClick={() => toggleAdminExpand(u.id)}
                                    className="font-bold underline cursor-pointer"
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      <Users size={14} className="text-brand-primary" />
                                      Users / Employees Under This Admin ({subordinatesList.length})
                                    </h5>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Scoped to Company: <strong className="text-slate-700">{u.assignedCompanyName}</strong>
                                    </span>
                                  </div>

                                  {subordinatesList.length === 0 ? (
                                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                                      No subordinate users or employees registered under {u.assignedCompanyName} yet.
                                    </div>
                                  ) : (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b">
                                          <tr>
                                            <th className="p-2.5">Employee / User Name</th>
                                            <th className="p-2.5">Code</th>
                                            <th className="p-2.5">Email</th>
                                            <th className="p-2.5">Role / Designation</th>
                                            <th className="p-2.5">Department</th>
                                            <th className="p-2.5">Branch</th>
                                            <th className="p-2.5 text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {subordinatesList.map((sub: any) => (
                                            <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                                              <td className="p-2.5 font-bold text-slate-800">
                                                {sub.name}
                                              </td>
                                              <td className="p-2.5 font-mono text-[11px] font-bold text-brand-primary">
                                                {sub.employeeCode || '—'}
                                              </td>
                                              <td className="p-2.5 text-slate-600 font-medium">
                                                {sub.email}
                                              </td>
                                              <td className="p-2.5">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10.5px] rounded border border-blue-200">
                                                  {sub.roleOrDesignation || 'Staff'}
                                                </span>
                                              </td>
                                              <td className="p-2.5 text-slate-600 font-medium">
                                                {sub.departmentName || '—'}
                                              </td>
                                              <td className="p-2.5 text-slate-600 font-medium">
                                                {sub.branchName || '—'}
                                              </td>
                                              <td className="p-2.5 text-center">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sub.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                  {sub.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 4: SERVER-SIDE PAGINATION CONTROLS ── */}
        <div className="p-4 border-t bg-brand-bg-secondary/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-brand-text-secondary font-medium">
            Showing{' '}
            <span className="font-bold text-brand-text-primary">
              {users.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-brand-text-primary">
              {Math.min(pageNumber * pageSize, totalCount)}
            </span>{' '}
            of <span className="font-bold text-brand-text-primary">{totalCount}</span> registered users
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
              disabled={pageNumber <= 1 || isLoading}
              className="px-3 py-1.5 border border-brand-border rounded-lg hover:bg-brand-bg-secondary text-brand-text-primary flex items-center gap-1 disabled:opacity-40 cursor-pointer font-semibold"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span className="px-3 py-1 font-bold text-brand-primary bg-brand-primary/10 rounded-lg">
              Page {pageNumber} of {totalPages}
            </span>

            <button
              onClick={() => setPageNumber((p) => Math.min(p + 1, totalPages))}
              disabled={pageNumber >= totalPages || isLoading}
              className="px-3 py-1.5 border border-brand-border rounded-lg hover:bg-brand-bg-secondary text-brand-text-primary flex items-center gap-1 disabled:opacity-40 cursor-pointer font-semibold"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ── MODALS ── */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(msg) => {
          onTriggerToast('success', 'User Account Created', msg);
          loadUsers();
        }}
        onTriggerToast={onTriggerToast}
        existingUsers={users}
      />

      <EditUserModal
        isOpen={!!editUserTarget}
        onClose={() => setEditUserTarget(null)}
        user={editUserTarget}
        onSuccess={(msg) => {
          onTriggerToast('success', 'Profile Updated', msg);
          loadUsers();
        }}
        onTriggerToast={onTriggerToast}
      />

      <AssignRoleModal
        isOpen={!!assignRoleTarget}
        onClose={() => setAssignRoleTarget(null)}
        user={assignRoleTarget}
        onSuccess={(msg) => {
          onTriggerToast('success', 'Role Updated', msg);
          loadUsers();
        }}
        onTriggerToast={onTriggerToast}
      />

      <EmployeeSecurityDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        employee={selectedEmployee}
        onRegisterFace={handleOpenEnrollment}
        onViewHistory={handleOpenHistory}
        onTriggerToast={onTriggerToast}
        onStatusUpdate={() => loadUsers()}
      />

      {isEnrollmentModalOpen && enrollmentTarget && (
        <WebcamEnrollmentModal
          isOpen={isEnrollmentModalOpen}
          onClose={() => {
            setIsEnrollmentModalOpen(false);
            setEnrollmentTarget(null);
          }}
          employee={{
            id: enrollmentTarget.id,
            userId: enrollmentTarget.userId,
            fullName: enrollmentTarget.fullName,
            employeeCode: enrollmentTarget.mappedEmployeeCode,
            email: enrollmentTarget.email,
          }}
          onTriggerToast={onTriggerToast}
          onEnrollmentSuccess={(res) => {
            onTriggerToast('success', 'Face Registered', `Biometric template updated for ${enrollmentTarget.fullName}.`);
            if (enrollmentTarget?.id) {
              setFaceStatusMap((prev) => ({
                ...prev,
                [enrollmentTarget.id]: { status: 'Registered', version: res?.templateVersion || 1 },
              }));
            }
            setIsEnrollmentModalOpen(false);
            setEnrollmentTarget(null);
            loadUsers();
          }}
        />
      )}

      {isHistoryModalOpen && historyTarget && (
        <FaceVerificationHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setHistoryTarget(null);
          }}
          employee={{
            id: historyTarget.id,
            userId: historyTarget.userId,
            fullName: historyTarget.fullName,
            employeeCode: historyTarget.mappedEmployeeCode,
          }}
        />
      )}

      {isLocationModalOpen && locationTarget && (
        <LocationEnrollmentModal
          isOpen={isLocationModalOpen}
          onClose={() => {
            setIsLocationModalOpen(false);
            setLocationTarget(null);
          }}
          employee={{
            id: locationTarget.id,
            userId: locationTarget.userId,
            name: locationTarget.fullName,
            email: locationTarget.email,
            role: locationTarget.roles?.[0] || 'User',
            branch: locationTarget.branchName || 'Delhi Central',
          }}
          onTriggerToast={onTriggerToast}
        />
      )}

      {inspectAdminTarget && (
        <AdminTeamInspectorModal
          isOpen={Boolean(inspectAdminTarget)}
          onClose={() => setInspectAdminTarget(null)}
          adminUser={inspectAdminTarget}
          allUsers={users}
          onEditUser={(userToEdit) => setEditUserTarget(userToEdit)}
        />
      )}

      {assignCompanyTarget && (
        <AssignCompanyModal
          isOpen={Boolean(assignCompanyTarget)}
          onClose={() => setAssignCompanyTarget(null)}
          onSuccess={(msg) => {
            onTriggerToast('success', 'Company Assignment', msg);
            loadUsers();
          }}
          onTriggerToast={onTriggerToast}
          targetUser={assignCompanyTarget}
        />
      )}

    </div>
  );
};

export default UserManagementModule;
