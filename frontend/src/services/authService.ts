import { apiClient } from '../api/apiClient';
import {
  LoginCredentials,
  AuthResponse,
  UserProfile,
  PasswordResetParams,
  ConfirmPasswordResetParams,
  ChangePasswordParams,
  FaceAuthParams,
  FaceAuthResult,
  GpsAuthParams,
  GpsAuthResult
} from '../types/auth';
import { STORAGE_KEYS } from '../constants/app';

export interface SessionValidationStrategy {
  validateSession: () => Promise<UserProfile | null>;
}

function storeSession(response: AuthResponse): AuthResponse {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

  const userObj: UserProfile = {
    ...response.user,
    name: response.user.name
      || response.user.displayName
      || `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim()
      || response.user.username
      || 'User',
    role: response.user.role || (response.user.roles && response.user.roles[0]) || 'Admin',
    branch: response.user.branch || 'Delhi Central'
  };
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userObj));
  return { ...response, user: userObj };
}

export const authService = {
  /**
   * Authenticate with username/password. Issues JWT Access & Refresh Tokens directly upon success.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
      username: credentials.email,
      password: credentials.password
    }, { skipAuth: true });

    return storeSession(response);
  },

  async devLogin(email: string, roleName: string, permissions?: string[]): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/dev-login', {
      email,
      roleName,
      permissions
    }, { skipAuth: true });

    return storeSession(response);
  },

  async logout(refreshToken?: string): Promise<void> {
    const activeRefreshToken = refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try {
      if (activeRefreshToken) {
        await apiClient.post<void>('/api/v1/auth/logout', { refreshToken: activeRefreshToken });
      }
    } catch {
      // Graceful error handling for offline/network issues during logout
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
    return storeSession(response);
  },

  async validateSession(): Promise<UserProfile | null> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);

    if (!token || !userJson) {
      return null;
    }

    try {
      const userProfile: UserProfile = JSON.parse(userJson);

      // Client-side JWT exp validation
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = JSON.parse(decodedJson);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          return null;
        }
      }

      return userProfile;
    } catch {
      return null;
    }
  },

  async requestPasswordReset(params: PasswordResetParams): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/v1/auth/forgot-password', { email: params.email }, { skipAuth: true });
  },

  async confirmPasswordReset(params: ConfirmPasswordResetParams): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/v1/auth/reset-password', {
      email: params.email,
      token: params.code,
      newPassword: params.newPassword
    }, { skipAuth: true });
  },

  async changePassword(params: ChangePasswordParams): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/v1/auth/change-password', {
      currentPassword: params.currentPassword,
      newPassword: params.newPassword
    });
  },

  async verifyFaceBiometrics(params: FaceAuthParams): Promise<FaceAuthResult> {
    return apiClient.post<FaceAuthResult>('/api/v1/auth/verify-face', params);
  },

  async registerFace(userId: string, imageFile: File | Blob): Promise<{ success: boolean; id?: string }> {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('image', imageFile);

    return apiClient.post<{ success: boolean; id?: string }>('/api/v1/security/face/register', formData);
  },

  async registerFaceBase64(userId: string, imageBase64: string): Promise<{ success: boolean; id?: string }> {
    return apiClient.post<{ success: boolean; id?: string }>('/api/v1/security/face/register-base64', {
      userId,
      imageBase64
    });
  },

  async enableFace(userId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/security/face/enable?userId=${userId}`);
  },

  async disableFace(userId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/security/face/disable?userId=${userId}`);
  },

  async getFaceStatus(userId: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/security/face/status/${userId}`);
  },

  async deleteFace(userId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/security/face/delete?userId=${userId}`);
  },

  async getFaceAuditLogs(userId?: string): Promise<any[]> {
    const endpoint = userId ? `/api/v1/security/face/audit-logs?userId=${userId}` : '/api/v1/security/face/audit-logs';
    return apiClient.get<any[]>(endpoint);
  },

  async getBiometricDiagnostics(userId?: string): Promise<{ logs: any[]; serviceStatus: any }> {
    try {
      const logs = await this.getFaceAuditLogs(userId);
      return { logs: Array.isArray(logs) ? logs : [], serviceStatus: { isOnline: true, model: 'InsightFace MobileFaceNet' } };
    } catch {
      return { logs: [], serviceStatus: { isOnline: true, model: 'InsightFace MobileFaceNet' } };
    }
  },

  async verifyGpsGeofence(params: GpsAuthParams): Promise<GpsAuthResult> {
    return apiClient.post<GpsAuthResult>('/api/v1/auth/verify-gps', params);
  }
};
