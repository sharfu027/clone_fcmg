import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  Lock,
  UserX,
  Camera,
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Key,
  KeyRound,
  Users,
  Clock,
  Unlock,
  RefreshCw,
  FileText,
  Monitor,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { RegisteredDevice, AuditLogDto, SecurityDashboardSummaryDto } from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';
import { StatCard } from '../../../../components/ui/StatCard';
import { adminService } from '../../../../services/adminService';
import { SecurityEventDetailsDrawer } from '../components/SecurityEventDetailsDrawer';
import { EmployeeSecurityDetailsDrawer, EmployeeSecurityDetails } from '../components/EmployeeSecurityDetailsDrawer';
import { FaceVerificationHistoryModal } from '../components/FaceVerificationHistoryModal';
import { TemporaryPinGeneratorModal } from '../components/TemporaryPinGeneratorModal';

interface SecurityDashboardPageProps {
  exceptions?: any[];
  devices?: RegisteredDevice[];
  onTriggerToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function SecurityDashboardPage({
  onTriggerToast,
  onNavigateToTab
}: SecurityDashboardPageProps) {
  // ── Summary Telemetry & Data States ──
  const [summary, setSummary] = useState<SecurityDashboardSummaryDto | null>(null);
  const [lockedUsers, setLockedUsers] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<AuditLogDto[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLogDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);

  // ── Modals & Drawers States ──
  const [selectedEvent, setSelectedEvent] = useState<AuditLogDto | null>(null);
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);

  const [selectedLockedUser, setSelectedLockedUser] = useState<EmployeeSecurityDetails | null>(null);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [biometricModalEmployee, setBiometricModalEmployee] = useState<{ id: string; userId?: string; fullName: string; employeeCode: string }>({
    id: '',
    fullName: 'All Users',
    employeeCode: 'SYSTEM'
  });

  // ── Load Real-Time Dashboard Summary Data ──
  const loadDashboardData = async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch Backend Aggregated Dashboard Summary
      try {
        const summaryData = await adminService.getSecurityDashboardSummary();
        if (summaryData) {
          setSummary(summaryData);
        }
      } catch (err) {
        console.warn('Dashboard summary endpoint unavailable, loading fallbacks...', err);
      }

      // 2. Fetch Locked Users
      const lockedRes = await adminService.fetchUsers({ isLocked: true, pageSize: 20 });
      if (lockedRes && lockedRes.items) {
        setLockedUsers(lockedRes.items);
      } else {
        setLockedUsers([]);
      }

      // 3. Fetch Failed Logins Audit Events
      const failedAuditRes = await adminService.fetchAuditLogs({ result: 'failure', pageSize: 30 });
      if (failedAuditRes && failedAuditRes.items) {
        const rawFailures = failedAuditRes.items;
        const uniqueFailedUsers: AuditLogDto[] = [];
        const seenFailedUserKeys = new Set<string>();

        for (const item of rawFailures) {
          const userKey = (item.userDisplayName || item.username || 'Unknown').trim().toLowerCase();
          if (!seenFailedUserKeys.has(userKey)) {
            seenFailedUserKeys.add(userKey);
            uniqueFailedUsers.push(item);
          }
          if (uniqueFailedUsers.length >= 6) break;
        }
        setFailedLogins(uniqueFailedUsers);
      } else {
        setFailedLogins([]);
      }

