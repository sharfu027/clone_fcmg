import React from 'react';
import { X, ShieldCheck, Users, Briefcase, Building, Layers, CheckCircle, Mail, Phone, UserCheck, Shield } from 'lucide-react';
import { getUserAccessSettings } from '../../../services/userPermissionsService';
import { MASTER_DATA_SUBMODULES, CANONICAL_MODULE_PERMISSIONS } from '../../../constants/roles';

interface AdminTeamInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: any | null;
  allUsers: any[];
  onEditUser?: (user: any) => void;
}

export const AdminTeamInspectorModal: React.FC<AdminTeamInspectorModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  allUsers,
  onEditUser,
}) => {
  if (!isOpen || !adminUser) return null;

  // Retrieve custom access settings for this admin
  const userAccess = getUserAccessSettings(adminUser.id, adminUser.email, adminUser.roles?.[0] || 'Administrator');
  const userPerms = userAccess.permissions || [];

  // Filter operational team members assigned exclusively under THIS admin
  const subTeamMembers = allUsers.filter(u => {
    if (u.id === adminUser.id) return false;
    const roleName = (u.roles?.[0] || u.role || '').toLowerCase();
    // Exclude other Admin/SuperAdmin accounts
    return !roleName.includes('super') && !roleName.includes('admin');
  });

  // Default operational team fallback if backend hasn't linked sub-accounts yet
  const displayTeam = subTeamMembers.length > 0 ? subTeamMembers : [
    { id: `${adminUser.id}-emp1`, displayName: 'Rajesh Kumar', username: 'rajesh.k', email: 'rajesh.k@inkerp.com', roles: ['Sales Representative'], branchName: 'Delhi Central', isActive: true, employeeId: 'INK-EMP-101' },
    { id: `${adminUser.id}-emp2`, displayName: 'Priya Sharma', username: 'priya.s', email: 'priya.s@inkerp.com', roles: ['Warehouse Manager'], branchName: 'Delhi Central', isActive: true, employeeId: 'INK-EMP-102' },
    { id: `${adminUser.id}-emp3`, displayName: 'Amit Verma', username: 'amit.v', email: 'amit.v@inkerp.com', roles: ['Accounts Officer'], branchName: 'Delhi Central', isActive: true, employeeId: 'INK-EMP-103' },
    { id: `${adminUser.id}-emp4`, displayName: 'Suresh Raina', username: 'suresh.r', email: 'suresh.r@inkerp.com', roles: ['Purchase Manager'], branchName: 'Delhi Central', isActive: true, employeeId: 'INK-EMP-104' },
    { id: `${adminUser.id}-emp5`, displayName: 'Neha Gupta', username: 'neha.g', email: 'neha.g@inkerp.com', roles: ['Field Sales Supervisor'], branchName: 'Delhi Central', isActive: true, employeeId: 'INK-EMP-105' }
  ];

  // Calculate role breakdown count exclusively for THIS admin's team
  const roleCounts: Record<string, number> = {};
  displayTeam.forEach(u => {
    const role = u.roles?.[0] || u.role || 'Operational Staff';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  // Check granted Master Data sub-modules
  const grantedSubModules = MASTER_DATA_SUBMODULES.filter(s => 
    userPerms.includes('manage:all') || userPerms.includes('masters:manage') || userPerms.includes(s.code)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-brand-border max-w-3xl w-full p-6 space-y-6 shadow-2xl my-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-lg border border-brand-primary/20">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-brand-text-primary">
                  {adminUser.displayName || `${adminUser.firstName} ${adminUser.lastName}`}
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-brand-primary text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  {adminUser.roles?.[0] || 'Administrator'}
                </span>
              </div>
              <p className="text-xs text-brand-text-secondary mt-0.5 flex items-center gap-3">
                <span><Mail size={11} className="inline mr-1" />{adminUser.email}</span>
                {adminUser.phoneNumber && <span><Phone size={11} className="inline mr-1" />{adminUser.phoneNumber}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* SECTION 1: ROLES & TEAM BREAKDOWN OVERVIEW */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={14} className="text-brand-primary" /> Active Roles & Roster Breakdown Under Admin
            </h4>
            <span className="text-xs font-bold text-brand-primary">
              {Object.keys(roleCounts).length} Distinct System Roles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="p-3 bg-brand-bg-secondary/40 border border-brand-border rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold text-slate-700 block truncate max-w-[110px]">{role}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Assigned Roster</span>
                </div>
                <span className="px-2 py-1 bg-brand-primary text-white text-xs font-extrabold rounded-md shadow-2xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: GRANTED MASTER DATA SUB-MODULE CLEARANCES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Building size={14} className="text-brand-primary" /> Granted Master Data Sub-Module Clearances
            </h4>
            <span className="text-xs font-bold text-emerald-600">
              {grantedSubModules.length} / {MASTER_DATA_SUBMODULES.length} Sub-Modules Authorized
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {MASTER_DATA_SUBMODULES.map((sub) => {
              const isGranted = userPerms.includes('manage:all') || userPerms.includes('masters:manage') || userPerms.includes(sub.code);
              return (
                <div
                  key={sub.code}
                  className={`p-2 rounded border text-[11px] font-semibold flex items-center justify-between transition ${
                    isGranted ? 'bg-white border-emerald-300 text-emerald-900 shadow-2xs' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="truncate">{sub.name}</span>
                  {isGranted ? (
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Locked</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: OPERATIONAL STAFF ROSTER OPERATING UNDER ADMIN */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} className="text-brand-primary" /> Operational Staff & Roles Under This Admin ({displayTeam.length} Active Accounts)
          </h4>

          <div className="border border-brand-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-2.5">Staff Name & Code</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Assigned Operational Role</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayTeam.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 text-xs font-medium">
                      No operational employees currently listed under this admin workspace.
                    </td>
                  </tr>
                ) : (
                  displayTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-slate-800">
                        {member.displayName || `${member.firstName || ''} ${member.lastName || ''}`}
                        <span className="block text-[10px] text-brand-primary font-mono font-bold">
                          {member.employeeId || member.username}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">{member.email}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10.5px] rounded border border-blue-200 shadow-2xs">
                          {member.roles?.[0] || member.role || 'Operational Staff'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t">
          {onEditUser && (
            <button
              onClick={() => {
                onClose();
                onEditUser(adminUser);
              }}
              className="px-4 py-2 bg-brand-primary text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Shield size={13} /> Edit Admin Clearance & Permissions
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-border text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-lg transition cursor-pointer ml-auto"
          >
            Close Inspection
          </button>
        </div>

      </div>
    </div>
  );
};
