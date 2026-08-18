import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, LoginCredentials, UserPermission, UserRole } from '../types';
import { getPermissionsForRole, ROLE_PERMISSIONS_MAP } from '../constants/roles';
import { STORAGE_KEYS } from '../constants/app';
import { authService } from '../services/authService';
import { apiClient } from '../api/apiClient';
import { getUserAccessSettings } from '../services/userPermissionsService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsUser: (userName: string, role: string, actualEmail?: string, actualId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => void;
  updatePermissions: (permissions: UserPermission[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state when custom event or storage event triggers
  useEffect(() => {
    apiClient.setOnUnauthorizedHandler(() => {
      logout();
    });

    const handlePermissionsUpdated = async () => {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson);
          const isRootSuper = (parsed.email && parsed.email.toLowerCase().includes('superadmin')) ||
                              ((parsed as any).userName && (parsed as any).userName.toLowerCase().includes('superadmin')) ||
                              ((parsed as any).username && (parsed as any).username.toLowerCase().includes('superadmin'));

          const rawRole = parsed.role || (parsed.roles && (parsed.roles[0] as any)) || 'Administrator';
          const access = getUserAccessSettings(parsed.id, parsed.email, isRootSuper ? 'Super Administrator' : rawRole);
          const resolvedRole = (isRootSuper ? 'Super Administrator' : access.roleName) as UserRole;
          const resolvedPermissions = (isRootSuper
            ? ROLE_PERMISSIONS_MAP['Super Administrator']
            : access.permissions) as UserPermission[];

          try {
            const devRes = await authService.devLogin(parsed.email || 'admin@inkerp.com', resolvedRole, resolvedPermissions);
            if (devRes.accessToken) {
              const updatedUser = {
                ...parsed,
                role: resolvedRole,
                permissions: resolvedPermissions,
                companyName: access.companyName || parsed.companyName,
                companyLogo: access.companyLogo || parsed.companyLogo
              };
              setUser(updatedUser);
              setToken(devRes.accessToken);
            }
          } catch {
            // fallback if backend unreachable
            const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            setUser({
              ...parsed,
              role: resolvedRole,
              permissions: resolvedPermissions,
              companyName: access.companyName || parsed.companyName,
              companyLogo: access.companyLogo || parsed.companyLogo
            });
            if (storedToken) setToken(storedToken);
          }
        } catch {
          // ignore error
        }
      }
    };

    window.addEventListener('ink_permissions_updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);

    restoreSession();

    return () => {
      window.removeEventListener('ink_permissions_updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, []);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      const validUser = await authService.validateSession();
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (validUser && storedToken) {
        const isRootSuper = (validUser.email && validUser.email.toLowerCase().includes('superadmin')) ||
                            ((validUser as any).userName && (validUser as any).userName.toLowerCase().includes('superadmin')) ||
                            ((validUser as any).username && (validUser as any).username.toLowerCase().includes('superadmin'));

        const rawRole = validUser.role || (validUser.roles && (validUser.roles[0] as any)) || 'Administrator';
        const access = getUserAccessSettings(validUser.id, validUser.email, isRootSuper ? 'Super Administrator' : rawRole);
        const resolvedRole = (isRootSuper ? 'Super Administrator' : access.roleName) as UserRole;
        const resolvedPermissions = (isRootSuper
          ? ROLE_PERMISSIONS_MAP['Super Administrator']
          : access.permissions) as UserPermission[];

        setUser({
          ...validUser,
          role: resolvedRole,
          permissions: resolvedPermissions,
          companyName: access.companyName || validUser.companyName,
          companyLogo: access.companyLogo || validUser.companyLogo
        });
        setToken(storedToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to restore auth session:', error);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.accessToken && response.user) {
        const rawRole = response.user.role || (response.user.roles && (response.user.roles[0] as any)) || 'Sales Representative';
        const access = getUserAccessSettings(response.user.id, response.user.email, rawRole);
        const resolvedRole = access.roleName as UserRole;
        const resolvedPermissions = (resolvedRole === 'Super Administrator'
          ? ROLE_PERMISSIONS_MAP['Super Administrator']
          : access.permissions) as UserPermission[];

        const fullUser: UserProfile = {
          ...response.user,
          role: resolvedRole,
          permissions: resolvedPermissions,
          companyName: access.companyName || response.user.companyName,
          companyLogo: access.companyLogo || response.user.companyLogo
        };

        setToken(response.accessToken);
        setUser(fullUser);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsUser = async (userName: string, role: string, actualEmail?: string, actualId?: string) => {
    const userEmail = actualEmail || `${userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    const access = getUserAccessSettings(actualId, userEmail, role);
    const isRootSuper = userEmail.toLowerCase().includes('superadmin') || userName.toLowerCase().includes('superadmin');
    const resolvedRole = (isRootSuper ? 'Super Administrator' : access.roleName) as UserRole;
    const resolvedPermissions = (isRootSuper
      ? ROLE_PERMISSIONS_MAP['Super Administrator']
      : access.permissions) as UserPermission[];

    try {
      const devRes = await authService.devLogin(userEmail, resolvedRole, resolvedPermissions);
      if (devRes.accessToken) {
        const fullUser: UserProfile = {
          id: devRes.user.id || actualId || 'USR-1001',
          name: userName,
          email: userEmail,
          role: resolvedRole,
          companyName: access.companyName,
          companyLogo: access.companyLogo,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          branch: 'Delhi Central',
          permissions: resolvedPermissions
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fullUser));
        setToken(devRes.accessToken);
        setUser(fullUser);
        return;
      }
    } catch (err) {
      console.warn('Backend dev-login endpoint unreachable during mock login; falling back to offline user state:', err);
    }

    const mockUser: UserProfile = {
      id: actualId || ('USR-' + Math.floor(1000 + Math.random() * 9000)),
      name: userName,
      email: userEmail,
      role: resolvedRole,
      companyName: access.companyName,
      companyLogo: access.companyLogo,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      branch: 'Delhi Central',
      permissions: resolvedPermissions
    };

    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network error during logout cleanup
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateRole = (role: UserRole) => {
    if (!user) return;
    const permissions = getPermissionsForRole(role as any) as UserPermission[];
    const updatedUser: UserProfile = {
      ...user,
      role,
      permissions
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updatePermissions = (permissions: UserPermission[]) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      permissions
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginAsUser,
        logout,
        updateRole,
        updatePermissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
