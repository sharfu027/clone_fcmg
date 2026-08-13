import React from 'react';
import { Shield, Layers } from 'lucide-react';

interface AuthSimulationToolbarProps {
  selectedSecurityProfileKey: string;
  setSelectedSecurityProfileKey: (key: string) => void;
  apiSecurityProfiles: Record<string, any>;
  useGlobalPolicy: boolean;
  setUseGlobalPolicy: (value: boolean) => void;
  sensorMode: 'simulated' | 'real';
  setSensorMode: (mode: 'simulated' | 'real') => void;
  mockFaceResult: 'success' | 'failure';
  setMockFaceResult: (result: 'success' | 'failure') => void;
  mockGpsResult: 'success' | 'failure';
  setMockGpsResult: (result: 'success' | 'failure') => void;
  activeScreen: string;
  setActiveScreen: (screen: any) => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export function AuthSimulationToolbar({
  selectedSecurityProfileKey,
  setSelectedSecurityProfileKey,
  apiSecurityProfiles,
  useGlobalPolicy,
  setUseGlobalPolicy,
  sensorMode,
  setSensorMode,
  mockFaceResult,
  setMockFaceResult,
  mockGpsResult,
  setMockGpsResult,
  activeScreen,
  setActiveScreen,
  onTriggerToast
}: AuthSimulationToolbarProps) {
  return (
    <div className="space-y-4 mb-4">
      {/* SECTION 1: DETAILED SIMULATION CONTROL BAR */}
      <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-primary/10 text-brand-primary">
              <Shield size={16} />
            </span>
            <h2 className="text-sm font-bold text-brand-text-primary">Biometric Attendance & Geofence Simulation Desk</h2>
          </div>
          <p className="text-xs text-brand-text-secondary leading-normal max-w-2xl">
            Test and inspect all required screens of the high-security enterprise sign-in. Use the controls below to toggle biometric match results, GPS geofence checks, or browser sensor modes.
          </p>
        </div>

        {/* HIGH-FIDELITY SANDBOX CONTROLS */}
        <div className="flex flex-wrap items-center gap-4 bg-brand-bg-secondary p-3 border border-brand-border rounded-lg">
          {/* POLICY-DRIVEN SECURITY PROFILE SELECTOR */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-text-primary block uppercase tracking-wider flex items-center gap-1">
              <Shield size={12} className="text-brand-primary" /> Assigned Security Profile
            </span>
            <select
              value={selectedSecurityProfileKey}
              onChange={(e) => {
                setSelectedSecurityProfileKey(e.target.value);
                onTriggerToast('info', 'Security Profile Loaded', `Policy dynamically resolved for: ${apiSecurityProfiles[e.target.value]?.profileName || 'Security Profile'}`);
              }}
              className="p-1.5 border rounded border-brand-border bg-white text-[11px] font-bold text-brand-text-primary"
            >
              <option value="SEC-ADMIN">Admin Security (Face Required)</option>
              <option value="SEC-SALES">Sales Security (Face + GPS Required)</option>
              <option value="SEC-WAREHOUSE">Warehouse Security (Face + GPS Required)</option>
              <option value="SEC-FINANCE">Finance Security (Face Disabled)</option>
              <option value="SEC-HR">HR Security</option>
              <option value="SEC-DRIVER">Driver Security (Face + GPS Required)</option>
              <option value="SEC-CUSTOM">Custom / Future Employee Profile</option>
            </select>
          </div>

          {/* POLICY OVERRIDE HIERARCHY TOGGLE */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary block uppercase tracking-wider">Policy Hierarchy</span>
            <div className="flex bg-white rounded border border-brand-border p-0.5 text-[11px] font-bold">
              <button
                onClick={() => {
                  setUseGlobalPolicy(true);
                  onTriggerToast('info', 'Policy Mode: Global System', 'Using company-wide Security Profile Policy.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  useGlobalPolicy ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Security Profile
              </button>
              <button
                onClick={() => {
                  setUseGlobalPolicy(false);
                  onTriggerToast('warning', 'Policy Mode: Employee Override', 'Employee override policy active.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  !useGlobalPolicy ? 'bg-brand-warning text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Employee Override
              </button>
            </div>
          </div>

          {/* SENSOR CONTROL */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary block uppercase tracking-wider">Device Sensors</span>
            <div className="flex bg-white rounded border border-brand-border p-0.5 text-[11px] font-bold">
              <button
                onClick={() => {
                  setSensorMode('simulated');
                  onTriggerToast('info', 'Sensor Mode Changed', 'Now using high-fidelity mock sensor feeds.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sensorMode === 'simulated' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Simulated Feed
              </button>
              <button
                onClick={() => {
                  setSensorMode('real');
                  onTriggerToast('warning', 'Requesting Hardware Devices', 'Will prompt browser camera and geolocation.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  sensorMode === 'real' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Real Webcam/GPS
              </button>
            </div>
          </div>

          {/* FACE SIMULATION RESULT TOGGLE */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary block uppercase tracking-wider">Biometric Match Result</span>
            <div className="flex bg-white rounded border border-brand-border p-0.5 text-[11px] font-bold">
              <button
                onClick={() => {
                  setMockFaceResult('success');
                  onTriggerToast('success', 'Biometric Mode: Success', 'Face scan will resolve to MATCH APPROVED.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  mockFaceResult === 'success' ? 'bg-emerald-600 text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Success Pass
              </button>
              <button
                onClick={() => {
                  setMockFaceResult('failure');
                  onTriggerToast('error', 'Biometric Mode: Mismatch', 'Face scan will resolve to MATCH FAILURE.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  mockFaceResult === 'failure' ? 'bg-rose-600 text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Fail Mismatch
              </button>
            </div>
          </div>

          {/* GPS SIMULATION RESULT TOGGLE */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary block uppercase tracking-wider">GPS Geofence Bounds</span>
            <div className="flex bg-white rounded border border-brand-border p-0.5 text-[11px] font-bold">
              <button
                onClick={() => {
                  setMockGpsResult('success');
                  onTriggerToast('success', 'Geofence Mode: In-Bounds', 'GPS scan will resolve as within Delhi Central Depot HQ.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  mockGpsResult === 'success' ? 'bg-emerald-600 text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Within Range (Delhi)
              </button>
              <button
                onClick={() => {
                  setMockGpsResult('failure');
                  onTriggerToast('error', 'Geofence Mode: Out of Bounds', 'GPS scan will resolve as 1,740km away in Bengaluru.');
                }}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  mockGpsResult === 'failure' ? 'bg-rose-600 text-white shadow-xs' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Out of Range (BLR)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCREEN JUMPER RAIL FOR STAKEHOLDER DIRECT PREVIEW */}
      <div className="bg-white px-5 py-3 rounded-lg border border-brand-border shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1">
          <Layers size={13} /> Inspect Specific Screen State:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'login', label: '1. Standard Login' },
            { id: 'face-permission', label: '2. Camera Request' },
            { id: 'face-scan', label: '3. Biometric Sweep' },
            { id: 'face-success', label: '4. Bio Pass' },
            { id: 'face-failure', label: '5. Bio Fail' },
            { id: 'gps-permission', label: '6. Geofence Request' },
            { id: 'gps-scan', label: '7. Radar GPS Sweep' },
            { id: 'gps-success', label: '8. GPS Clear' },
            { id: 'gps-failure', label: '9. GPS Fail' },
            { id: 'admin-override', label: '10. Admin Bypass' },
            { id: 'expired', label: '11. Session Timeout' }
          ].map((screen) => (
            <button
              key={screen.id}
              onClick={() => {
                setActiveScreen(screen.id as any);
                onTriggerToast('info', `Preview Screen Active`, `Switched viewport state to: ${screen.label}`);
              }}
              className={`px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${
                activeScreen === screen.id
                  ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                  : 'bg-brand-bg-secondary/40 border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
              }`}
            >
              {screen.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AuthSimulationToolbar;
