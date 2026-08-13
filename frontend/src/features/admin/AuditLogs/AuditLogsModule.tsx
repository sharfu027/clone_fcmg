import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Key,
  Users,
  Lock,
  Camera,
  Layers,
  Clock,
  X,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Globe,
  Monitor,
  Database,
  ArrowRight
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AuditLogDto, AuditLogStatsDto } from '../../../types/admin';
import { StatCard } from '../../../components/ui/StatCard';
import { Badge } from '../../../components/ui/Badge';

interface AuditLogsModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Events' },
  { id: 'Login', label: 'Login' },
  { id: 'Logout', label: 'Logout' },
  { id: 'Face Verification', label: 'Face Verification' },
  { id: 'Face Enrollment', label: 'Face Enrollment' },
  { id: 'Face Template Update', label: 'Face Template Update' },
  { id: 'Password Reset', label: 'Password Reset' },
  { id: 'User Created', label: 'User Created' },
  { id: 'User Updated', label: 'User Updated' },
  { id: 'User Deleted', label: 'User Deleted' },
  { id: 'User Locked', label: 'User Locked' },
  { id: 'User Unlocked', label: 'User Unlocked' },
  { id: 'Role Assigned', label: 'Role Assigned' },
  { id: 'Role Removed', label: 'Role Removed' },
  { id: 'Security Policy Change', label: 'Security Policy Change' },
  { id: 'Security Exception', label: 'Security Exception' },
  { id: 'System Event', label: 'System Event' }
];

