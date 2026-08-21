import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Cpu, Database, Eye, Zap, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { authService } from '../../../../services/authService';
import { Badge } from '../../../../components/ui/Badge';
import { Tooltip } from '../../../../components/ui/Tooltip';

interface BiometricDebugDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const BiometricDebugDashboardModal: React.FC<BiometricDebugDashboardModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const diagData = await authService.getBiometricDiagnostics(userId);
      setLogs(diagData.logs || []);
      setStatus(diagData.serviceStatus || {});
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 max-w-4xl w-full p-6 rounded-xl space-y-4 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="text-emerald-400" size={20} />
            <h3 className="text-sm font-mono font-bold tracking-wide text-emerald-400 uppercase">
              Biometric Diagnostics & ONNX Neural Telemetry Dashboard
            </h3>
            <Badge variant="neutral" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
              Dev Mode Only
            </Badge>
          </div>
          <Tooltip content="Close">
            <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white cursor-pointer p-1">
              <X size={18} />
            </button>
          </Tooltip>
        </div>

        {/* Model Spec Grid */}
        <div className="grid grid-cols-4 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">ONNX Model</span>
            <span className="font-bold text-emerald-300">InsightFace MobileFaceNet</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Embedding Dimension</span>
            <span className="font-bold text-emerald-300">512-dim Float32</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Comparison Strategy</span>
            <span className="font-bold text-emerald-300">Euclidean (Parallel.ForEach)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Match Threshold</span>
            <span className="font-bold text-emerald-300">0.40 (Dist &le; 0.55)</span>
          </div>
        </div>

        {/* User Status Card */}
        {status && (
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={16} />
              <span>Target Profile: <strong className="text-white">{userId}</strong></span>
            </div>
            <div className="flex items-center gap-4">
              <span>Status: <strong className="text-emerald-400">{status.status}</strong></span>
              <span>Active Version: <strong className="text-emerald-400">v{status.activeTemplateVersion}</strong></span>
            </div>
          </div>
        )}

        {/* Verification Logs Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
            <span>Recent Forensic Verification Telemetry Stream ({logs.length} entries)</span>
            <button onClick={fetchDiagnostics} className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer">
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No biometric verification logs captured yet. Execute a face scan to generate telemetry.
            </div>
          ) : (
            logs.map((log: any, idx: number) => (
              <div
                key={log.id || idx}
                className={`p-3 rounded-lg border font-mono text-xs space-y-1.5 transition-colors ${
                  log.isSuccessful || log.isMatch || log.MatchScore >= 0.40
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="font-bold text-[11px] flex items-center gap-1.5">
                    <Activity size={14} className={log.isSuccessful ? 'text-emerald-400' : 'text-rose-400'} />
                    Timestamp: {new Date(log.createdAtUtc || log.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                  <Badge variant={log.isSuccessful ? 'success' : 'danger'}>
                    {log.isSuccessful ? 'MATCHED' : 'REJECTED'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Similarity Score</span>
                    <span className="font-bold">
                      {((log.matchScore || log.SimilarityScore || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Euclidean Distance</span>
                    <span className="font-bold">
                      {(1.0 - (log.matchScore || 0)).toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Reason Code</span>
                    <span className="font-bold">
                      {log.failureReason || (log.isSuccessful ? 'MATCH_SUCCESS' : 'LOW_SIMILARITY')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Device ID</span>
                    <span className="truncate block font-bold text-slate-300">
                      {log.deviceId || 'WEB-CLIENT'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Controls */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1 text-[11px]">
            <Zap size={14} className="text-emerald-400" />
            AES-256 Vector Encryption | Single-Frame &lt;1s Latency Engine
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer font-bold"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
