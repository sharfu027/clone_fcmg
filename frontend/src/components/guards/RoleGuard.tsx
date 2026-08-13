import React from 'react';
import { UserRole } from '../../types';
import { securityPolicyResolver } from '../../services/securityPolicyResolver';

export interface RoleGuardProps {
  userRole?: UserRole;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  userPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  userRole,
  allowedRoles,
  requiredPermission,
  userPermissions,
  children,
  fallback
}: RoleGuardProps) {
  let hasAccess = true;

  if (requiredPermission && userPermissions) {
    hasAccess = userPermissions.includes(requiredPermission);
  } else if (allowedRoles && userRole) {
    hasAccess = allowedRoles.includes(userRole);
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="p-8 bg-red-50/50 border border-red-200 rounded-lg text-center space-y-2">
        <h4 className="text-sm font-bold text-brand-danger uppercase">Access Policy Violation</h4>
        <p className="text-xs text-brand-text-secondary">
          Your current security profile policy does not grant permission to view this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
