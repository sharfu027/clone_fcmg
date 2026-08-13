export type UserAccountStatus =
  | 'Enabled'
  | 'Disabled'
  | 'Locked'
  | 'Suspended'
  | 'Archived'
  | 'PendingPasswordReset'
  | 'PendingActivation';

export type NotificationChannel = 'Email' | 'SMS' | 'WhatsApp' | 'Push';
export type LogSeverity = 'Info' | 'Warning' | 'SecurityAlert' | 'Error';

import type { AuthenticationMode } from './auth';

export type SecurityRequirementMode = 'Required' | 'Optional' | 'Disabled';
export type { AuthenticationMode };

export interface RoleDto {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  priority: number;
  isActive: boolean;
  usersCount: number;
  permissionCount: number;
  permissionCodes?: string[];
  createdAtUtc: string;
  lastModifiedAtUtc?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface RoleStatsDto {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  systemRoles: number;
  customRoles: number;
  totalUsersAssigned: number;
  totalPermissionsCount: number;
}

export interface PermissionItemDto {
  id: string;
  code: string;
  name: string;
  description: string;
  action: string;
  displayOrder: number;
}

export interface PermissionCategoryDto {
  id: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  permissions: PermissionItemDto[];
}

export interface AuditLogDto {
  id: string;
  timestamp: string;
  userId?: string;
  username: string;
  employeeId: string;
  userDisplayName: string;
  eventType: string;
  category: string;
  module: string;
  description: string;
  success: boolean;
  failureReason?: string;
  ipAddress: string;
  device: string;
  browser: string;
  operatingSystem: string;
  location: string;
  endpoint?: string;
  httpMethod?: string;
  processingTimeMs?: number;
  previousValue?: string;
  newValue?: string;
  createdAtUtc: string;
}

export interface AuditLogStatsDto {
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  faceVerifications: number;
  userManagementEvents: number;
  roleChanges: number;
  securityExceptions: number;
  criticalSecurityEvents: number;
}

export interface RoleUserDto {
  userId: string;
  userName: string;
  displayName: string;
  email: string;
  department?: string;
  branch?: string;
  isActive: boolean;
  lastLoginUtc?: string;
}

export interface FacePolicy {
  loginFace: SecurityRequirementMode;
  attendanceFace: SecurityRequirementMode;
  visitFace: SecurityRequirementMode;
  warehouseFace: SecurityRequirementMode;
  transactionFace: SecurityRequirementMode;
  managerApprovalFace: SecurityRequirementMode;
  inventoryAuditFace: SecurityRequirementMode;
  minConfidenceScore?: number;
}

export interface LocationPolicy {
  loginGps: SecurityRequirementMode;
  attendanceGps: SecurityRequirementMode;
  visitGps: SecurityRequirementMode;
  warehouseGps: SecurityRequirementMode;
  deliveryGps: SecurityRequirementMode;
  collectionsGps: SecurityRequirementMode;
  allowedRadiusMeters: number;
  gpsAccuracyMeters: number;
  mockLocationDetection: SecurityRequirementMode;
  backgroundTracking: SecurityRequirementMode;
}

export interface GpsPolicy {
  loginGps: SecurityRequirementMode;
  attendanceGps: SecurityRequirementMode;
  visitGps: SecurityRequirementMode;
  warehouseGps: SecurityRequirementMode;
  deliveryGps: SecurityRequirementMode;
  collectionsGps: SecurityRequirementMode;
}

export interface DevicePolicy {
  mockLocationDetection: SecurityRequirementMode;
  backgroundTracking: SecurityRequirementMode;
  trustedDevicesOnly: SecurityRequirementMode;
  rootDetection: SecurityRequirementMode;
  jailbreakDetection: SecurityRequirementMode;
  emulatorDetection: SecurityRequirementMode;
  offlineLoginAllowed: SecurityRequirementMode;
  deviceRegistrationRequired: SecurityRequirementMode;
}

export interface SessionPolicy {
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  forceLogoutOnPasswordChange: boolean;
  allowConcurrentSessions: boolean;
  rememberDeviceAllowed: boolean;
  autoLogoutOnInactivity: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  passwordHistoryCount: number;
  passwordExpiryDays: number;
  maxFailedAttempts: number;
  accountLockDurationMinutes: number;
}

export interface GlobalAuthenticationPolicy {
  id: string;
  name: string;
  description: string;
  facePolicy: FacePolicy;
  locationPolicy: LocationPolicy;
  devicePolicy: DevicePolicy;
  sessionPolicy: SessionPolicy;
  passwordPolicy: PasswordPolicy;
}

export interface EmployeeSecurityProfile {
  id: string;
  profileCode: string;
  profileName: string; // e.g. Salesman Security Profile, Warehouse Security Profile, Finance Security Profile, etc.
  description: string;
  assignedPolicyId: string;
  assignedPolicyName: string;
  employeeCount: number;
  isSystemDefault: boolean;
}

export interface EmployeeAuthenticationOverride {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  useGlobalPolicy: boolean;
  loginFace?: SecurityRequirementMode;
  attendanceFace?: SecurityRequirementMode;
  visitFace?: SecurityRequirementMode;
  warehouseFace?: SecurityRequirementMode;
  loginGps?: SecurityRequirementMode;
  attendanceGps?: SecurityRequirementMode;
  visitGps?: SecurityRequirementMode;
  warehouseGps?: SecurityRequirementMode;
  passwordExpiryDays?: number;
  sessionTimeoutMinutes?: number;
  maxDevices?: number;
}

export interface TemporarySecurityException {
  id: string;
  employeeId: string;
  employeeName: string;
  exceptionType: 'SkipFaceAuth' | 'SkipGPS';
  reason: string;
  approvedBy: string;
  approvedDate: string;
  startDate: string;
  expiryDate: string;
  isExpired: boolean;
}

export interface RegisteredDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  osVersion: string;
  registeredToEmployeeName: string;
  registeredDate: string;
  lastUsedTimestamp: string;
  isTrusted: boolean;
  isBlocked: boolean;
}

