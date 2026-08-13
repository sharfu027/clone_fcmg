import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, LoginCredentials, UserPermission } from '../types';
import { getPermissionsForRole } from '../constants/roles';
import { STORAGE_KEYS } from '../constants/app';
import { authService } from '../services/authService';
import { apiClient } from '../api/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsUser: (userName: string, role: string) => void;
  logout: () => Promise<void>;
  updateRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient.setOnUnauthorizedHandler(() => {
      logout();
    });
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      const validUser = await authService.validateSession();
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (validUser && storedToken) {
        const userRole = validUser.role || (validUser.roles && (validUser.roles[0] as any)) || 'Administrator';
        const permissions = getPermissionsForRole(userRole) as UserPermission[];
        setUser({
          ...validUser,
          role: userRole as any,
          permissions
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
        const userRole = response.user.role || (response.user.roles && (response.user.roles[0] as any)) || 'Administrator';
        const permissions = getPermissionsForRole(userRole) as UserPermission[];
        const fullUser: UserProfile = {
          ...response.user,
          role: userRole as any,
          permissions
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

  const loginAsUser = (userName: string, role: string) => {
    const mockToken = `jwt-token-${Date.now()}`;
    const permissions = getPermissionsForRole(role as any) as UserPermission[];
    const mockUser: UserProfile = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      name: userName,
      email: `${userName.toLowerCase().replace(/\s+/g, '.')}@ink-fmcg.com`,
      role: role as any,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      branch: 'Delhi Central',
      permissions
    };

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mockUser));

    setToken(mockToken);
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
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateRole = (role: string) => {
    if (!user) return;
    const permissions = getPermissionsForRole(role as any) as UserPermission[];
    const updatedUser: UserProfile = {
      ...user,
      role: role as any,
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
        updateRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
