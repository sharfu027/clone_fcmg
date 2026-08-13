import React, { useState } from 'react';
import {
  BarChart3,
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Clock,
  Send,
  Layers,
  Sparkles,
  TrendingUp,
  Sliders,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import {
  ReportDefinition,
  GeneratedDocument,
  ExportRequest,
  ScheduledReportJob,
  ReportMetrics,
  ReportFilterParams
} from '../../types/reports';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatINR } from '../../utils/formatters';

interface ReportsModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function ReportsModule({ onTriggerToast }: ReportsModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'procurement' | 'inventory' | 'sales' | 'finance' | 'hrms-crm' | 'logistics' | 'documents' | 'scheduled'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);

  // Mock Report Definitions
  const [reports] = useState<ReportDefinition[]>([
    { id: 'RPT-01', code: 'PUR-REG-01', title: 'Purchase Register & Purchase Invoices', category: 'Procurement', description: 'Complete itemized log of purchase bills and GRN reconciliations.', isFavourite: true, lastGeneratedDate: '2026-07-23' },
    { id: 'RPT-02', code: 'INV-VAL-02', title: 'Inventory FEFO Expiry & Stock Valuation', category: 'Inventory', description: 'Batch-wise stock valuation (FIFO/FEFO) with remaining shelf-life.', isFavourite: true, lastGeneratedDate: '2026-07-23' },
    { id: 'RPT-03', code: 'SLS-CUST-03', title: 'Customer Sales & Beat Performance', category: 'Sales', description: 'Outlet-wise revenue, target vs achievement, and DCR collections.', isFavourite: false, lastGeneratedDate: '2026-07-22' },
    { id: 'RPT-04', code: 'FIN-AGING-04', title: 'AR 5-Tier Outstanding & Aging Buckets', category: 'Finance', description: 'Customer receivables aging (0-30, 31-60, 61-90, 91-180, 180+ Days).', isFavourite: true, lastGeneratedDate: '2026-07-23' }
  ]);

  // Mock Generated Documents
  const [documents] = useState<GeneratedDocument[]>([
    { id: 'DOC-901', documentCode: 'DOC-INV-2026-0981', documentType: 'SalesInvoice', referenceNumber: 'INV-DEL-2026-0981', entityName: 'Reliance Retail Chain', generatedDate: '2026-07-23 11:30 AM', totalAmount: 185000 },
    { id: 'DOC-902', documentCode: 'DOC-PO-2026-0012', documentType: 'PurchaseOrder', referenceNumber: 'PO-2026-0012', entityName: 'Hindustan Unilever Ltd', generatedDate: '2026-07-22 03:15 PM', totalAmount: 1455000 }
  ]);

  // Mock Scheduled Jobs
  const [scheduledJobs] = useState<ScheduledReportJob[]>([
    { id: 'SCH-01', jobName: 'Daily Sales & Collections Summary', reportCode: 'SLS-CUST-03', frequency: 'Daily', recipients: ['directors@ink-fmcg.com'], lastRunStatus: 'Success', nextRunDate: '2026-07-24 07:00 AM' }
  ]);

  const handleExportReport = (format: 'PDF' | 'Excel' | 'CSV') => {
    if (!selectedReport) return;
    onTriggerToast('success', `${format} Export Triggered`, `Generating ${selectedReport.title} as ${format}...`);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: REPORT KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reports Generated Today" value="48 Runs" badgeText="Auto & Manual" badgeVariant="primary" subLabel="Favourite Reports" subValue={`${reports.filter(r => r.isFavourite).length} Favourites`} />
        <StatCard title="Export Operations" value="124 Downloads" badgeText="PDF / Excel" badgeVariant="success" subLabel="PDF: 82 | Excel: 42" subValue="100% Success" progressPercent={99} progressColor="success" />
        <StatCard title="Active Scheduled Jobs" value={scheduledJobs.length} badgeText="Cron Active" badgeVariant="info" subLabel="Next Dispatch" subValue="Tomorrow 07:00 AM" />
        <StatCard title="Print Jobs Completed" value="32 Documents" badgeText="PDF Challans" badgeVariant="warning" subLabel="PODs & Invoices" subValue="Zero Print Errors" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Reports Overview', icon: TrendingUp },
          { id: 'procurement', label: 'Procurement Reports', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventory Reports', icon: Package },
          { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
          { id: 'finance', label: 'Finance & AR/AP', icon: DollarSign },
          { id: 'hrms-crm', label: 'HRMS & CRM', icon: Users },
          { id: 'logistics', label: 'Logistics Reports', icon: Truck },
          { id: 'documents', label: 'Document Engine', icon: FileText },
          { id: 'scheduled', label: 'Scheduled Jobs', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isActive ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REUSABLE FILTER BAR */}
      <div className="bg-white p-3 rounded-lg border border-brand-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-brand-primary" />
          <span className="font-bold text-brand-text-primary">Universal Filter Engine:</span>
          <input type="date" defaultValue="2026-07-01" className="p-1.5 border rounded border-brand-border text-xs" />
          <span className="text-brand-text-secondary">to</span>
          <input type="date" defaultValue="2026-07-23" className="p-1.5 border rounded border-brand-border text-xs" />
          <select className="p-1.5 border rounded border-brand-border bg-white text-xs">
            <option value="All">All Branches</option>
            <option value="Delhi Central">Delhi Central Depot</option>
          </select>
        </div>
        <Badge variant="primary">Filter Context Ready</Badge>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Starred & Favourite Reports</h4>
            <div className="space-y-3 text-xs">
              {reports.map(r => (
                <div key={r.id} className="p-3 border rounded bg-brand-bg-secondary/30 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-brand-primary">{r.title}</span>
                      <Badge variant="info">{r.category}</Badge>
                    </div>
                    <p className="text-brand-text-secondary text-[11px] mt-0.5">{r.description}</p>
                  </div>
                  <button onClick={() => setSelectedReport(r)} className="px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-blue-700 cursor-pointer flex items-center gap-1">
                    <Eye size={13} /> Run Report
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Print-Ready Document Engine</h4>
            <div className="space-y-2 text-xs">
              {documents.map(d => (
                <div key={d.id} className="p-2.5 border rounded bg-brand-bg-secondary/40 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{d.referenceNumber}</span>
                    <Badge variant="success">{d.documentType}</Badge>
                  </div>
                  <p className="text-brand-text-secondary text-[11px]">{d.entityName}</p>
                  <p className="text-brand-primary font-mono font-bold">{formatINR(d.totalAmount || 0)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: DOCUMENT ENGINE */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search document code, reference..." />
            <Badge variant="success">PDF & Print Engine Ready</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Document Code</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference Number</th>
                  <th className="p-3">Party / Entity Name</th>
                  <th className="p-3 text-right">Value (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{doc.documentCode}</td>
                    <td className="p-3 font-semibold">{doc.documentType}</td>
                    <td className="p-3 font-mono text-brand-text-secondary">{doc.referenceNumber}</td>
                    <td className="p-3">{doc.entityName}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(doc.totalAmount || 0)}</td>
                    <td className="p-3 text-center flex justify-center gap-1">
                      <button onClick={() => onTriggerToast('info', 'Print Preview', `Rendering print preview for ${doc.referenceNumber}`)} className="px-2 py-1 bg-brand-bg-secondary border text-brand-text-primary text-[11px] font-semibold rounded hover:bg-brand-border cursor-pointer flex items-center gap-1">
                        <Printer size={12} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT RUNNER / EXPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">{selectedReport.title}</h3>
            <p className="text-xs text-brand-text-secondary">{selectedReport.description}</p>
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-brand-text-primary">Select Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleExportReport('PDF')} className="p-2.5 border rounded border-brand-primary text-brand-primary font-bold text-center hover:bg-blue-50 cursor-pointer flex flex-col items-center gap-1">
                  <FileText size={16} /> PDF
                </button>
                <button onClick={() => handleExportReport('Excel')} className="p-2.5 border rounded border-brand-success text-brand-success font-bold text-center hover:bg-green-50 cursor-pointer flex flex-col items-center gap-1">
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExportReport('CSV')} className="p-2.5 border rounded border-brand-warning text-brand-warning font-bold text-center hover:bg-amber-50 cursor-pointer flex flex-col items-center gap-1">
                  <Download size={16} /> CSV
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
