import { UserRole } from './auth';

export type SortDirection = 'asc' | 'desc';

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  search?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  module: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
