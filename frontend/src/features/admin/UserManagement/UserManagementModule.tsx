import React, { useState, useEffect, useCallback } from 'react';
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
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import AssignRoleModal from './AssignRoleModal';
import { EmployeeSecurityDetailsDrawer, EmployeeSecurityDetails } from '../SecurityCenter/components/EmployeeSecurityDetailsDrawer';
import { WebcamEnrollmentModal } from '../SecurityCenter/components/WebcamEnrollmentModal';
import { FaceVerificationHistoryModal } from '../SecurityCenter/components/FaceVerificationHistoryModal';
import { LocationEnrollmentModal } from '../SecurityCenter/components/LocationEnrollmentModal';

interface UserManagementModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({ onTriggerToast }) => {
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

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<any | null>(null);
  const [assignRoleTarget, setAssignRoleTarget] = useState<any | null>(null);

  // Security Drawer & Face Modals State
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSecurityDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [enrollmentTarget, setEnrollmentTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [locationTarget, setLocationTarget] = useState<any | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  // Load Users from Backend
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let isActive: boolean | undefined = undefined;
      let isLocked: boolean | undefined = undefined;

      if (statusFilter === 'ACTIVE') isActive = true;
      if (statusFilter === 'INACTIVE') isActive = false;
      if (statusFilter === 'LOCKED') isLocked = true;

      const res = await adminService.fetchUsers({
        searchTerm: debouncedSearch.trim() || undefined,
        isActive,
        isLocked,
        pageNumber,
        pageSize,
        sortBy,
        sortDescending,
      });

      const loadedUsers = res.items || [];
      setUsers(loadedUsers);
      setTotalCount(res.totalCount || loadedUsers.length);
      setTotalPages(res.totalPages || Math.ceil((res.totalCount || loadedUsers.length) / pageSize) || 1);

      // Fetch face status in background for loaded users
      loadedUsers.forEach(async (u) => {
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
          // Face status not registered or 404
        }
      });
    } catch (err: any) {
      onTriggerToast('error', 'Failed to Load Users', err?.message || 'Unable to fetch user registry from server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, pageNumber, pageSize, sortBy, sortDescending]);

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

  const isSuperUser = (u: any) =>
    u.username?.toLowerCase().includes('superadmin') ||
    u.email?.toLowerCase().includes('superadmin') ||
    (u.roles && u.roles.includes('Super Administrator'));

  const handleDeactivate = async (user: any) => {
    if (isSuperUser(user)) {
      onTriggerToast('warning', 'Root Account Protected', 'The Super Administrator account cannot be deactivated.');
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
      onTriggerToast('warning', 'Root Account Protected', 'The Super Administrator account cannot be locked.');
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
      onTriggerToast('warning', 'Root Account Protected', 'The Super Administrator account cannot be deleted.');
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

  // Active / Locked / Total counts dynamically from loaded list & totalCount
  const activeCount = users.filter((u) => u.isActive && !u.isLocked).length;
  const lockedCount = users.filter((u) => u.isLocked).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-5">
      
      {/* ── SECTION 1: DYNAMIC IAM STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total User Accounts"
          value={`${totalCount} Registered`}
          badgeText="Active Directory"
          badgeVariant="primary"
          subLabel="Current Query Result"
          subValue={`Page ${pageNumber} of ${totalPages}`}
        />
        <StatCard
          title="Active Accounts"
          value={`${activeCount} Users`}
          badgeText="Enabled"
          badgeVariant="success"
          subLabel="Filtered in View"
          subValue={`${inactiveCount} Inactive`}
        />
        <StatCard
          title="Locked Accounts"
          value={`${lockedCount} Locked`}
          badgeText={lockedCount > 0 ? 'Security Alert' : 'Normal'}
          badgeVariant={lockedCount > 0 ? 'warning' : 'success'}
          subLabel="Failed Attempts / Manual"
          subValue="Security policy active"
        />
        <StatCard
          title="Face Biometrics Registry"
          value={`${Object.keys(faceStatusMap).length} Checked`}
          badgeText="Biometric Security"
          badgeVariant="info"
          subLabel="Registered Profiles"
          subValue={`${(Object.values(faceStatusMap) as { status: string; version?: number }[]).filter((f) => f.status === 'Registered').length} Biometric Templates`}
        />
      </div>

      {/* ── SECTION 2: PRODUCTION USER MANAGEMENT MODULE ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
        
        {/* Module Header Toolbar */}
        <div className="p-4 border-b bg-brand-bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text-primary">Production User Management</h2>
              <p className="text-xs text-brand-text-secondary">
                Manage ERP user accounts, security roles, status lifecycle, and facial biometric enrollment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => loadUsers()}
              disabled={isLoading}
              className="p-2 border border-brand-border rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary transition cursor-pointer"
              title="Refresh Grid"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus size={15} />
              Add New User
            </button>
          </div>
        </div>

        {/* Server-side Search & Filters Control Bar */}
        <div className="p-4 border-b bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, email, username, employee ID..."
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

        {/* ── SECTION 3: USERS DATA TABLE ── */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
              <tr>
                <th className="p-3">User / Avatar</th>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Full Name & Email</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Role(s)</th>
                <th className="p-3">Department / Branch</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">
                  <span className="flex items-center gap-1 justify-center">
                    <Fingerprint size={12} />
                    Face Biometrics
                  </span>
                </th>
                <th className="p-3">Last Login</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-xs text-brand-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-brand-primary" />
                      <span>Fetching user registry from ASP.NET Core backend...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-xs text-brand-text-secondary">
                    No user accounts match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const faceInfo = faceStatusMap[u.id];
                  const faceStatus = faceInfo?.status || 'Not Registered';
                  const activeRole = u.roles && u.roles.length > 0 ? u.roles[0] : 'User';

                  return (
                    <tr key={u.id} className="hover:bg-brand-bg-secondary/30 transition group">
                      
                      {/* Avatar & User Code */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {u.profileImageUrl ? (
                            <img
                              src={u.profileImageUrl}
                              alt={u.displayName}
                              className="w-8 h-8 rounded-full object-cover border border-brand-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs border border-brand-primary/20">
                              {getInitials(u.displayName || `${u.firstName} ${u.lastName}`)}
                            </div>
                          )}
                          <div>
                            <span className="font-mono font-bold text-brand-text-primary block text-xs">
                              {u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="p-3 font-mono text-brand-primary font-semibold text-xs">
                        {u.employeeId || '—'}
                      </td>

                      {/* Full Name & Email */}
                      <td className="p-3">
                        <span className="font-bold text-brand-text-primary block">
                          {u.displayName || `${u.firstName} ${u.lastName}`}
                        </span>
                        <span className="text-[11px] text-brand-text-secondary flex items-center gap-1">
                          <Mail size={11} /> {u.email}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                        {u.phoneNumber ? (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {u.phoneNumber}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Role(s) */}
                      <td className="p-3">
                        {u.roles && u.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r: string) => (
                              <span key={r}>
                                <Badge variant="primary">{r}</Badge>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="neutral">Standard User</Badge>
                        )}
                      </td>

                      {/* Department / Branch */}
                      <td className="p-3 text-brand-text-secondary text-[11px]">
                        <span className="block font-medium text-brand-text-primary">Operations</span>
                        <span className="text-[10px]">Delhi Central</span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {isSuperUser(u) ? (
                          <span title="Permanent Root Account (Cannot be deactivated)">
                            <Badge variant="success">Permanent Active</Badge>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => (u.isActive ? handleDeactivate(u) : handleActivate(u))}
                            title={u.isActive ? 'Click to Deactivate Account' : 'Click to Activate Account'}
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
                        )}
                      </td>

                      {/* Interactive Face Biometrics Badge (Click to Register / Re-register) */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEnrollment(toEmployeeDetails(u))}
                          title={faceStatus === 'Registered' ? 'Click to Re-Register 3D Face Biometrics' : 'Click to Register 3D Face Biometrics'}
                          className="cursor-pointer transition transform hover:scale-105 active:scale-95 inline-block"
                        >
                          {faceStatus === 'Registered' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs hover:bg-emerald-100">
                              Registered {faceInfo?.version ? `(v${faceInfo.version})` : ''}
                            </span>
                          ) : faceStatus === 'Disabled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs hover:bg-rose-100">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs hover:bg-amber-100">
                              Not Registered
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                        {u.lastLoginUtc ? new Date(u.lastLoginUtc).toLocaleString() : 'Never'}
                      </td>

                      {/* Created Date */}
                      <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                        {u.createdAtUtc ? new Date(u.createdAtUtc).toLocaleDateString() : '—'}
                      </td>

                      {/* Clean 4 Action Buttons: View, Edit, Reset Pass, Soft Delete */}
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          
                          {/* 1. View Security Details & Audit Logs */}
                          <button
                            onClick={() => handleViewDetails(u)}
                            title="View Security Details & Audit Logs"
                            className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-brand-text-primary rounded-md hover:bg-brand-bg-secondary transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* 2. Edit User Profile */}
                          {isSuperUser(u) ? (
                            <button
                              disabled
                              title="Root Super Administrator account cannot be edited"
                              className="p-1.5 border border-slate-200 text-slate-300 rounded-md cursor-not-allowed opacity-50"
                            >
                              <Edit3 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditUserTarget(u)}
                              title="Edit Profile, Biometrics & Module Clearance"
                              className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-brand-primary rounded-md hover:bg-brand-bg-secondary transition cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}

                          {/* 3. Reset Password */}
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Reset User Password"
                            className="p-1.5 border border-brand-border text-brand-text-secondary hover:text-amber-600 rounded-md hover:bg-amber-50 transition cursor-pointer"
                          >
                            <Key size={14} />
                          </button>

                          {/* 4. Soft Delete User Account */}
                          {isSuperUser(u) ? (
                            <button
                              disabled
                              title="Root Super Administrator account cannot be deleted"
                              className="p-1.5 border border-slate-200 text-slate-300 rounded-md cursor-not-allowed opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(u)}
                              title="Soft Delete User Account"
                              className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
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

    </div>
  );
};

export default UserManagementModule;
