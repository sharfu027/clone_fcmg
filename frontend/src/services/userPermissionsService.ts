import { UserRole } from '../types';
import { getPermissionsForRole, ROLE_PERMISSIONS_MAP } from '../constants/roles';

export const saveUserRoleAndPermissions = (
  userId: string,
  email: string,
  roleName: string,
  permissions: string[],
  username?: string
): void => {
  try {
    const data = { roleName, permissions, updatedAt: new Date().toISOString() };
    if (userId) localStorage.setItem(`ink_user_access_${userId}`, JSON.stringify(data));
    if (email) localStorage.setItem(`ink_user_access_${email.toLowerCase()}`, JSON.stringify(data));
    if (username) localStorage.setItem(`ink_user_access_${username.toLowerCase()}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving user access settings:', e);
  }
};

export const getUserAccessSettings = (
  userId?: string,
  email?: string,
  username?: string,
  defaultRole: string = 'Administrator'
): { roleName: string; permissions: string[] } => {
  try {
    let raw = null;
    if (userId) raw = localStorage.getItem(`ink_user_access_${userId}`);
    if (!raw && email) raw = localStorage.getItem(`ink_user_access_${email.toLowerCase()}`);
    if (!raw && username) raw = localStorage.getItem(`ink_user_access_${username.toLowerCase()}`);
    
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.roleName) {
        // Super Administrator ALWAYS gets full root permissions by default
        if (parsed.roleName === 'Super Administrator') {
          return {
            roleName: 'Super Administrator',
            permissions: ROLE_PERMISSIONS_MAP['Super Administrator']
          };
        }
        return {
          roleName: parsed.roleName,
          permissions: parsed.permissions && parsed.permissions.length > 0
            ? parsed.permissions
            : getPermissionsForRole(parsed.roleName as UserRole)
        };
      }
    }
  } catch (e) {
    console.error('Error reading user access settings:', e);
  }

  // Super Administrator root fallback
  if ((email && email.toLowerCase().includes('superadmin')) || (username && username.toLowerCase().includes('superadmin'))) {
    return {
      roleName: 'Super Administrator',
      permissions: ROLE_PERMISSIONS_MAP['Super Administrator']
    };
  }

  // Standard role fallback
  return {
    roleName: defaultRole,
    permissions: getPermissionsForRole(defaultRole as UserRole)
  };
};
