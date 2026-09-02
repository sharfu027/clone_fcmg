import { CustomerDto } from './masterData';

export interface SalesRepresentativeDto {
  id: string; // Employee ID
  userId: string;
  companyId: string;
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  phone: string;
  isActive: boolean;
  assignedCustomersCount: number;
  createdAtUtc: string;
  lastLoginUtc?: string | null;
  assignedCustomerIds?: string[] | null;
  locationRegistered?: boolean;
  faceRegistered?: boolean;
  locationName?: string | null;
  allowedRadiusMeters?: number | null;
}

export interface CreateSalesRepresentativeRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  branchId?: string | null;
  isActive?: boolean;
}

export interface UpdateSalesRepresentativeRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  branchId?: string | null;
  isActive?: boolean;
}

export interface ResetSalesRepPasswordRequest {
  newPassword: string;
}

export interface AssignCustomersToSalesRepRequest {
  customerIds: string[];
}

export interface SalesRepLocationEnrollment {
  id: string;
  companyId: string;
  employeeId: string;
  userId?: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  isActive: boolean;
  enrolledAtUtc: string;
  enrolledByUserId?: string | null;
  updatedAtUtc?: string | null;
}

export interface RegisterSalesRepLocationRequest {
  locationName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters?: number;
}

export interface SalesRepBiometricStatus {
  faceRegistered: boolean;
  faceProfileId?: string | null;
  templateVersion?: number | null;
  faceEnrolledAtUtc?: string | null;
  locationRegistered: boolean;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  locationEnrolledAtUtc?: string | null;
}

export interface FaceEnrollmentResult {
  userId: string;
  faceStatus: 'Registered';
  templateVersion: number;
}

export interface LocationVerificationResult {
  isAllowed: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  message: string;
  requiresPinOverride: boolean;
  targetLocationName?: string | null;
}
