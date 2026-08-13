import React from 'react';
import { UserPermission } from '../../types';

export interface PermissionGuardProps {
  userPermissions?: UserPermission[];
  requiredPermission: UserPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  userPermissions = [],
  requiredPermission,
  children,
  fallback
}: PermissionGuardProps) {
  const hasPermission = userPermissions.includes(requiredPermission);

  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
}
