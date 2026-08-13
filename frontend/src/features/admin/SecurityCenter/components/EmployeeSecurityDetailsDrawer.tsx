import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Camera,
  Activity,
  Trash2,
  Lock,
  Unlock,
  X,
  Mail,
  Building,
  Briefcase,
  Key,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { authService } from '../../../../services/authService';

export interface EmployeeSecurityDetails {
  id: string;
  userId?: string;
  userCode: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: string;
  department?: string;
  designation?: string;
  mappedEmployeeCode: string;
  branch?: string;
  status: 'Enabled' | 'Disabled' | 'Locked' | 'Suspended';
  securityProfileName: string;
  faceStatus: 'Registered' | 'Not Registered' | 'Disabled';
  activeTemplateVersion?: number;
  registeredBy?: string;
  registeredDate?: string;
  lastVerificationTimestamp?: string;
  similarityThreshold?: number;
  qualityScore?: number;
}

interface EmployeeSecurityDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeSecurityDetails | null;
  onRegisterFace: (emp: EmployeeSecurityDetails) => void;
  onViewHistory: (emp: EmployeeSecurityDetails) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  onStatusUpdate: (updatedEmp: EmployeeSecurityDetails) => void;
}

export const EmployeeSecurityDetailsDrawer: React.FC<EmployeeSecurityDetailsDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  onRegisterFace,
  onViewHistory,
  onTriggerToast,
  onStatusUpdate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  if (!isOpen || !employee) return null;

  const targetUserId = employee.userId || employee.id;

  const handleDeleteFace = async () => {
    if (!window.confirm(`Are you sure you want to delete the registered biometric face template for ${employee.fullName}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await authService.deleteFace(targetUserId);
      const updated: EmployeeSecurityDetails = {
        ...employee,
        faceStatus: 'Not Registered',
        activeTemplateVersion: undefined
      };
      onStatusUpdate(updated);
      onTriggerToast('success', 'Face Template Deleted', `Face template cleared for ${employee.fullName}. Eligible for immediate re-enrollment.`);
    } catch (err: any) {
      console.error('Failed to delete face profile:', err);
      onTriggerToast('error', 'Action Failed', 'Unable to delete face template.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFaceAuth = async () => {
    setIsTogglingStatus(true);
    try {
      if (employee.faceStatus === 'Disabled') {
        await authService.enableFace(targetUserId);
        const updated: EmployeeSecurityDetails = {
          ...employee,
          faceStatus: employee.activeTemplateVersion ? 'Registered' : 'Not Registered'
        };
        onStatusUpdate(updated);
        onTriggerToast('success', 'Face Auth Enabled', `Biometric authentication re-enabled for ${employee.fullName}.`);
      } else {
        await authService.disableFace(targetUserId);
        const updated: EmployeeSecurityDetails = {
          ...employee,
          faceStatus: 'Disabled'
        };
        onStatusUpdate(updated);
        onTriggerToast('warning', 'Face Auth Disabled', `Biometric authentication disabled for ${employee.fullName}.`);
      }
    } catch (err: any) {
      console.error('Failed to toggle face auth:', err);
      onTriggerToast('error', 'Action Failed', 'Unable to update face profile status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-brand-border flex flex-col justify-between">

        {/* Drawer Header */}
        <div className="p-6 border-b bg-brand-bg-secondary/30 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-base">
              {employee.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-brand-text-primary">{employee.fullName}</h2>
                <Badge variant={employee.status === 'Enabled' ? 'success' : 'danger'}>{employee.status}</Badge>
              </div>
              <p className="text-xs text-brand-text-secondary font-mono">
                Code: {employee.mappedEmployeeCode} | User: {employee.userCode}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 cursor-pointer rounded hover:bg-white">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">

          {/* 1. IDENTITY SECTION */}
          <div className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
            <h3 className="font-bold text-brand-text-primary border-b pb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
              <User size={15} className="text-brand-primary" />
              Employee Identity & Role Context
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Employee ID</span>
                <span className="font-mono font-bold text-brand-text-primary">{employee.mappedEmployeeCode}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">User Account Code</span>
                <span className="font-mono font-bold text-brand-primary">{employee.userCode}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Corporate Email</span>
                <span className="font-medium text-brand-text-primary flex items-center gap-1">
                  <Mail size={12} className="text-gray-400" />
                  {employee.email}
                </span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Department</span>
                <span className="font-medium text-brand-text-primary flex items-center gap-1">
                  <Building size={12} className="text-gray-400" />
                  {employee.department || 'Executive Management'}
                </span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Designation</span>
                <span className="font-medium text-brand-text-primary flex items-center gap-1">
                  <Briefcase size={12} className="text-gray-400" />
                  {employee.designation || 'Senior Officer'}
                </span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Assigned Role</span>
                <span className="font-semibold text-brand-text-primary flex items-center gap-1">
                  <Key size={12} className="text-brand-primary" />
                  {employee.role}
                </span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Security Profile</span>
                <span className="font-medium text-brand-text-primary">{employee.securityProfileName}</span>
              </div>
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Account Lifecycle</span>
                <Badge variant={employee.status === 'Enabled' ? 'success' : 'danger'}>{employee.status}</Badge>
              </div>
            </div>
          </div>

          {/* 2. FACE BIOMETRICS SECTION */}
          <div className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-brand-text-primary flex items-center gap-2 text-xs uppercase tracking-wider">
                <ShieldCheck size={15} className="text-brand-primary" />
                Face Biometric Template Details
              </h3>
              <Badge variant={
                employee.faceStatus === 'Registered' ? 'success' :
                employee.faceStatus === 'Disabled' ? 'danger' : 'warning'
              }>
                {employee.faceStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-brand-text-secondary text-[11px] block">Biometric Status</span>
                <span className="font-bold text-brand-text-primary flex items-center gap-1">
                  {employee.faceStatus === 'Registered' ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-500" />
                  )}
                  {employee.faceStatus}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Active Template Version</span>
                <span className="font-mono font-bold text-brand-primary">
                  {employee.activeTemplateVersion ? `Version ${employee.activeTemplateVersion}` : 'None'}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Registered By</span>
                <span className="font-medium text-brand-text-primary">{employee.registeredBy || 'Admin (admin@inkerp.com)'}</span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Registration Date</span>
                <span className="font-mono text-brand-text-secondary flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" />
                  {employee.registeredDate || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Last Verification</span>
                <span className="font-mono text-brand-text-primary">
                  {employee.lastVerificationTimestamp || 'Never Verified'}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Configured Threshold</span>
                <span className="font-mono font-bold text-brand-text-primary">
                  {employee.similarityThreshold ? `${(employee.similarityThreshold * 100).toFixed(0)}%` : '85%'}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Enrolled Quality Score</span>
                <span className="font-mono font-bold text-emerald-700">
                  {employee.qualityScore ? `${(employee.qualityScore * 100).toFixed(1)}%` : '92.0%'}
                </span>
              </div>

              <div>
                <span className="text-brand-text-secondary text-[11px] block">Feature Vector Size</span>
                <span className="font-mono text-brand-text-secondary">512 Dimensions (ONNX)</span>
              </div>
            </div>
          </div>

          {/* 3. ADMINISTRATOR ACTIONS */}
          <div className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
            <h3 className="font-bold text-brand-text-primary border-b pb-2 text-xs uppercase tracking-wider">
              Administrator Biometric Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => onRegisterFace(employee)}
                className="px-3 py-2 bg-brand-primary text-white font-semibold rounded hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Camera size={14} />
                {employee.faceStatus === 'Registered' ? 'Re-register / Update Face' : 'Register Face Biometrics'}
              </button>

              <button
                onClick={() => onViewHistory(employee)}
                className="px-3 py-2 border border-brand-border text-brand-text-primary font-semibold rounded hover:bg-brand-bg-secondary flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Activity size={14} className="text-brand-primary" />
                View Verification History
              </button>

              <button
                onClick={handleToggleFaceAuth}
                disabled={isTogglingStatus}
                className={`px-3 py-2 border font-semibold rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  employee.faceStatus === 'Disabled'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {employee.faceStatus === 'Disabled' ? (
                  <>
                    <Unlock size={14} />
                    Enable Face Authentication
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Disable Face Authentication
                  </>
                )}
              </button>

              {employee.faceStatus === 'Registered' && (
                <button
                  onClick={handleDeleteFace}
                  disabled={isDeleting}
                  className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded hover:bg-rose-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete Face Profile
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t bg-brand-bg-secondary/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-border text-xs font-semibold rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
