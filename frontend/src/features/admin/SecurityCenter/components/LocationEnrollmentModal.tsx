import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass, Check, AlertCircle, RefreshCw, X, ShieldCheck, Navigation } from 'lucide-react';
import { Tooltip } from '../../../../components/ui/Tooltip';
export interface EmployeeDetails {
  id: string;
  name: string;
  employeeId?: string;
  department?: string;
  [key: string]: any;
}

interface LocationEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDetails | null;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export interface UserLocationProfile {
  userId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  updatedAtUtc: string;
}

export const getLocationProfile = (userId: string): UserLocationProfile | null => {
  try {
    const raw = localStorage.getItem(`ink_user_gps_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading location profile:', e);
  }
  return null;
};

export const saveLocationProfile = (profile: UserLocationProfile): void => {
  try {
    localStorage.setItem(`ink_user_gps_${profile.userId}`, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving location profile:', e);
  }
};

export const LocationEnrollmentModal: React.FC<LocationEnrollmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  onTriggerToast
}) => {
  const [locationName, setLocationName] = useState('Delhi Central Branch [HQ]');
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [allowedRadius, setAllowedRadius] = useState<number>(500);
  const [isDetecting, setIsDetecting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<UserLocationProfile | null>(null);

  const hasFetchedRef = useRef(false);
  const employeeId = employee?.userId || employee?.id || '';

  useEffect(() => {
    if (isOpen && employeeId) {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      const profile = getLocationProfile(employeeId);
      if (profile) {
        setExistingProfile(profile);
        setLocationName(profile.locationName);
        setLatitude(profile.latitude);
        setLongitude(profile.longitude);
        setAllowedRadius(profile.allowedRadiusMeters);
      } else {
        setExistingProfile(null);
        setAllowedRadius(500);
        // Automatically fetch live GPS location ONCE on mount
        autoDetectLocation();
      }
    } else if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [isOpen, employeeId]);

  if (!isOpen || !employee) return null;

  const targetUserId = employee.userId || employee.id;

  const autoDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      setIsDetecting(false);
      fetchIpLocationFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsDetecting(false);
        onTriggerToast('success', 'Live GPS Location Locked', `Acquired coordinates: ${lat}° N, ${lng}° E`);

        // Reverse geocoding to fetch full detailed street address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            // Full detailed street address
            setLocationName(data.display_name);
            onTriggerToast('success', 'Full Address Resolved', data.display_name);
          }
        } catch (e) {
          console.warn('Reverse geocode lookup skipped:', e);
        }
      },
      error => {
        console.warn('Geolocation query failed, using IP fallback:', error);
        fetchIpLocationFallback();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const fetchIpLocationFallback = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        setLatitude(Number(data.latitude.toFixed(6)));
        setLongitude(Number(data.longitude.toFixed(6)));
        const fullAddr = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''} [IP Node: ${data.org || 'Local ISP'}]`.trim();
        setLocationName(fullAddr);
        onTriggerToast('info', 'IP Location Resolved', fullAddr);
      }
    } catch (e) {
      console.warn('IP fallback failed:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveLocation = () => {
    const profile: UserLocationProfile = {
      userId: targetUserId,
      locationName,
      latitude,
      longitude,
      allowedRadiusMeters: allowedRadius,
      updatedAtUtc: new Date().toISOString()
    };

    saveLocationProfile(profile);
    setExistingProfile(profile);
    onTriggerToast('success', 'Location Enrolled Successfully', `Approved GPS Geofence registered for ${employee.name}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-brand-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Approved Location Enrollment</h3>
              <p className="text-[11px] text-slate-400">Configure GPS Geofence clearance parameters for login policy.</p>
            </div>
          </div>
          <Tooltip content="Close">
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </Tooltip>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* USER INFO SUMMARY CARD */}
          <div className="bg-slate-50 border border-brand-border/80 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-brand-text-primary text-sm">{employee.name}</p>
              <p className="text-[11px] text-brand-text-secondary">{employee.email} • <span className="font-mono text-brand-primary">{employee.role}</span></p>
            </div>
            {existingProfile ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Check size={12} /> Geofence Registered
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <AlertCircle size={12} /> Pending Registration
              </span>
            )}
          </div>

          {/* AUTO DETECT GPS BUTTON */}
          <div className="space-y-2">
            <button
              onClick={autoDetectLocation}
              disabled={isDetecting}
              className="w-full py-2.5 bg-blue-50 border border-blue-200 text-brand-primary hover:bg-blue-100 font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isDetecting ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-brand-primary" />
                  <span>Locking Live Satellite GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <Navigation size={14} className="text-brand-primary" />
                  <span>Auto-Detect Current Browser GPS Coordinates</span>
                </>
              )}
            </button>
          </div>

          {/* LOCATION DETAILS FORM */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block font-bold text-brand-text-primary">Approved Location / Depot Name</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g. Delhi Central Depot [HQ]"
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-brand-text-primary">Latitude (° N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs font-mono focus:outline-none focus:border-brand-primary bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-brand-text-primary">Longitude (° E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs font-mono focus:outline-none focus:border-brand-primary bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-brand-text-primary">Allowed Geofence Radius Buffer</label>
              <select
                value={allowedRadius}
                onChange={e => setAllowedRadius(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white cursor-pointer"
              >
                <option value={100}>100 Meters (Strict Building Perimeter)</option>
                <option value={250}>250 Meters (Depot Yard & Gate Bounds)</option>
                <option value={500}>500 Meters (Standard City Campus Buffer)</option>
                <option value={1000}>1000 Meters (Expanded Branch Radius)</option>
              </select>
            </div>
          </div>

          {/* GEOFENCE FOOTER INFO */}
          <div className="p-3 bg-slate-50 border border-brand-border/60 rounded-lg space-y-1">
            <h5 className="font-bold text-brand-text-primary text-[11px] flex items-center gap-1">
              <Compass size={12} className="text-brand-primary" /> Multi-Factor Attendance Policy
            </h5>
            <p className="text-[10px] text-brand-text-secondary leading-normal">
              Once enrolled, credential login will automatically verify this GPS location perimeter before proceeding to face authentication.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 p-4 border-t border-brand-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-border text-brand-text-secondary hover:text-brand-text-primary font-bold rounded-lg transition cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <ShieldCheck size={14} /> Save Approved Location Profile
          </button>
        </div>

      </div>
    </div>
  );
};
