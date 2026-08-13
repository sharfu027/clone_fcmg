import React from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  User,
  Monitor,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Hash,
  Server
} from 'lucide-react';
import { AuditLogDto } from '../../../../types/admin';
import { Badge } from '../../../../components/ui/Badge';

interface SecurityEventDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: AuditLogDto | null;
  onTriggerToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export const SecurityEventDetailsDrawer: React.FC<SecurityEventDetailsDrawerProps> = ({
  isOpen,
  onClose,
  event,
  onTriggerToast
}) => {
  if (!isOpen || !event) return null;

  const isSuccess = event.success ?? (event.result === 'success' || event.result === 'SUCCESS');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) {
      onTriggerToast('info', 'Copied to Clipboard', `${label}: ${text}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
              {isSuccess ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{event.eventType || event.action || 'Security Event'}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-full border ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {isSuccess ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">Audit Record ID: #{event.id.substring(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-5 space-y-5 flex-1 text-xs">

          {/* Failure Warning Box */}
          {!isSuccess && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <div className="font-bold flex items-center gap-1.5 text-xs text-rose-700">
                <AlertTriangle size={14} /> Failure Reason / Security Event Detail
              </div>
              <p className="text-[11px] font-medium leading-relaxed">
                {event.failureReason || event.description || 'Authentication attempt failed due to invalid credentials or security policy check.'}
              </p>
            </div>
          )}

          {/* User Account Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={13} /> User Identity & Metadata
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">User Display Name</span>
                <span className="font-bold text-slate-900 block truncate">{event.userDisplayName || event.username || 'System / Anonymous'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Username</span>
                <span className="font-mono text-slate-700 block truncate">{event.username || 'N/A'}</span>
              </div>
              {event.userId && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">User Internal ID</span>
                  <span className="font-mono text-[10px] text-slate-600 block truncate">{event.userId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Telemetry & Client Environment */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Monitor size={13} /> Client Telemetry & Environment
            </h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">IP Address</span>
                <span className="font-mono font-bold text-slate-900">{event.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Device Client</span>
                <span className="font-medium text-slate-800">{event.device || 'Desktop Browser'}</span>
              </div>
              {event.browser && (
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Browser</span>
                  <span className="font-medium text-slate-800">{event.browser}</span>
                </div>
              )}
              {event.operatingSystem && (
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Operating System</span>
                  <span className="font-medium text-slate-800">{event.operatingSystem}</span>
                </div>
              )}
              {event.location && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Geographic Location</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <Globe size={11} className="text-slate-400" /> {event.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Technical Execution Audit Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Server size={13} /> Technical Execution Details
            </h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Module / Category</span>
                <span className="font-medium text-slate-800">{event.module || 'IAM'} / {event.category || 'Security'}</span>
              </div>
              {event.endpoint && (
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Endpoint</span>
                  <span className="font-mono text-[11px] text-slate-800">{event.httpMethod} {event.endpoint}</span>
                </div>
              )}
              {event.correlationId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Correlation ID</span>
                  <button
                    onClick={() => copyToClipboard(event.correlationId || '', 'Correlation ID')}
                    className="font-mono text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {event.correlationId.substring(0, 16)}... <Copy size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
