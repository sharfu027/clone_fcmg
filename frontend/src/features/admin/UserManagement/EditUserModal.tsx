import React, { useState, useEffect } from 'react';
import { X, Edit3, MapPin, Camera, ShieldCheck } from 'lucide-react';
import { adminService } from '../../../services/adminService';

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
    }
  }, [user]);

  if (!isOpen || !user) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-brand-border max-w-lg w-full p-6 space-y-5 shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text-primary">Edit User Profile</h3>
              <p className="text-xs text-brand-text-secondary">Update personal and security clearance policies for account.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded-lg hover:bg-brand-bg-secondary transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
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
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditUserModal;
