import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Shield, Lock, Mail, Phone, User, Building, MapPin, CheckCircle, Sliders, Upload } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { apiClient } from '../../../api/apiClient';
import { RoleDefinition } from '../../../types/admin';
import { CANONICAL_MODULE_PERMISSIONS, MASTER_DATA_SUBMODULES, MASTER_DATA_SUBMODULE_GROUPS, normalizePermissionDependencies, resolveCascadingPermissions } from '../../../constants/roles';
import { saveUserRoleAndPermissions } from '../../../services/userPermissionsService';
import { Tooltip } from '../../../components/ui/Tooltip';

const isGuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  existingUsers?: any[];
}

// 12 Standard ERP Login Types / Roles required (Super Admin is a unique root system account)
export const ERP_LOGIN_ROLES = [
  { code: 'ADMIN', name: 'Admin', desc: 'Sub-Admin with Tailored Module Access' },
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
  existingUsers = [],
}) => {
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    displayName: '',
    password: '',
    employeeId: '',
    companyId: '',
    companyName: 'INK FMCG India Pvt Ltd',
    companyLogo: '',
    selectedRoleCode: 'ADMIN',
    preferredLanguage: 'en',
    timeZone: 'Asia/Kolkata',
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
  const [explicitPermissions, setExplicitPermissions] = useState<string[]>([]);

  const { resolved: selectedPermissions, inherited: inheritedPermissions, explicit: explicitPermissionsSet, inheritedSources } = useMemo(() => {
    return resolveCascadingPermissions(explicitPermissions);
  }, [explicitPermissions]);

  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getNextAutoAdminCode = async (): Promise<string> => {
    try {
      const res = await adminService.getUsers({ pageNumber: 1, pageSize: 100 });
      const apiList = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      const combinedList = [...apiList, ...existingUsers];

      const savedCodesRaw = localStorage.getItem('erp_admin_codes');
      const savedCodes: string[] = savedCodesRaw ? JSON.parse(savedCodesRaw) : [];

      const usedNumbers = new Set<number>();

      combinedList.forEach((u: any, idx: number) => {
        const codeStr = String(u.employeeId || u.userCode || u.employeeCode || u.adminCode || '').toUpperCase().trim();
        const match = codeStr.match(/ADM-(\d+)/);
        if (match) {
          usedNumbers.add(parseInt(match[1], 10));
        } else {
          const isSuper = u.username?.toLowerCase().includes('superadmin') || u.email?.toLowerCase().includes('superadmin') || (u.roles && u.roles.includes('Super Admin'));
          if (!isSuper) {
            usedNumbers.add(idx + 1);
          }
        }
      });

      savedCodes.forEach((codeStr) => {
        const match = String(codeStr).toUpperCase().trim().match(/ADM-(\d+)/);
        if (match) usedNumbers.add(parseInt(match[1], 10));
      });

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ink_user_access_') || key.startsWith('user_access_'))) {
          try {
            const val = JSON.parse(localStorage.getItem(key) || '{}');
            if (val.adminCode) {
              const match = String(val.adminCode).toUpperCase().trim().match(/ADM-(\d+)/);
              if (match) usedNumbers.add(parseInt(match[1], 10));
            }
          } catch {}
        }
      }

      let maxNum = 0;
      usedNumbers.forEach((n) => {
        if (n > maxNum) maxNum = n;
      });

      const nextNum = maxNum + 1;
      return `ADM-${String(nextNum).padStart(3, '0')}`;
    } catch {
      return 'ADM-006';
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
      getNextAutoAdminCode().then((code) => {
        setFormData((prev) => ({ ...prev, employeeId: code }));
      });
      adminService.getRoles().then((roles) => {
        if (roles && roles.length > 0) {
          setAvailableRoles(roles);
        }
      }).catch(() => {});
      apiClient.get<any[]>('/api/v1/masters/company/lookup').then((res) => {
        if (Array.isArray(res)) {
          setAvailableCompanies(res);
          if (res.length > 0 && !formData.companyId) {
            setFormData((prev) => ({ ...prev, companyId: res[0].id, companyName: res[0].legalName || res[0].name }));
          }
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

    const cleanEmployeeId = formData.employeeId.trim() || undefined;

    setIsSubmitting(true);
    try {
      let userId: string;
      const matchedRoleDef = ERP_LOGIN_ROLES.find(r => r.code === formData.selectedRoleCode);
      const roleName = matchedRoleDef ? matchedRoleDef.name : 'Sales Representative';

      if (formData.selectedRoleCode === 'ADMIN') {
        userId = await adminService.createAdminWithCompany({
          username: formData.username.trim(),
          email: cleanEmail,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          password: formData.password,
          companyId: formData.companyId || null,
          isActive: true
        });
      } else {
        userId = await adminService.createUser({
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
      }

      if (userId) {
        // Persist generated code to local storage history
        try {
          const savedCodesRaw = localStorage.getItem('erp_admin_codes');
          const savedCodes: string[] = savedCodesRaw ? JSON.parse(savedCodesRaw) : [];
          if (formData.employeeId && !savedCodes.includes(formData.employeeId)) {
            localStorage.setItem('erp_admin_codes', JSON.stringify([...savedCodes, formData.employeeId]));
          }
        } catch {}

        saveUserRoleAndPermissions(
          userId,
          cleanEmail,
          roleName,
          formData.selectedRoleCode === 'ADMIN' ? selectedPermissions : [],
          formData.companyName.trim(),
          formData.companyLogo,
          formData.employeeId
        );

        if (formData.selectedRoleCode !== 'ADMIN') {
          const matchedRole = availableRoles.find(
            (r) => r.code?.toLowerCase() === formData.selectedRoleCode.toLowerCase() || r.name?.toLowerCase() === formData.selectedRoleCode.toLowerCase()
          );
          if (matchedRole) {
            try {
              await adminService.assignRole(userId, matchedRole.id);
            } catch {}
          }
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

  const isSubAdminSelected = formData.selectedRoleCode === 'ADMIN';

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
              <h3 className="text-base font-bold text-brand-text-primary">Create Company Admin Account</h3>
              <p className="text-xs text-brand-text-secondary">Add new user to ERP system with credentials and security role.</p>
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

            <div className="text-xs mt-3">
              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Admin Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  readOnly
                  disabled={true}
                  title="Admin Code is auto-generated and cannot be changed manually."
                  placeholder="ADM-001"
                  className="w-full p-2 border rounded-md border-brand-border font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed outline-none"
                />
              </div>
            </div>
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
                  {formData.selectedRoleCode === 'ADMIN' ? 'Assigned Company *' : 'Company / Business Name *'}
                </label>
                {availableCompanies.length > 0 ? (
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={(e) => {
                      const compId = e.target.value;
                      const matched = availableCompanies.find(c => c.id === compId);
                      setFormData(prev => ({
                        ...prev,
                        companyId: compId,
                        companyName: matched ? (matched.legalName || matched.name) : prev.companyName
                      }));
                    }}
                    className="w-full p-2 border rounded-md border-brand-border bg-white text-xs font-semibold text-brand-text-primary focus:ring-1 focus:ring-brand-primary outline-none"
                  >
                    <option value="">-- Select Company --</option>
                    {availableCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.legalName || c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Patanjali Ayurved Ltd"
                    className={`w-full p-2 border rounded-md outline-none transition ${
                      fieldErrors.companyName
                        ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:ring-1 focus:ring-rose-500'
                        : 'border-brand-border focus:ring-1 focus:ring-brand-primary'
                    }`}
                  />
                )}
                {fieldErrors.companyName && (
                  <p className="mt-1 text-[11px] font-bold text-rose-600">
                    {fieldErrors.companyName}
                  </p>
                )}
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
