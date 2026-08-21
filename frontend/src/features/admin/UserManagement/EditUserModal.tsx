import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit3, MapPin, Camera, ShieldCheck, Sliders, CheckCircle, Building, Upload } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { CANONICAL_MODULE_PERMISSIONS, MASTER_DATA_SUBMODULES, MASTER_DATA_SUBMODULE_GROUPS, normalizePermissionDependencies, resolveCascadingPermissions } from '../../../constants/roles';
import { saveUserRoleAndPermissions, getUserAccessSettings } from '../../../services/userPermissionsService';
import { Tooltip } from '../../../components/ui/Tooltip';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phoneNumber?: string;
    preferredLanguage?: string;
    timeZone?: string;
    profileImageUrl?: string;
    email?: string;
    companyName?: string;
    companyLogo?: string;
    role?: string;
    roles?: string[];
  } | null;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export const STORAGE_KEY_USER_POLICY_SETTINGS = 'ink_user_security_policies';

export interface UserSecurityPolicySettings {
  userId: string;
  enableLocationAuth: boolean;
  enableFaceAuth: boolean;
}

export const getUserSecurityPolicy = (userId: string, email?: string): UserSecurityPolicySettings => {
  const isSuper = (userId && userId.toLowerCase().includes('superadmin')) ||
                  (email && email.toLowerCase().includes('superadmin'));
  if (isSuper) {
    return { userId, enableLocationAuth: false, enableFaceAuth: false };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_POLICY_SETTINGS);
    if (raw) {
      const list = JSON.parse(raw);
      const match = Array.isArray(list) ? list.find((item: any) => item.userId === userId) : null;
      if (match) return match;
    }
  } catch (err) {
    console.error('Error reading user security policy settings:', err);
  }
  return { userId, enableLocationAuth: true, enableFaceAuth: true };
};

export const saveUserSecurityPolicy = (policy: UserSecurityPolicySettings): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_POLICY_SETTINGS);
    let list: UserSecurityPolicySettings[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch { list = []; }
    }
    const idx = list.findIndex((item) => item.userId === policy.userId);
    if (idx >= 0) { list[idx] = policy; } else { list.push(policy); }
    localStorage.setItem(STORAGE_KEY_USER_POLICY_SETTINGS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving user security policy settings:', err);
  }
};

export const getUserPermissions = (userId: string, userEmail?: string): string[] => {
  const settings = getUserAccessSettings(userId, userEmail);
  return settings.permissions || [];
};

