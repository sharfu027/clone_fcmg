import React, { useState } from 'react';
import {
  Search,
  Calendar,
  ChevronDown,
  Plus,
  Check,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ComponentDocsProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function DesignSystemDocs({ onTriggerToast }: ComponentDocsProps) {
  const [activeTab, setActiveTab] = useState<'tokens' | 'forms' | 'data' | 'states'>('tokens');
  
  // Interactive component states
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState(false);
  const [selectVal, setSelectVal] = useState('monthly');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Auto-complete mock
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const branches = [
    'Central Depot (HQ) - Delhi',
    'Western Warehouse - Mumbai',
    'Southern Hub - Chennai',
    'Eastern Outlet - Kolkata',
    'Northern Branch - Chandigarh'
  ];
  const filteredBranches = branches.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));

  // Date picker mock state
  const [selectedDate, setSelectedDate] = useState('2026-07-21');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Accordion state
  const [accordionOpen, setAccordionOpen] = useState<number | null>(0);

  // Table State
  const [tableSearch, setTableSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const mockTableData = [
    { id: 'TXN-9021', customer: 'Hindustan Unilever Retail', category: 'Soaps & Detergents', amount: '₹1,45,200', status: 'Approved', date: '2026-07-20' },
    { id: 'TXN-9022', customer: 'ITC Distribution Hub', category: 'Packaged Foods', amount: '₹3,84,000', status: 'Pending', date: '2026-07-20' },
    { id: 'TXN-9023', customer: 'Nestle India Agency', category: 'Dairy Products', amount: '₹95,400', status: 'Rejected', date: '2026-07-19' },
    { id: 'TXN-9024', customer: 'Britannia Wholesale', category: 'Bakery & Biscuits', amount: '₹2,10,500', status: 'Approved', date: '2026-07-18' },
    { id: 'TXN-9025', customer: 'P&G Sales Corporation', category: 'Personal Care', amount: '₹1,18,000', status: 'On Hold', date: '2026-07-18' },
  ];
  const filteredTableData = mockTableData.filter(row => 
    row.customer.toLowerCase().includes(tableSearch.toLowerCase()) || 
    row.id.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredTableData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredTableData.map(r => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="border-b border-brand-border bg-white p-6 rounded-lg shadow-sm-flat">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-blue-50 text-brand-primary rounded">v1.0.0 Stable</span>
              <span className="text-xs text-brand-text-secondary font-mono">React 19 / Tailwind v4 / .NET 9 Compatible</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">INK Design System & Core Component Library</h1>
            <p className="text-sm text-brand-text-secondary mt-1 max-w-3xl">
              This interactive playground serves as the single source of truth for design tokens, typography scales, responsive layouts, 
              and robust frontend components. Every component adheres to WCAG AA guidelines with keyboard friendliness and precise spacing rules.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                onTriggerToast('success', 'Design Tokens Exported', 'Tokens compiled as standard Tailwind v4 CSS variables successfully.');
              }}
              className="px-4 py-2 text-sm font-medium border border-brand-border hover:bg-brand-bg-secondary text-brand-text-primary rounded-md flex items-center gap-2 transition cursor-pointer"
            >
              <FileText size={16} /> Export Tokens
            </button>
            <button 
              onClick={() => {
                onTriggerToast('info', 'System Sync Complete', 'Enterprise ASP.NET Core 9 API mapping schemas validated.');
              }}
              className="px-4 py-2 text-sm font-medium bg-brand-primary hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <RefreshCw size={16} /> Sync API Schemas
            </button>
          </div>
        </div>

        {/* Documentation Tab Switcher */}
        <div className="flex border-b border-brand-border mt-8 -mb-6">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'tokens'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            1. Design Tokens & Variables
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'forms'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            2. Form Controls & Overlays
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'data'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            3. Data Tables & Indicators
          </button>
          <button
            onClick={() => setActiveTab('states')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'states'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            4. System States & Shell Rules
          </button>
        </div>
      </div>

      {/* Tab 1: Design Tokens */}
      {activeTab === 'tokens' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Colors */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Color tokens (Light Theme Only)</h3>
              <p className="text-xs text-brand-text-secondary">Strictly aligned with client request. No unnecessary gradients.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white border border-brand-border" />
                <div>
                  <span className="block text-xs font-bold font-mono">#FFFFFF</span>
                  <span className="text-xs text-brand-text-secondary">Background / Sidebar</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#F8F9FB] border border-brand-border" />
                <div>
                  <span className="block text-xs font-bold font-mono">#F8F9FB</span>
                  <span className="text-xs text-brand-text-secondary">Secondary Bg</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-primary" />
                <div>
                  <span className="block text-xs font-bold text-brand-primary font-mono">#2563EB</span>
                  <span className="text-xs text-brand-text-secondary">Primary Action</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-success" />
                <div>
                  <span className="block text-xs font-bold text-brand-success font-mono">#16A34A</span>
                  <span className="text-xs text-brand-text-secondary">Success States</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-warning" />
                <div>
                  <span className="block text-xs font-bold text-brand-warning font-mono">#D97706</span>
                  <span className="text-xs text-brand-text-secondary">Warning States</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-danger" />
                <div>
                  <span className="block text-xs font-bold text-brand-danger font-mono">#DC2626</span>
                  <span className="text-xs text-brand-text-secondary">Danger / Error</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-info" />
                <div>
                  <span className="block text-xs font-bold text-brand-info font-mono">#0284C7</span>
                  <span className="text-xs text-brand-text-secondary">Information</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-border" />
                <div>
                  <span className="block text-xs font-bold font-mono">#E5E7EB</span>
                  <span className="text-xs text-brand-text-secondary">Dividers & Borders</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-text-primary" />
                <div>
                  <span className="block text-xs font-bold text-[#111827] font-mono">#111827</span>
                  <span className="text-xs text-brand-text-secondary">Text Primary</span>
                </div>
              </div>

              <div className="p-3 border border-brand-border rounded flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-text-secondary" />
                <div>
                  <span className="block text-xs font-bold text-[#6B7280] font-mono">#6B7280</span>
                  <span className="text-xs text-brand-text-secondary">Text Secondary</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Typography scale (Inter & Fallbacks)</h3>
              <p className="text-xs text-brand-text-secondary">Highly legible enterprise hierarchy with strict tracking constraints.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start border-b border-brand-border pb-3">
                <span className="w-24 text-xs font-mono text-brand-text-secondary font-bold">text-2xl</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">INK FMCG ERP Dashboard</h2>
                  <span className="text-xs text-brand-text-secondary">Font: Inter Bold / Size: 24px / Line Height: 32px</span>
                </div>
              </div>

              <div className="flex items-start border-b border-brand-border pb-3">
                <span className="w-24 text-xs font-mono text-brand-text-secondary font-bold">text-lg</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-text-primary">Recent Sales Invoices</h3>
                  <span className="text-xs text-brand-text-secondary">Font: Inter Semibold / Size: 18px / Line Height: 28px</span>
                </div>
              </div>

              <div className="flex items-start border-b border-brand-border pb-3">
                <span className="w-24 text-xs font-mono text-brand-text-secondary font-bold">text-sm</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text-primary">Primary action label text</p>
                  <span className="text-xs text-brand-text-secondary">Font: Inter Medium / Size: 14px / Line Height: 20px</span>
                </div>
              </div>

              <div className="flex items-start border-b border-brand-border pb-3">
                <span className="w-24 text-xs font-mono text-brand-text-secondary font-bold">text-xs</span>
                <div className="flex-1">
                  <p className="text-xs text-brand-text-secondary">Secondary text helper or table header label</p>
                  <span className="text-xs text-brand-text-secondary">Font: Inter Regular / Size: 12px / Line Height: 16px</span>
                </div>
              </div>

              <div className="flex items-start">
                <span className="w-24 text-xs font-mono text-brand-text-secondary font-bold">mono-xs</span>
                <div className="flex-1">
                  <p className="text-xs font-mono text-brand-text-secondary">INV-2026-00392A</p>
                  <span className="text-xs text-brand-text-secondary">Font: JetBrains Mono Regular / Size: 12px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spacing & Layout Constraints */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Spacing & Alignment (8-Point Grid)</h3>
              <p className="text-xs text-brand-text-secondary">Ensures perfect layout density for enterprise workflows.</p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-brand-text-secondary mb-1">
                  <span>8px (0.5rem - space-2) — Tight elements, tag gap</span>
                  <span>100% layout density</span>
                </div>
                <div className="h-4 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-brand-primary">8px</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-brand-text-secondary mb-1">
                  <span>16px (1rem - space-4) — Standard cell, inner padding</span>
                  <span>Grid & Card inner margins</span>
                </div>
                <div className="h-8 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-brand-primary">16px</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-brand-text-secondary mb-1">
                  <span>24px (1.5rem - space-6) — Workspace gutters, header margin</span>
                  <span>Section dividers</span>
                </div>
                <div className="h-12 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-brand-primary">24px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elevation & Borders */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Elevation, Radii & Icons</h3>
              <p className="text-xs text-brand-text-secondary">Professional flat styling to prevent screen clutter.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-brand-border rounded-lg bg-white shadow-sm-flat">
                <span className="block text-xs font-bold text-brand-text-primary">Shadow Flat SM</span>
                <span className="text-[11px] text-brand-text-secondary block mt-1">Used on primary standard grid cards</span>
                <code className="text-[10px] bg-brand-bg-secondary p-1 rounded font-mono mt-2 block">shadow-sm-flat</code>
              </div>

              <div className="p-4 border border-brand-border rounded-lg bg-white shadow-md-flat">
                <span className="block text-xs font-bold text-brand-text-primary">Shadow Flat MD</span>
                <span className="text-[11px] text-brand-text-secondary block mt-1">Used on global dropdowns & flyouts</span>
                <code className="text-[10px] bg-brand-bg-secondary p-1 rounded font-mono mt-2 block">shadow-md-flat</code>
              </div>

              <div className="p-4 border border-brand-border rounded-lg bg-white">
                <span className="block text-xs font-bold text-brand-text-primary">Border Radius: 6px</span>
                <span className="text-[11px] text-brand-text-secondary block mt-1">Slightly sharp, premium modern corners</span>
                <div className="mt-2 h-4 w-12 bg-brand-text-primary rounded" />
              </div>

              <div className="p-4 border border-brand-border rounded-lg bg-white">
                <span className="block text-xs font-bold text-brand-text-primary">Iconography: Lucide-React</span>
                <span className="text-[11px] text-brand-text-secondary block mt-1">Consistent 16px/20px sizes, stroke width 2px</span>
                <div className="mt-2 flex gap-2">
                  <CheckCircle2 size={16} className="text-brand-success" />
                  <AlertCircle size={16} className="text-brand-danger" />
                  <Info size={16} className="text-brand-info" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Form Controls & Overlays */}
      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Buttons Library */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Standard Buttons</h3>
              <p className="text-xs text-brand-text-secondary">Fully accessible, support active, hovered, and keyboard focused states.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-brand-primary text-white hover:bg-blue-700 text-xs font-medium rounded-md transition shadow-sm cursor-pointer">
                Primary Button
              </button>
              
              <button className="px-4 py-2 border border-brand-border text-brand-text-primary hover:bg-brand-bg-secondary text-xs font-medium rounded-md transition cursor-pointer">
                Secondary Button
              </button>

              <button className="px-4 py-2 bg-brand-success text-white hover:bg-green-700 text-xs font-medium rounded-md transition shadow-sm cursor-pointer">
                Success Action
              </button>

              <button className="px-4 py-2 bg-brand-danger text-white hover:bg-red-700 text-xs font-medium rounded-md transition shadow-sm cursor-pointer">
                Destructive Action
              </button>

              <button className="px-3 py-2 border border-brand-border hover:bg-brand-bg-secondary text-brand-text-primary rounded-md transition flex items-center gap-1.5 text-xs cursor-pointer">
                <Plus size={14} /> With Icon
              </button>

              <button className="px-4 py-2 bg-brand-bg-secondary text-brand-text-secondary text-xs font-medium rounded-md cursor-not-allowed" disabled>
                Disabled Button
              </button>
            </div>
          </div>

          {/* Form Inputs & Autocomplete */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Form Controls & Autocomplete</h3>
              <p className="text-xs text-brand-text-secondary">Strict input designs with helper descriptions and validating triggers.</p>
            </div>

            <div className="space-y-4">
              {/* Standard Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-brand-text-primary">Branch Sales Target (₹)</label>
                <input 
                  type="text" 
                  placeholder="Enter invoice limits or goals"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-md bg-white focus:outline-none focus:border-brand-primary transition"
                />
                <span className="block text-[10px] text-brand-text-secondary">Type any content above to test key actions.</span>
              </div>

              {/* Error Input Toggle */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-brand-text-primary">Super Admin Access Token</label>
                  <button 
                    onClick={() => setInputError(!inputError)}
                    className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    Toggle Error State
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    value="123456"
                    disabled
                    className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none bg-white transition ${
                      inputError ? 'border-brand-danger bg-red-50/20' : 'border-brand-border'
                    }`}
                  />
                  {inputError && (
                    <AlertCircle size={14} className="text-brand-danger absolute right-3 top-2.5" />
                  )}
                </div>
                {inputError && (
                  <p className="text-[10px] text-brand-danger font-medium">Invalid administrator token sequence. Verification failed.</p>
                )}
              </div>

              {/* Select Trigger */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-brand-text-primary">FMCG Reporting Cadence</label>
                <div className="relative">
                  <select 
                    value={selectVal} 
                    onChange={(e) => setSelectVal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-md bg-white appearance-none focus:outline-none focus:border-brand-primary transition cursor-pointer"
                  >
                    <option value="daily">Daily SKU Real-time Sync</option>
                    <option value="weekly">Weekly Branch Stock Audits</option>
                    <option value="monthly">Monthly Sales Distribution Summary</option>
                  </select>
                  <ChevronDown size={14} className="text-brand-text-secondary absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Autocomplete Input */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-brand-text-primary">FMCG Branch (Autocomplete Search)</label>
                <div className="relative">
                  <Search size={14} className="text-brand-text-secondary absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search master warehouses..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsAutocompleteOpen(true);
                    }}
                    onFocus={() => setIsAutocompleteOpen(true)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded-md bg-white focus:outline-none focus:border-brand-primary transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isAutocompleteOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg-flat max-h-48 overflow-y-auto">
                    <div className="p-1 border-b border-brand-border bg-brand-bg-secondary flex justify-between items-center px-2">
                      <span className="text-[10px] text-brand-text-secondary font-semibold uppercase">Branches & Depots</span>
                      <button 
                        onClick={() => setIsAutocompleteOpen(false)}
                        className="text-[10px] text-brand-text-secondary hover:text-brand-text-primary font-bold"
                      >
                        Close
                      </button>
                    </div>
                    {filteredBranches.length > 0 ? (
                      filteredBranches.map((branch, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchQuery(branch);
                            setIsAutocompleteOpen(false);
                            onTriggerToast('success', 'Branch selected', branch);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-brand-bg-secondary text-brand-text-primary block transition"
                        >
                          {branch}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-center text-brand-text-secondary">No match found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Date Picker Component Trigger */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-brand-text-primary">Posting Date Ledger Calendar</label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-full text-left px-3 py-2 text-xs border border-brand-border rounded-md bg-white flex items-center justify-between hover:border-brand-primary transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-brand-text-primary">
                    <Calendar size={14} className="text-brand-text-secondary" />
                    {selectedDate}
                  </span>
                  <ChevronDown size={14} className="text-brand-text-secondary" />
                </button>

                {isDatePickerOpen && (
                  <div className="absolute z-50 mt-1 bg-white p-3 border border-brand-border rounded-md shadow-lg-flat space-y-2">
                    <div className="flex justify-between items-center text-xs border-b border-brand-border pb-1">
                      <span className="font-bold">July 2026</span>
                      <button 
                        onClick={() => setIsDatePickerOpen(false)}
                        className="text-brand-text-secondary hover:text-brand-text-primary"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    {/* Compact layout representing mock calendar dates */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] w-48">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => (
                        <span key={dIdx} className="font-bold text-brand-text-secondary">{day}</span>
                      ))}
                      {Array.from({ length: 31 }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setIsDatePickerOpen(false);
                              onTriggerToast('success', 'Date selected', `Ledger date locked to ${dateStr}`);
                            }}
                            className={`p-1 rounded cursor-pointer transition ${
                              isSelected 
                                ? 'bg-brand-primary text-white font-bold' 
                                : 'hover:bg-brand-bg-secondary text-brand-text-primary'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dialog & Drawer Showcase */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6 xl:col-span-2">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Enterprise Dialogs & Drawer sheets</h3>
              <p className="text-xs text-brand-text-secondary">Fully accessible, overlay components with background dimming and keyboard escapes.</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsDialogOpen(true)}
                className="px-4 py-2 bg-brand-primary text-white hover:bg-blue-700 text-xs font-semibold rounded-md shadow-sm transition cursor-pointer"
              >
                Launch Dialog Box (Modal)
              </button>

              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="px-4 py-2 border border-brand-border text-brand-text-primary hover:bg-brand-bg-secondary text-xs font-semibold rounded-md transition cursor-pointer"
              >
                Open Details Panel (Drawer)
              </button>
            </div>

            {/* Dialog Overlay */}
            {isDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
                <div className="bg-white rounded-lg border border-brand-border shadow-lg-flat max-w-md w-full overflow-hidden">
                  <div className="p-5 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <SlidersHorizontal size={18} />
                      <h4 className="font-bold text-sm text-brand-text-primary">Configure Master Rules</h4>
                    </div>
                    <button 
                      onClick={() => setIsDialogOpen(false)}
                      className="text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-brand-text-secondary">
                      You are defining global SKU access policies. Admin changes propagate across all 12 regional distribution depots immediately.
                    </p>
                    <div className="p-3 bg-blue-50/50 rounded border border-blue-100 flex items-start gap-2.5">
                      <Info size={16} className="text-brand-info shrink-0 mt-0.5" />
                      <div className="text-[11px] text-brand-text-primary leading-normal">
                        <strong>Security Rule:</strong> Super Administrator approval is required for orders exceeding ₹5,00,000.
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-brand-bg-secondary border-t border-brand-border flex justify-end gap-2">
                    <button 
                      onClick={() => setIsDialogOpen(false)}
                      className="px-3 py-1.5 border border-brand-border rounded text-xs font-medium text-brand-text-primary bg-white hover:bg-brand-bg-secondary transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setIsDialogOpen(false);
                        onTriggerToast('success', 'Configuration updated', 'Global master rules synchronized.');
                      }}
                      className="px-3 py-1.5 bg-brand-primary hover:bg-blue-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-sm"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Drawer Sheet */}
            {isDrawerOpen && (
              <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
                <div className="bg-white w-full max-w-md h-full flex flex-col shadow-lg-flat border-l border-brand-border">
                  <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg-secondary">
                    <div>
                      <span className="text-[10px] font-bold text-brand-text-secondary font-mono">DETAIL VIEW</span>
                      <h4 className="font-bold text-sm text-brand-text-primary">Hindustan Unilever Retail [HQ]</h4>
                    </div>
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-brand-text-primary block">Active Credit Policy</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-brand-bg-secondary rounded border border-brand-border">
                          <span className="block text-[10px] text-brand-text-secondary">LIMIT</span>
                          <span className="text-sm font-bold">₹15,00,000</span>
                        </div>
                        <div className="p-3 bg-brand-bg-secondary rounded border border-brand-border">
                          <span className="block text-[10px] text-brand-text-secondary">DUE PERIOD</span>
                          <span className="text-sm font-bold">45 Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold text-brand-text-primary block">Regional Contacts</span>
                      <div className="p-3 border border-brand-border rounded space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-brand-text-primary">Ananya Sen (Zonal Sales Coordinator)</p>
                          <p className="text-[11px] text-brand-text-secondary">ananya.sen@hul-india.com</p>
                        </div>
                        <div className="border-t border-brand-border pt-2">
                          <p className="text-xs font-semibold text-brand-text-primary">Vikram Malhotra (Logistics Lead)</p>
                          <p className="text-[11px] text-brand-text-secondary">+91 98765 43210</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded flex gap-3">
                      <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-brand-warning">Outstanding Invoice Warning</h5>
                        <p className="text-[11px] text-brand-text-secondary mt-1">
                          This distributor has 2 pending invoices overdue by 12 days. Standard shipping restrictions might trigger if unpaid.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-brand-border bg-brand-bg-secondary flex justify-end gap-2">
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-4 py-2 border border-brand-border bg-white hover:bg-brand-bg-secondary text-xs font-medium text-brand-text-primary rounded-md transition cursor-pointer"
                    >
                      Close Panel
                    </button>
                    <button 
                      onClick={() => {
                        setIsDrawerOpen(false);
                        onTriggerToast('info', 'Credit Hold Initiated', 'Manual dispatch freeze initiated.');
                      }}
                      className="px-4 py-2 bg-brand-danger text-white hover:bg-red-700 text-xs font-semibold rounded-md transition cursor-pointer shadow-sm"
                    >
                      Enforce Hold
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Data Tables & Indicators */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          {/* Beautiful Reusable Table Component */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-brand-text-primary">TanStack Table (Simulated Layout)</h3>
                <p className="text-xs text-brand-text-secondary">With row selection, column headers, actions, and client-side filtering.</p>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="text-brand-text-secondary absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search invoices, clients..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-brand-border rounded bg-white focus:outline-none focus:border-brand-primary w-48 sm:w-64 transition"
                  />
                </div>
                <button className="px-3 py-1.5 border border-brand-border rounded text-xs font-medium hover:bg-brand-bg-secondary flex items-center gap-1 cursor-pointer">
                  <Filter size={12} /> Filter
                </button>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="border border-brand-border rounded-md overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg-secondary border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input 
                        type="checkbox"
                        checked={selectedRows.length === filteredTableData.length && filteredTableData.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-brand-border text-brand-primary focus:ring-brand-primary h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">TRANSACTION ID</th>
                    <th className="py-3 px-4">DISTRIBUTOR / CLIENT</th>
                    <th className="py-3 px-4">SKU CATEGORY</th>
                    <th className="py-3 px-4 text-right">TOTAL AMOUNT</th>
                    <th className="py-3 px-4 text-center">APPROVAL STATUS</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs text-brand-text-primary">
                  {filteredTableData.length > 0 ? (
                    filteredTableData.map((row) => {
                      const isSelected = selectedRows.includes(row.id);
                      return (
                        <tr 
                          key={row.id} 
                          className={`hover:bg-brand-bg-secondary/50 transition ${
                            isSelected ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(row.id)}
                              className="rounded border-brand-border text-brand-primary focus:ring-brand-primary h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-brand-text-primary">{row.id}</td>
                          <td className="py-3 px-4 font-semibold">{row.customer}</td>
                          <td className="py-3 px-4 text-brand-text-secondary">{row.category}</td>
                          <td className="py-3 px-4 text-right font-semibold text-brand-text-primary">{row.amount}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'Approved' ? 'bg-green-50 text-brand-success border border-green-200' :
                              row.status === 'Pending' ? 'bg-amber-50 text-brand-warning border border-amber-200' :
                              row.status === 'Rejected' ? 'bg-red-50 text-brand-danger border border-red-200' :
                              'bg-gray-50 text-brand-text-secondary border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                row.status === 'Approved' ? 'bg-brand-success' :
                                row.status === 'Pending' ? 'bg-brand-warning' :
                                row.status === 'Rejected' ? 'bg-brand-danger' :
                                'bg-brand-text-secondary'
                              }`} />
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-brand-text-secondary">{row.date}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => onTriggerToast('info', 'Edit Action', `Updating metadata for ${row.id}`)}
                                className="p-1 hover:bg-brand-bg-secondary rounded text-brand-text-secondary hover:text-brand-text-primary transition"
                                title="Edit Row"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => onTriggerToast('error', 'Row Deleted', `Successfully removed transaction record ${row.id}`)}
                                className="p-1 hover:bg-red-50 rounded text-brand-text-secondary hover:text-brand-danger transition"
                                title="Delete Row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-brand-text-secondary">
                        No transactions match your search query. Try another term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Component */}
              <div className="bg-brand-bg-secondary border-t border-brand-border px-4 py-3 flex items-center justify-between text-xs text-brand-text-secondary">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select className="border border-brand-border bg-white rounded px-1.5 py-0.5 focus:outline-none">
                    <option>5 rows</option>
                    <option>20 rows</option>
                    <option>50 rows</option>
                  </select>
                  <span>of 124 records</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="px-2 py-1 border border-brand-border bg-white hover:bg-brand-bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-brand-primary text-white font-bold rounded">1</button>
                  <button className="px-3 py-1 border border-brand-border bg-white hover:bg-brand-bg-secondary rounded cursor-pointer">2</button>
                  <button className="px-3 py-1 border border-brand-border bg-white hover:bg-brand-bg-secondary rounded cursor-pointer">3</button>
                  <button className="px-2 py-1 border border-brand-border bg-white hover:bg-brand-bg-secondary rounded cursor-pointer">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Badges, Status Chips, Accordion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
              <h4 className="text-sm font-bold text-brand-text-primary">System Indicators & Badges</h4>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-brand-text-secondary mb-2">Pill Badges (With Icons)</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-brand-primary text-xs font-semibold rounded border border-blue-100">
                      <Info size={12} /> Standard Info
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-brand-success text-xs font-semibold rounded border border-green-100">
                      <CheckCircle2 size={12} /> Audit OK
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-brand-danger text-xs font-semibold rounded border border-red-100">
                      <AlertCircle size={12} /> Blocked SKU
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-brand-text-secondary mb-2">Count Indicator Badges</span>
                  <div className="flex gap-4">
                    <div className="relative">
                      <button className="p-2 border border-brand-border rounded hover:bg-brand-bg-secondary">Bell</button>
                      <span className="absolute -top-1.5 -right-1.5 bg-brand-danger text-white font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                        8
                      </span>
                    </div>

                    <div className="relative">
                      <button className="p-2 border border-brand-border rounded hover:bg-brand-bg-secondary">Tasks</button>
                      <span className="absolute -top-1.5 -right-1.5 bg-brand-warning text-white font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                        14
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Component */}
            <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
              <h4 className="text-sm font-bold text-brand-text-primary">Accordion Folders (FMCG FAQs)</h4>

              <div className="space-y-2">
                {[
                  { q: "How are regional distribution taxes calculated?", a: "Taxes are evaluated using ASP.NET Core API routines pointing to live PostgreSQL schemas, matching SGST/CGST rules automatically based on the shipping warehouse code location." },
                  { q: "Can we configure different credit limits for retailers?", a: "Yes. Use the Customer Details panel under Masters to override standard terms, enforcing custom billing periods up to 90 days with auto-lock alerts." }
                ].map((item, idx) => {
                  const isOpen = accordionOpen === idx;
                  return (
                    <div key={idx} className="border border-brand-border rounded-md overflow-hidden">
                      <button
                        onClick={() => setAccordionOpen(isOpen ? null : idx)}
                        className="w-full text-left p-3 text-xs font-bold text-brand-text-primary hover:bg-brand-bg-secondary flex justify-between items-center cursor-pointer"
                      >
                        {item.q}
                        <ChevronDown size={14} className={`text-brand-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="p-3 bg-brand-bg-secondary/50 border-t border-brand-border text-xs text-brand-text-secondary leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System States & Shell Rules */}
      {activeTab === 'states' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Loading Skeleton */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
            <h4 className="text-sm font-bold text-brand-text-primary">Loading Skeleton Shimmer</h4>
            <p className="text-xs text-brand-text-secondary">Replaces business widgets while fetching server payloads.</p>
            
            <div className="space-y-3 p-4 border border-brand-border rounded-md bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded-sm w-1/3 animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded-sm w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-sm w-full animate-pulse" />
              <div className="h-2 bg-gray-200 rounded-sm w-4/5 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded-md w-full animate-pulse mt-2" />
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
            <h4 className="text-sm font-bold text-brand-text-primary">Empty State Layout</h4>
            <p className="text-xs text-brand-text-secondary">Clean call-to-actions when records don't exist.</p>

            <div className="p-4 border border-brand-border rounded-md bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-bg-secondary flex items-center justify-center mx-auto text-brand-text-secondary">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-brand-text-primary">No Active Credit holds</h5>
                <p className="text-[10px] text-brand-text-secondary mt-1">
                  Outstanding invoices are fully cleared. No distribution restrictions apply to any zone.
                </p>
              </div>
              <button className="px-3 py-1.5 bg-brand-primary text-white hover:bg-blue-700 text-[10px] font-semibold rounded-md transition cursor-pointer">
                Configure Policy limits
              </button>
            </div>
          </div>

          {/* Error State */}
          <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
            <h4 className="text-sm font-bold text-brand-text-primary">Error / Incident Log State</h4>
            <p className="text-xs text-brand-text-secondary">Provides clean, diagnostic logs for super admins.</p>

            <div className="p-4 border border-brand-danger/30 rounded-md bg-red-50/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-brand-danger">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-brand-text-primary">SignalR Service Offline</h5>
                <p className="text-[10px] text-brand-text-secondary mt-1">
                  Unable to establish push notification tunnels. Real-time fleet sync is currently halted.
                </p>
              </div>
              <div className="bg-brand-text-primary text-left text-white p-2 rounded text-[9px] font-mono leading-relaxed overflow-x-auto select-all">
                ERR_CONN_TIMEOUT: Host 10.120.4.99:3000 refused handshakes.
              </div>
              <button className="px-3 py-1.5 bg-brand-danger text-white hover:bg-red-700 text-[10px] font-semibold rounded-md transition cursor-pointer">
                Reconnect SignalR Gateway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
