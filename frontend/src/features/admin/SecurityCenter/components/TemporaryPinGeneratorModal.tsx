import React, { useState, useEffect } from 'react';
import { KeyRound, X, Clock, ShieldAlert, Check, Copy, AlertTriangle, RefreshCw } from 'lucide-react';
import { salesService } from '../../../../services/salesService';
import { fetchEmployees } from '../../../../services/masterDataService';
import { EmployeeDto } from '../../../../types/masterData';
import { TemporaryPin } from '../../../../types/sales';
import { useAuth } from '../../../../context/AuthContext';

interface TemporaryPinGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  preselectedEmployeeId?: string | null;
}

export const TemporaryPinGeneratorModal: React.FC<TemporaryPinGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTriggerToast,
  preselectedEmployeeId
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || '');
  const [purpose, setPurpose] = useState<string>('Sales Login GPS / Camera Bypass');
  const [expiryMinutes, setExpiryMinutes] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPinData, setGeneratedPinData] = useState<TemporaryPin | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedPinData(null);
      setCopied(false);
      loadEmployees();
      if (preselectedEmployeeId) {
        setSelectedEmployeeId(preselectedEmployeeId);
      }
    }
  }, [isOpen, preselectedEmployeeId]);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error('Failed to load employees for PIN generation:', err);
    }
  };

  const handleGeneratePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId && !user?.companyName) {
      onTriggerToast?.('error', 'Company Required', 'No active company context found for PIN generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const pinResult = await salesService.generateTemporaryPin({
        companyId: user.companyId || (user as any).CompanyId || '00000000-0000-0000-0000-000000000000',
        employeeId: selectedEmployeeId ? selectedEmployeeId : null,
        purpose: purpose.trim() || 'Temporary Access Override',
        expiryMinutes: Number(expiryMinutes) || 30
      });

      setGeneratedPinData(pinResult);
      onTriggerToast?.('success', 'PIN Generated', 'Temporary single-use authorization PIN created.');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to generate PIN.';
      onTriggerToast?.('error', 'Generation Failed', errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPin = () => {
    if (!generatedPinData?.plainPin) return;
    navigator.clipboard.writeText(generatedPinData.plainPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    onTriggerToast?.('info', 'Copied to Clipboard', 'Temporary PIN copied.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-brand-border shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admin Authorization PIN</h3>
              <p className="text-[11px] text-slate-500">Generate single-use temporary bypass code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Alert */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Strict Security Warning</p>
            <p className="text-[11px] text-amber-800">
              This PIN is single-use, hashed upon creation, and will expire automatically. Share securely with the authorized field sales rep only.
            </p>
          </div>
        </div>

        {/* PIN Result Display (If generated) */}
        {generatedPinData && generatedPinData.plainPin ? (
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Single-Use Authorization Code
            </span>
            
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl font-mono font-black tracking-widest text-brand-primary bg-white px-5 py-2.5 rounded-lg border border-brand-primary/30 shadow-xs">
                {generatedPinData.plainPin}
              </div>
              <button
                type="button"
                onClick={handleCopyPin}
                className="p-2.5 bg-brand-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Copy PIN"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-slate-600 border-t border-slate-200/60 pt-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Expires At</span>
                <span className="font-semibold text-slate-800">
                  {new Date(generatedPinData.expiresAtUtc).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Employee</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {employees.find(e => e.id === generatedPinData.employeeId)?.firstName || 'Any Company Staff'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setGeneratedPinData(null)}
                className="text-xs text-brand-primary hover:underline font-semibold"
              >
                Generate Another PIN
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleGeneratePin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Target Sales Representative (Optional)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 border rounded-lg border-slate-300 text-slate-800 bg-white focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Any Staff (Company Scope)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designationName || 'Sales Rep'}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Restricts PIN redemption to this specific employee account if selected.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Expiry Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 120].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setExpiryMinutes(mins)}
                    className={`py-1.5 rounded-lg border text-center font-semibold cursor-pointer transition ${
                      expiryMinutes === mins
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Purpose / Audit Note
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Reason for temporary authorization..."
                className="w-full p-2 border rounded-lg border-slate-300 text-slate-800 focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                <span>Generate PIN</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