export interface SecurityDashboardMetrics {
  activeUsersCount: number;
  lockedUsersCount: number;
  disabledUsersCount: number;
  suspendedUsersCount: number;
  onlineUsersCount: number;
  offlineUsersCount: number;
  registeredDevicesCount: number;
  failedLoginsTodayCount: number;
  faceVerificationSuccessCount: number;
  faceVerificationFailureCount: number;
  gpsFailureRatePercent: number;
  policyViolationsCount: number;
  securityAlertsCount: number;
}

export interface SecurityDashboardSummaryDto {
  activeUsersCount: number;
  onlineUsersCount: number | null;
  lockedUsersCount: number;
  suspendedUsersCount: number;
  faceVerificationSuccessCount: number;
  faceVerificationFailureCount: number;
  biometricSuccessRatePercent: number;
  registeredDevicesCount: number;
  unregisteredDevicesCount: number;
  securityAlertsCount: number;
  failedLoginsTodayCount: number;
  totalSecurityEventsCount: number;
  successfulLoginsCount: number;
  biometricVerificationsCount: number;
}

export interface UserAccount {
  id: string;
  userCode: string;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  mappedEmployeeCode?: string;
  department?: string;
  designation?: string;
  branch: string;
  status: UserAccountStatus;
  securityProfileName?: string;
  lastLoginTimestamp?: string;
  isMfaEnabled: boolean;
  registeredDevicesCount?: number;
  // Face biometric fields
  faceStatus?: 'Registered' | 'Not Registered' | 'Disabled';
  activeTemplateVersion?: number;
  registeredBy?: string;
  registeredDate?: string;
  lastVerificationTimestamp?: string;
  similarityThreshold?: number;
  qualityScore?: number;
}

export interface UserSession {
  sessionId: string;
  username: string;
  ipAddress: string;
  deviceBrowser: string;
  loginTime: string;
  status: 'Active' | 'Terminated';
}

export interface RoleDefinition {
  id: string;
  roleCode: string;
  name: string;
  category: 'Executive' | 'Operations' | 'Finance' | 'FieldStaff' | 'SystemAdmin';
  description: string;
  assignedUsersCount: number;
  isSystemRole: boolean;
}

export interface PermissionItem {
  id: string;
  moduleName: string;
  pageName: string;
  actionKey: 'Create' | 'Read' | 'Update' | 'Delete' | 'Approve' | 'Export';
  isGranted: boolean;
}

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  financialYearStart: string;
  currency: string;
  timeZone: string;
  defaultLanguage: string;
}

export interface BranchSettings {
  id: string;
  branchCode: string;
  name: string;
  region: string;
  defaultWarehouseName: string;
  gstNumber: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface NumberSeriesRule {
  id: string;
  documentType: 'PurchaseOrder' | 'SalesOrder' | 'SalesInvoice' | 'GRN' | 'Returns' | 'Employee' | 'Customer' | 'Supplier';
  prefix: string;
  suffix?: string;
  nextNumber: number;
  numberPaddingLength: number;
  sampleFormattedCode: string;
}

export interface NotificationTemplate {
  id: string;
  templateCode: string;
  name: string;
  channel: NotificationChannel;
  subjectOrHeader: string;
  bodyTemplate: string;
  variables: string[];
}

export interface AuditTrailLog {
  id: string;
  timestamp: string;
  username: string;
  actionType:
    | 'Login'
    | 'Logout'
    | 'FailedLogin'
    | 'FaceVerified'
    | 'FaceFailed'
    | 'GpsFailed'
    | 'AccountLocked'
    | 'AccountDisabled'
    | 'PasswordChanged'
    | 'PolicyModified'
    | 'DeviceRegistered'
    | 'DeviceRemoved'
    | 'SecurityOverrideApplied'
    | 'TemporaryBypassGranted';
  module: string;
  ipAddress: string;
  severity: LogSeverity;
  details: string;
}

export interface SystemConfiguration {
  sessionTimeoutMinutes: number;
  passwordExpiryDays: number;
  minPasswordLength: number;
  requireSpecialCharacter: boolean;
  enableBiometricAuth: boolean;
  enableGpsGeofencing: boolean;
  autoBackupFrequency: 'Daily' | 'Weekly';
}

export interface AdminMetrics {
  totalUsersCount: number;
  activeUsersCount: number;
  lockedUsersCount: number;
  totalRolesCount: number;
  activeSessionsCount: number;
  securityEventsToday: number;
}
