import { AuthenticationPolicy, SecurityProfile } from '../types/security';
import { UserProfile } from '../types/auth';

// System Default Global Policy
export const DEFAULT_GLOBAL_POLICY: AuthenticationPolicy = {
  policyId: 'POL-GLOBAL-DEFAULT',
  policyName: 'Global Company Standard Security Policy',
  loginFaceRequirement: 'Disabled',
  loginGpsRequirement: 'Disabled',
  sessionTimeoutMinutes: 30,
  allowedGeofenceRadiusMeters: 500,
  officeHoursOnly: false,
  allowOffline: false
};

export const securityPolicyResolver = {
  /**
   * Resolves the effective Authentication Policy for an employee dynamically from API-loaded profiles.
   * Order of Resolution:
   * 1. Employee Override Policy (if useGlobalPolicy === false)
   * 2. Assigned Security Profile Default Policy (API-loaded)
   * 3. Global System Policy
   */
  resolveAuthenticationPolicy(
    user?: Partial<UserProfile>,
    apiSecurityProfile?: SecurityProfile,
    customGlobalPolicy: AuthenticationPolicy = DEFAULT_GLOBAL_POLICY
  ): AuthenticationPolicy {
    if (!user) return customGlobalPolicy;

    const activeProfilePolicy = apiSecurityProfile?.defaultPolicy || user.assignedSecurityProfile?.defaultPolicy;

    // 1. Employee Override Policy (if useGlobalPolicy === false and override exists)
    if (user.useGlobalPolicy === false && user.employeeOverridePolicy) {
      const basePolicy = activeProfilePolicy || customGlobalPolicy;
      return {
        ...basePolicy,
        ...user.employeeOverridePolicy
      };
    }

    // 2. Assigned Security Profile Default Policy
    if (activeProfilePolicy) {
      return activeProfilePolicy;
    }

    // 3. Fallback to Global System Policy
    return customGlobalPolicy;
  },

  /**
   * Resolves dynamic permissions for an employee based on Security Profile loaded from API contracts.
   */
  resolveUserPermissions(
    user?: Partial<UserProfile>,
    apiSecurityProfile?: SecurityProfile
  ): string[] {
    if (!user) return [];
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.map(p => typeof p === 'string' ? p : p.code);
    }

    const profile = apiSecurityProfile || user.assignedSecurityProfile;
    return profile?.grantedPermissions || [];
  }
};
