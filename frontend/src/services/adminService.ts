import { apiClient } from '../api/apiClient';
import {
  UserAccount,
  UserSession,
  RoleDefinition,
  PermissionItem,
  CompanySettings,
  BranchSettings,
  NumberSeriesRule,
  NotificationTemplate,
  AuditTrailLog,
  SystemConfiguration,
  AdminMetrics,
  GlobalAuthenticationPolicy,
  EmployeeSecurityProfile,
  EmployeeAuthenticationOverride,
  TemporarySecurityException,
  RegisteredDevice,
  SecurityDashboardMetrics
} from '../types/admin';

export const adminService = {
  // Global Security Center Policies
  async getSecurityPolicies(): Promise<GlobalAuthenticationPolicy[]> {
    return apiClient.get<GlobalAuthenticationPolicy[]>('/api/v1/admin/security/policies');
  },

  async updateSecurityPolicies(policyId: string, payload: Partial<GlobalAuthenticationPolicy>): Promise<GlobalAuthenticationPolicy> {
    return apiClient.put<GlobalAuthenticationPolicy>(`/api/v1/admin/security/policies/${policyId}`, payload);
  },

  // Security Profiles
  async getSecurityProfiles(): Promise<EmployeeSecurityProfile[]> {
    return apiClient.get<EmployeeSecurityProfile[]>('/api/v1/admin/security/profiles');
  },

  async createSecurityProfile(payload: Partial<EmployeeSecurityProfile>): Promise<EmployeeSecurityProfile> {
    return apiClient.post<EmployeeSecurityProfile>('/api/v1/admin/security/profiles', payload);
  },

  async updateSecurityProfile(profileId: string, payload: Partial<EmployeeSecurityProfile>): Promise<EmployeeSecurityProfile> {
    return apiClient.put<EmployeeSecurityProfile>(`/api/v1/admin/security/profiles/${profileId}`, payload);
  },

  // Employee Authentication Overrides
  async getEmployeeOverrides(): Promise<EmployeeAuthenticationOverride[]> {
    return apiClient.get<EmployeeAuthenticationOverride[]>('/api/v1/admin/security/overrides');
  },

  async updateEmployeeOverrides(overrideId: string, payload: Partial<EmployeeAuthenticationOverride>): Promise<EmployeeAuthenticationOverride> {
    return apiClient.put<EmployeeAuthenticationOverride>(`/api/v1/admin/security/overrides/${overrideId}`, payload);
  },

  // Temporary Security Exceptions
  async getTemporaryExceptions(): Promise<TemporarySecurityException[]> {
    return apiClient.get<TemporarySecurityException[]>('/api/v1/admin/security/exceptions');
  },

  async createTemporarySecurityException(payload: Partial<TemporarySecurityException>): Promise<TemporarySecurityException> {
    return apiClient.post<TemporarySecurityException>('/api/v1/admin/security/exceptions', payload);
  },

  async removeTemporarySecurityException(exceptionId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/admin/security/exceptions/${exceptionId}`);
  },

  // Employee Account Lifecycle Actions
  async enableEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/enable`, {});
  },

  async disableEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/disable`, {});
  },

  async lockEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/lock`, {});
  },

  async unlockEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/unlock`, {});
  },

  async suspendEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/suspend`, {});
  },

  async restoreEmployee(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/restore`, {});
  },

  async forceLogout(employeeId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/employees/${employeeId}/force-logout`, {});
  },

  // Registered Devices
  async getRegisteredDevices(): Promise<RegisteredDevice[]> {
    return apiClient.get<RegisteredDevice[]>('/api/v1/admin/security/devices');
  },

  async fetchDevices(): Promise<RegisteredDevice[]> {
    return this.getRegisteredDevices();
  },

  async registerDevice(payload: Partial<RegisteredDevice>): Promise<RegisteredDevice> {
    return apiClient.post<RegisteredDevice>('/api/v1/admin/security/devices', payload);
  },

  async revokeDevice(deviceId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admin/security/devices/${deviceId}/revoke`, {});
  },

  // Security Metrics & Audit Logs
  async getSecurityDashboardMetrics(): Promise<SecurityDashboardMetrics> {
    return apiClient.get<SecurityDashboardMetrics>('/api/v1/admin/security/dashboard-metrics');
  },

  // ── Production Users API (GET/POST/PUT/DELETE/PATCH /api/v1/users) ───────────────────
  async fetchUsers(params?: {
    searchTerm?: string;
    isActive?: boolean;
    isLocked?: boolean;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDescending?: boolean;
  }): Promise<{
    items: any[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }> {
    return apiClient.get('/api/v1/users', { params });
  },

  async getUserById(id: string): Promise<any> {
    return apiClient.get(`/api/v1/users/${id}`);
  },

  async createUser(payload: {
    username: string;
    email: string;
    phoneNumber?: string;
    firstName: string;
    lastName: string;
    displayName: string;
    password: string;
    employeeId?: string;
    preferredLanguage?: string;
    timeZone?: string;
  }): Promise<string> {
    return apiClient.post<string>('/api/v1/users', payload);
  },

  async updateUser(
    id: string,
    payload: {
      firstName: string;
      lastName: string;
      displayName: string;
      phoneNumber?: string;
      preferredLanguage: string;
      timeZone: string;
      profileImageUrl?: string;
    }
  ): Promise<void> {
    return apiClient.put<void>(`/api/v1/users/${id}`, payload);
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/users/${id}`);
  },

  async activateUser(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${id}/activate`, {});
  },

  async deactivateUser(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${id}/deactivate`, {});
  },

  async lockUser(id: string, lockoutEndUtc?: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${id}/lock`, { lockoutEndUtc });
  },

  async unlockUser(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${id}/unlock`, {});
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${userId}/assign-role`, { roleId });
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/users/${userId}/remove-role`, { roleId });
  },

  // Legacy fallback alias for compatibility
  async getUsers(): Promise<UserAccount[]> {
    const res = await this.fetchUsers({ pageSize: 100 });
    return res.items || [];
  },

  async toggleLockUser(userId: string, lock: boolean): Promise<void> {
    if (lock) {
      return this.lockUser(userId);
    } else {
      return this.unlockUser(userId);
    }
  },

  // Sessions
  async getActiveSessions(): Promise<UserSession[]> {
    return apiClient.get<UserSession[]>('/api/v1/admin/sessions');
  },

  async getPermissionMatrix(): Promise<PermissionItem[]> {
    return apiClient.get<PermissionItem[]>('/api/v1/permissions');
  },

  // Company & Branch Settings
  async getCompanySettings(): Promise<CompanySettings> {
    return apiClient.get<CompanySettings>('/api/v1/admin/settings/company');
  },

  async updateCompanySettings(payload: Partial<CompanySettings>): Promise<CompanySettings> {
    return apiClient.put<CompanySettings>('/api/v1/admin/settings/company', payload);
  },

  async getBranchSettings(): Promise<BranchSettings[]> {
    return apiClient.get<BranchSettings[]>('/api/v1/admin/settings/branches');
  },

  // Number Series
  async getNumberSeries(): Promise<NumberSeriesRule[]> {
    return apiClient.get<NumberSeriesRule[]>('/api/v1/admin/number-series');
  },

  // Templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return apiClient.get<NotificationTemplate[]>('/api/v1/admin/templates');
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditTrailLog[]> {
    return apiClient.get<AuditTrailLog[]>('/api/v1/admin/audit-logs');
  },

  // System Configuration
  async getSystemConfiguration(): Promise<SystemConfiguration> {
    return apiClient.get<SystemConfiguration>('/api/v1/admin/config');
  },

  // Admin Metrics
  async getAdminMetrics(): Promise<AdminMetrics> {
    return apiClient.get<AdminMetrics>('/api/v1/admin/metrics');
  },

  // Role Security Profiles (RBAC Module)
  async fetchRoles(params?: { searchTerm?: string; isActive?: boolean; isSystem?: boolean; pageNumber?: number; pageSize?: number; sortBy?: string; sortDescending?: boolean }) {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.append('SearchTerm', params.searchTerm);
    if (params?.isActive !== undefined) query.append('IsActive', String(params.isActive));
    if (params?.isSystem !== undefined) query.append('IsSystem', String(params.isSystem));
    if (params?.pageNumber) query.append('PageNumber', String(params.pageNumber));
    if (params?.pageSize) query.append('PageSize', String(params.pageSize));
    if (params?.sortBy) query.append('SortBy', params.sortBy);
    if (params?.sortDescending !== undefined) query.append('SortDescending', String(params.sortDescending));

    const queryString = query.toString();
    return apiClient.get<any>(`/api/v1/roles${queryString ? `?${queryString}` : ''}`);
  },

  async getRoles(params?: any) {
    return this.fetchRoles(params);
  },

  async getRoleStats(): Promise<any> {
    return apiClient.get<any>('/api/v1/roles/stats');
  },

  async getAvailablePermissions(): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/roles/permissions/available');
  },

  async getRoleById(roleId: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/roles/${roleId}`);
  },

  async createRole(payload: { name: string; code: string; description: string; isSystem?: boolean; priority?: number }): Promise<string> {
    return apiClient.post<string>('/api/v1/roles', payload);
  },

  async updateRole(roleId: string, payload: { name: string; description: string; priority: number; isActive: boolean }): Promise<void> {
    return apiClient.put<void>(`/api/v1/roles/${roleId}`, payload);
  },

  async deleteRole(roleId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/roles/${roleId}`);
  },

  async activateRole(roleId: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/roles/${roleId}/activate`, {});
  },

  async deactivateRole(roleId: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/roles/${roleId}/deactivate`, {});
  },

  async cloneRole(roleId: string, payload: { newName: string; newCode: string; description: string }): Promise<string> {
    return apiClient.post<string>(`/api/v1/roles/${roleId}/clone`, payload);
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/api/v1/roles/${roleId}/permissions`);
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    return apiClient.put<void>(`/api/v1/roles/${roleId}/permissions`, { permissionIds });
  },

  async getRoleUsers(roleId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/roles/${roleId}/users`);
  },

  async removeUserFromRole(roleId: string, userId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/roles/${roleId}/users/${userId}`);
  },

  // Audit Logs Module
  async fetchAuditLogs(params?: {
    searchTerm?: string;
    category?: string;
    eventType?: string;
    module?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDescending?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.append('SearchTerm', params.searchTerm);
    if (params?.category) query.append('Category', params.category);
    if (params?.eventType) query.append('EventType', params.eventType);
    if (params?.module) query.append('Module', params.module);
    if (params?.result) query.append('Result', params.result);
    if (params?.startDate) query.append('StartDate', params.startDate);
    if (params?.endDate) query.append('EndDate', params.endDate);
    if (params?.pageNumber) query.append('PageNumber', String(params.pageNumber));
    if (params?.pageSize) query.append('PageSize', String(params.pageSize));
    if (params?.sortBy) query.append('SortBy', params.sortBy);
    if (params?.sortDescending !== undefined) query.append('SortDescending', String(params.sortDescending));

    const queryString = query.toString();
    return apiClient.get<any>(`/api/v1/audit-logs${queryString ? `?${queryString}` : ''}`);
  },

  async getAuditLogStats(): Promise<any> {
    return apiClient.get<any>('/api/v1/audit-logs/statistics');
  },

  async getAuditLogById(id: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/audit-logs/${id}`);
  },

  async getSecurityDashboardSummary(): Promise<any> {
    return apiClient.get<any>('/api/v1/security/dashboard/summary');
  },

  async exportAuditLogs(payload: {
    format?: string;
    searchTerm?: string;
    category?: string;
    eventType?: string;
    module?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    return apiClient.postBlob('/api/v1/audit-logs/export', payload);
  },

  // Admin Company Assignment Management (Super Admin Exclusive)
  async createAdminWithCompany(payload: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    companyId?: string | null;
    isActive?: boolean;
  }): Promise<string> {
    return apiClient.post<string>('/api/v1/admins', payload);
  },

  async assignCompanyToAdmin(adminUserId: string, companyId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admins/${adminUserId}/assign-company`, { companyId });
  },

  async revokeAdminCompany(adminUserId: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/admins/${adminUserId}/revoke-company`, {});
  },

  async getAdminCompanyAssignments(): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/admins/assignments');
  },

  async getAdminSubordinates(adminUserId: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/admins/${adminUserId}/subordinates`);
  }
};