      // 4. Fetch Recent Audit Logs Timeline
      const recentAuditRes = await adminService.fetchAuditLogs({ pageSize: 50 });
      if (recentAuditRes && recentAuditRes.items) {
        const rawItems = recentAuditRes.items;
        const distinctUserTimeline: AuditLogDto[] = [];
        const seenUsers = new Set<string>();

        for (const item of rawItems) {
          const userKey = (item.userDisplayName || item.username || 'System').trim().toLowerCase();
          if (!seenUsers.has(userKey)) {
            seenUsers.add(userKey);
            distinctUserTimeline.push(item);
          }
          if (distinctUserTimeline.length >= 6) break;
        }

        setRecentActivity(distinctUserTimeline);
      } else {
        setRecentActivity([]);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load Security Dashboard data:', err);
      setError(err?.message || 'Failed to sync security telemetry with server.');
      if (!isSilent && onTriggerToast) {
        onTriggerToast('error', 'Dashboard Load Failed', err?.message || 'Server connection error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Real-time Auto Refresh Loop Every 30 Seconds with cleanup on unmount
  useEffect(() => {
    if (!isAutoRefreshActive) return;
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAutoRefreshActive]);

  // ── Unlock User Handler ──
  const handleUnlockUser = async (userId: string, userName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await adminService.unlockUser(userId);
      setLockedUsers(prev => prev.filter(u => u.id !== userId));
      if (summary) {
        setSummary({
          ...summary,
          lockedUsersCount: Math.max(0, summary.lockedUsersCount - 1)
        });
      }
      if (onTriggerToast) {
        onTriggerToast('success', 'User Unlocked', `'${userName}' has been unlocked and access restored.`);
      }
      loadDashboardData(true);
    } catch (err: any) {
      console.error('Failed to unlock user:', err);
      if (onTriggerToast) {
        onTriggerToast('error', 'Unlock Failed', err?.message || 'Failed to unlock user account.');
      }
    }
  };

  // ── Navigation & Filter Parameter Helpers ──
  const navigateToUserManagement = (status?: 'active' | 'locked' | 'inactive') => {
    const url = `/admin/security-center/user-management${status ? `?status=${status}` : ''}`;
    window.history.pushState({}, '', url);
    if (onNavigateToTab) {
      onNavigateToTab('employee-lifecycle');
    }
  };

  const navigateToAuditLogs = (params?: { result?: string; eventType?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.result) query.append('result', params.result);
    if (params?.eventType) query.append('eventType', params.eventType);
    if (params?.category) query.append('category', params.category);

    const queryString = query.toString();
    const url = `/admin/security-center/audit-logs${queryString ? `?${queryString}` : ''}`;
    window.history.pushState({}, '', url);
    if (onNavigateToTab) {
      onNavigateToTab('audit-trail');
    }
  };

  const navigateToDevicePolicies = () => {
    const url = `/admin/security-center/device-policies`;
    window.history.pushState({}, '', url);
    if (onNavigateToTab) {
      onNavigateToTab('device-policies');
    }
  };

  // ── Row Click Handlers ──
  const handleFailedLoginRowClick = (event: AuditLogDto) => {
    setSelectedEvent(event);
    setIsEventDrawerOpen(true);
  };

  const handleLockedUserRowClick = (lu: any) => {
    const empDetails: EmployeeSecurityDetails = {
      id: lu.id,
      userId: lu.id,
      userCode: lu.userCode || 'USR-' + lu.id.substring(0, 6),
      fullName: lu.displayName || `${lu.firstName || ''} ${lu.lastName || ''}`.trim() || lu.userName,
      email: lu.email || '',
      mobile: lu.mobile || '',
      role: lu.roleName || lu.role || 'User',
      department: lu.department,
      designation: lu.designation,
      mappedEmployeeCode: lu.employeeCode || lu.mappedEmployeeCode || 'EMP-001',
      branch: lu.branch,
      status: lu.isLocked ? 'Locked' : (lu.isActive ? 'Enabled' : 'Disabled'),
      securityProfileName: lu.securityProfileName || 'Default Security Policy',
      faceStatus: lu.faceStatus || 'Not Registered',
      activeTemplateVersion: lu.activeTemplateVersion,
      registeredBy: lu.registeredBy,
      registeredDate: lu.registeredDate,
      lastVerificationTimestamp: lu.lastVerificationTimestamp
    };
    setSelectedLockedUser(empDetails);
    setIsUserDrawerOpen(true);
  };

  const handleOpenBiometricModal = () => {
    setBiometricModalEmployee({
      id: '00000000-0000-0000-0000-000000000000',
      fullName: 'All Users (Security Center)',
      employeeCode: 'SYSTEM'
    });
    setIsBiometricModalOpen(true);
  };

  // Calculated values
  const activeUsersVal = summary?.activeUsersCount ?? 0;
  const onlineUsersVal = summary?.onlineUsersCount !== null && summary?.onlineUsersCount !== undefined ? summary.onlineUsersCount : 1;
  const lockedUsersVal = summary?.lockedUsersCount ?? lockedUsers.length;
  const faceSuccessVal = summary?.faceVerificationSuccessCount ?? 0;
  const faceFailVal = summary?.faceVerificationFailureCount ?? 0;
  const biometricSuccessRateVal = summary?.biometricSuccessRatePercent ?? 100.0;
  const registeredDevicesVal = summary?.registeredDevicesCount ?? 0;
  const unregisteredDevicesVal = summary?.unregisteredDevicesCount ?? 0;
  const securityAlertsVal = summary?.securityAlertsCount ?? 0;
  const failedLoginsTodayVal = summary?.failedLoginsTodayCount ?? failedLogins.length;
  const totalEventsVal = summary?.totalSecurityEventsCount ?? 0;
  const successfulLoginsVal = summary?.successfulLoginsCount ?? 0;
  const biometricVerificationsVal = summary?.biometricVerificationsCount ?? (faceSuccessVal + faceFailVal);

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: MATCHING EXECUTIVE HEADER TOOLBAR ── */}
      <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Security Control Dashboard</h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> System Posture: Optimal
              </span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Auto-Sync (30s)
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Real-time security operations center monitoring authentication logs, failed attempt history, account access control, and active system security events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <KeyRound size={14} />
            <span>Generate Auth PIN</span>
          </button>

          <button
            onClick={() => loadDashboardData()}
            disabled={isLoading || isRefreshing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title={`Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}`}
          >
            <RefreshCw size={14} className={isLoading || isRefreshing ? 'animate-spin text-brand-primary' : 'text-slate-500'} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* ── API Error Banner ── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-rose-600 shrink-0" size={18} />
            <div>
              <span className="font-bold">Telemetry Connection Error:</span> {error}
            </div>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer text-[11px]"
          >
            Retry Telemetry
          </button>
        </div>
      )}


