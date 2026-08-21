import React, { useState, useEffect } from 'react';
import { X, Building, Check, Loader2, AlertCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { apiClient } from '../../../api/apiClient';

interface AssignCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  targetUser: any | null;
}

export const AssignCompanyModal: React.FC<AssignCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onTriggerToast,
  targetUser
}) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen && targetUser) {
      setErrorMessage('');
      setSelectedCompanyId(targetUser.assignedCompanyId || '');
      loadCompanies();
    }
  }, [isOpen, targetUser]);

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const res = await apiClient.get<any[]>('/api/v1/masters/company/lookup');
      const list = Array.isArray(res) ? res : [];
      setCompanies(list);
    } catch (err: any) {
      console.error('Failed to load companies for assignment lookup:', err);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCompanyId || isSubmitting) {
      if (!selectedCompanyId) setErrorMessage('Please select a company to assign.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    let successMessage = '';
    try {
      await adminService.assignCompanyToAdmin(targetUser.id, selectedCompanyId);
      const matched = companies.find(c => c.id === selectedCompanyId);
      successMessage = `Company '${matched?.legalName || matched?.name || 'Selected Company'}' assigned to ${targetUser.username || targetUser.displayName}.`;
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to assign company to administrator.';
      setErrorMessage(msg);
      onTriggerToast('error', 'Assignment Failed', msg);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
    if (successMessage) {
      try {
        onSuccess(successMessage);
      } catch (cbErr) {
        console.error('Post-assignment UI refresh error:', cbErr);
      }
    }
  };

  const handleRevoke = async () => {
    if (isSubmitting) return;
    if (!window.confirm(`Are you sure you want to revoke company assignment from ${targetUser.username || targetUser.displayName}? This admin will have no company assigned.`)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    let successMessage = '';
    try {
      await adminService.revokeAdminCompany(targetUser.id);
      successMessage = `Company assignment revoked from ${targetUser.username || targetUser.displayName}.`;
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Failed to revoke company assignment.';
      setErrorMessage(msg);
      onTriggerToast('error', 'Revocation Failed', msg);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
    if (successMessage) {
      try {
        onSuccess(successMessage);
      } catch (cbErr) {
        console.error('Post-revocation UI refresh error:', cbErr);
      }
    }
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-400/30">
              <Building size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Assign Company to Administrator</h3>
              <p className="text-[11px] text-slate-400">One-Company Scoping Enforcement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Admin Profile Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {targetUser.displayName || `${targetUser.firstName} ${targetUser.lastName}`}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">@{targetUser.username}</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded">
                Admin
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600">
              Current Assignment:{' '}
              {targetUser.assignedCompanyName ? (
                <span className="font-bold text-emerald-700">
                  {targetUser.assignedCompanyName} ({targetUser.assignedCompanyCode || 'Active'})
                </span>
              ) : (
                <span className="font-bold text-amber-600">Not Assigned</span>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Company Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Select Company to Assign <span className="text-red-500">*</span>
            </label>
            {isLoadingCompanies ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg text-slate-500">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span>Loading available companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg text-xs">
                No active companies found. Please create a company first in the Companies Master.
              </div>
            ) : (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">-- Choose Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `[${c.code}] ` : ''}{c.legalName || c.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10.5px] text-slate-400">
              Rule: Assigning a new company replaces any existing company for this Admin.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {targetUser.assignedCompanyId ? (
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              Revoke Assignment
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={isSubmitting || !selectedCompanyId || isLoadingCompanies}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={13} />
                  Save Assignment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AssignCompanyModal;
