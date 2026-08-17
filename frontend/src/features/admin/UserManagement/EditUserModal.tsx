import React, { useState, useEffect } from 'react';
import { X, Edit3, MapPin, Camera, ShieldCheck, Sliders, CheckCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { CANONICAL_MODULE_PERMISSIONS, MASTER_DATA_SUBMODULES } from '../../../constants/roles';
import { saveUserRoleAndPermissions } from '../../../services/userPermissionsService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phoneNumber?: string;
    preferredLanguage: string;
    timeZone: string;
    profileImageUrl?: string;
    role?: string;
    roles?: string[];
  } | null;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export interface UserSecurityPolicySettings {
  userId: string;
  enableLocationAuth: boolean;
  enableFaceAuth: boolean;
}

export const getUserSecurityPolicy = (userId: string): UserSecurityPolicySettings => {
  try {
    const raw = localStorage.getItem(`ink_security_policy_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user security policy:', e);
  }
  return {
    userId,
    enableLocationAuth: true,
    enableFaceAuth: true,
  };
};

export const saveUserSecurityPolicy = (policy: UserSecurityPolicySettings): void => {
  try {
    localStorage.setItem(`ink_security_policy_${policy.userId}`, JSON.stringify(policy));
  } catch (e) {
    console.error('Error saving user security policy:', e);
  }
};

export const getUserPermissions = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(`ink_user_permissions_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user permissions:', e);
  }
  return [
    'admin:manage_users', 'masters:manage', 'procurement:manage', 'wms:manage', 'inventory:manage', 'sales:manage', 'finance:manage'
  ];
};

export const saveUserPermissions = (userId: string, permissions: string[]): void => {
  try {
    localStorage.setItem(`ink_user_permissions_${userId}`, JSON.stringify(permissions));
  } catch (e) {
    console.error('Error saving user permissions:', e);
  }
};

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  onTriggerToast,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phoneNumber: '',
    preferredLanguage: 'en',
    timeZone: 'Asia/Kolkata',
    profileImageUrl: '',
  });

  const [enableLocationAuth, setEnableLocationAuth] = useState(true);
  const [enableFaceAuth, setEnableFaceAuth] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        preferredLanguage: user.preferredLanguage || 'en',
        timeZone: user.timeZone || 'Asia/Kolkata',
        profileImageUrl: user.profileImageUrl || '',
      });

      const policy = getUserSecurityPolicy(user.id);
      setEnableLocationAuth(policy.enableLocationAuth);
      setEnableFaceAuth(policy.enableFaceAuth);
      setSelectedPermissions(getUserPermissions(user.id));
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.displayName) {
      onTriggerToast('warning', 'Missing Fields', 'First Name, Last Name, and Display Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.updateUser(user.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
        timeZone: formData.timeZone,
        profileImageUrl: formData.profileImageUrl.trim() || undefined,
      });

      // Save User Security Policies (Location & Face Auth enablement)
      saveUserSecurityPolicy({
        userId: user.id,
        enableLocationAuth,
        enableFaceAuth,
      });

      // Save User Per-Module Permissions & Role (Fine-grained ABAC)
      saveUserPermissions(user.id, selectedPermissions);
      saveUserRoleAndPermissions(
        user.id,
        (user as any).email || '',
        user.role || (user as any).roles?.[0] || 'Sales Representative',
        selectedPermissions
      );

      onSuccess(`User profile and authentication policies for '${formData.displayName}' updated successfully.`);
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.message || 'Failed to update user profile.';
      onTriggerToast('error', 'Update Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 sm:p-6 flex items-start justify-center">
      <div className="bg-white rounded-2xl border border-brand-border max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text-primary">Edit User Profile & Security Clearances</h3>
              <p className="text-xs text-brand-text-secondary">Update personal info, authentication policies, and module access.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1.5 space-y-4 max-h-[calc(90vh-140px)] text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-text-primary mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-text-primary mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-text-primary mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-brand-text-primary mb-1">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-text-primary mb-1">Preferred Language</label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full p-2 border rounded-md border-brand-border bg-white"
              >
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-brand-text-primary mb-1">Time Zone</label>
              <select
                name="timeZone"
                value={formData.timeZone}
                onChange={handleChange}
                className="w-full p-2 border rounded-md border-brand-border bg-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-text-primary mb-1">Profile Image URL</label>
            <input
              type="text"
              name="profileImageUrl"
              value={formData.profileImageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none font-mono text-[11px]"
            />
          </div>

          {/* SECURITY AUTHENTICATION ENFORCEMENT POLICIES */}
          <div className="pt-3 border-t border-brand-border/60 space-y-2">
            <h4 className="font-bold text-brand-text-primary text-xs flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-brand-primary" /> Multi-Factor Authentication Policies
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-brand-border/80">
              <div>
                <label className="block font-semibold text-brand-text-primary mb-1 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600" /> Location Verification
                </label>
                <select
                  value={enableLocationAuth ? 'Required' : 'Bypassed'}
                  onChange={e => setEnableLocationAuth(e.target.value === 'Required')}
                  className="w-full p-2 border rounded-md border-brand-border bg-white text-xs font-bold"
                >
                  <option value="Required">✅ Enabled (Check GPS Geofence)</option>
                  <option value="Bypassed">🚫 Disabled (Bypass / Escape GPS)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1 flex items-center gap-1">
                  <Camera size={12} className="text-brand-primary" /> Face Authentication
                </label>
                <select
                  value={enableFaceAuth ? 'Required' : 'Bypassed'}
                  onChange={e => setEnableFaceAuth(e.target.value === 'Required')}
                  className="w-full p-2 border rounded-md border-brand-border bg-white text-xs font-bold"
                >
                  <option value="Required">✅ Enabled (3D Biometric Scan)</option>
                  <option value="Bypassed">🚫 Disabled (Bypass / Escape Face)</option>
                </select>
              </div>
            </div>
          </div>

          {/* PER-USER INDIVIDUAL MODULE CLEARANCE SELECTOR */}
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} /> Tailored Sub-Admin Module Clearance
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-brand-primary rounded-full">
                {selectedPermissions.length} / {CANONICAL_MODULE_PERMISSIONS.filter(p => !p.protected).length} Modules Selected
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Customize exact module permissions for this specific user. Changes take effect immediately across all system sessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start max-h-72 overflow-y-auto pt-1">
              {CANONICAL_MODULE_PERMISSIONS.filter((p) => !p.protected).map((perm) => {
                const isChecked = selectedPermissions.includes(perm.code);
                return (
                  <div
                    key={perm.code}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition space-y-1.5 ${
                      isChecked
                        ? 'border-brand-primary bg-white shadow-xs'
                        : 'border-brand-border bg-slate-50 hover:bg-white'
                    }`}
                    onClick={() => togglePermission(perm.code)}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.code)}
                        className="mt-0.5 cursor-pointer accent-brand-primary"
                      />
                      <div>
                        <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          {perm.name}
                          {isChecked && <CheckCircle size={11} className="text-brand-primary" />}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">{perm.description}</div>
                      </div>
                    </div>

                    {/* Granular Master Data Sub-Module Clearances */}
                    {perm.code === 'masters:manage' && isChecked ? (
                      <div className="mt-2 pt-2 border-t border-blue-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1">
                            <Sliders size={11} /> Master Data Sub-Module Access:
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const subCodes = MASTER_DATA_SUBMODULES.map(s => s.code);
                              const hasAll = subCodes.every(c => selectedPermissions.includes(c));
                              if (hasAll) {
                                setSelectedPermissions(prev => prev.filter(p => !subCodes.includes(p)));
                              } else {
                                setSelectedPermissions(prev => Array.from(new Set([...prev, ...subCodes])));
                              }
                            }}
                            className="text-[9px] font-bold text-brand-primary hover:underline cursor-pointer"
                          >
                            Toggle All
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                          {MASTER_DATA_SUBMODULES.map((sub) => {
                            const isSubChecked = selectedPermissions.includes(sub.code);
                            return (
                              <label
                                key={sub.code}
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold cursor-pointer transition ${
                                  isSubChecked
                                    ? 'bg-white border-brand-primary text-brand-primary shadow-2xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={() => togglePermission(sub.code)}
                                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                />
                                <span>{sub.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : isChecked ? (
                      <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <CheckCircle size={10} /> Full Module Access Authorized
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 sticky bottom-0 bg-white pt-3 mt-2 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border text-xs font-semibold rounded-lg hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditUserModal;
