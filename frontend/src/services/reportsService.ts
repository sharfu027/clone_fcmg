import { apiClient } from '../api/apiClient';
import {
  ReportDefinition,
  GeneratedDocument,
  ExportRequest,
  ScheduledReportJob,
  ReportMetrics,
  ReportFilterParams
} from '../types/reports';

export const reportsService = {
  // Reports Directory
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return apiClient.get<ReportDefinition[]>('/api/v1/reports/definitions');
  },

  // Execute Report
  async runReport(reportCode: string, filters: ReportFilterParams): Promise<any> {
    return apiClient.post<any>(`/api/v1/reports/run/${reportCode}`, filters);
  },

  // Document Engine
  async getGeneratedDocuments(): Promise<GeneratedDocument[]> {
    return apiClient.get<GeneratedDocument[]>('/api/v1/reports/documents');
  },

  async generateDocument(payload: Partial<GeneratedDocument>): Promise<GeneratedDocument> {
    return apiClient.post<GeneratedDocument>('/api/v1/reports/documents/generate', payload);
  },

  // Export Engine
  async exportReport(payload: ExportRequest): Promise<{ downloadUrl: string }> {
    return apiClient.post<{ downloadUrl: string }>('/api/v1/reports/export', payload);
  },

  // Scheduled Jobs
  async getScheduledJobs(): Promise<ScheduledReportJob[]> {
    return apiClient.get<ScheduledReportJob[]>('/api/v1/reports/scheduled');
  },

  // Report Metrics
  async getReportMetrics(): Promise<ReportMetrics> {
    return apiClient.get<ReportMetrics>('/api/v1/reports/metrics');
  }
};