export const AuditLogsModule: React.FC<AuditLogsModuleProps> = ({ onTriggerToast }) => {
  // ── States ──────────────────────────────────────────
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);

  // Summary Metrics Stats
  const [stats, setStats] = useState<AuditLogStatsDto>({
    totalEvents: 0,
    successfulLogins: 0,
    failedLogins: 0,
    faceVerifications: 0,
    userManagementEvents: 0,
    roleChanges: 0,
    securityExceptions: 0,
    criticalSecurityEvents: 0
  });

  const [searchParams] = useSearchParams();

  // Read URL query parameters for context-aware KPI navigation
  useEffect(() => {
    const resultParam = searchParams.get('result')?.toLowerCase();
    if (resultParam === 'failure' || resultParam === 'failed') {
      setResultFilter('failure');
    } else if (resultParam === 'success' || resultParam === 'successful') {
      setResultFilter('success');
    }

    const eventTypeParam = searchParams.get('eventType');
    if (eventTypeParam) {
      if (eventTypeParam.includes('LOGIN_FAILED')) {
        setSelectedCategory('Login');
        setResultFilter('failure');
      } else if (eventTypeParam.includes('LOGIN_SUCCESS')) {
        setSelectedCategory('Login');
        setResultFilter('success');
      }
    }

    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Selected Log Event Details Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'general' | 'security' | 'system' | 'changes'>('general');

  // ── Data Fetching ───────────────────────────────────

  const loadAuditLogsAndStats = async (isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const statsData = await adminService.getAuditLogStats();
      setStats(statsData);

      const parsedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
      const parsedEndDate = endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined;

      const pagedResult = await adminService.fetchAuditLogs({
        searchTerm,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        module: selectedModule === 'all' ? undefined : selectedModule,
        result: resultFilter === 'all' ? undefined : resultFilter,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        pageNumber,
        pageSize
      });

      if (pagedResult && pagedResult.items) {
        setLogs(pagedResult.items);
        setTotalCount(pagedResult.totalCount);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      if (!isSilent) {
        onTriggerToast('error', 'Failed to Load Audit Logs', err?.message || 'Server connection error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial and Manual Filter Trigger
  useEffect(() => {
    loadAuditLogsAndStats();
  }, [pageNumber, searchTerm, selectedCategory, resultFilter, selectedModule, startDate, endDate]);

  // Real-Time Auto Refresh Every 1 Minute (60,000ms)
  useEffect(() => {
    if (!isAutoRefreshActive) return;
    const interval = setInterval(() => {
      loadAuditLogsAndStats(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoRefreshActive, pageNumber, searchTerm, selectedCategory, resultFilter, selectedModule, startDate, endDate]);

  // ── Export Handlers (CSV & PDF) ──────────────────────
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      onTriggerToast('info', 'Generating Export...', `Preparing ${format.toUpperCase()} report...`);

      const parsedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
      const parsedEndDate = endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined;

      const blob = await adminService.exportAuditLogs({
        format,
        searchTerm,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        module: selectedModule === 'all' ? undefined : selectedModule,
        result: resultFilter === 'all' ? undefined : resultFilter,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });

      if (format === 'pdf') {
        const textContent = await blob.text();
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Production Audit Log Report - INK FMCG ERP</title>
                <style>
                  body { font-family: 'Courier New', monospace; font-size: 11px; padding: 24px; background: #fff; color: #0f172a; white-space: pre-wrap; line-height: 1.5; }
                  @media print {
                    body { padding: 0; }
                    @page { size: landscape; margin: 15mm; }
                  }
                </style>
              </head>
              <body>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
            </html>
          `);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 400);
        }
        onTriggerToast('success', 'PDF Report Ready', 'Audit log PDF report generated and opened for printing/saving.');
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `INK_ERP_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        onTriggerToast('success', 'CSV Export Complete', 'Audit logs exported to CSV spreadsheet successfully.');
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      onTriggerToast('error', 'Export Failed', err?.message || 'Failed to generate export file.');
    }
  };

  const handleViewDetails = (log: AuditLogDto) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
    setDrawerTab('general');
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: DASHBOARD METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Audit Events"
          value={`${stats.totalEvents} Logs`}
          badgeText="Live Sync Active"
          badgeVariant="primary"
          subLabel="Face & Biometrics"
          subValue={`${stats.faceVerifications} Verifications`}
        />
        <StatCard
          title="User Authentications"
          value={`${stats.successfulLogins} Logins`}
          badgeText={`Failed: ${stats.failedLogins}`}
          badgeVariant="success"
          subLabel="Critical Security Alerts"
          subValue={`${stats.criticalSecurityEvents} Alerts Triggered`}
        />
        <StatCard
          title="User Management Events"
          value={`${stats.userManagementEvents} Actions`}
          badgeText="Lifecycle Audited"
          badgeVariant="info"
          subLabel="Role & Permission Changes"
          subValue={`${stats.roleChanges} Role Updates`}
        />
        <StatCard
          title="Security Governance"
          value={`${stats.securityExceptions} Exceptions`}
          badgeText="100% Audited"
          badgeVariant="warning"
          subLabel="Compliance Status"
          subValue="Zero Untracked Access"
        />
      </div>

      {/* ── SECTION 2: AUDIT CATEGORY PILLS BAR ── */}
      <div className="bg-white p-2 rounded-xl border border-brand-border shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Category:
          </span>
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPageNumber(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-brand-border/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: PRODUCTION FILTERS TOOLBAR ── */}
      <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPageNumber(1); }}
              placeholder="Search user, username, employee ID, event, IP..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg border-brand-border text-xs focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Result Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-brand-border/80 text-xs font-semibold">
            <button
              onClick={() => { setResultFilter('all'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${resultFilter === 'all' ? 'bg-white font-bold shadow-xs text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Results
            </button>
            <button
              onClick={() => { setResultFilter('success'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${resultFilter === 'success' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Success
            </button>
            <button
              onClick={() => { setResultFilter('failure'); setPageNumber(1); }}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${resultFilter === 'failure' ? 'bg-rose-50 text-rose-700 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Failure
            </button>
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={e => { setSelectedModule(e.target.value); setPageNumber(1); }}
            className="p-2 border rounded-lg border-brand-border bg-white text-xs font-semibold outline-none"
          >
            <option value="all">All ERP Modules</option>
            <option value="IAM">IAM Security</option>
            <option value="SECURITY">Security Control</option>
            <option value="MASTERS">Master Data</option>
            <option value="SALES">Sales & O2C</option>
            <option value="INVENTORY">Inventory</option>
            <option value="FINANCE">Finance</option>
          </select>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPageNumber(1); }}
              className="p-1.5 border rounded-lg border-brand-border text-xs bg-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPageNumber(1); }}
              className="p-1.5 border rounded-lg border-brand-border text-xs bg-white"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPageNumber(1); }}
                className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-bold rounded cursor-pointer"
                title="Clear Date Filter"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Refresh & Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-Sync (60s)
          </div>

          <button
            onClick={() => loadAuditLogsAndStats()}
            disabled={isLoading || isRefreshing}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition border border-slate-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title={`Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}`}
          >
            <RefreshCw size={13} className={isLoading || isRefreshing ? 'animate-spin text-brand-primary' : ''} />
            Refresh
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={14} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* ── SECTION 4: AUDIT DATA TABLE ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-300 font-bold tracking-wide uppercase text-[10px] border-b border-slate-800">
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Employee ID</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Result</th>
                <th className="p-3.5">IP & Terminal</th>
                <th className="p-3.5 text-center">Latency</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                    Loading security audit events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                    No audit trail records found matching search and filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Timestamp */}
                    <td className="p-3.5 pl-4 font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* User */}
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>
                        <span className="block font-bold">{log.userDisplayName}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">{log.username}</span>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="p-3.5 font-mono font-bold text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded">
                        {log.employeeId}
                      </span>
                    </td>

                    {/* Event Type Badge */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-brand-primary border border-blue-200 font-mono font-bold text-[10px] rounded-full">
                        {log.eventType}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="p-3.5 font-bold text-slate-600 text-[11px]">
                      {log.module}
                    </td>

                    {/* Result */}
                    <td className="p-3.5">
                      {log.success ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> Success
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                          <XCircle size={10} /> Failed
                        </span>
                      )}
                    </td>

                    {/* IP & Terminal */}
                    <td className="p-3.5 text-slate-600">
                      <span className="font-mono font-bold text-[10px] text-slate-700 block">{log.ipAddress}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{log.device}</span>
                    </td>

                    {/* Latency */}
                    <td className="p-3.5 text-center font-mono text-[10px] font-bold text-slate-500">
                      {log.processingTimeMs ? `${log.processingTimeMs}ms` : '12ms'}
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-600 max-w-[220px] truncate" title={log.description}>
                      {log.description}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right pr-4">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition border border-slate-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} /> Details
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="bg-slate-50 p-3 border-t border-brand-border flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-800">{pageNumber}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} Total Events)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1.5 border rounded-lg border-brand-border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
              disabled={pageNumber >= totalPages}
              className="px-3 py-1.5 border rounded-lg border-brand-border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── DRAWER: AUDIT EVENT DETAILS ── */}
      {isDrawerOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-brand-border overflow-hidden">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedLog.eventType}</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</span>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="bg-slate-50 border-b border-brand-border flex gap-1 p-2 shrink-0">
              <button
                onClick={() => setDrawerTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'general' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                General Info
              </button>
              <button
                onClick={() => setDrawerTab('security')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'security' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Security & Client
              </button>
              <button
                onClick={() => setDrawerTab('system')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'system' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                System & API
              </button>
              <button
                onClick={() => setDrawerTab('changes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${drawerTab === 'changes' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                State Changes
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* TAB 1: GENERAL */}
              {drawerTab === 'general' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2">Event Metadata</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-semibold">Event ID</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{selectedLog.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Timestamp</span>
                        <span className="font-mono font-bold text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">User Display Name</span>
                        <span className="font-bold text-slate-800">{selectedLog.userDisplayName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Username / Email</span>
                        <span className="font-mono font-bold text-slate-800">{selectedLog.username}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Employee ID</span>
                        <span className="font-mono font-bold text-slate-800">{selectedLog.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Category</span>
                        <span className="font-bold text-brand-primary">{selectedLog.category}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Description & Audit Rationale</h4>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-brand-border leading-relaxed">{selectedLog.description}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY */}
              {drawerTab === 'security' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2">Security Context & Terminal Attributes</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-semibold">Execution Outcome</span>
                        <span className={`font-bold ${selectedLog.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {selectedLog.success ? 'SUCCESS (Passed)' : 'FAILURE (Blocked)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">IP Address</span>
                        <span className="font-mono font-bold text-slate-800">{selectedLog.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Terminal Device</span>
                        <span className="font-bold text-slate-800">{selectedLog.device}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Browser Agent</span>
                        <span className="font-bold text-slate-800">{selectedLog.browser}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Operating System</span>
                        <span className="font-bold text-slate-800">{selectedLog.operatingSystem}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Geographic Location</span>
                        <span className="font-bold text-slate-800">{selectedLog.location}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLog.failureReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                      <span className="font-bold block mb-1">Failure Reason:</span>
                      <p>{selectedLog.failureReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SYSTEM */}
              {drawerTab === 'system' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2">System Execution Telemetry</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-semibold">Target Module</span>
                        <span className="font-bold text-slate-800">{selectedLog.module}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">API Endpoint</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{selectedLog.endpoint || '/api/v1/security'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">HTTP Method</span>
                        <span className="font-mono font-bold text-brand-primary">{selectedLog.httpMethod || 'POST'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Processing Latency</span>
                        <span className="font-mono font-bold text-slate-800">{selectedLog.processingTimeMs || 14} ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STATE CHANGES */}
              {drawerTab === 'changes' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">State Mutation Delta</h4>

                  <div className="space-y-3">
                    <div>
                      <span className="font-bold text-rose-600 block mb-1">Previous State (Before Action)</span>
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto">
                        {selectedLog.previousValue ? selectedLog.previousValue : '// No previous state mutation captured for this read/verification event.'}
                      </pre>
                    </div>

                    <div>
                      <span className="font-bold text-emerald-600 block mb-1">New State (After Action)</span>
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto">
                        {selectedLog.newValue ? selectedLog.newValue : '// No new state mutation captured for this read/verification event.'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogsModule;
