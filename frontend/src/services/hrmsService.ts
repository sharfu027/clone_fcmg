import { apiClient } from '../api/apiClient';
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
} from '../types/hrms';

export const hrmsService = {
  // Employees CRUD
  async getEmployees(): Promise<HrmsEmployee[]> {
    return apiClient.get<HrmsEmployee[]>('/api/v1/hrms/employees');
  },

  async createEmployee(payload: Partial<HrmsEmployee>): Promise<HrmsEmployee> {
    return apiClient.post<HrmsEmployee>('/api/v1/hrms/employees', payload);
  },

  async updateEmployee(id: string, payload: Partial<HrmsEmployee>): Promise<HrmsEmployee> {
    return apiClient.put<HrmsEmployee>(`/api/v1/hrms/employees/${id}`, payload);
  },

  async archiveEmployee(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/hrms/employees/${id}`);
  },

  // Organization Structure
  async getDepartments(): Promise<HrmsDepartment[]> {
    return apiClient.get<HrmsDepartment[]>('/api/v1/hrms/departments');
  },

  async getDesignations(): Promise<HrmsDesignation[]> {
    return apiClient.get<HrmsDesignation[]>('/api/v1/hrms/designations');
  },

  // Attendance
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return apiClient.get<AttendanceRecord[]>('/api/v1/hrms/attendance');
  },

  async recordFaceAttendance(payload: { employeeId: string; faceData: string }): Promise<AttendanceRecord> {
    return apiClient.post<AttendanceRecord>('/api/v1/hrms/attendance/face-checkin', payload);
  },

  // Shifts
  async getShifts(): Promise<ShiftMaster[]> {
    return apiClient.get<ShiftMaster[]>('/api/v1/hrms/shifts');
  },

  // Leaves
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return apiClient.get<LeaveRequest[]>('/api/v1/hrms/leaves');
  },

  async applyLeave(payload: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>('/api/v1/hrms/leaves', payload);
  },

  // Holidays
  async getHolidays(): Promise<HolidayItem[]> {
    return apiClient.get<HolidayItem[]>('/api/v1/hrms/holidays');
  },

  // Documents
  async uploadDocumentContract(payload: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
    return apiClient.post<EmployeeDocument>('/api/v1/hrms/documents/upload', payload);
  },

  // Transfers & Separation
  async getTransfers(): Promise<EmployeeTransferRequest[]> {
    return apiClient.get<EmployeeTransferRequest[]>('/api/v1/hrms/transfers');
  },

  async getSeparations(): Promise<EmployeeSeparationRecord[]> {
    return apiClient.get<EmployeeSeparationRecord[]>('/api/v1/hrms/separations');
  },

  // HR Metrics
  async getHrmsMetrics(): Promise<HrmsMetrics> {
    return apiClient.get<HrmsMetrics>('/api/v1/hrms/metrics');
  }
};