export const saveUserPermissions = (userId: string, permissions: string[]): void => {
  try {
    localStorage.setItem(`ink_user_permissions_${userId}`, JSON.stringify(permissions));
  } catch (err) {
    console.error('Error saving user permissions:', err);
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
    companyName: '',
    companyLogo: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onTriggerToast('warning', 'File Too Large', 'Company logo image must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, companyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [enableLocationAuth, setEnableLocationAuth] = useState(true);
  const [enableFaceAuth, setEnableFaceAuth] = useState(true);
  const [explicitPermissions, setExplicitPermissions] = useState<string[]>([]);

  const { resolved: selectedPermissions, inherited: inheritedPermissions, explicit: explicitPermissionsSet, inheritedSources } = useMemo(() => {
    return resolveCascadingPermissions(explicitPermissions);
  }, [explicitPermissions]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFieldErrors({});
      const accessSettings = getUserAccessSettings(user.id, (user as any).email);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        preferredLanguage: user.preferredLanguage || 'en',
        timeZone: user.timeZone || 'Asia/Kolkata',
        profileImageUrl: user.profileImageUrl || '',
        companyName: user.companyName || accessSettings.companyName || '',
        companyLogo: user.companyLogo || accessSettings.companyLogo || '',
      });

      const policy = getUserSecurityPolicy(user.id);
      setEnableLocationAuth(policy.enableLocationAuth);
      setEnableFaceAuth(policy.enableFaceAuth);
      setExplicitPermissions(getUserPermissions(user.id, (user as any).email));
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const togglePermission = (code: string) => {
    setExplicitPermissions((prev) => {
      const explicitSet = new Set(prev);
      const isCurrentlyExplicit = explicitSet.has(code);

      if (code === 'masters:manage') {
        const subCodes = MASTER_DATA_SUBMODULES.map(s => s.code);
        const hasAll = subCodes.every(c => explicitSet.has(c));
        if (hasAll) {
          subCodes.forEach(c => explicitSet.delete(c));
          explicitSet.delete('masters:manage');
        } else {
          subCodes.forEach(c => explicitSet.add(c));
          explicitSet.add('masters:manage');
        }
      } else {
        if (isCurrentlyExplicit) {
          explicitSet.delete(code);
        } else {
          explicitSet.add(code);
        }
      }

      const subCodes = MASTER_DATA_SUBMODULES.map(s => s.code);
      const hasAnySub = subCodes.some(s => explicitSet.has(s));
      if (hasAnySub) {
        explicitSet.add('masters:manage');
      } else if (!isCurrentlyExplicit && code !== 'masters:manage') {
        explicitSet.delete('masters:manage');
      }

      return Array.from(explicitSet);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (fieldErrors[name] || fieldErrors.general) {
      setFieldErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = '⚠️ First Name is required. Example: "Rahul"';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = '⚠️ Last Name is required. Example: "Sharma"';
    }
    if (!formData.displayName.trim()) {
      errors.displayName = '⚠️ Display Name is required. Example: "Rahul Sharma"';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Do NOT show pop-up toasts! Inline errors show directly below placeholders!
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
      const targetEmail = (user as any).email || (user as any).userName || (user as any).username || (user as any).name || '';
      saveUserPermissions(user.id, selectedPermissions);
      saveUserRoleAndPermissions(
        user.id,
        targetEmail,
        user.role || (user as any).roles?.[0] || 'Sales Representative',
        selectedPermissions,
        formData.companyName.trim(),
        formData.companyLogo
      );

      onSuccess(`User profile and authentication policies for '${formData.displayName}' updated successfully.`);
      onClose();
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      if (err?.data?.errors && typeof err.data.errors === 'object') {
        const serverErrs = err.data.errors;
        if (serverErrs.FirstName) newErrors.firstName = `⚠️ ${serverErrs.FirstName.join(' ')} Example: "Rahul"`;
        if (serverErrs.LastName) newErrors.lastName = `⚠️ ${serverErrs.LastName.join(' ')} Example: "Sharma"`;
        if (serverErrs.DisplayName) newErrors.displayName = `⚠️ ${serverErrs.DisplayName.join(' ')} Example: "Rahul Sharma"`;
      } else if (err?.data?.detail) {
        newErrors.general = `⚠️ ${err.data.detail}`;
      } else if (err?.message) {
        newErrors.general = `⚠️ ${err.message}`;
      }
      setFieldErrors(newErrors);
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
          <Tooltip content="Close">
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </Tooltip>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1.5 space-y-4 max-h-[calc(90vh-140px)] text-xs">
          
          {fieldErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
              <span>{fieldErrors.general}</span>
            </div>
          )}

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
                className={`w-full p-2 border rounded-md outline-none transition ${
                  fieldErrors.firstName
                    ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                    : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                }`}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {fieldErrors.firstName}
                </p>
              )}
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
                className={`w-full p-2 border rounded-md outline-none transition ${
                  fieldErrors.lastName
                    ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                    : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                }`}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {fieldErrors.lastName}
                </p>
              )}
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
              className={`w-full p-2 border rounded-md outline-none transition ${
                fieldErrors.displayName
                  ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                  : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
              }`}
            />
            {fieldErrors.displayName && (
              <p className="mt-1 text-[11px] font-bold text-rose-600">
                {fieldErrors.displayName}
              </p>
            )}
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

          {/* 🏢 COMPANY & CORPORATE BRANDING */}
          <div className="pt-2 border-t border-brand-border space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
              <Building size={14} className="text-brand-primary" />
              <span>Company & Branding Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="companyName" className="block font-semibold text-brand-text-primary mb-1">
                  Company / Business Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Patanjali Ayurved Ltd"
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Profile Image URL / Web Link
                </label>
                <input
                  type="url"
                  name="companyLogo"
                  value={formData.companyLogo}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            {/* Logo Preview & File Upload Bar */}
            <div className="flex items-center justify-between gap-3 p-2.5 bg-brand-bg-secondary/40 rounded-lg border border-brand-border text-xs">
              <div className="flex items-center gap-3">
                {formData.companyLogo ? (
                  <img
                    src={formData.companyLogo}
                    alt="Company Logo Preview"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-10 h-10 object-contain rounded-lg border border-brand-border bg-white p-0.5 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs">
                    {formData.companyName.trim() ? formData.companyName.trim().charAt(0).toUpperCase() : 'I'}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-brand-text-primary block">Company Branding Logo</span>
                  <span className="text-[11px] text-brand-text-secondary">Paste image URL above or upload image locally from computer</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-white text-brand-text-primary border border-brand-border rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                  <Upload size={14} className="text-brand-primary" />
                  <span>Upload Local File</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {formData.companyLogo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, companyLogo: '' }))}
                    className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-semibold transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
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
                      <div className="mt-2 pt-2 border-t border-blue-100 space-y-2" onClick={(e) => e.stopPropagation()}>
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
                                setExplicitPermissions(prev => prev.filter(p => !subCodes.includes(p)));
                              } else {
                                setExplicitPermissions(prev => Array.from(new Set([...prev, ...subCodes])));
                              }
                            }}
                            className="text-[9px] font-bold text-brand-primary hover:underline cursor-pointer"
                          >
                            Toggle All
                          </button>
                        </div>

                        <div className="space-y-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                          {MASTER_DATA_SUBMODULE_GROUPS.map((group) => {
                            const groupSubCodes = group.items.map(item => item.code);
                            const isAllGroupChecked = groupSubCodes.every(c => selectedPermissions.includes(c));

                            return (
                              <div key={group.groupKey} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={isAllGroupChecked}
                                      onChange={() => {
                                        if (isAllGroupChecked) {
                                          setExplicitPermissions(prev => prev.filter(p => !groupSubCodes.includes(p)));
                                        } else {
                                          setExplicitPermissions(prev => Array.from(new Set([...prev, ...groupSubCodes])));
                                        }
                                      }}
                                      className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                    />
                                    <span className="text-[11px] font-bold text-slate-800">{group.groupName}</span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-slate-500">
                                    {groupSubCodes.filter(c => selectedPermissions.includes(c)).length} / {group.items.length} Enabled
                                  </span>
                                </div>

                                {group.groupKey === 'company' ? (
                                  <div className="space-y-2 pt-1">
                                    {/* Company Details - Independent */}
                                    <div className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-md">
                                      <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedPermissions.includes('masters:company')}
                                          onChange={() => togglePermission('masters:company')}
                                          className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                        />
                                        <span>Company Details</span>
                                      </label>
                                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Independent</span>
                                    </div>

                                    {/* Cascading Hierarchy: Branches -> Warehouse / Stockist -> Departments */}
                                    <div className="p-2 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                                      {/* Level 1: Branches (Parent Permission) */}
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-brand-primary cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes('masters:branch')}
                                            onChange={() => togglePermission('masters:branch')}
                                            className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                          />
                                          <span>Branches</span>
                                        </label>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                          Parent Permission
                                        </span>
                                      </div>

                                      {/* Level 2: Warehouse / Stockist */}
                                      <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-2">
                                        <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={selectedPermissions.includes('masters:warehouse')}
                                              disabled={selectedPermissions.includes('masters:branch')}
                                              onChange={() => togglePermission('masters:warehouse')}
                                              className={`rounded border-slate-300 text-brand-primary w-3.5 h-3.5 accent-brand-primary ${
                                                selectedPermissions.includes('masters:branch') ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                                              }`}
                                            />
                                            <span className={selectedPermissions.includes('masters:warehouse') ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                                              Warehouse / Stockist
                                            </span>
                                          </label>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                            selectedPermissions.includes('masters:branch')
                                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                                              : explicitPermissionsSet.has('masters:warehouse')
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                          }`}>
                                            {selectedPermissions.includes('masters:branch')
                                              ? 'Inherited from Branch access'
                                              : explicitPermissionsSet.has('masters:warehouse')
                                                ? 'Independent'
                                                : 'Requires / Controlled by Branch'}
                                          </span>
                                        </div>

                                        {/* Level 3: Departments */}
                                        <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-1.5">
                                          <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes('masters:department')}
                                                disabled={selectedPermissions.includes('masters:branch') || selectedPermissions.includes('masters:warehouse')}
                                                onChange={() => togglePermission('masters:department')}
                                                className={`rounded border-slate-300 text-brand-primary w-3.5 h-3.5 accent-brand-primary ${
                                                  selectedPermissions.includes('masters:branch') || selectedPermissions.includes('masters:warehouse')
                                                    ? 'opacity-80 cursor-not-allowed'
                                                    : 'cursor-pointer'
                                                }`}
                                              />
                                              <span className={selectedPermissions.includes('masters:department') ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                                                Departments
                                              </span>
                                            </label>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                              selectedPermissions.includes('masters:branch')
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : selectedPermissions.includes('masters:warehouse')
                                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                  : explicitPermissionsSet.has('masters:department')
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                              {selectedPermissions.includes('masters:branch')
                                                ? 'Inherited from Branch access'
                                                : selectedPermissions.includes('masters:warehouse')
                                                  ? 'Inherited from Warehouse access'
                                                  : explicitPermissionsSet.has('masters:department')
                                                    ? 'Independent'
                                                    : 'Can be independently enabled'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  ) : group.groupKey === 'product' ? (
                                    <div className="space-y-2 pt-1">
                                      {/* Cascading Dependency Group: Category / Brands / Units (UOM) -> Products (SKUs) */}
                                      <div className="p-2 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                                        {/* Level 1: Parent Masters Header & Rows */}
                                        <div className="space-y-1.5">
                                          {/* Category (Parent Permission) */}
                                          <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                            <label className="flex items-center gap-2 font-bold text-brand-primary cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes('masters:category')}
                                                onChange={() => togglePermission('masters:category')}
                                                className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                              />
                                              <span>Category</span>
                                            </label>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                              Parent Permission
                                            </span>
                                          </div>

                                          {/* Brands (Parent Permission) */}
                                          <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                            <label className="flex items-center gap-2 font-bold text-brand-primary cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes('masters:brand')}
                                                onChange={() => togglePermission('masters:brand')}
                                                className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                              />
                                              <span>Brands</span>
                                            </label>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                              Parent Permission
                                            </span>
                                          </div>

                                          {/* Units (UOM) (Parent Permission) */}
                                          <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                            <label className="flex items-center gap-2 font-bold text-brand-primary cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes('masters:unit')}
                                                onChange={() => togglePermission('masters:unit')}
                                                className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer accent-brand-primary"
                                              />
                                              <span>Units (UOM)</span>
                                            </label>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                              Parent Permission
                                            </span>
                                          </div>
                                        </div>

                                        {/* Level 2: Shared Dependent Child — Products (SKUs) */}
                                        <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-1.5">
                                          <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes('masters:product')}
                                                disabled={inheritedPermissions.has('masters:product')}
                                                onChange={() => togglePermission('masters:product')}
                                                className={`rounded border-slate-300 text-brand-primary w-3.5 h-3.5 accent-brand-primary ${
                                                  inheritedPermissions.has('masters:product') ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                              />
                                              <span className={selectedPermissions.includes('masters:product') ? 'font-semibold text-slate-800' : 'text-slate-500'}>
                                                Products (SKUs)
                                              </span>
                                            </label>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                              inheritedPermissions.has('masters:product')
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : explicitPermissionsSet.has('masters:product')
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                              {inheritedPermissions.has('masters:product')
                                                ? `Inherited from ${(inheritedSources?.['masters:product'] || []).join(' + ')}`
                                                : explicitPermissionsSet.has('masters:product')
                                                  ? 'Independent'
                                                  : 'Can be independently enabled'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {group.items.map((sub) => {
                                      const isSubChecked = selectedPermissions.includes(sub.code);
                                      return (
                                        <label
                                          key={sub.code}
                                          onClick={(e) => e.stopPropagation()}
                                          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition ${
                                            isSubChecked
                                              ? 'bg-blue-50/80 border-brand-primary text-brand-primary'
                                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
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
                                )}
                              </div>
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