      {/* ── SECTION 3: SECONDARY INTERACTIVE SECURITY METRICS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div
          onClick={() => navigateToUserManagement('active')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Active Users</span>
            <Users size={15} className="text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{activeUsersVal}</div>
          <span className="text-[10px] text-emerald-700 font-bold block">Account Active</span>
        </div>

        <div
          onClick={() => navigateToUserManagement('active')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Online Users</span>
            <Activity size={15} className="text-blue-600 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-slate-900">{onlineUsersVal}</div>
          <span className="text-[10px] text-blue-700 font-bold block">Active Sessions</span>
        </div>

        <div
          onClick={() => navigateToUserManagement('locked')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Locked Users</span>
            <Lock size={15} className="text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{lockedUsersVal}</div>
          <span className="text-[10px] text-amber-700 font-bold block">Access Restricted</span>
        </div>

        <div
          onClick={handleOpenBiometricModal}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Face Failures</span>
            <Camera size={15} className="text-rose-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{faceFailVal}</div>
          <span className="text-[10px] text-rose-700 font-bold block">Verification Rejections</span>
        </div>

        <div
          onClick={navigateToDevicePolicies}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Registered Devices</span>
            <Smartphone size={15} className="text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{registeredDevicesVal}</div>
          <span className="text-[10px] text-indigo-700 font-bold block">Policy Compliant</span>
        </div>

        <div
          onClick={() => navigateToAuditLogs({ category: 'Security Exception' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-primary/50 hover:shadow-sm transition cursor-pointer space-y-1"
        >
          <div className="flex justify-between items-center text-slate-500 font-medium">
            <span>Security Alerts</span>
            <ShieldAlert size={15} className="text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{securityAlertsVal}</div>
          <span className="text-[10px] text-purple-700 font-bold block">Exceptions Recorded</span>
        </div>
      </div>

      {/* ── SECTION 4: FAILED LOGINS & LOCKED ACCOUNTS (GRID 2-COL) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Failed Login Attempt Summary */}
        <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <XCircle className="text-rose-500" size={18} /> Failed Login Attempt History
            </h3>
            <button
              onClick={() => navigateToAuditLogs({ result: 'failure', eventType: 'LOGIN_FAILED' })}
              className="text-xs font-bold px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1 transition cursor-pointer"
            >
              {failedLoginsTodayVal} Failures <ExternalLink size={10} />
            </button>
          </div>

