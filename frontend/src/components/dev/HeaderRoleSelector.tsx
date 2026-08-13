import React from 'react';
import { Shield } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderRoleSelectorProps {
  activeRole: UserRole;
  roles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export function HeaderRoleSelector({
  activeRole,
  roles,
  onRoleChange,
  onTriggerToast
}: HeaderRoleSelectorProps) {
  return (
    <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-brand-warning rounded border border-yellow-200 text-xs">
      <Shield size={13} className="shrink-0" />
      <span className="font-semibold text-[11px]">Role Simulation:</span>
      <select
        value={activeRole}
        onChange={(e) => {
          onRoleChange(e.target.value as UserRole);
          onTriggerToast('info', 'Permissions Shifted', `Simulated workspace role updated to ${e.target.value}`);
        }}
        className="bg-transparent border-none text-[11px] font-bold focus:outline-none cursor-pointer text-brand-text-primary"
      >
        {roles.map((r, i) => (
          <option key={i} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

export default HeaderRoleSelector;
