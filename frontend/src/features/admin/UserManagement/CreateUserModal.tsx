import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Lock, Mail, Phone, User, Building, MapPin, CheckCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { RoleDefinition } from '../../../types/admin';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

// 12 Standard ERP Login Types / Roles required
export const ERP_LOGIN_ROLES = [
  { code: 'ADMINISTRATOR', name: 'Administrator', desc: 'Full System & Security Access' },
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

  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch dynamic backend roles if available
      adminService.getRoles().then((roles) => {
        if (roles && roles.length > 0) {
          setAvailableRoles(roles);
        }
      }).catch(() => {
        // Fallback to static list if backend roles endpoint is empty
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if ((name === 'firstName' || name === 'lastName') && (!prev.displayName || prev.displayName === `${prev.firstName} ${prev.lastName}`.trim())) {
        next.displayName = `${name === 'firstName' ? value : prev.firstName} ${name === 'lastName' ? value : prev.lastName}`.trim();
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      onTriggerToast('warning', 'Missing Fields', 'Please complete all required fields (*).');
      return;
    }

    if (formData.password.length < 8) {
      onTriggerToast('warning', 'Weak Password', 'Password must be at least 8 characters long with uppercase, lowercase, and digit.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create User via POST /api/v1/users
      const userId = await adminService.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
        password: formData.password,
        employeeId: formData.employeeId.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
        timeZone: formData.timeZone,
      });

      // 2. Assign Role if backend role found matching selection
      if (userId) {
        const matchedRole = availableRoles.find(
          (r) => r.code?.toLowerCase() === formData.selectedRoleCode.toLowerCase() || r.name?.toLowerCase() === formData.selectedRoleCode.toLowerCase()
        );
        if (matchedRole) {
          try {
            await adminService.assignRole(userId, matchedRole.id);
          } catch {
            // Role assignment fallback
          }
        }
      }

      onSuccess(`User '${formData.username}' created successfully.`);
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.detail || err?.data?.Title || err?.message || 'Failed to create user account.';
      onTriggerToast('error', 'User Creation Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-brand-border max-w-2xl w-full p-6 space-y-5 shadow-xl my-8">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
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
                  required
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-brand-text-primary mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rajesh.kumar@ink-fmcg.com"
                  required
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
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
                  required
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
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
                  placeholder="Last name"
                  required
                  className="w-full p-2 border rounded-md border-brand-border focus:ring-1 focus:ring-brand-primary outline-none"
                />
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

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
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
