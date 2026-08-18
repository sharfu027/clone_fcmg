import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { RoleDefinition } from '../../../types/admin';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    displayName: string;
    roles: string[];
  } | null;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  onTriggerToast,
}) => {
  const [allRoles, setAllRoles] = useState<RoleDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      adminService.getRoles().then((roles) => {
        const filtered = (roles || []).filter(
          (r) => r.name !== 'Super Admin' && r.code !== 'SUPER_ADMIN' && r.code !== 'SUPERADMIN'
        );
        setAllRoles(filtered);
        if (filtered && filtered.length > 0) {
          setSelectedRoleId(filtered[0].id);
        }
      }).catch(() => {
        setAllRoles([]);
      });
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      onTriggerToast('warning', 'No Role Selected', 'Please select a role to assign.');
      return;
    }

    const roleToAssign = allRoles.find((r) => r.id === selectedRoleId);
    setIsSubmitting(true);
    try {
      await adminService.assignRole(user.id, selectedRoleId);
      onSuccess(`Role '${roleToAssign?.name || roleToAssign?.code}' assigned to ${user.displayName}.`);
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.message || 'Failed to assign role to user.';
      onTriggerToast('error', 'Role Assignment Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    const roleToRemove = allRoles.find((r) => r.name.toLowerCase() === roleName.toLowerCase() || r.code.toLowerCase() === roleName.toLowerCase());
    if (!roleToRemove) {
      onTriggerToast('warning', 'Role Not Found', `Role '${roleName}' not found in role registry.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.removeRole(user.id, roleToRemove.id);
      onSuccess(`Role '${roleName}' removed from ${user.displayName}.`);
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.message || 'Failed to remove role.';
      onTriggerToast('error', 'Role Removal Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text-primary">Manage User Roles</h3>
              <p className="text-xs text-brand-text-secondary">Assign or revoke security roles for {user.displayName}.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Roles */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Assigned Roles</h4>
          {user.roles && user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((roleName) => (
                <span
                  key={roleName}
                  className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full font-semibold flex items-center gap-1 text-xs"
                >
                  {roleName}
                  <button
                    onClick={() => handleRemoveRole(roleName)}
                    disabled={isSubmitting}
                    title="Remove Role"
                    className="hover:text-red-600 cursor-pointer ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-brand-text-secondary italic">No roles currently assigned.</p>
          )}
        </div>

        {/* Assign New Role */}
        <div className="space-y-2 text-xs border-t pt-3">
          <h4 className="font-bold text-brand-text-secondary uppercase tracking-wider text-[10px]">Assign Additional Role</h4>
          {allRoles.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="flex-1 p-2 border rounded-md border-brand-border bg-white"
              >
                {allRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignRole}
                disabled={isSubmitting || !selectedRoleId}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus size={14} /> Assign
              </button>
            </div>
          ) : (
            <p className="text-brand-text-secondary text-xs">No dynamic roles loaded from server.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border text-xs font-semibold rounded-lg hover:bg-brand-bg-secondary cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignRoleModal;
