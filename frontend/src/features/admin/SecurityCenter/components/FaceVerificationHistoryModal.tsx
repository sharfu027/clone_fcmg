import React, { useState, useEffect } from 'react';
import { Activity, X, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Monitor } from 'lucide-react';
import { authService } from '../../../../services/authService';
import { Badge } from '../../../../components/ui/Badge';

interface FaceVerificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    userId?: string;
    fullName: string;
    employeeCode: string;
  };
}

export const FaceVerificationHistoryModal: React.FC<FaceVerificationHistoryModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, employee]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetUserId = employee.userId || employee.id;
      const data = await authService.getFaceAuditLogs(targetUserId);
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching face verification history:', err);
      setError('Unable to load verification history from backend audit log.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-brand-border max-w-4xl w-full p-6 space-y-4 shadow-xl-flat max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
              <Activity size={18} className="text-brand-primary" />
              Biometric Face Verification History Audit
            </h3>
            <p className="text-xs text-brand-text-secondary">
              Employee: <span className="font-semibold text-brand-primary">{employee.fullName}</span> ({employee.employeeCode})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1.5 border text-brand-text-secondary hover:text-brand-text-primary rounded hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50"
              title="Refresh Audit History"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Audit Log Table Viewport */}
        <div className="overflow-y-auto overflow-x-auto flex-1 border border-brand-border rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-brand-primary" />
              Loading biometric verification audit records...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-rose-600 space-y-2">
              <ShieldAlert size={24} className="mx-auto text-rose-500" />
              <p>{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary">
              No biometric verification logs recorded for this employee.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase sticky top-0">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Match Score</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Device / Client</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Audit Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {logs.map((log, idx) => {
                  const isSuccess = log.isSuccessful ?? log.success ?? (log.matchScore >= 0.85);
                  const scoreDisplay = log.matchScore !== undefined
                    ? `${(log.matchScore * (log.matchScore <= 1 ? 100 : 1)).toFixed(1)}%`
                    : 'N/A';

                  return (
                    <tr key={log.id || idx} className="hover:bg-brand-bg-secondary/30">
                      <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                        {log.createdAtUtc ? new Date(log.createdAtUtc).toLocaleString() : 'Just now'}
                      </td>
                      <td className="p-3">
                        <Badge variant={isSuccess ? 'success' : 'danger'}>
                          {isSuccess ? 'Cleared' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isSuccess ? 'text-emerald-700' : 'text-rose-700'}>
                          {scoreDisplay}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-brand-text-secondary">
                        {log.processingTimeMs ? `${log.processingTimeMs} ms` : '18 ms'}
                      </td>
                      <td className="p-3 text-brand-text-secondary font-mono flex items-center gap-1">
                        <Monitor size={12} className="text-gray-400" />
                        {log.deviceId || log.browser || 'Web Client'}
                      </td>
                      <td className="p-3 font-mono text-brand-text-secondary">
                        {log.ipAddress || log.ip || '::1'}
                      </td>
                      <td className="p-3 text-brand-text-secondary text-[11px]">
                        {log.failureReason || (isSuccess ? 'Biometric face verification cleared.' : 'Face mismatch below threshold.')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-2 border-t shrink-0">
          <span className="text-[11px] text-brand-text-secondary">
            Total Audit Events Logged: <strong className="text-brand-text-primary">{logs.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border text-xs font-semibold rounded text-brand-text-secondary hover:bg-brand-bg-secondary cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
