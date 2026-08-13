import { PolicyRequirementLevel, AuthenticationPolicy, SecurityProfile } from './auth';

export type { PolicyRequirementLevel, AuthenticationPolicy, SecurityProfile };

export interface RoleSecurityPolicy {
  requireFace: boolean;
  requireGps: boolean;
  require2Fa: boolean;
  requireDeviceReg: boolean;
  allowUnknownDevice: boolean;
  officeHoursOnly: boolean;
  allowOffline: boolean;
  autoMarkAttendance: boolean;
  radius: number;
}

export interface EmployeeSecurityConfig {
  useGlobalPolicy: boolean;
  assignedSecurityProfileId: string;
  employeeOverridePolicy?: Partial<AuthenticationPolicy>;
}

export interface GlobalSecuritySettings {
  faceRecognitionGlobally: boolean;
  gpsVerificationGlobally: boolean;
  attendanceOnLogin: boolean;
  deviceRegistration: boolean;
  sessionTimeout: boolean;
  sessionTimeoutMinutes: number;
  loginAuditLogs: boolean;
  ipRestrictions: boolean;
  passwordExpiration: boolean;
  passwordExpirationDays: number;
  defaultGlobalPolicy: AuthenticationPolicy;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  user: string;
  securityProfileName: string;
  eventType: string;
  ipAddress: string;
  device: string;
  status: 'Passed' | 'Flagged' | 'Blocked';
}
