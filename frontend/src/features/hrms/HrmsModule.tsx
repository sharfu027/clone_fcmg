import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowRightLeft,
  UserMinus,
  Sparkles,
  TrendingUp,
  Award,
  Cake,
  ShieldCheck,
  Camera,
  MapPin
} from 'lucide-react';
import {
  HrmsEmployee,
  HrmsDepartment,
  HrmsDesignation,
  AttendanceRecord,
  ShiftMaster,
  LeaveRequest,
  HolidayItem,
  EmployeeDocument,
  EmployeeTransferRequest,
  EmployeeSeparationRecord,
  HrmsMetrics
} from '../../types/hrms';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';

interface HrmsModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function HrmsModule({ onTriggerToast }: HrmsModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'employees' | 'org' | 'attendance' | 'shifts' | 'leaves' | 'holidays' | 'documents' | 'transfers' | 'separation'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Mock Employees
  const [employees, setEmployees] = useState<HrmsEmployee[]>([
    {
      id: 'EMP-001',
      employeeCode: 'INK-EMP-1001',
      name: 'Rajiv Kapoor',
      email: 'rajiv.kapoor@ink-fmcg.com',
      mobile: '+91 98765 43210',
      gender: 'Male',
      dateOfBirth: '1988-05-14',
      dateOfJoining: '2020-06-01',
      department: 'Sales & Distribution',
      designation: 'Area Sales Manager',
      branch: 'Delhi Central Depot',
      reportingManager: 'Siddharth Mehra (Director)',
      employmentType: 'FullTime',
      employmentStatus: 'Active',
      aadhaar: 'XXXX-XXXX-8901',
      pan: 'ABCDE1234F',
      address: 'B-42, South Extension Part II, New Delhi',
      emergencyContact: '+91 98111 22334 (Spouse)',
      bankDetails: {
        accountNumber: '91802001928374',
        ifscCode: 'HDFC0000128',
        bankName: 'HDFC Bank Ltd'
      },
      notes: 'Top performing Area Sales Manager for North Zone.'
    },
    {
      id: 'EMP-002',
      employeeCode: 'INK-EMP-1002',
      name: 'Priya Patel',
      email: 'priya.patel@ink-fmcg.com',
      mobile: '+91 98123 65432',
      gender: 'Female',
      dateOfBirth: '1992-09-21',
      dateOfJoining: '2021-08-15',
      department: 'Procurement',
      designation: 'Senior Buyer',
      branch: 'Delhi Central Depot',
      reportingManager: 'Karan Anand (Procurement Mgr)',
      employmentType: 'FullTime',
      employmentStatus: 'Active',
      aadhaar: 'XXXX-XXXX-4567',
      pan: 'FGHIJ5678K',
      address: 'H-14, Green Park, New Delhi',
      emergencyContact: '+91 98222 33445 (Father)',
      bankDetails: {
        accountNumber: '91802005544332',
        ifscCode: 'ICIC0000456',
        bankName: 'ICICI Bank Ltd'
      }
    }
  ]);

  // Mock Departments
  const [departments] = useState<HrmsDepartment[]>([
    { id: 'DEP-01', code: 'DEP-SALES', name: 'Sales & Distribution', headOfDepartment: 'Rajiv Kapoor', totalEmployees: 42 },
    { id: 'DEP-02', code: 'DEP-PROC', name: 'Procurement & Sourcing', headOfDepartment: 'Karan Anand', totalEmployees: 18 },
    { id: 'DEP-03', code: 'DEP-WMS', name: 'Warehouse & Logistics', headOfDepartment: 'Deepak Sharma', totalEmployees: 35 },
    { id: 'DEP-04', code: 'DEP-FIN', name: 'Finance & Accounts', headOfDepartment: 'Siddharth Mehra', totalEmployees: 12 }
  ]);

  // Mock Attendance
  const [attendanceLogs] = useState<AttendanceRecord[]>([
    { id: 'ATT-101', employeeId: 'EMP-001', employeeName: 'Rajiv Kapoor', date: '2026-07-23', checkInTime: '09:02 AM', checkOutTime: '06:15 PM', mode: 'FaceBiometrics', status: 'Present', lateArrivalMinutes: 2 }
  ]);

  // Mock Leaves
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 'LR-201', leaveCode: 'LV-2026-042', employeeName: 'Priya Patel', leaveType: 'Casual', startDate: '2026-07-28', endDate: '2026-07-29', totalDays: 2, reason: 'Family function in hometown', status: 'Pending', appliedDate: '2026-07-23' }
  ]);

  // Mock Holidays
  const [holidays] = useState<HolidayItem[]>([
    { id: 'HOL-01', name: 'Independence Day', date: '2026-08-15', dayOfWeek: 'Saturday', type: 'National' },
    { id: 'HOL-02', name: 'Diwali Festive Holiday', date: '2026-11-01', dayOfWeek: 'Sunday', type: 'Company' }
  ]);

  // Mock Transfers
  const [transfers] = useState<EmployeeTransferRequest[]>([
    { id: 'TRF-01', transferCode: 'TRF-2026-09', employeeName: 'Vikram Sethi', fromBranch: 'Delhi Central', toBranch: 'Mumbai Hub Depot', fromDepartment: 'Sales & Distribution', toDepartment: 'Sales & Distribution', effectiveDate: '2026-08-01', status: 'Approved' }
  ]);

  // Mock Separation
  const [separations] = useState<EmployeeSeparationRecord[]>([
    { id: 'SEP-01', employeeName: 'Amit Verma', resignationDate: '2026-07-01', relievingDate: '2026-07-31', noticePeriodDays: 30, reason: 'Career Advancement Opportunity', checklistCleared: true, fnfStatus: 'Calculated' }
  ]);

  const handleCreateEmployee = () => {
    const newEmp: HrmsEmployee = {
      id: `EMP-00${employees.length + 1}`,
      employeeCode: `INK-EMP-100${employees.length + 1}`,
      name: 'Amanpreet Kaur',
      email: 'amanpreet@ink-fmcg.com',
      mobile: '+91 98999 11223',
      gender: 'Female',
      dateOfBirth: '1995-03-12',
      dateOfJoining: new Date().toISOString().split('T')[0],
      department: 'Warehouse & Logistics',
      designation: 'Inventory Inspector',
      branch: 'Delhi Central Depot',
      reportingManager: 'Deepak Sharma',
      employmentType: 'FullTime',
      employmentStatus: 'Active',
      aadhaar: 'XXXX-XXXX-9988',
      pan: 'KLMNO9988P',
      address: 'Plot 4, Rohini Sector 9, New Delhi',
      emergencyContact: '+91 98777 66554 (Mother)',
      bankDetails: { accountNumber: '91802008877665', ifscCode: 'SBIN0000890', bankName: 'State Bank of India' }
    };
    setEmployees([...employees, newEmp]);
    setIsEmpModalOpen(false);
    onTriggerToast('success', 'Employee Onboarded', `Employee ${newEmp.employeeCode} (${newEmp.name}) added to HR Master.`);
  };

  const handleApplyLeave = () => {
    const newLeave: LeaveRequest = {
      id: `LR-${Math.floor(100 + Math.random() * 900)}`,
      leaveCode: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: 'Rajiv Kapoor',
      leaveType: 'Casual',
      startDate: '2026-08-05',
      endDate: '2026-08-06',
      totalDays: 2,
      reason: 'Personal affairs',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setIsLeaveModalOpen(false);
    onTriggerToast('success', 'Leave Application Submitted', `Leave request ${newLeave.leaveCode} forwarded to manager approval.`);
  };

  return (
    <div className="space-y-6">

      {/* SECTION 1: HRMS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={employees.length + 105} badgeText="Active Headcount" badgeVariant="success" subLabel="Active / Probation" subValue="105 Active | 2 Prob" />
        <StatCard title="Attendance Today" value="95.8%" badgeText="On Time: 94%" badgeVariant="primary" subLabel="Present Headcount" subValue="101 / 107 Staff" progressPercent={95.8} progressColor="success" />
        <StatCard title="Employees on Leave" value={leaveRequests.filter(l => l.status === 'Approved').length + 4} badgeText="Approved Leaves" badgeVariant="info" subLabel="Pending Requests" subValue={`${leaveRequests.filter(l => l.status === 'Pending').length} Pending`} />
        <StatCard title="Upcoming Celebrations" value="3 Events" badgeText="This Week" badgeVariant="warning" subLabel="Birthdays / Work Anniv" subValue="2 Birthdays | 1 Anniv" />
      </div>

      {/* SECTION 2: SUB-NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-lg border border-brand-border shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'HR Overview', icon: TrendingUp },
          { id: 'employees', label: 'Employee Directory', icon: Users },
          { id: 'org', label: 'Org Hierarchy', icon: Building2 },
          { id: 'attendance', label: 'Daily Attendance', icon: UserCheck },
          { id: 'shifts', label: 'Shift Roster', icon: Clock },
          { id: 'leaves', label: 'Leave Requests', icon: Calendar },
          { id: 'holidays', label: 'Holiday Calendar', icon: Award },
          { id: 'documents', label: 'Employee Documents', icon: FileText },
          { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
          { id: 'separation', label: 'Offboarding', icon: UserMinus }
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Departmental Headcount Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {departments.map(d => (
                <div key={d.id} className="p-3 border rounded bg-brand-bg-secondary/30 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-brand-primary">{d.name}</span>
                    <p className="text-brand-text-secondary text-[11px]">HOD: {d.headOfDepartment}</p>
                  </div>
                  <Badge variant="primary">{d.totalEmployees} Employees</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Cake size={16} className="text-brand-primary" /> Upcoming Celebrations
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 border rounded bg-brand-bg-secondary/40 space-y-1">
                <span className="font-bold text-brand-text-primary">Rajiv Kapoor</span>
                <p className="text-[11px] text-brand-text-secondary">Birthday • May 14 (Area Sales Mgr)</p>
              </div>
              <div className="p-2.5 border rounded bg-brand-bg-secondary/40 space-y-1">
                <span className="font-bold text-brand-text-primary">Priya Patel</span>
                <p className="text-[11px] text-brand-text-secondary">5-Year Work Anniversary • Aug 15</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-lg border border-brand-border shadow-sm-flat overflow-hidden">
          <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search employee code, name, department..." />
            <button onClick={() => setIsEmpModalOpen(true)} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Add New Employee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
                <tr>
                  <th className="p-3">Employee Code</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Branch Depot</th>
                  <th className="p-3">Mobile / Email</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-brand-bg-secondary/30">
                    <td className="p-3 font-mono font-bold text-brand-primary">{emp.employeeCode}</td>
                    <td className="p-3 font-semibold">{emp.name}</td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3 text-brand-text-secondary">{emp.designation}</td>
                    <td className="p-3">{emp.branch}</td>
                    <td className="p-3 font-mono text-[11px]">{emp.mobile}</td>
                    <td className="p-3 text-center"><Badge variant="success">{emp.employmentStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ONBOARD EMPLOYEE */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-brand-border max-w-md w-full p-6 space-y-4 shadow-xl-flat">
            <h3 className="text-base font-bold text-brand-text-primary">Onboard New Employee</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Full Name</label>
                <input type="text" defaultValue="Amanpreet Kaur" className="w-full p-2 border rounded border-brand-border" />
              </div>
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Department</label>
                <select className="w-full p-2 border rounded border-brand-border bg-white">
                  <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                  <option value="Sales & Distribution">Sales & Distribution</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 border text-xs font-semibold rounded hover:bg-brand-bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleCreateEmployee} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 cursor-pointer shadow-sm">Save & Onboard</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
