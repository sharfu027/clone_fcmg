import { RoleSecurityPolicy } from '../types';

export const DEFAULT_ROLE_POLICIES: RoleSecurityPolicy = {
  requireFace: true,
  requireGps: true,
  require2Fa: false,
  requireDeviceReg: true,
  allowUnknownDevice: false,
  officeHoursOnly: true,
  allowOffline: false,
  autoMarkAttendance: true,
  radius: 100
};
