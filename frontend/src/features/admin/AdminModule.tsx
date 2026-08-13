import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Key,
  Smartphone,
  Lock,
  Plus,
  TrendingUp,
  Activity,
  Sliders,
  UserCheck,
  Layers,
  Camera,
  History,
  Eye,
  Fingerprint
} from 'lucide-react';
import {
  UserAccount,
  UserAccountStatus,
  GlobalAuthenticationPolicy,
  EmployeeSecurityProfile,
  EmployeeAuthenticationOverride,
  TemporarySecurityException,
  RegisteredDevice,
  SecurityDashboardMetrics,
  AuditTrailLog
} from '../../types/admin';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import SecurityDashboardPage from './SecurityCenter/pages/SecurityDashboardPage';
import AuthenticationPoliciesPage from './SecurityCenter/pages/AuthenticationPoliciesPage';
import {
  EmployeeSecurityDetailsDrawer,
  EmployeeSecurityDetails
} from './SecurityCenter/components/EmployeeSecurityDetailsDrawer';
import { WebcamEnrollmentModal } from './SecurityCenter/components/WebcamEnrollmentModal';
import { FaceVerificationHistoryModal } from './SecurityCenter/components/FaceVerificationHistoryModal';
import { BiometricDebugDashboardModal } from './SecurityCenter/components/BiometricDebugDashboardModal';
import { UserManagementModule } from './UserManagement/UserManagementModule';
import RoleSecurityProfilesModule from './RoleManagement/RoleSecurityProfilesModule';
import AuditLogsModule from './AuditLogs/AuditLogsModule';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';

interface AdminModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

type TabOption =
  | 'security-center'
  | 'auth-policies'
  | 'device-policies'
  | 'password-policies'
  | 'security-profiles'
  | 'employee-overrides'
  | 'employee-lifecycle'
  | 'audit-trail';

// Roles allowed to perform face management actions
const FACE_ADMIN_ROLES = ['Super Administrator', 'Administrator', 'Security Officer'];

function canManageFace(role: string): boolean {
  return FACE_ADMIN_ROLES.some(r => role.toLowerCase().includes(r.toLowerCase()));
}

function toEmployeeSecurityDetails(u: UserAccount): EmployeeSecurityDetails {
  return {
    id: u.id,
    userId: u.id,
    userCode: u.userCode,
    fullName: u.fullName,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    department: u.department,
    designation: u.designation,
    mappedEmployeeCode: u.mappedEmployeeCode || u.userCode,
    branch: u.branch,
    status: (u.status as EmployeeSecurityDetails['status']) ?? 'Enabled',
    securityProfileName: u.securityProfileName || 'Standard Security Profile',
    faceStatus: u.faceStatus || 'Not Registered',
    activeTemplateVersion: u.activeTemplateVersion,
    registeredBy: u.registeredBy,
    registeredDate: u.registeredDate,
    lastVerificationTimestamp: u.lastVerificationTimestamp,
    similarityThreshold: u.similarityThreshold,
    qualityScore: u.qualityScore,
  };
}

