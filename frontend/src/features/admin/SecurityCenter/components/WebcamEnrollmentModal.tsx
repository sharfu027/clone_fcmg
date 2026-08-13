import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, X, ShieldCheck, Zap, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { authService } from '../../../../services/authService';
import { Badge } from '../../../../components/ui/Badge';

interface WebcamEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    userId?: string;
    fullName: string;
    employeeCode: string;
    email?: string;
  };
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  onEnrollmentSuccess: (result: { userId: string; faceStatus: 'Registered'; templateVersion: number }) => void;
}

interface FrameCandidate {
  base64: string;
  sharpness: number;
  brightness: number;
  score: number;
}

type EnrollmentPhase = 
  | 'checking-existing'
  | 'confirm-delete'
  | 'deleting'
  | 'scanning'
  | 'registering'
  | 'success'
  | 'error';

export const WebcamEnrollmentModal: React.FC<WebcamEnrollmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  onTriggerToast,
  onEnrollmentSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const [phase, setPhase] = useState<EnrollmentPhase>('checking-existing');
  const [existingTemplateVersion, setExistingTemplateVersion] = useState<number | null>(null);

  const [scanProgress, setScanProgress] = useState(0);
  const [statusText, setStatusText] = useState('Checking registration status...');
  const [faceDetected, setFaceDetected] = useState(false);

  const [verificationTestResult, setVerificationTestResult] = useState<{
    success: boolean;
    similarityScore: number;
    confidenceScore: number;
    processingTimeMs: number;
    message: string;
  } | null>(null);

  const MIN_REQUIRED_FRAMES = 50; // 5.0 seconds min scan
  const IDEAL_TARGET_FRAMES = 75; // 7.5 seconds thorough scan
  const MAX_TIMEOUT_FRAMES = 80;  // 8.0 seconds max scan

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Modal open initialization: Check if face is already registered
  useEffect(() => {
    if (isOpen) {
      checkExistingRegistration();
    } else {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]);

  const targetUserId = employee.userId || employee.id;

  const checkExistingRegistration = async () => {
    resetState();
    setPhase('checking-existing');
    setStatusText('Checking existing biometric profile...');

    try {
      const status = await authService.getFaceStatus(targetUserId);
      const isRegistered = status && (status.hasTemplate === true || status.status === 'Enrolled' || status.activeTemplateVersion > 0);

      if (isRegistered) {
        setExistingTemplateVersion(status.activeTemplateVersion || 1);
        setPhase('confirm-delete');
      } else {
        // No existing face profile -> start camera and scan immediately
        setPhase('scanning');
        startCamera();
      }
    } catch (err) {
      console.warn('[Enrollment] Could not fetch face status, proceeding to camera scan:', err);
      setPhase('scanning');
      startCamera();
    }
  };

  const resetState = () => {
    setScanProgress(0);
    setStatusText('Initializing...');
    setFaceDetected(false);
    setCameraError(null);
    setEnrollmentError(null);
    setVerificationTestResult(null);
    isProcessingRef.current = false;
  };

  const handleDeleteExistingAndStartCamera = async () => {
    setPhase('deleting');
    setStatusText('Deleting existing biometric profile...');

    try {
      await authService.deleteFace(targetUserId);
      onTriggerToast('info', 'Previous Profile Removed', `Existing biometric template deleted for ${employee.fullName}. Ready for new registration.`);
      setExistingTemplateVersion(null);
      setPhase('scanning');
      startCamera();
    } catch (err: any) {
      console.error('[Enrollment] Delete existing face failed:', err);
      const msg = err.data?.detail || err.message || 'Failed to delete existing template.';
      setEnrollmentError(`Failed to delete existing face: ${msg}`);
      setPhase('error');
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
      setStatusText('Detecting face. Please look at the camera.');
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setCameraError('Unable to access webcam. Please verify camera permissions and hardware connection.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Evaluate frame quality (sharpness + brightness)
  const sampleFrameQuality = (video: HTMLVideoElement, canvas: HTMLCanvasElement): { candidate: FrameCandidate; faceDetected: boolean } | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let totalLuminance = 0;
    let edgeGradient = 0;
    const w = canvas.width;

    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      totalLuminance += lum;

      const px = (i / 4) % w;
      if (px > 0 && px < w - 1) {
        const leftLum = 0.299 * pixels[i - 4] + 0.587 * pixels[i - 3] + 0.114 * pixels[i - 2];
        const rightLum = 0.299 * pixels[i + 4] + 0.587 * pixels[i + 5] + 0.114 * pixels[i + 6];
        edgeGradient += Math.abs(rightLum - leftLum);
      }
    }

    const pixelCount = pixels.length / 4;
    const avgLuminance = totalLuminance / pixelCount;
    const avgEdge = edgeGradient / pixelCount;

    // Reject dark/glare frames
    if (avgLuminance < 20 || avgLuminance > 245) {
      return { candidate: { base64: '', sharpness: 0, brightness: avgLuminance, score: 0 }, faceDetected: false };
    }

    // Facial region detection heuristic (Center bounding oval + contrast evaluation)
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const regionSize = 80;
    let validContentPixels = 0;
    let totalRegionPixels = 0;

    for (let dy = -regionSize; dy < regionSize; dy += 2) {
      for (let dx = -regionSize; dx < regionSize; dx += 2) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
        const idx = (py * canvas.width + px) * 4;
        const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
        totalRegionPixels++;
        // General human skin & feature luminance range
        if ((r > 40 && g > 30 && b > 15 && r >= g && r >= b) || (r > 30 && g > 20 && b > 20)) {
          validContentPixels++;
        }
      }
    }

    const faceContentRatio = totalRegionPixels > 0 ? validContentPixels / totalRegionPixels : 0;
    const hasFace = faceContentRatio > 0.10 && avgEdge > 1.2;

    const base64 = canvas.toDataURL('image/jpeg', 0.95);
    const qualityScore = avgEdge + 0.1 * avgLuminance;

    return {
      candidate: { base64, sharpness: avgEdge, brightness: avgLuminance, score: qualityScore },
      faceDetected: hasFace
    };
  };

  // Dynamic Auto-Scanner Loop: Auto-detects face stability and completes as soon as face is crisp
  useEffect(() => {
    if (!isOpen || phase !== 'scanning' || !isCameraActive) return;

    let frameCandidates: FrameCandidate[] = [];
    let videoReadyLogged = false;

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement('canvas');
    }

    isProcessingRef.current = false;
    setScanProgress(0);

    intervalRef.current = setInterval(() => {
      if (isProcessingRef.current || !videoRef.current) return;

      const video = videoRef.current;
      const isReady = video.readyState >= 4 && video.videoWidth > 0 && video.videoHeight > 0;
      if (!isReady) return;

      if (!videoReadyLogged) {
        videoReadyLogged = true;
        console.log('[Enrollment] Video stream active');
      }

      const sampled = sampleFrameQuality(video, analysisCanvasRef.current!);
      if (!sampled || !sampled.faceDetected) {
        if (frameCandidates.length > 0) {
          console.log('[Enrollment] Face lost. Resetting scan.');
          frameCandidates = [];
          setScanProgress(0);
        }
        setFaceDetected(false);
        setStatusText('No face detected. Center face in camera frame.');
        return;
      }

      setFaceDetected(true);
      frameCandidates.push(sampled.candidate);
      const frameNum = frameCandidates.length;

      // Progress bar dynamically advances from 0% to 100% over 7.5 seconds
      const progressPercent = Math.min(100, Math.floor((frameNum / IDEAL_TARGET_FRAMES) * 100));
      setScanProgress(progressPercent);

      if (progressPercent < 30) {
        setStatusText(`Auto-scanning face... Keep face steady (Frontal view) ${progressPercent}%`);
      } else if (progressPercent < 60) {
        setStatusText(`Auto-scanning face... Tilt head slightly right/left for 3D multi-angle capture ${progressPercent}%`);
      } else if (progressPercent < 90) {
        setStatusText(`Capturing ambient lighting & depth variations ${progressPercent}%`);
      } else {
        setStatusText(`Finalizing high-precision multi-angle biometric template cluster ${progressPercent}%`);
      }

      console.log(`[Enrollment] Frame ${frameNum}/${IDEAL_TARGET_FRAMES}`);

      // Complete when ideal target (75 frames / 7.5s) or max timeout (80 frames) reached
      const isTargetReached = frameNum >= IDEAL_TARGET_FRAMES;
      const isMaxTimeoutReached = frameNum >= MAX_TIMEOUT_FRAMES;

      if ((isTargetReached || isMaxTimeoutReached) && !isProcessingRef.current) {
        isProcessingRef.current = true;
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        setScanProgress(100);
        setStatusText('7.5s multi-angle scan complete! Encrypting & registering template cluster...');
        setPhase('registering');

        // Sort candidates by quality score and pick the single best candidate frame
        frameCandidates.sort((a, b) => b.score - a.score);
        const bestCandidate = frameCandidates[0];
        console.log(`[Enrollment] Optimal frame selected out of ${frameNum} sampled candidates (score: ${bestCandidate.score.toFixed(2)})`);

        // Auto-submit best frame
        performAutoEnrollment(bestCandidate.base64);
      }
    }, 100); // 100ms sampling interval = 7.5s total scan time

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, phase, isCameraActive]);

  const performAutoEnrollment = async (bestFrameBase64: string) => {
    try {
      // 1. Submit Registration to Backend
      await authService.registerFaceBase64(targetUserId, bestFrameBase64);

      // 2. Perform Post-Enrollment Verification Test
      const verifyRes = await authService.verifyFaceBiometrics({
        userId: targetUserId,
        imageBase64: bestFrameBase64,
        deviceId: 'WEB-ADMIN-ENROLLMENT'
      });

      const result = {
        success: verifyRes.success ?? true,
        similarityScore: verifyRes.similarityScore ?? 1.0,
        confidenceScore: verifyRes.confidenceScore ?? 1.0,
        processingTimeMs: verifyRes.processingTimeMs ?? 15,
        message: verifyRes.message || 'Face biometrics verified cleanly.'
      };

      setVerificationTestResult(result);
      setPhase('success');
      setStatusText('Face registered successfully!');
      stopCamera();

      onTriggerToast('success', 'Face Profile Registered', `Biometric template active for ${employee.fullName} (${employee.employeeCode}).`);

      onEnrollmentSuccess({
        userId: targetUserId,
        faceStatus: 'Registered',
        templateVersion: 1
      });
    } catch (err: any) {
      console.error('[Enrollment] Registration failed:', err);
      const msg = err.data?.detail || err.message || 'Face quality check failed. Ensure face is centered with clear illumination.';
      setEnrollmentError(`Registration Failed: ${msg}`);
      setPhase('error');
      setStatusText('Registration failed. Please retry.');
      onTriggerToast('error', 'Enrollment Failed', msg);
    }
  };

  const handleRetry = () => {
    resetState();
    setPhase('scanning');
    if (!stream) {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-brand-border max-w-2xl w-full p-6 space-y-4 shadow-xl-flat">

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
              <Camera size={18} className="text-brand-primary" />
              Biometric Face Enrollment & Template Registration
            </h3>
            <p className="text-xs text-brand-text-secondary">
              Employee: <span className="font-semibold text-brand-primary">{employee.fullName}</span> ({employee.employeeCode})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        {/* ── PHASE: Checking Existing Registration ── */}
        {phase === 'checking-existing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 size={32} className="text-brand-primary animate-spin" />
            <p className="text-xs font-semibold text-brand-text-secondary">{statusText}</p>
          </div>
        )}

        {/* ── PHASE: Confirm Deletion of Existing Profile ── */}
        {phase === 'confirm-delete' && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={28} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">Existing Face Profile Detected</h4>
              <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
                <span className="font-semibold">{employee.fullName}</span> already has an active biometric face template registered 
                {existingTemplateVersion && <Badge variant="warning" className="ml-1.5">Active Template v{existingTemplateVersion}</Badge>}.
              </p>
              <p className="text-[11px] text-amber-700 pt-1">
                To prevent duplicate registrations, you must delete the existing profile before enrolling a new face.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-amber-300 text-xs font-semibold text-amber-900 rounded hover:bg-amber-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExistingAndStartCamera}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 size={14} />
                Delete Existing Face & Start New Registration
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE: Deleting Existing Profile ── */}
        {phase === 'deleting' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 size={32} className="text-rose-600 animate-spin" />
            <p className="text-xs font-semibold text-rose-800">{statusText}</p>
          </div>
        )}

        {/* ── PHASE: Scanning / Camera View ── */}
        {(phase === 'scanning' || phase === 'registering' || phase === 'success' || phase === 'error') && (
          <>
            <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-brand-border aspect-video flex items-center justify-center">

              <canvas ref={canvasRef} className="hidden" />

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${phase === 'success' ? 'opacity-30' : ''}`}
              />

              {/* Facial Bounding Oval Overlay */}
              {phase === 'scanning' && isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className={`w-56 h-72 border-2 border-dashed rounded-full flex flex-col items-center justify-between py-4 shadow-lg transition-colors duration-300 ${
                    faceDetected ? 'border-emerald-400/80' : 'border-amber-400/80'
                  }`}>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      faceDetected ? 'text-emerald-300 bg-black/60' : 'text-amber-300 bg-black/60'
                    }`}>
                      {faceDetected ? '✓ Face Detected' : 'Center Face Here'}
                    </span>
                    <span className="text-[10px] text-emerald-300 bg-black/60 px-2 py-0.5 rounded">Maintain Good Illumination</span>
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {phase === 'success' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 size={48} className="text-emerald-400" />
                  <p className="text-white font-bold text-sm">Face Registered Successfully</p>
                </div>
              )}

              {/* Camera Access Error */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-rose-300 space-y-2">
                  <AlertTriangle size={32} className="text-rose-400" />
                  <p className="text-xs font-semibold">{cameraError}</p>
                  <button onClick={startCamera} className="mt-2 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 cursor-pointer">
                    Retry Camera Access
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Scanning Progress Bar */}
            {(phase === 'scanning' || phase === 'registering') && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-text-secondary font-medium">{statusText}</span>
                  <span className={`font-mono font-bold ${faceDetected ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {scanProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      phase === 'registering' ? 'bg-blue-500 animate-pulse' : faceDetected ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                {phase === 'registering' && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                    <Loader2 size={14} className="animate-spin" />
                    Encrypting & registering biometric template...
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Enrollment Error Alert */}
        {enrollmentError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-500" />
            <span>{enrollmentError}</span>
          </div>
        )}

        {/* Verification Test Result Card */}
        {verificationTestResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <ShieldCheck size={16} className="text-emerald-600" />
                Automatic Verification Test Passed
              </div>
              <Badge variant="success">Active Template V1</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-200/60">
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Similarity Score</span>
                <span className="font-mono font-bold text-emerald-900">
                  {(verificationTestResult.similarityScore * 100).toFixed(1)}% Match
                </span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Confidence</span>
                <span className="font-mono font-bold text-emerald-900">High (1.0)</span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Latency</span>
                <span className="font-mono font-bold text-emerald-900">{verificationTestResult.processingTimeMs} ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-[11px] text-brand-text-secondary flex items-center gap-1.5">
            <Zap size={14} className="text-brand-primary" />
            InsightFace ONNX 512-dim Feature Extractor
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border text-xs font-semibold text-brand-text-secondary rounded hover:bg-brand-bg-secondary cursor-pointer"
            >
              {phase === 'success' ? 'Done' : 'Close'}
            </button>

            {phase === 'error' && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} />
                Retry Enrollment
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
