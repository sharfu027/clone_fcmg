export type EmploymentStatus = 'Active' | 'Probation' | 'NoticePeriod' | 'Separated' | 'Archived';
export type EmploymentType = 'FullTime' | 'PartTime' | 'Contractor' | 'Intern';
export type AttendanceMode = 'FaceBiometrics' | 'GpsGeofence' | 'ManualCorrection' | 'WebPortal';
export type AttendanceStatus = 'Present' | 'Late' | 'HalfDay' | 'Absent' | 'OnLeave';
export type LeaveApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface HrmsEmployee {
  id: string;
  employeeCode: string;
  name: string;
  profilePhoto?: string;
  email: string;
  mobile: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  branch: string;
  reportingManager: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  aadhaar: string;
  pan: string;
  address: string;
  emergencyContact: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  notes?: string;
}

export interface HrmsDepartment {
  id: string;
  code: string;
  name: string;
  headOfDepartment: string;
  totalEmployees: number;
}

export interface HrmsDesignation {
  id: string;
  title: string;
  department: string;
  gradeLevel: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  mode: AttendanceMode;
  status: AttendanceStatus;
  locationCoordinates?: string;
  lateArrivalMinutes?: number;
  earlyExitMinutes?: number;
}

export interface ShiftMaster {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  weeklyOffDays: string[];
}

export interface LeaveBalance {
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  maternityLeave?: number;
}

export interface LeaveRequest {
  id: string;
  leaveCode: string;
  employeeName: string;
  leaveType: 'Casual' | 'Sick' | 'Earned' | 'Unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveApprovalStatus;
  appliedDate: string;
  approverComments?: string;
}

export interface HolidayItem {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  type: 'National' | 'State' | 'Company' | 'Branch';
  applicableBranch?: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'DrivingLicense' | 'Resume' | 'Certificate';
  documentNumber: string;
  fileUrl?: string;
  uploadedDate: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
}

export interface EmployeeTransferRequest {
  id: string;
  transferCode: string;
  employeeName: string;
  fromBranch: string;
  toBranch: string;
  fromDepartment: string;
  toDepartment: string;
  effectiveDate: string;
  status: 'Pending' | 'Approved' | 'Completed';
}

export interface EmployeeSeparationRecord {
  id: string;
  employeeName: string;
  resignationDate: string;
  relievingDate: string;
  noticePeriodDays: number;
  reason: string;
  checklistCleared: boolean;
  fnfStatus: 'Pending' | 'Calculated' | 'Settled';
}

export interface HrmsMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  attendanceTodayPercent: number;
  employeesOnLeaveToday: number;
  upcomingBirthdaysCount: number;
  upcomingAnniversariesCount: number;
  recentJoiningsCount: number;
}