          {failedLogins.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
              Zero failed login attempts detected in current audit window.
            </div>
          ) : (
            <div className="space-y-2.5">
              {failedLogins.map(fl => (
                <div
                  key={fl.id}
                  onClick={() => handleFailedLoginRowClick(fl)}
                  className="p-3 bg-slate-50 hover:bg-rose-50/50 border border-brand-border/70 hover:border-rose-300 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{fl.userDisplayName || fl.username}</span>
                      <span className="font-mono text-[10px] text-slate-400">({fl.ipAddress})</span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium">Reason: {fl.failureReason || fl.description || 'Authentication Failed'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-full block">
                      {fl.eventType || 'LOGIN_FAILED'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {new Date(fl.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently Locked Accounts Control */}
        <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="text-amber-500" size={18} /> Locked User Accounts Control
            </h3>
            <button
              onClick={() => navigateToUserManagement('locked')}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer ${lockedUsers.length > 0 ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
            >
              {lockedUsers.length} Locked <ExternalLink size={10} />
            </button>
          </div>

          {lockedUsers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
              All user accounts are active and unlocked.
            </div>
          ) : (
            <div className="space-y-3">
              {lockedUsers.map(lu => (
                <div
                  key={lu.id}
                  onClick={() => handleLockedUserRowClick(lu)}
                  className="p-3.5 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{lu.displayName || `${lu.firstName} ${lu.lastName}`}</span>
                    <span className="text-[11px] text-slate-500 font-mono block">{lu.email || lu.userName}</span>
                    <span className="text-[10px] text-rose-600 font-bold mt-1 block">Account Locked out due to security threshold</span>
                  </div>
                  <button
                    onClick={(e) => handleUnlockUser(lu.id, lu.displayName || lu.userName, e)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <Unlock size={14} /> Unlock Account
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── SECTION 5: RECENT LIVE AUDIT TRAIL TIMELINE ── */}
      <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="text-brand-primary" size={18} /> Live Security Audit Trail Timeline
          </h3>
          <button
            onClick={() => navigateToAuditLogs()}
            className="text-xs font-mono text-brand-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            {totalEventsVal} Events Logged <ExternalLink size={11} />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs">
            No recent audit trail records recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {recentActivity.map(act => (
              <div
                key={act.id}
                onClick={() => handleFailedLoginRowClick(act)}
                className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand-primary/40 rounded-xl space-y-1.5 cursor-pointer transition shadow-2xs hover:shadow-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-blue-50 text-brand-primary border border-blue-200 font-mono font-bold text-[10px] rounded-full">
                    {act.eventType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-bold text-slate-900 truncate">
                  {act.userDisplayName || act.username}
                </div>
                <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Module: {act.module}</span>
                  <span>IP: {act.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Drawers & Modals Integration ── */}
      <SecurityEventDetailsDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => setIsEventDrawerOpen(false)}
        event={selectedEvent}
        onTriggerToast={onTriggerToast}
      />

      <EmployeeSecurityDetailsDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        employee={selectedLockedUser}
        onRegisterFace={() => {}}
        onViewHistory={() => {
          if (selectedLockedUser) {
            setBiometricModalEmployee({
              id: selectedLockedUser.id,
              userId: selectedLockedUser.userId,
              fullName: selectedLockedUser.fullName,
              employeeCode: selectedLockedUser.mappedEmployeeCode
            });
            setIsBiometricModalOpen(true);
          }
        }}
        onTriggerToast={onTriggerToast || (() => {})}
        onStatusUpdate={() => {
          loadDashboardData(true);
          setIsUserDrawerOpen(false);
        }}
      />

      <FaceVerificationHistoryModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        employee={biometricModalEmployee}
      />

      <TemporaryPinGeneratorModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />

    </div>
  );
}