export default function AdminModule({ onTriggerToast }: AdminModuleProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (pathname: string): TabOption => {
    if (pathname.includes('user-management')) return 'employee-lifecycle';
    if (pathname.includes('security-profiles')) return 'security-profiles';
    if (pathname.includes('authentication')) return 'auth-policies';
    if (pathname.includes('device-policy')) return 'device-policies';
    if (pathname.includes('password-policy')) return 'password-policies';
    if (pathname.includes('employee-overrides')) return 'employee-overrides';
    if (pathname.includes('audit-logs')) return 'audit-trail';
    return 'security-center';
  };

  const activeTab = getTabFromPath(location.pathname);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

  // Employee Security Drawer state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSecurityDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Webcam Enrollment Modal state
  const [enrollmentTarget, setEnrollmentTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  // Verification History Modal state
  const [historyTarget, setHistoryTarget] = useState<EmployeeSecurityDetails | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDebugDashboardOpen, setIsDebugDashboardOpen] = useState(false);

  // Deletion in-progress tracking per user id
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // ── IAM Dashboard Metrics ──────────────────────────
  const [iamMetrics, setIamMetrics] = useState<SecurityDashboardMetrics>({
    activeUsersCount: 1,
    lockedUsersCount: 0,
    disabledUsersCount: 0,
    suspendedUsersCount: 0,
    onlineUsersCount: 1,
    offlineUsersCount: 0,
    registeredDevicesCount: 1,
    failedLoginsTodayCount: 0,
    faceVerificationSuccessCount: 1,
    faceVerificationFailureCount: 0,
    gpsFailureRatePercent: 0.0,
    policyViolationsCount: 0,
    securityAlertsCount: 0
  });

  React.useEffect(() => {
    let isMounted = true;
    const fetchRealMetrics = async () => {
      try {
        const usersRes = await adminService.fetchUsers({ pageSize: 1 });
        const totalUsers = usersRes?.totalCount || 1;
        const devicesRes = await adminService.getRegisteredDevices().catch(() => []);
        const totalDevices = Array.isArray(devicesRes) && devicesRes.length > 0 ? devicesRes.length : 1;

        if (isMounted) {
          setIamMetrics(prev => ({
            ...prev,
            activeUsersCount: totalUsers,
            onlineUsersCount: Math.min(totalUsers, 1),
            registeredDevicesCount: totalDevices
          }));
        }
      } catch (err) {
        console.warn('Failed to load security dashboard metrics:', err);
      }
    };
    fetchRealMetrics();
    return () => { isMounted = false; };
  }, []);

  // ── Global Authentication Policy ───────────────────────────────────────────
  const [globalPolicy, setGlobalPolicy] = useState<GlobalAuthenticationPolicy>({
    id: 'POL-GLOBAL-162',
    name: 'Enterprise Global Security Policy (v16.2)',
    description: 'Master IAM security rules applied across all company entities.',
    facePolicy: {
      loginFace: 'Required',
      attendanceFace: 'Required',
      visitFace: 'Required',
      warehouseFace: 'Required',
      transactionFace: 'Optional',
      managerApprovalFace: 'Required',
      inventoryAuditFace: 'Required'
    },
    locationPolicy: {
      loginGps: 'Required',
      attendanceGps: 'Required',
      visitGps: 'Required',
      warehouseGps: 'Required',
      deliveryGps: 'Required',
      collectionsGps: 'Required',
      allowedRadiusMeters: 500,
      gpsAccuracyMeters: 20,
      mockLocationDetection: 'Required',
      backgroundTracking: 'Optional'
    },
    devicePolicy: {
      maxDevices: 2,
      trustedDevicesOnly: 'Required',
      rootDetection: 'Required',
      jailbreakDetection: 'Required',
      emulatorDetection: 'Required',
      offlineLoginAllowed: 'Optional',
      deviceRegistrationRequired: 'Required'
    },
    sessionPolicy: {
      sessionTimeoutMinutes: 30,
      idleTimeoutMinutes: 15,
      forceLogoutOnPasswordChange: true,
      allowConcurrentSessions: false,
      rememberDeviceAllowed: true,
      autoLogoutOnInactivity: true
    },
    passwordPolicy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
      passwordHistoryCount: 5,
      passwordExpiryDays: 90,
      maxFailedAttempts: 3,
      accountLockDurationMinutes: 30
    },
  });

  // ── Temporary Exceptions ────────────────────────────────────────────────────
  const [exceptions, setExceptions] = useState<TemporarySecurityException[]>([
    { id: 'EXC-901', employeeId: 'EMP-1004', employeeName: 'Vikram Singh (Driver)', exceptionType: 'SkipFaceAuth', reason: 'Temporary camera lens hardware malfunction on mobile terminal.', approvedBy: 'Siddharth Mehra (SuperAdmin)', approvedDate: '2026-07-23', startDate: '2026-07-23', expiryDate: '2026-07-26', isExpired: false }
  ]);

  // ── Registered Devices ──────────────────────────────────────────────────────
  const [devices] = useState<RegisteredDevice[]>([
    { id: 'DEV-01', deviceId: 'DEV-IPHONE-14-PRO', deviceName: 'Siddharth iPhone 14 Pro', osVersion: 'iOS 17.4', registeredToEmployeeName: 'Siddharth Mehra', registeredDate: '2026-01-15', lastUsedTimestamp: 'Today 09:15 AM', isTrusted: true, isBlocked: false }
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateException = () => {
    const newExc: TemporarySecurityException = {
      id: `EXC-90${exceptions.length + 1}`,
      employeeId: 'EMP-1008',
      employeeName: 'Anand Singh (Sales Rep)',
      exceptionType: 'SkipGPS',
      reason: 'Network connectivity blackout in rural distributor zone.',
      approvedBy: 'Siddharth Mehra (SuperAdmin)',
      approvedDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '2026-07-25',
      isExpired: false
    };
    setExceptions([...exceptions, newExc]);
    setIsExceptionModalOpen(false);
    onTriggerToast('success', 'Temporary Security Exception Granted', `Bypass approved for ${newExc.employeeName} until ${newExc.expiryDate}.`);
  };

  // Open webcam enrollment modal (Register or Re-register)
  const handleOpenEnrollment = (emp: EmployeeSecurityDetails) => {
    setEnrollmentTarget(emp);
    setIsEnrollmentModalOpen(true);
    setIsDrawerOpen(false); // Close drawer while camera modal is open
  };

  // Open verification history modal
  const handleOpenHistory = (emp: EmployeeSecurityDetails) => {
    setHistoryTarget(emp);
    setIsHistoryModalOpen(true);
    setIsDrawerOpen(false);
  };

  // Called when drawer action updates status (enable/disable/delete)
  const handleDrawerStatusUpdate = (updated: EmployeeSecurityDetails) => {
    setSelectedEmployee(updated);
  };

  // Called after a successful face enrollment
  const handleEnrollmentSuccess = (result: { userId: string; faceStatus: 'Registered'; templateVersion: number }) => {
    onTriggerToast(
      'success',
      'Face Biometric Registered',
      `Template v${result.templateVersion} enrolled for user ${enrollmentTarget?.fullName ?? result.userId}.`
    );
  };

  // ── Tab list ────────────────────────────────────────────────────────────────
  const tabsList: Array<{ id: TabOption; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'security-center', label: 'Security Dashboard', icon: Shield },
    { id: 'auth-policies', label: 'Global Security Policies', icon: Key },
    { id: 'device-policies', label: 'Device Security', icon: Smartphone },
    { id: 'password-policies', label: 'Password & Session Rules', icon: Lock },
    { id: 'security-profiles', label: 'Roles & Permissions', icon: Layers },
    { id: 'employee-overrides', label: 'Overrides & Exceptions', icon: Sliders },
    { id: 'employee-lifecycle', label: 'User Management', icon: Users },
    { id: 'audit-trail', label: 'Audit Logs', icon: Activity }
  ];

  return (
    <div className="space-y-6">


      {/* ── VIEW: True Security Control Dashboard ── */}
      {activeTab === 'security-center' && (
        <SecurityDashboardPage
          exceptions={exceptions}
          devices={devices}
          onTriggerToast={onTriggerToast}
          onNavigateToTab={(tab) => {
            const currentSearch = window.location.search;
            if (tab === 'employee-lifecycle') navigate(`/admin/security-center/user-management${currentSearch}`);
            else if (tab === 'security-profiles') navigate(`/admin/security-center/security-profiles${currentSearch}`);
            else if (tab === 'auth-policies') navigate(`/admin/security-center/authentication${currentSearch}`);
            else if (tab === 'audit-trail') navigate(`/admin/security-center/audit-logs${currentSearch}`);
            else if (tab === 'device-policies') navigate(`/admin/security-center/device-policy${currentSearch}`);
            else navigate(`/admin/security-center${currentSearch}`);
          }}
        />
      )}

      {/* ── TAB: Global Security Policies ── */}
      {activeTab === 'auth-policies' && (
        <AuthenticationPoliciesPage
          globalPolicy={globalPolicy}
          setGlobalPolicy={setGlobalPolicy}
          onSave={() => onTriggerToast('success', 'Security Policy Saved', 'Global authentication policy matrix saved.')}
        />
      )}

      {/* ── TAB: Production User Management ── */}
      {activeTab === 'employee-lifecycle' && (
        <UserManagementModule onTriggerToast={onTriggerToast} />
      )}

      {/* ── TAB: Role Security Profiles (RBAC Module) ── */}
      {activeTab === 'security-profiles' && (
        <RoleSecurityProfilesModule onTriggerToast={onTriggerToast} />
      )}

      {/* ── TAB: Production Audit Logs Module ── */}
      {activeTab === 'audit-trail' && (
        <AuditLogsModule onTriggerToast={onTriggerToast} />
      )}

      {/* ── MODAL: Temporary Security Exception ── */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Grant Temporary Security Exception</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Bypass Exception Type</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white font-bold">
                  <option value="SkipGPS">Skip GPS Location Verification</option>
                  <option value="SkipFaceAuth">Skip Face Biometric Check</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Audit Justification / Reason</label>
                <textarea rows={3} defaultValue="Temporary camera lens hardware malfunction on mobile terminal." className="w-full p-2 border rounded border-brand-border" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsExceptionModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleCreateException} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Grant Exception</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: Employee Security Details ── */}
      <EmployeeSecurityDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        employee={selectedEmployee}
        onRegisterFace={handleOpenEnrollment}
        onViewHistory={handleOpenHistory}
        onTriggerToast={onTriggerToast}
        onStatusUpdate={handleDrawerStatusUpdate}
      />

      {/* ── MODAL: Webcam Enrollment ── */}
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
            email: enrollmentTarget.email
          }}
          onTriggerToast={onTriggerToast}
          onEnrollmentSuccess={(result) => {
            handleEnrollmentSuccess(result);
            setIsEnrollmentModalOpen(false);
            setEnrollmentTarget(null);
          }}
        />
      )}

      {/* ── MODAL: Verification History ── */}
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
            employeeCode: historyTarget.mappedEmployeeCode
          }}
        />
      )}

      {/* ── MODAL: Developer Biometric Diagnostics Dashboard ── */}
      <BiometricDebugDashboardModal
        isOpen={isDebugDashboardOpen}
        onClose={() => setIsDebugDashboardOpen(false)}
        userId={selectedEmployee?.userId || selectedEmployee?.id}
      />

    </div>
  );
}
