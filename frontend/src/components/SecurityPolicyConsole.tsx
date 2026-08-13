import React, { useState } from 'react';
import {
  Shield,
  Key,
  Users,
  Building,
  Lock,
  RefreshCw,
  Smartphone,
  Eye,
  AlertTriangle,
  Info,
  Sliders,
  Clock,
  ShieldCheck,
  MapPin,
  Camera,
  Server,
  FileText,
  Save,
  UserCheck
} from 'lucide-react';
import { DEFAULT_ROLE_POLICIES, ROLES } from '../constants';

const defaultRolePolicies = DEFAULT_ROLE_POLICIES;

interface SecurityPolicyConsoleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function SecurityPolicyConsole({ onTriggerToast }: SecurityPolicyConsoleProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'roles' | 'audit'>('system');

  // ==========================================
  // SYSTEM SECURITY SETTINGS STATE (GLOBAL)
  // ==========================================
  const [globalSettings, setGlobalSettings] = useState({
    faceRecognitionGlobally: true,
    gpsVerificationGlobally: false,
    attendanceOnLogin: true,
    deviceRegistration: true,
    sessionTimeout: true,
    sessionTimeoutMinutes: 15,
    loginAuditLogs: true,
    ipRestrictions: false,
    passwordExpiration: true,
    passwordExpirationDays: 90
  });

  const handleGlobalToggle = (key: keyof typeof globalSettings) => {
    setGlobalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    onTriggerToast('info', 'Global Policy Updated', 'The organization-wide default state was adjusted in UI buffer.');
  };

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerToast('success', 'Global Security Policies Saved', 'All organization configurations successfully staged for C# / PostgreSQL integration.');
  };

  // ==========================================
  // ROLE SECURITY SETTINGS STATE (DEFAULTS)
  // ==========================================
  const [selectedRole, setSelectedRole] = useState<string>('Sales Representative');
  
  // Custom settings per role
  const [roleSettings, setRoleSettings] = useState<Record<string, typeof defaultRolePolicies>>({
    'Administrator': {
      requireFace: true,
      requireGps: false,
      require2Fa: true,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: false,
      allowOffline: false,
      autoMarkAttendance: false,
      radius: 100
    },
    'Sales Representative': {
      requireFace: true,
      requireGps: true,
      require2Fa: false,
      requireDeviceReg: true,
      allowUnknownDevice: true,
      officeHoursOnly: true,
      allowOffline: true,
      autoMarkAttendance: true,
      radius: 200
    },
    'Warehouse Manager': {
      requireFace: true,
      requireGps: true,
      require2Fa: false,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: true,
      allowOffline: false,
      autoMarkAttendance: true,
      radius: 100
    },
    'Procurement Manager': {
      requireFace: false,
      requireGps: false,
      require2Fa: true,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: false,
      allowOffline: false,
      autoMarkAttendance: false,
      radius: 100
    },
    'Accountant': {
      requireFace: false,
      requireGps: false,
      require2Fa: true,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: false,
      allowOffline: false,
      autoMarkAttendance: false,
      radius: 100
    },
    'Finance Manager': {
      requireFace: true,
      requireGps: false,
      require2Fa: true,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: false,
      allowOffline: false,
      autoMarkAttendance: false,
      radius: 100
    },
    'HR Manager': {
      requireFace: false,
      requireGps: false,
      require2Fa: false,
      requireDeviceReg: true,
      allowUnknownDevice: false,
      officeHoursOnly: true,
      allowOffline: false,
      autoMarkAttendance: false,
      radius: 100
    }
  });

  const activeRolePolicy = roleSettings[selectedRole] || roleSettings['Sales Representative'];

  const handleRoleToggle = (key: keyof typeof defaultRolePolicies) => {
    setRoleSettings(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [key]: !prev[selectedRole][key]
      }
    }));
    onTriggerToast('info', `${selectedRole} Policy Updated`, `Staged custom default parameter: ${String(key)}`);
  };

  const handleSaveRolePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerToast('success', 'Role Defaults Staged', `Default authentication profiles updated for "${selectedRole}".`);
  };

  // ==========================================
  // SIMULATED AUDIT LOGS
  // ==========================================
  const [auditLogs] = useState([
    { id: 'LOG-882', timestamp: '2026-07-21 03:15:22', user: 'Siddharth Mehra', role: 'Super Administrator', ip: '192.168.1.104', action: 'Modified GPS Fence radius globally to 200m', status: 'Success', type: 'Policy Change' },
    { id: 'LOG-881', timestamp: '2026-07-21 02:58:10', user: 'Amit Sharma', role: 'Sales Representative', ip: '112.196.34.82', action: 'Biometric Face signature match approved', status: 'Success', type: 'Authentication' },
    { id: 'LOG-880', timestamp: '2026-07-21 02:44:02', user: 'Priya Patel', role: 'Sales Representative', ip: '202.54.10.43', action: 'GPS Boundary failure (Delhi Depot boundary violation)', status: 'Blocked', type: 'Security Violation' },
    { id: 'LOG-879', timestamp: '2026-07-21 01:20:15', user: 'Karan Anand', role: 'Procurement Manager', ip: '192.168.1.112', action: 'Forced password reset on next authentication pipeline', status: 'Success', type: 'Credential Update' },
    { id: 'LOG-878', timestamp: '2026-07-20 22:15:40', user: 'Rohan Joshi', role: 'Warehouse Manager', ip: '112.196.34.90', action: 'Attempted login from unauthorized unknown device', status: 'Blocked', type: 'Device Verification' }
  ]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-white p-6 rounded-lg border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-brand-primary rounded-md">
              <Shield size={20} />
            </span>
            <h2 className="text-lg font-bold text-brand-text-primary">Enterprise Security Control Center</h2>
          </div>
          <p className="text-xs text-brand-text-secondary">
            Manage granular device verification, liveness checks, GPS geofences, and role-based policies globally.
          </p>
        </div>

        {/* Dynamic warning if critical things are disabled */}
        {!globalSettings.faceRecognitionGlobally && (
          <div className="bg-amber-50 text-brand-warning text-xs border border-amber-200 p-3 rounded-md max-w-sm flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Global Override Advisory</p>
              <p className="text-[11px] text-brand-text-secondary">Face recognition is disabled globally. Active user roles will fall back to dual-factor authentication.</p>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'system'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Building size={14} /> Organization Settings
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Users size={14} /> Role Defaults Configuration
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <FileText size={14} /> Security Audit Trails
        </button>
      </div>

      {/* ==========================================
          TAB 1: ORGANIZATION SECURITY SETTINGS
          ========================================== */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveGlobal} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-white border border-brand-border rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary flex items-center gap-1.5 border-b pb-2">
                  <Server size={16} className="text-brand-primary" /> Global Policy Parameters
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-1">
                  Enforces default security rules globally at the tenant routing level. Individual accounts inherit these constraints.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Switch 1: Face Globally */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable Face Recognition Globally</label>
                    <span className="text-[10px] text-brand-text-secondary block">Require biometric liveness checking on every authentication portal session.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('faceRecognitionGlobally')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.faceRecognitionGlobally ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.faceRecognitionGlobally ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 2: GPS Globally */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable GPS Verification Globally</label>
                    <span className="text-[10px] text-brand-text-secondary block">Block login completely if user coordinates map outside allowed warehouse depots.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('gpsVerificationGlobally')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.gpsVerificationGlobally ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.gpsVerificationGlobally ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 3: Attendance on Login */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable Attendance On Login</label>
                    <span className="text-[10px] text-brand-text-secondary block">Instantly register morning clock-in times upon a successful SSO web session.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('attendanceOnLogin')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.attendanceOnLogin ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.attendanceOnLogin ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 4: Device Registration */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable Device Registration</label>
                    <span className="text-[10px] text-brand-text-secondary block">Strictly limit logins to verified Android handpieces or whitelisted MAC addresses.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('deviceRegistration')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.deviceRegistration ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.deviceRegistration ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 5: Session Timeout */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4 flex-1">
                    <label className="font-bold text-brand-text-primary block">Enable Session Timeout</label>
                    <span className="text-[10px] text-brand-text-secondary block">Auto disconnect users after long idle durations.</span>
                    {globalSettings.sessionTimeout && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          value={globalSettings.sessionTimeoutMinutes}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
                          className="w-16 p-1 border rounded bg-white text-brand-text-primary font-mono text-center font-bold"
                        />
                        <span className="text-[10px] text-brand-text-secondary">Minutes idle</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('sessionTimeout')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.sessionTimeout ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.sessionTimeout ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 6: IP Restrictions */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable IP Restrictions</label>
                    <span className="text-[10px] text-brand-text-secondary block">Block ERP panels from external networks except dedicated depot static routers.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('ipRestrictions')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.ipRestrictions ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.ipRestrictions ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 7: Password Expiry */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4 flex-1">
                    <label className="font-bold text-brand-text-primary block">Enable Password Expiration</label>
                    <span className="text-[10px] text-brand-text-secondary block">Force users to change AD credentials on defined cycles.</span>
                    {globalSettings.passwordExpiration && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          value={globalSettings.passwordExpirationDays}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, passwordExpirationDays: Number(e.target.value) }))}
                          className="w-16 p-1 border rounded bg-white text-brand-text-primary font-mono text-center font-bold"
                        />
                        <span className="text-[10px] text-brand-text-secondary">Days validity</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('passwordExpiration')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.passwordExpiration ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.passwordExpiration ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Switch 8: Login Audit Logs */}
                <div className="flex items-start justify-between p-3 bg-brand-bg-secondary/20 border border-brand-border/60 rounded-lg hover:border-brand-primary/40 transition">
                  <div className="space-y-1 pr-4">
                    <label className="font-bold text-brand-text-primary block">Enable Login Audit Logs</label>
                    <span className="text-[10px] text-brand-text-secondary block">Log authentication results, terminal parameters, and token states to T_FMCG_AUDIT.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGlobalToggle('loginAuditLogs')}
                    className={`w-10 h-5 rounded-full p-0.5 transition shrink-0 cursor-pointer ${
                      globalSettings.loginAuditLogs ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition transform ${globalSettings.loginAuditLogs ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

              </div>

              {/* ACTION FOOTER */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={14} /> Commit Global Policies
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: TECHNICAL METADATA SPECIFICATIONS */}
          <div className="space-y-4 text-xs">
            
            <div className="bg-white border border-brand-border rounded-lg shadow-sm p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Info size={12} /> Live Policy Warnings
              </h4>
              
              <div className="space-y-2">
                {globalSettings.faceRecognitionGlobally && (
                  <div className="p-3 bg-blue-50/50 text-brand-primary border border-blue-100 rounded-md flex gap-2">
                    <ShieldCheck size={16} className="shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      "This user will be required to complete Face Verification before accessing the ERP." (Active due to global biometric override)
                    </p>
                  </div>
                )}

                {!globalSettings.gpsVerificationGlobally && (
                  <div className="p-3 bg-amber-50/50 text-brand-warning border border-amber-100 rounded-md flex gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      "GPS Verification is disabled for this user." (Active due to global radius omission policy)
                    </p>
                  </div>
                )}

                {globalSettings.deviceRegistration && (
                  <div className="p-3 bg-green-50/40 text-brand-success border border-green-100 rounded-md flex gap-2">
                    <UserCheck size={16} className="shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      "This user can login from any approved device." (Active device whitelist checks)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-brand-text-primary text-gray-300 p-4 rounded-lg space-y-3 font-mono text-[10px]">
              <p className="font-bold text-white uppercase tracking-wider text-[9px] border-b border-gray-700 pb-1.5 flex items-center gap-1">
                <Lock size={11} className="text-brand-success" /> Security Context Signature
              </p>
              <div className="space-y-1 text-[11px]">
                <p>DATABASE: postgresql_security_schema</p>
                <p>AUTH_ENGINE: ASP.NET Core 9 Identity</p>
                <p>BIOMETRICS: PyTorch FaceID CDN proxy</p>
                <p>GPS_VERIFIER: PostGIS Geofence Route</p>
                <p>ENCRYPTION: AES-256 HMAC JWT-Bearer</p>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* ==========================================
          TAB 2: ROLE Defaults Configuration
          ========================================== */}
      {activeTab === 'roles' && (
        <form onSubmit={handleSaveRolePolicies} className="space-y-6">
          
          <div className="bg-white border border-brand-border rounded-lg shadow-sm p-6 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary flex items-center gap-1.5">
                  <Key size={16} className="text-brand-primary" /> Role Authorization Overrides
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-1">
                  Configure default policies that apply automatically when a new user is registered under a selected role.
                </p>
              </div>

              {/* Role Select Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-text-secondary">Target Role:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-white border border-brand-border text-brand-text-primary rounded px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-brand-primary"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configurable switches grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              
              {/* REQUIRE FACE */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-blue-50 text-brand-primary rounded flex items-center gap-1 font-bold">
                    <Camera size={13} /> Biometrics
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('requireFace')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.requireFace ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.requireFace ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Require Face Recognition</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Forces users to complete facial scan validation. Show warning: "This user will be required to complete Face Verification before accessing the ERP."
                  </p>
                </div>
              </div>

              {/* REQUIRE GPS */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded flex items-center gap-1 font-bold">
                    <MapPin size={13} /> Location Fence
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('requireGps')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.requireGps ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.requireGps ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Require GPS Verification</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Assures location authenticity within regional depots. Shows warning: "GPS Verification is disabled for this user" when toggled off.
                  </p>
                </div>
              </div>

              {/* REQUIRE 2FA */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3 opacity-80 border-dashed">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-gray-100 text-brand-text-secondary rounded flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                    <Lock size={11} /> 2FA (Future)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('require2Fa')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.require2Fa ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.require2Fa ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Require Two-Factor Auth</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Triggers secondary TOTP authentication codes dynamically generated in future stages.
                  </p>
                </div>
              </div>

              {/* REQUIRE DEVICE REG */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded flex items-center gap-1 font-bold">
                    <Smartphone size={13} /> HW ID Whitelist
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('requireDeviceReg')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.requireDeviceReg ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.requireDeviceReg ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Require Device Registration</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Restricts this role to registered corporate assets. Prevents login from personal machines.
                  </p>
                </div>
              </div>

              {/* ALLOW UNKNOWN DEVICE */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-amber-50 text-brand-warning rounded flex items-center gap-1 font-bold">
                    <Smartphone size={13} /> BYOD Rules
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('allowUnknownDevice')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.allowUnknownDevice ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.allowUnknownDevice ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Allow Unknown Devices</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    When enabled, warning is visible: "This user can login from any approved device." (Allows self-onboarding).
                  </p>
                </div>
              </div>

              {/* OFFICE HOURS ONLY */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-emerald-50 text-brand-success rounded flex items-center gap-1 font-bold">
                    <Clock size={13} /> Shift Locks
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('officeHoursOnly')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.officeHoursOnly ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.officeHoursOnly ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Office Hours Only (09:00 - 18:00)</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Rejects authentication tokens generated after-hours to avoid remote operational tampering.
                  </p>
                </div>
              </div>

              {/* ALLOW OFFLINE LOGIN */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3 opacity-80 border-dashed">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-gray-100 text-brand-text-secondary rounded flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                    <Sliders size={11} /> Offline Synced (Future)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('allowOffline')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.allowOffline ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.allowOffline ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Allow Offline Local Login</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Maintains encrypted SQLite keychains on-device to support sales beat logs without internet.
                  </p>
                </div>
              </div>

              {/* AUTO MARK ATTENDANCE */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-teal-50 text-teal-600 rounded flex items-center gap-1 font-bold">
                    <UserCheck size={13} /> ERP HRMS Sync
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('autoMarkAttendance')}
                    className={`w-9 h-4.5 rounded-full p-0.5 transition cursor-pointer ${
                      activeRolePolicy.autoMarkAttendance ? 'bg-brand-primary' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${activeRolePolicy.autoMarkAttendance ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-brand-text-primary">Auto-Mark Attendance on Login</h4>
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Syncs with payroll sub-systems immediately, completing morning check-ins automatically.
                  </p>
                </div>
              </div>

              {/* GPS RADIUS configuration */}
              <div className="p-4 border rounded-lg hover:shadow-xs transition bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-amber-50 text-brand-warning rounded flex items-center gap-1 font-bold">
                    <Map size={13} /> GPS Radius (m)
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-brand-text-secondary leading-normal">
                    Threshold radius around the depot point where attendance triggers.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={50}
                      value={activeRolePolicy.radius}
                      onChange={(e) => {
                        const newRadius = Number(e.target.value);
                        setRoleSettings(prev => ({
                          ...prev,
                          [selectedRole]: {
                            ...prev[selectedRole],
                            radius: newRadius
                          }
                        }));
                      }}
                      className="flex-1 accent-brand-primary"
                    />
                    <span className="font-mono text-xs font-bold shrink-0 bg-brand-bg-secondary px-2 py-0.5 border rounded">
                      {activeRolePolicy.radius}m
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* LIVE ALERTS ADVISORY PREVIEW */}
            <div className="bg-brand-bg-secondary/40 p-4 rounded border text-xs space-y-3">
              <h5 className="font-bold text-brand-text-primary flex items-center gap-1">
                <ShieldCheck size={14} className="text-brand-success" /> Active Policy Warnings for New Users assigned to "{selectedRole}"
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                
                <div className="p-2.5 bg-white rounded border border-brand-border flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${activeRolePolicy.requireFace ? 'bg-brand-primary' : 'bg-gray-300'}`} />
                  <div>
                    <span className="font-semibold block">Face Check State:</span>
                    <p className="text-brand-text-secondary mt-0.5">
                      {activeRolePolicy.requireFace 
                        ? '"This user will be required to complete Face Verification before accessing the ERP."'
                        : 'Face check skipped. System will prompt standard passcodes.'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded border border-brand-border flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${activeRolePolicy.requireGps ? 'bg-brand-success' : 'bg-brand-danger'}`} />
                  <div>
                    <span className="font-semibold block">GPS Fence State:</span>
                    <p className="text-brand-text-secondary mt-0.5">
                      {activeRolePolicy.requireGps
                        ? '"User coordinates will be verified in real time within Delhi Depot perimeter."'
                        : '"GPS Verification is disabled for this user."'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded border border-brand-border flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${activeRolePolicy.requireDeviceReg ? 'bg-purple-600' : 'bg-gray-300'}`} />
                  <div>
                    <span className="font-semibold block">Device Bind state:</span>
                    <p className="text-brand-text-secondary mt-0.5">
                      {activeRolePolicy.requireDeviceReg
                        ? 'Requires device pre-registration before SSO token issuance.'
                        : '"This user can login from any approved device."'}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save size={14} /> Commit Default Role Config
              </button>
            </div>

          </div>

        </form>
      )}

      {/* ==========================================
          TAB 3: SYSTEM AUDIT LOGS / FAILED ATTEMPTS
          ========================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-brand-border rounded-lg shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Failed Auth & Policy Change Audit Ledger</h4>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">Tracks compliance anomalies, hardware modifications, and security bypass attempts.</p>
            </div>
            <span className="px-2 py-0.5 bg-red-50 text-brand-danger font-mono font-bold text-[10px] rounded border border-red-100">
              12 Failed Attempts logged MTD
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-bg-secondary border-b border-brand-border text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Profile</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Directive Action</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3 text-center">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border font-medium text-brand-text-primary">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-bg-secondary/20 transition">
                    <td className="p-3 font-mono text-brand-text-secondary">{log.id}</td>
                    <td className="p-3 font-mono text-brand-text-secondary text-[11px]">{log.timestamp}</td>
                    <td className="p-3">
                      <div className="font-semibold">{log.user}</div>
                      <div className="text-[10px] text-brand-text-secondary">{log.role}</div>
                    </td>
                    <td className="p-3 font-mono text-brand-text-secondary">{log.ip}</td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                        log.type === 'Security Violation' ? 'bg-red-50 text-brand-danger border-red-100' :
                        log.type === 'Policy Change' ? 'bg-blue-50 text-brand-primary border-blue-100' : 'bg-gray-50 text-brand-text-secondary border-brand-border'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'Success' ? 'text-brand-success' : 'text-brand-danger font-black'
                      }`}>
                        {log.status === 'Success' ? '● APPROVED' : '✖ BLOCKED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
