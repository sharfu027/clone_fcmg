import { useMemo } from 'react';
import { hasPermission } from '../utils/supplierUtils';

export function useSupplierPermissions(userRole: string = 'Procurement Manager') {
  return useMemo(() => ({
    canCreate: hasPermission(userRole, 'create'),
    canEdit: hasPermission(userRole, 'edit'),
    canArchive: hasPermission(userRole, 'archive'),
    canBlock: hasPermission(userRole, 'block'),
    canApprove: hasPermission(userRole, 'approve'),
    canExport: hasPermission(userRole, 'export'),
    canView: hasPermission(userRole, 'view'),
  }), [userRole]);
}
