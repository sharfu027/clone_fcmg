import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Lock,
  KeyRound,
  UserCheck,
  UserX,
  Building,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  Store,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Camera,
  Compass,
  Navigation,
  Loader2,
  Trash2,
  ShieldAlert,
  Sliders,
  Shield
} from 'lucide-react';
import {
  SalesRepresentativeDto,
  CreateSalesRepresentativeRequest,
  UpdateSalesRepresentativeRequest,
  SalesRepLocationEnrollment,
  RegisterSalesRepLocationRequest,
  SalesRepBiometricStatus
} from '../../types/salesTeam';
import { CustomerDto, BranchDto } from '../../types/masterData';
import { salesTeamService } from '../../services/salesTeamService';
import { fetchCustomers, fetchBranches } from '../../services/masterDataService';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface SalesTeamManagementModuleProps {
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function SalesTeamManagementModule({ onTriggerToast }: SalesTeamManagementModuleProps) {
  const { user } = useAuth();

  // ── States ──
  const [salesReps, setSalesReps] = useState<SalesRepresentativeDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [branchFilter, setBranchFilter] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignCustomersModalOpen, setIsAssignCustomersModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState<SalesRepresentativeDto | null>(null);

  // Form States - Create Rep
  const [createFormData, setCreateFormData] = useState<CreateSalesRepresentativeRequest>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    branchId: null,
    isActive: true
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form States - Edit Rep
  const [editFormData, setEditFormData] = useState<UpdateSalesRepresentativeRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    branchId: null,
    isActive: true
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Customer Assignment Modal States
  const [assignedCustomerIds, setAssignedCustomerIds] = useState<string[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Reset Password Modal States
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Location Enrollment Modal States
  const [locationFormData, setLocationFormData] = useState<RegisterSalesRepLocationRequest>({
    locationName: '',
    latitude: 28.6139,
    longitude: 77.2090,
    allowedRadiusMeters: 50.0
  });
  const [existingLocation, setExistingLocation] = useState<SalesRepLocationEnrollment | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Face Enrollment Modal States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isEnrollingFace, setIsEnrollingFace] = useState(false);
  const [faceBiometricStatus, setFaceBiometricStatus] = useState<SalesRepBiometricStatus | null>(null);
  const [isLoadingFaceStatus, setIsLoadingFaceStatus] = useState(false);
  const [isDeletingFace, setIsDeletingFace] = useState(false);

  // ────────────────────────────────────────────────────────
  // DATA FETCHING
  // ────────────────────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [repsData, customersData, branchesData] = await Promise.all([
        salesTeamService.fetchSalesTeam({
          companyId: user?.companyId,
          search: searchQuery || undefined,
          status: statusFilter === 'All' ? undefined : statusFilter,
          branchId: branchFilter || undefined
        }),
        fetchCustomers({ companyId: user?.companyId, pageSize: 500 }),
        fetchBranches({ companyId: user?.companyId, pageSize: 100 })
      ]);

      setSalesReps(repsData);
      setCustomers(Array.isArray(customersData?.items) ? customersData.items : Array.isArray(customersData) ? customersData : []);
      setBranches(Array.isArray(branchesData?.items) ? branchesData.items : Array.isArray(branchesData) ? branchesData : []);
    } catch (err: any) {
      onTriggerToast('error', 'Failed to Load Sales Team', err.message || 'Could not retrieve sales team data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, branchFilter]);

  // Clean up camera stream when face modal closes
  useEffect(() => {
    if (!isFaceModalOpen) {
      stopCamera();
    }
  }, [isFaceModalOpen]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera capture is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err.message || 'Failed to access camera device.');
      setIsCameraActive(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: CREATE REPRESENTATIVE
  // ────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setCreateFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      branchId: branches.length > 0 ? branches[0].id : null,
      isActive: true
    });
    setConfirmPassword('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.password !== confirmPassword) {
      onTriggerToast('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (createFormData.password.length < 8) {
      onTriggerToast('error', 'Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await salesTeamService.createSalesRepresentative(createFormData, user?.companyId);
      onTriggerToast('success', 'Sales Representative Created', `Created account for ${created.displayName}.`);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Creation Failed', err.message || 'Failed to create sales representative.');
    } finally {
      setIsCreating(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: EDIT REPRESENTATIVE
  // ────────────────────────────────────────────────────────
  const handleOpenEditModal = (rep: SalesRepresentativeDto) => {
    setSelectedRep(rep);
    setEditFormData({
      firstName: rep.firstName,
      lastName: rep.lastName,
      email: rep.email,
      phone: rep.phone,
      branchId: rep.branchId || null,
      isActive: rep.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    setIsUpdating(true);
    try {
      await salesTeamService.updateSalesRepresentative(selectedRep.id, editFormData);
      onTriggerToast('success', 'Representative Updated', `Updated profile for ${editFormData.firstName} ${editFormData.lastName}.`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Update Failed', err.message || 'Failed to update representative.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: TOGGLE ACTIVE STATUS
  // ────────────────────────────────────────────────────────
  const handleToggleStatus = async (rep: SalesRepresentativeDto) => {
    const newStatus = !rep.isActive;
    try {
      await salesTeamService.toggleSalesRepresentativeStatus(rep.id, newStatus);
      onTriggerToast(
        newStatus ? 'success' : 'warning',
        newStatus ? 'Representative Activated' : 'Representative Deactivated',
        `${rep.displayName} is now ${newStatus ? 'Active' : 'Inactive'}.`
      );
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Status Update Failed', err.message || 'Could not update status.');
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: RESET PASSWORD
  // ────────────────────────────────────────────────────────
  const handleOpenResetPasswordModal = (rep: SalesRepresentativeDto) => {
    setSelectedRep(rep);
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    if (newPassword !== confirmNewPassword) {
      onTriggerToast('error', 'Password Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      onTriggerToast('error', 'Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await salesTeamService.resetSalesRepresentativePassword(selectedRep.id, newPassword);
      onTriggerToast('success', 'Password Reset Successful', `New password has been set for ${selectedRep.displayName}.`);
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      onTriggerToast('error', 'Reset Failed', err.message || 'Failed to reset password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: ASSIGN CUSTOMERS
  // ────────────────────────────────────────────────────────
  const handleOpenAssignCustomersModal = async (rep: SalesRepresentativeDto) => {
    setSelectedRep(rep);
    setCustomerSearchQuery('');
    setAssignedCustomerIds([]);
    setIsAssignCustomersModalOpen(true);

    try {
      const assigned = await salesTeamService.fetchAssignedCustomers(rep.id);
      setAssignedCustomerIds(assigned.map(c => c.id));
    } catch (err: any) {
      onTriggerToast('warning', 'Loading Assignments', 'Could not load existing store assignments.');
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    setAssignedCustomerIds(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    const allFilteredIds = filteredCustomers.map(c => c.id);
    setAssignedCustomerIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleClearAllCustomers = () => {
    setAssignedCustomerIds([]);
  };

  const handleSaveAssignments = async () => {
    if (!selectedRep) return;

    setIsSavingAssignments(true);
    try {
      const count = await salesTeamService.assignCustomers(selectedRep.id, assignedCustomerIds);
      onTriggerToast('success', 'Customer Stores Assigned', `Successfully assigned ${count} store outlets to ${selectedRep.displayName}.`);
      setIsAssignCustomersModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Assignment Failed', err.message || 'Failed to assign customer stores.');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: LOCATION ENROLLMENT
  // ────────────────────────────────────────────────────────
  const handleOpenLocationModal = async (rep: SalesRepresentativeDto) => {
    setSelectedRep(rep);
    setIsLoadingLocation(true);
    setIsLocationModalOpen(true);

    try {
      const loc = await salesTeamService.getSalesRepLocation(rep.id);
      setExistingLocation(loc);
      if (loc) {
        setLocationFormData({
          locationName: loc.locationName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          allowedRadiusMeters: loc.allowedRadiusMeters || 50.0
        });
      } else {
        setLocationFormData({
          locationName: rep.branchName ? `${rep.branchName} Store Base` : `${rep.displayName} Work Area`,
          latitude: 28.6139,
          longitude: 77.2090,
          allowedRadiusMeters: 50.0
        });
        autoDetectGpsLocation();
      }
    } catch (err: any) {
      onTriggerToast('warning', 'Location Data', 'Could not load existing location details.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const autoDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      onTriggerToast('warning', 'GPS Unavailable', 'Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationFormData(prev => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }));
        setIsDetectingGps(false);
        onTriggerToast('info', 'GPS Located', `Acquired coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      err => {
        setIsDetectingGps(false);
        onTriggerToast('warning', 'GPS Signal Error', err.message || 'Could not acquire precise GPS fix.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    if (!locationFormData.locationName.trim()) {
      onTriggerToast('error', 'Validation Error', 'Location name is required.');
      return;
    }

    setIsSavingLocation(true);
    try {
      const enrolled = await salesTeamService.registerSalesRepLocation(selectedRep.id, {
        locationName: locationFormData.locationName.trim(),
        latitude: Number(locationFormData.latitude),
        longitude: Number(locationFormData.longitude),
        allowedRadiusMeters: Number(locationFormData.allowedRadiusMeters) || 50.0
      });

      onTriggerToast('success', 'Location Enrolled', `Enrolled login location "${enrolled.locationName}" (Radius: ${enrolled.allowedRadiusMeters}m).`);
      setIsLocationModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Enrollment Failed', err.message || 'Failed to save location enrollment.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!selectedRep) return;
    if (!window.confirm(`Are you sure you want to remove the enrolled login location for ${selectedRep.displayName}?`)) {
      return;
    }

    setIsSavingLocation(true);
    try {
      await salesTeamService.deleteSalesRepLocation(selectedRep.id);
      onTriggerToast('success', 'Location Removed', `Enrolled location for ${selectedRep.displayName} has been deactivated.`);
      setIsLocationModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Delete Failed', err.message || 'Could not remove location enrollment.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // HANDLERS: FACE BIOMETRIC ENROLLMENT
  // ────────────────────────────────────────────────────────
  const handleOpenFaceModal = async (rep: SalesRepresentativeDto) => {
    setSelectedRep(rep);
    setIsLoadingFaceStatus(true);
    setIsFaceModalOpen(true);
    setCameraError(null);

    try {
      const status = await salesTeamService.getSalesRepBiometricStatus(rep.id);
      setFaceBiometricStatus(status);
    } catch (err: any) {
      setFaceBiometricStatus(null);
    } finally {
      setIsLoadingFaceStatus(false);
    }

    startCamera();
  };

  const handleCaptureAndEnrollFace = async () => {
    if (!selectedRep || !videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      onTriggerToast('error', 'Camera Not Ready', 'Video feed is initializing, please wait a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    setIsEnrollingFace(true);
    try {
      await salesTeamService.enrollSalesRepFace(selectedRep.id, base64);
      onTriggerToast('success', 'Face Biometric Enrolled', `Facial biometric template successfully registered for ${selectedRep.displayName}.`);
      setIsFaceModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Enrollment Failed', err.message || 'Could not enroll facial biometrics.');
    } finally {
      setIsEnrollingFace(false);
    }
  };

  const handleDeleteFace = async () => {
    if (!selectedRep) return;
    if (!window.confirm(`Are you sure you want to remove the enrolled face template for ${selectedRep.displayName}?`)) {
      return;
    }

    setIsDeletingFace(true);
    try {
      await salesTeamService.deleteSalesRepFace(selectedRep.id);
      onTriggerToast('success', 'Face Biometrics Removed', `Deactivated biometric template for ${selectedRep.displayName}.`);
      setIsFaceModalOpen(false);
      loadData();
    } catch (err: any) {
      onTriggerToast('error', 'Deletion Failed', err.message || 'Could not delete face template.');
    } finally {
      setIsDeletingFace(false);
    }
  };

  // Helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filtered Customers for Assignment Modal
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(c =>
      c.legalName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Statistics
  const totalReps = salesReps.length;
  const activeReps = salesReps.filter(r => r.isActive).length;
  const totalAssignedCustomers = salesReps.reduce((sum, r) => sum + r.assignedCustomersCount, 0);
  const locationEnrolledReps = salesReps.filter(r => r.locationRegistered).length;
  const faceEnrolledReps = salesReps.filter(r => r.faceRegistered).length;

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: EXECUTIVE HEADER & KPI CARDS ── */}
      <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl shrink-0">
            <Users2 size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Sales Team Management</h2>
              {user?.companyName && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-brand-primary border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Building size={11} /> {user.companyName} Scope
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Create and manage field sales representatives, login location geofences, facial biometrics, and store territory mappings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-brand-primary' : ''} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Sales Representative</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 2: STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales Representatives"
          value={totalReps.toString()}
          badgeText="Company Roster"
          badgeVariant="primary"
          subLabel="Active Field Reps"
          subValue={activeReps.toString()}
        />
        <StatCard
          title="Location Geofencing"
          value={`${locationEnrolledReps} / ${totalReps}`}
          badgeText={locationEnrolledReps === totalReps && totalReps > 0 ? "100% Enrolled" : "Geofenced"}
          badgeVariant="info"
          subLabel="Enrolled Logins"
          subValue={`${locationEnrolledReps} Reps`}
        />
        <StatCard
          title="Face Biometrics"
          value={`${faceEnrolledReps} / ${totalReps}`}
          badgeText="Biometric Security"
          badgeVariant="success"
          subLabel="Verified Profiles"
          subValue={`${faceEnrolledReps} Reps`}
        />
        <StatCard
          title="Assigned Store Outlets"
          value={totalAssignedCustomers.toString()}
          badgeText="Territory Reach"
          badgeVariant="warning"
          subLabel="Total Available Stores"
          subValue={customers.length.toString()}
        />
      </div>

      {/* ── SECTION 3: REPS TABLE ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-xs overflow-hidden space-y-4 p-4">
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, code, username, email, phone..."
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="p-2 border rounded-lg border-slate-300 text-slate-800 bg-white"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>

            <div className="flex border rounded-lg overflow-hidden border-slate-200">
              {(['All', 'Active', 'Inactive'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition ${
                    statusFilter === st
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-16 flex justify-center items-center text-slate-500 gap-2 text-xs">
            <RefreshCw size={18} className="animate-spin text-brand-primary" /> Loading sales representatives...
          </div>
        ) : salesReps.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No Sales Representatives Found"
            description="Create your company's field sales representatives to start enrolling locations, face biometrics, and taking orders."
            action={
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Add Sales Representative
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Sales Representative</th>
                  <th className="p-3">Login Username</th>
                  <th className="p-3">Assigned Branch</th>
                  <th className="p-3 text-center">Assigned Stores</th>
                  <th className="p-3">Location Status</th>
                  <th className="p-3">Face Biometrics</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReps.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition">
                    {/* Rep identity */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center border border-brand-primary/20 shrink-0">
                          {getInitials(rep.displayName)}
                        </div>
                        <div>
                          <span className="font-bold block text-slate-900">{rep.displayName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{rep.employeeCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username & Contact */}
                    <td className="p-3">
                      <span className="font-mono font-semibold text-slate-800 block">{rep.username}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Mail size={10} className="text-slate-400" /> {rep.email}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="p-3">
                      {rep.branchName ? (
                        <span className="flex items-center gap-1 text-slate-800 font-medium">
                          <Building size={12} className="text-slate-400" /> {rep.branchName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Headquarters / Main</span>
                      )}
                    </td>

                    {/* Stores */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenAssignCustomersModal(rep)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-brand-primary border border-blue-200 rounded-full font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Click to manage customer store assignments"
                      >
                        <Store size={12} />
                        <span>{rep.assignedCustomersCount} Stores</span>
                      </button>
                    </td>

                    {/* Location Status */}
                    <td className="p-3">
                      {rep.locationRegistered ? (
                        <div className="space-y-0.5">
                          <button
                            onClick={() => handleOpenLocationModal(rep)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                            title="Click to manage enrolled login location"
                          >
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Location Registered</span>
                          </button>
                          {rep.locationName && (
                            <span className="block text-[10px] text-slate-500 truncate max-w-[140px]" title={rep.locationName}>
                              {rep.locationName} ({rep.allowedRadiusMeters ?? 50}m)
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenLocationModal(rep)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                          title="Click to register login location"
                        >
                          <AlertTriangle size={11} className="text-amber-600" />
                          <span>Not Registered</span>
                        </button>
                      )}
                    </td>

                    {/* Face Biometrics Status */}
                    <td className="p-3">
                      {rep.faceRegistered ? (
                        <button
                          onClick={() => handleOpenFaceModal(rep)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                          title="Click to manage / re-enroll facial biometrics"
                        >
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Face Registered</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenFaceModal(rep)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                          title="Click to enroll facial biometrics"
                        >
                          <AlertTriangle size={11} className="text-amber-600" />
                          <span>Not Registered</span>
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <Badge variant={rep.isActive ? 'success' : 'neutral'}>
                        {rep.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Action buttons */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenLocationModal(rep)}
                          className="p-1.5 border rounded-md text-emerald-700 hover:bg-emerald-50 border-emerald-200 cursor-pointer"
                          title="Manage Login Location Geofence"
                        >
                          <MapPin size={13} />
                        </button>

                        <button
                          onClick={() => handleOpenFaceModal(rep)}
                          className="p-1.5 border rounded-md text-indigo-700 hover:bg-indigo-50 border-indigo-200 cursor-pointer"
                          title="Enroll / Manage Facial Biometrics"
                        >
                          <Camera size={13} />
                        </button>

                        <button
                          onClick={() => handleOpenAssignCustomersModal(rep)}
                          className="p-1.5 border rounded-md text-brand-primary hover:bg-blue-50 border-blue-200 cursor-pointer"
                          title="Assign Customer Stores"
                        >
                          <Store size={13} />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(rep)}
                          className="p-1.5 border rounded-md text-slate-700 hover:bg-slate-100 border-slate-200 cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleOpenResetPasswordModal(rep)}
                          className="p-1.5 border rounded-md text-amber-700 hover:bg-amber-50 border-amber-200 cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound size={13} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(rep)}
                          className={`p-1.5 border rounded-md cursor-pointer ${
                            rep.isActive
                              ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                          }`}
                          title={rep.isActive ? 'Deactivate Representative' : 'Activate Representative'}
                        >
                          {rep.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 1: REGISTER / MANAGE LOGIN LOCATION               */}
      {/* ════════════════════════════════════════════════════════ */}
      {isLocationModalOpen && selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {existingLocation ? 'Manage Login Location' : 'Register Login Location'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRep.displayName} ({selectedRep.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            {isLoadingLocation ? (
              <div className="p-8 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
                <Loader2 size={16} className="animate-spin text-brand-primary" /> Loading location enrollment...
              </div>
            ) : (
              <form onSubmit={handleSaveLocation} className="p-5 space-y-4 text-xs">
                {/* Location Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location Name / Site Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={locationFormData.locationName}
                    onChange={e => setLocationFormData({ ...locationFormData, locationName: e.target.value })}
                    placeholder="e.g. South Delhi Territory Hub, Karol Bagh Central Base"
                    className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                {/* GPS Coordinates with Auto Detect */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      GPS Coordinates (Latitude, Longitude) *
                    </label>
                    <button
                      type="button"
                      onClick={autoDetectGpsLocation}
                      disabled={isDetectingGps}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      {isDetectingGps ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      <span>Auto-Detect Live GPS</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Latitude (-90 to +90)</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={locationFormData.latitude}
                        onChange={e => setLocationFormData({ ...locationFormData, latitude: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border rounded-lg border-slate-300 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Longitude (-180 to +180)</span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={locationFormData.longitude}
                        onChange={e => setLocationFormData({ ...locationFormData, longitude: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border rounded-lg border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Allowed Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Allowed Login Radius (Default: 50m) *
                    </label>
                    <span className="font-bold text-brand-primary text-xs font-mono">
                      {locationFormData.allowedRadiusMeters} meters
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {[25, 50, 100, 250, 500].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setLocationFormData({ ...locationFormData, allowedRadiusMeters: r })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition cursor-pointer ${
                          locationFormData.allowedRadiusMeters === r
                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}m {r === 50 ? '(Default)' : ''}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={locationFormData.allowedRadiusMeters}
                    onChange={e => setLocationFormData({ ...locationFormData, allowedRadiusMeters: parseInt(e.target.value) || 50 })}
                    className="w-full accent-brand-primary cursor-pointer"
                  />
                </div>

                {/* Information Callout */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-700 flex items-start gap-2 text-[11px]">
                  <ShieldCheck size={16} className="text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Server-Authoritative Geofencing</span>
                    <span>
                      When {selectedRep.displayName} logs in, the backend computes the exact Haversine distance. If outside {locationFormData.allowedRadiusMeters}m, login requires an Admin Temporary PIN override.
                    </span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {existingLocation ? (
                    <button
                      type="button"
                      onClick={handleDeleteLocation}
                      disabled={isSavingLocation}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Remove Geofence</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(false)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingLocation}
                      className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSavingLocation && <Loader2 size={13} className="animate-spin" />}
                      <span>Save Location Geofence</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 2: ENROLL / MANAGE FACIAL BIOMETRICS              */}
      {/* ════════════════════════════════════════════════════════ */}
      {isFaceModalOpen && selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {faceBiometricStatus?.faceRegistered ? 'Re-enroll Facial Biometrics' : 'Enroll Facial Biometrics'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRep.displayName} ({selectedRep.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFaceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Camera Preview Area */}
              <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {cameraError ? (
                  <div className="p-6 text-center text-rose-300 space-y-2">
                    <AlertTriangle size={28} className="mx-auto text-rose-400" />
                    <p className="font-bold">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold transition"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Face target overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-60 border-2 border-dashed border-emerald-400/80 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-44 h-56 border border-emerald-300/40 rounded-full" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white p-2 rounded-lg text-[11px] flex items-center justify-between border border-white/10">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Biometric Scanner
                      </span>
                      <span className="text-slate-300">Align face inside oval</span>
                    </div>
                  </>
                )}
              </div>

              {/* Status info */}
              {faceBiometricStatus?.faceRegistered && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Biometric Template Registered</span>
                      <span className="text-emerald-700">
                        Version {faceBiometricStatus.templateVersion ?? 1} • {new Date(faceBiometricStatus.faceEnrolledAtUtc || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteFace}
                    disabled={isDeletingFace}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition"
                    title="Remove Biometric Template"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaceModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCaptureAndEnrollFace}
                  disabled={isEnrollingFace || !isCameraActive}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isEnrollingFace ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing Template...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      <span>{faceBiometricStatus?.faceRegistered ? 'Re-enroll Face' : 'Capture & Enroll Face'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CREATE SALES REPRESENTATIVE                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Add Sales Representative</h3>
                  <p className="text-xs text-slate-500">Create new sales field representative account for your company</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.firstName}
                    onChange={e => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.lastName}
                    onChange={e => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                    placeholder="e.g. Kumar"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.username}
                    onChange={e => setCreateFormData({ ...createFormData, username: e.target.value })}
                    placeholder="e.g. ramesh.sales"
                    className="w-full p-2.5 border rounded-lg border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="ramesh@company.com"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={createFormData.phone}
                    onChange={e => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned Branch</label>
                  <select
                    value={createFormData.branchId || ''}
                    onChange={e => setCreateFormData({ ...createFormData, branchId: e.target.value || null })}
                    className="w-full p-2.5 border rounded-lg border-slate-300 bg-white"
                  >
                    <option value="">Headquarters / Main Base</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={createFormData.password}
                    onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={createFormData.isActive}
                  onChange={e => setCreateFormData({ ...createFormData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                />
                <label htmlFor="createIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Activate account immediately upon creation
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isCreating && <Loader2 size={13} className="animate-spin" />}
                  <span>Create Representative</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 4: EDIT SALES REPRESENTATIVE                      */}
      {/* ════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-200 text-slate-800 rounded-lg">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Sales Representative</h3>
                  <p className="text-xs text-slate-500">{selectedRep.displayName} ({selectedRep.employeeCode})</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned Branch</label>
                <select
                  value={editFormData.branchId || ''}
                  onChange={e => setEditFormData({ ...editFormData, branchId: e.target.value || null })}
                  className="w-full p-2.5 border rounded-lg border-slate-300 bg-white"
                >
                  <option value="">Headquarters / Main Base</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editFormData.isActive}
                  onChange={e => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active Representative Account
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isUpdating && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 5: ASSIGN CUSTOMER STORES                         */}
      {/* ════════════════════════════════════════════════════════ */}
      {isAssignCustomersModalOpen && selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-brand-primary rounded-lg">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Assign Retail Customer Outlets</h3>
                  <p className="text-xs text-slate-500">
                    Assign stores to <strong className="text-slate-800">{selectedRep.displayName}</strong> ({assignedCustomerIds.length} Selected)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignCustomersModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="w-full sm:w-72">
                <SearchInput
                  value={customerSearchQuery}
                  onChange={setCustomerSearchQuery}
                  placeholder="Search stores by name, code, city..."
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCustomers}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md font-semibold text-slate-700 cursor-pointer"
                >
                  Select All Filtered
                </button>
                <button
                  type="button"
                  onClick={handleClearAllCustomers}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-md font-semibold text-slate-700 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Store List Checklist */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No matching customer outlets found in your company.
                </div>
              ) : (
                filteredCustomers.map(customer => {
                  const isChecked = assignedCustomerIds.includes(customer.id);
                  return (
                    <label
                      key={customer.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCustomer(customer.id)}
                          className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{customer.legalName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {customer.code} {customer.tradeName ? `• ${customer.tradeName}` : ''} {customer.city ? `• ${customer.city}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500">
                        {customer.phone && <span className="block font-mono">{customer.phone}</span>}
                        {isChecked && (
                          <span className="text-brand-primary font-bold text-[10px] uppercase tracking-wider flex items-center gap-0.5 justify-end">
                            <Check size={11} /> Assigned
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-brand-border bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600 font-semibold">
                {assignedCustomerIds.length} customer outlets assigned
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignCustomersModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={isSavingAssignments}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                >
                  {isSavingAssignments && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Store Assignments</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL 6: RESET PASSWORD                                 */}
      {/* ════════════════════════════════════════════════════════ */}
      {isResetPasswordModalOpen && selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-brand-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Reset Sales Rep Password</h3>
                  <p className="text-xs text-slate-500">{selectedRep.displayName} ({selectedRep.email})</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 border rounded-lg border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isResettingPassword && <Loader2 size={13} className="animate-spin" />}
                  <span>Set New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
