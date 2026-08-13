export type UserRole = string;

export type PolicyRequirementLevel = 'Required' | 'Optional' | 'Disabled';
export type AuthenticationMode = 'BiometricFace' | 'GeofenceGPS';

export type UserPermission = string | {
  id: string;
  code: string;
  name: string;
  category: string;
};

export interface SecurityProfile {
  id: string;
  profileId?: string;
  key?: string;
  name?: string;
  profileName?: string;
  description: string;
  badgeColor?: string;
  defaultPolicy?: AuthenticationPolicy;
  grantedPermissions?: string[];
  loginPolicy?: {
    faceScan: AuthenticationMode;
    gpsLocation: AuthenticationMode;
  };
}

export interface AuthenticationPolicy {
  policyId: string;
  policyName: string;
  loginFaceRequirement: PolicyRequirementLevel;
  loginGpsRequirement: PolicyRequirementLevel;
  sessionTimeoutMinutes?: number;
  allowedGeofenceRadiusMeters?: number;
  officeHoursOnly?: boolean;
  allowOffline?: boolean;
}

export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: UserRole;
  roles?: string[];
  department?: string;
  designation?: string;
  employeeId?: string;
  employeeOverridePolicy?: Partial<AuthenticationPolicy>;
  useGlobalPolicy?: boolean;
  assignedSecurityProfileId?: string;
  assignedSecurityProfile?: SecurityProfile;
  permissions?: UserPermission[];
  avatarUrl?: string;
  branch?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: UserProfile;
}

export interface PasswordResetParams {
  email: string;
}

export interface ConfirmPasswordResetParams {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface FaceAuthParams {
  imageBlob?: Blob | string;
  imageBase64?: string;
  userId?: string;
  deviceId?: string;
}

export interface FaceAuthResult {
  success?: boolean;
  Success?: boolean;
  confidenceScore?: number;
  ConfidenceScore?: number;
  similarityScore?: number;
  SimilarityScore?: number;
  processingTimeMs?: number;
  ProcessingTimeMs?: number;
  failureReason?: string;
  FailureReason?: string;
  message?: string;
  Message?: string;
}

export interface GpsAuthParams {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GpsAuthResult {
  success: boolean;
  distanceFromDepotMeters: number;
  allowedRadiusMeters: number;
  message: string;
}
