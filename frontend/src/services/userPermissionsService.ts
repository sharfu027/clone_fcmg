import { UserRole } from '../types';
import { getPermissionsForRole, ROLE_PERMISSIONS_MAP } from '../constants/roles';

export const saveUserRoleAndPermissions = (
  userId: string,
  email: string,
  roleName: string,
  permissions: string[]
): void => {
  try {
    const data = { roleName, permissions, updatedAt: new Date().toISOString() };
    if (userId) {
      localStorage.setItem(`ink_user_access_${userId}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${userId}`, JSON.stringify(permissions));
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      localStorage.setItem(`ink_user_access_${cleanEmail}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${cleanEmail}`, JSON.stringify(permissions));
      const username = cleanEmail.split('@')[0];
      if (username) {
        localStorage.setItem(`ink_user_access_${username}`, JSON.stringify(data));
        localStorage.setItem(`ink_user_permissions_${username}`, JSON.stringify(permissions));
      }
    }
  } catch (e) {
    console.error('Error saving user access settings:', e);
  }
};

export const getUserAccessSettings = (
  userId?: string,
  email?: string,
  defaultRole: string = 'Sales Representative'
): { roleName: string; permissions: string[] } => {
  try {
    let raw = null;
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const username = cleanEmail ? cleanEmail.split('@')[0] : '';

    if (userId) raw = localStorage.getItem(`ink_user_access_${userId}`);
    if (!raw && cleanEmail) raw = localStorage.getItem(`ink_user_access_${cleanEmail}`);
    if (!raw && username) raw = localStorage.getItem(`ink_user_access_${username}`);
    if (!raw && userId) raw = localStorage.getItem(`ink_user_permissions_${userId}`);
    if (!raw && cleanEmail) raw = localStorage.getItem(`ink_user_permissions_${cleanEmail}`);
    if (!raw && username) raw = localStorage.getItem(`ink_user_permissions_${username}`);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        const storedRole = parsed.roleName || defaultRole;
        const rawPerms = Array.isArray(parsed) ? parsed : (parsed.permissions || []);
        
        if (storedRole === 'Super Administrator' || (cleanEmail && cleanEmail.includes('superadmin'))) {
          return {
            roleName: 'Super Administrator',
            permissions: ROLE_PERMISSIONS_MAP['Super Administrator']
          };
        }

        const resolvedPerms = rawPerms.includes('read:dashboard') ? rawPerms : ['read:dashboard', ...rawPerms];
        return {
          roleName: storedRole,
          permissions: resolvedPerms
        };
      }
    }
  } catch (e) {
    console.error('Error reading user access settings:', e);
  }

  // Super Administrator root fallback
  if (email && email.toLowerCase().includes('superadmin')) {
    return {
      roleName: 'Super Administrator',
      permissions: ROLE_PERMISSIONS_MAP['Super Administrator']
    };
  }

  // Sub-Admin role fallback: Only grant dashboard access by default until Super-Admin explicitly configures module clearances
  return {
    roleName: defaultRole,
    permissions: ['read:dashboard']
  };
};
