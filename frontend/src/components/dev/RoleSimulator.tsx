import React from 'react';
import { Monitor } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleSimulatorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function RoleSimulator({ currentRole, onRoleChange }: RoleSimulatorProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-brand-border rounded-lg shadow-xl p-3 max-w-xs flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-text-primary">
          <Monitor size={14} className="text-brand-primary" />
          <span>Role Simulator</span>
        </div>
        <span className="text-[10px] bg-blue-50 text-brand-primary px-1.5 py-0.5 rounded font-mono">Dev Tools</span>
      </div>
      <select
        value={currentRole}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        className="w-full text-xs bg-brand-bg-secondary border border-brand-border rounded px-2 py-1 focus:outline-none focus:border-brand-primary font-medium cursor-pointer"
      >
        <option value="Super Admin">Super Admin</option>
        <option value="Admin">Admin</option>
        <option value="Procurement Manager">Procurement Manager</option>
        <option value="Warehouse Manager">Warehouse Manager</option>
        <option value="Inventory Controller">Inventory Controller</option>
        <option value="Sales Manager">Sales Manager</option>
        <option value="Sales Representative">Sales Representative</option>
        <option value="Finance Manager">Finance Manager</option>
        <option value="Accountant">Accountant</option>
        <option value="Branch Manager">Branch Manager</option>
        <option value="Director">Director</option>
      </select>
    </div>
  );
}

export default RoleSimulator;
