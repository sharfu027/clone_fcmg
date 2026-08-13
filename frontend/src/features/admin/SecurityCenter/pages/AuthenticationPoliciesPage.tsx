import React from 'react';
import { Camera, MapPin } from 'lucide-react';
import { GlobalAuthenticationPolicy, AuthenticationMode, FacePolicy, LocationPolicy } from '../../../../types/admin';

interface AuthenticationPoliciesPageProps {
  globalPolicy: GlobalAuthenticationPolicy;
  setGlobalPolicy: React.Dispatch<React.SetStateAction<GlobalAuthenticationPolicy>>;
  onSave: () => void;
}

export default function AuthenticationPoliciesPage({
  globalPolicy,
  setGlobalPolicy,
  onSave
}: AuthenticationPoliciesPageProps) {
  const faceItems: Array<{ label: string; key: keyof FacePolicy }> = [
    { label: 'Login Sign-In Face Check', key: 'loginFace' },
    { label: 'Attendance Clock-In Face Check', key: 'attendanceFace' },
    { label: 'Customer Visit Face Check', key: 'visitFace' },
    { label: 'Warehouse Entry Face Check', key: 'warehouseFace' },
    { label: 'Manager Approval Signature', key: 'managerApprovalFace' },
    { label: 'Inventory Audit Face Verification', key: 'inventoryAuditFace' }
  ];

  const locationItems: Array<{ label: string; key: keyof LocationPolicy }> = [
    { label: 'Login Geofence Check', key: 'loginGps' },
    { label: 'Attendance Clock-In Geofence', key: 'attendanceGps' },
    { label: 'Customer Visit Geofence', key: 'visitGps' },
    { label: 'Warehouse Perimeter Check', key: 'warehouseGps' },
    { label: 'Delivery Handover Geofence', key: 'deliveryGps' },
    { label: 'Collections Payment Location', key: 'collectionsGps' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-brand-border shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="text-base font-bold text-brand-text-primary">{globalPolicy.name}</h3>
          <p className="text-xs text-brand-text-secondary">{globalPolicy.description}</p>
        </div>
        <button onClick={onSave} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded cursor-pointer shadow-sm">
          Save Policy Rules
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 border p-4 rounded-lg bg-brand-bg-secondary/20">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Camera size={16} className="text-brand-primary" /> Face Authentication Matrix
          </h4>
          {faceItems.map(item => (
            <div key={item.key} className="flex justify-between items-center text-xs">
              <span className="font-semibold text-brand-text-primary">{item.label}</span>
              <select
                value={globalPolicy.facePolicy[item.key]}
                onChange={(e) => setGlobalPolicy({ ...globalPolicy, facePolicy: { ...globalPolicy.facePolicy, [item.key]: e.target.value as AuthenticationMode } })}
                className="p-1 border rounded border-brand-border bg-white text-xs font-bold"
              >
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          ))}
          <div className="pt-2 border-t mt-3 flex justify-between items-center text-xs">
            <span className="font-bold text-brand-text-primary">Biometric Similarity Threshold</span>
            <select
              value={globalPolicy.facePolicy.minConfidenceScore || 0.85}
              onChange={(e) => setGlobalPolicy({
                ...globalPolicy,
                facePolicy: { ...globalPolicy.facePolicy, minConfidenceScore: parseFloat(e.target.value) }
              })}
              className="p-1.5 border rounded border-brand-border bg-white font-mono font-bold text-brand-primary"
            >
              <option value="0.75">0.75 (Relaxed)</option>
              <option value="0.82">0.82 (Balanced)</option>
              <option value="0.85">0.85 (Strict Enterprise)</option>
              <option value="0.90">0.90 (High Security)</option>
              <option value="0.95">0.95 (Maximum)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 border p-4 rounded-lg bg-brand-bg-secondary/20">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={16} className="text-brand-success" /> Location & Geofence Matrix
          </h4>
          {locationItems.map(item => (
            <div key={item.key} className="flex justify-between items-center text-xs">
              <span className="font-semibold text-brand-text-primary">{item.label}</span>
              <select
                value={globalPolicy.locationPolicy[item.key] as AuthenticationMode}
                onChange={(e) => setGlobalPolicy({ ...globalPolicy, locationPolicy: { ...globalPolicy.locationPolicy, [item.key]: e.target.value as AuthenticationMode } })}
                className="p-1 border rounded border-brand-border bg-white text-xs font-bold"
              >
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
