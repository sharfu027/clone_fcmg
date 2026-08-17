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
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const rawUsername = cleanEmail ? cleanEmail.split('@')[0] : '';
    const username = rawUsername.replace(/\s+/g, '');

    if (userId) {
      localStorage.setItem(`ink_user_access_${userId}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${userId}`, JSON.stringify(permissions));
    }
    if (cleanEmail) {
      localStorage.setItem(`ink_user_access_${cleanEmail}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${cleanEmail}`, JSON.stringify(permissions));
    }
    if (rawUsername) {
      localStorage.setItem(`ink_user_access_${rawUsername}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${rawUsername}`, JSON.stringify(permissions));
    }
    if (username) {
      localStorage.setItem(`ink_user_access_${username}`, JSON.stringify(data));
      localStorage.setItem(`ink_user_permissions_${username}`, JSON.stringify(permissions));
    }

    // Immediately sync current logged in profile in localStorage if matching
    ['ink_erp_user_profile', 'ink_user_profile'].forEach((key) => {
      try {
        const rawProf = localStorage.getItem(key);
        if (rawProf) {
          const prof = JSON.parse(rawProf);
          if (prof) {
            const pId = prof.id || prof.userId;
            const pEmail = (prof.email || prof.userName || prof.username || '').toLowerCase().trim();
            const pUser = pEmail.split('@')[0];
            const pName = (prof.displayName || prof.name || '').toLowerCase().trim();

            const isCurrentMatch =
              (userId && pId === userId) ||
              (cleanEmail && pEmail === cleanEmail) ||
              (username && pUser === username) ||
              (rawUsername && pUser === rawUsername) ||
              (pName && username && pName.includes(username)) ||
              prof.role === 'Administrator' ||
              (prof.roles && prof.roles.includes('Administrator'));

            if (isCurrentMatch && !pEmail.includes('superadmin')) {
              prof.permissions = permissions;
              prof.role = roleName;
              localStorage.setItem(key, JSON.stringify(prof));
            }
          }
        }
      } catch (err) {
        // ignore profile parse err
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ink_permissions_updated', { detail: { userId, email, permissions } }));
      window.dispatchEvent(new Event('storage'));
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
    const rawUsername = cleanEmail ? cleanEmail.split('@')[0] : '';
    const username = rawUsername.replace(/\s+/g, '');

    if (userId) raw = localStorage.getItem(`ink_user_access_${userId}`);
    if (!raw && cleanEmail) raw = localStorage.getItem(`ink_user_access_${cleanEmail}`);
    if (!raw && rawUsername) raw = localStorage.getItem(`ink_user_access_${rawUsername}`);
    if (!raw && username) raw = localStorage.getItem(`ink_user_access_${username}`);
    if (!raw && userId) raw = localStorage.getItem(`ink_user_permissions_${userId}`);
    if (!raw && cleanEmail) raw = localStorage.getItem(`ink_user_permissions_${cleanEmail}`);
    if (!raw && rawUsername) raw = localStorage.getItem(`ink_user_permissions_${rawUsername}`);
    if (!raw && username) raw = localStorage.getItem(`ink_user_permissions_${username}`);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        const storedRole = parsed.roleName || defaultRole;
        const rawPerms = Array.isArray(parsed) ? parsed : (parsed.permissions || []);
        
        const isRootSuperAdmin = cleanEmail.includes('superadmin') || (rawUsername && rawUsername.includes('superadmin')) || (username && username.includes('superadmin'));
        if (isRootSuperAdmin) {
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
