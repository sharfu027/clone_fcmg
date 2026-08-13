import { apiClient } from '../api/apiClient';
import {
  SalesRepMaster,
  Territory,
  BeatPlan,
  CustomerVisit,
  GpsCheckin,
  FaceAttendanceRecord,
  SfaOrderBooking,
  CollectionRecord,
  DailyCallReport,
  SfaExpense,
  CustomerFeedbackRecord,
  SalesTarget,
  SfaMetrics
} from '../types/sfa';

export const sfaService = {
  // Sales Reps
  async getSalesReps(): Promise<SalesRepMaster[]> {
    return apiClient.get<SalesRepMaster[]>('/api/v1/sfa/reps');
  },

  // Territories & Beats
  async getTerritories(): Promise<Territory[]> {
    return apiClient.get<Territory[]>('/api/v1/sfa/territories');
  },

  async getBeatPlans(): Promise<BeatPlan[]> {
    return apiClient.get<BeatPlan[]>('/api/v1/sfa/beat-plans');
  },

  // Visits & GPS
  async getVisits(): Promise<CustomerVisit[]> {
    return apiClient.get<CustomerVisit[]>('/api/v1/sfa/visits');
  },

  async recordVisit(payload: Partial<CustomerVisit>): Promise<CustomerVisit> {
    return apiClient.post<CustomerVisit>('/api/v1/sfa/visits', payload);
  },

  async checkinGps(payload: Partial<GpsCheckin>): Promise<GpsCheckin> {
    return apiClient.post<GpsCheckin>('/api/v1/sfa/gps-checkin', payload);
  },

  // Face Attendance
  async checkinFace(payload: Partial<FaceAttendanceRecord>): Promise<FaceAttendanceRecord> {
    return apiClient.post<FaceAttendanceRecord>('/api/v1/sfa/face-checkin', payload);
  },

  // Field Order Booking
  async getOrders(): Promise<SfaOrderBooking[]> {
    return apiClient.get<SfaOrderBooking[]>('/api/v1/sfa/orders');
  },

  async bookOrder(payload: Partial<SfaOrderBooking>): Promise<SfaOrderBooking> {
    return apiClient.post<SfaOrderBooking>('/api/v1/sfa/orders', payload);
  },

  // Collections & Receipts
  async getCollections(): Promise<CollectionRecord[]> {
    return apiClient.get<CollectionRecord[]>('/api/v1/sfa/collections');
  },

  async recordCollection(payload: Partial<CollectionRecord>): Promise<CollectionRecord> {
    return apiClient.post<CollectionRecord>('/api/v1/sfa/collections', payload);
  },

  // DCR
  async getDCRs(): Promise<DailyCallReport[]> {
    return apiClient.get<DailyCallReport[]>('/api/v1/sfa/dcr');
  },

  // Expenses
  async getExpenses(): Promise<SfaExpense[]> {
    return apiClient.get<SfaExpense[]>('/api/v1/sfa/expenses');
  },

  // Targets
  async getSalesTargets(): Promise<SalesTarget[]> {
    return apiClient.get<SalesTarget[]>('/api/v1/sfa/targets');
  },

  // SFA Metrics
  async getSfaMetrics(): Promise<SfaMetrics> {
    return apiClient.get<SfaMetrics>('/api/v1/sfa/metrics');
  }
};
