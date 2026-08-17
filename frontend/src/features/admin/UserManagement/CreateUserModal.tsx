import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Lock, Mail, Phone, User, Building, MapPin, CheckCircle, Sliders } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { RoleDefinition } from '../../../types/admin';
import { CANONICAL_MODULE_PERMISSIONS, MASTER_DATA_SUBMODULES } from '../../../constants/roles';
import { saveUserRoleAndPermissions } from '../../../services/userPermissionsService';

const isGuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

// 12 Standard ERP Login Types / Roles required (Super Administrator is a unique root system account)
export const ERP_LOGIN_ROLES = [
  { code: 'ADMINISTRATOR', name: 'Administrator', desc: 'Sub-Admin with Tailored Module Access' },
  { code: 'SALES_MANAGER', name: 'Sales Manager', desc: 'Regional Sales & Team Control' },
  { code: 'SALES_REP', name: 'Sales Representative', desc: 'Field Orders & Customer Visits' },
  { code: 'PURCHASE_MANAGER', name: 'Purchase Manager', desc: 'Procurement & Vendor Orders' },
  { code: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager', desc: 'Inventory & Stock Receipts' },
  { code: 'INVENTORY_MANAGER', name: 'Inventory Manager', desc: 'Stock Audits & Valuation' },
  { code: 'ACCOUNTANT', name: 'Accountant', desc: 'Financial Ledgers & Invoicing' },
  { code: 'HR_MANAGER', name: 'HR Manager', desc: 'Employee Records & Payroll' },
  { code: 'SUPERVISOR', name: 'Supervisor', desc: 'Shift & Operation Oversight' },
  { code: 'DRIVER', name: 'Driver', desc: 'Logistics & Order Deliveries' },
  { code: 'CUSTOMER_PORTAL_USER', name: 'Customer Portal User', desc: 'External B2B Buyer Access' },
  { code: 'DISTRIBUTOR_PORTAL_USER', name: 'Distributor Portal User', desc: 'Distributor Stocking Portal' },
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onTriggerToast,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    displayName: '',
    password: '',
    employeeId: '',
    selectedRoleCode: 'SALES_REP',
    preferredLanguage: 'en',
    timeZone: 'Asia/Kolkata',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'admin:manage_users', 'masters:manage', 'procurement:manage', 'wms:manage', 'inventory:manage', 'sales:manage', 'finance:manage'
  ]);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
      adminService.getRoles().then((roles) => {
        if (roles && roles.length > 0) {
          setAvailableRoles(roles);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Clear inline error for this field as user types
    if (fieldErrors[name] || fieldErrors.general) {
      setFieldErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if ((name === 'firstName' || name === 'lastName') && (!prev.displayName || prev.displayName === `${prev.firstName} ${prev.lastName}`.trim())) {
        next.displayName = `${name === 'firstName' ? value : prev.firstName} ${name === 'lastName' ? value : prev.lastName}`.trim();
      }
      return next;
    });
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Username
    const u = formData.username.trim();
    if (!u) {
      errors.username = '⚠️ Username is required. Example: "rajesh_kumar" or "sales_admin"';
    } else if (u.length < 3) {
      errors.username = '⚠️ Username must be at least 3 characters. You entered ' + u.length + ' character(s). Example: "rajesh_kumar"';
    }

    // 2. Email Address
    let cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      errors.email = '⚠️ Email Address is required. Example: "rajesh.kumar@inkerp.com"';
    } else {
      if (!cleanEmail.includes('@')) {
        cleanEmail = `${cleanEmail}@inkerp.com`;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = '⚠️ Please enter a valid email address format. Example: "name@company.com"';
      }
    }

    // 3. Password
    const p = formData.password;
    if (!p) {
      errors.password = '⚠️ Initial Password is required. Example: "UserPass123!"';
    } else {
      const hasUpper = /[A-Z]/.test(p);
      const hasLower = /[a-z]/.test(p);
      const hasDigit = /[0-9]/.test(p);
      if (p.length < 8 || !hasUpper || !hasLower || !hasDigit) {
        errors.password = '⚠️ Password must be at least 8 characters with 1 uppercase, 1 lowercase & 1 digit. Example: "UserPass123!"';
      }
    }

    // 4. First Name
    if (!formData.firstName.trim()) {
      errors.firstName = '⚠️ First Name is required. Example: "Rahul"';
    }

    // 5. Last Name
    if (!formData.lastName.trim()) {
      errors.lastName = '⚠️ Last Name is required. Example: "Sharma"';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Do NOT trigger pop-up toasts! Inline errors show directly below placeholders!
    }

    let cleanEmail = formData.email.trim();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@inkerp.com`;
    }

    const cleanEmployeeId = isGuid(formData.employeeId.trim()) ? formData.employeeId.trim() : undefined;

    setIsSubmitting(true);
    try {
      const userId = await adminService.createUser({
        username: formData.username.trim(),
        email: cleanEmail,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
        password: formData.password,
        employeeId: cleanEmployeeId,
        preferredLanguage: formData.preferredLanguage,
        timeZone: formData.timeZone,
      });

      const matchedRoleDef = ERP_LOGIN_ROLES.find(r => r.code === formData.selectedRoleCode);
      const roleName = matchedRoleDef ? matchedRoleDef.name : 'Sales Representative';

      if (userId) {
        saveUserRoleAndPermissions(
          userId,
          cleanEmail,
          roleName,
          formData.selectedRoleCode === 'ADMINISTRATOR' ? selectedPermissions : [],
          formData.username.trim()
        );

        const matchedRole = availableRoles.find(
          (r) => r.code?.toLowerCase() === formData.selectedRoleCode.toLowerCase() || r.name?.toLowerCase() === formData.selectedRoleCode.toLowerCase()
        );
        if (matchedRole) {
          try {
            await adminService.assignRole(userId, matchedRole.id);
          } catch {}
        }
      }

      onSuccess(`User '${formData.username}' created successfully as ${roleName}.`);
      onClose();
    } catch (err: any) {
      // Map API server errors directly to inline field errors without popping top-right toasts!
      const newErrors: Record<string, string> = {};
      if (err?.data?.errors && typeof err.data.errors === 'object') {
        const serverErrs = err.data.errors;
        if (serverErrs.Username) newErrors.username = `⚠️ ${serverErrs.Username.join(' ')} Example: "rajesh_kumar"`;
        if (serverErrs.Email) newErrors.email = `⚠️ ${serverErrs.Email.join(' ')} Example: "rajesh@inkerp.com"`;
        if (serverErrs.Password) newErrors.password = `⚠️ ${serverErrs.Password.join(' ')} Example: "UserPass123!"`;
        if (serverErrs.FirstName) newErrors.firstName = `⚠️ ${serverErrs.FirstName.join(' ')} Example: "Rahul"`;
        if (serverErrs.LastName) newErrors.lastName = `⚠️ ${serverErrs.LastName.join(' ')} Example: "Sharma"`;
      } else if (err?.data?.detail) {
        const detailStr = String(err.data.detail);
        if (detailStr.toLowerCase().includes('username')) {
          newErrors.username = `⚠️ ${detailStr}. Example: "rajesh_kumar"`;
        } else if (detailStr.toLowerCase().includes('email')) {
          newErrors.email = `⚠️ ${detailStr}. Example: "rajesh@inkerp.com"`;
        } else {
          newErrors.general = `⚠️ ${detailStr}`;
        }
      } else if (err?.message) {
        newErrors.general = `⚠️ ${err.message}`;
      }
      setFieldErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubAdminSelected = formData.selectedRoleCode === 'ADMINISTRATOR';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 sm:p-6 flex items-start justify-center">
      <div className="bg-white rounded-2xl border border-brand-border max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="shrink-0 flex justify-between items-center border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text-primary">Create Production User Account</h3>
              <p className="text-xs text-brand-text-secondary">Add new user to ERP system with credentials and security role.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1.5 space-y-4 max-h-[calc(90vh-140px)]">
          
          {fieldErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
              <span>{fieldErrors.general}</span>
            </div>
          )}

          {/* Section 1: User Account Credentials */}
          <div>
            <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
              <User size={13} /> Account Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. rajesh.kumar"
                  className={`w-full p-2 border rounded-md outline-none transition ${
                    fieldErrors.username
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                      : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                  }`}
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-[11px] font-bold text-rose-600">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rajesh.kumar@ink-fmcg.com"
                  className={`w-full p-2 border rounded-md outline-none transition ${
                    fieldErrors.email
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                      : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] font-bold text-rose-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                  className={`w-full p-2 border rounded-md outline-none transition ${
                    fieldErrors.password
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                      : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] font-bold text-rose-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">Mobile Phone</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Identity Details */}
          <div>
            <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
              <Shield size={13} /> Personal & Employee Identity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
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
                  placeholder="Last name"
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

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Display name"
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">Employee ID / Code</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. INK-EMP-1045"
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">Time Zone</label>
                <select
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md border-brand-border bg-white"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: ERP Login Type / Security Role */}
          <div>
            <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
              <Shield size={13} /> ERP Login Type & Security Role (Required)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto p-1 border rounded-lg border-brand-border bg-brand-bg-secondary/10">
              {ERP_LOGIN_ROLES.map((r) => {
                const isSelected = formData.selectedRoleCode === r.code;
                return (
                  <label
                    key={r.code}
                    onClick={() => setFormData((prev) => ({ ...prev, selectedRoleCode: r.code }))}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-start gap-2 ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/5 shadow-xs'
                        : 'border-brand-border bg-white hover:bg-brand-bg-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedRoleCode"
                      value={r.code}
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-brand-text-primary text-xs flex items-center gap-1">
                        {r.name}
                        {isSelected && <CheckCircle size={12} className="text-brand-primary" />}
                      </div>
                      <div className="text-[10px] text-brand-text-secondary">{r.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Custom Sub-Admin Module Permission Selector */}
          {isSubAdminSelected && (
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} /> Sub-Admin Module Clearance Selector
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-brand-primary rounded-full">
                  {selectedPermissions.length} / {CANONICAL_MODULE_PERMISSIONS.filter(p => !p.protected).length} Modules Selected
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Grant specific FMCG ERP module permissions to this Sub-Admin. Root clearance (<code className="text-rose-600">manage:all</code>) and IAM Security (<code className="text-rose-600">iam:manage</code>) are protected Super-Admin rights.
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
          )}

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
              {isSubmitting ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateUserModal;
