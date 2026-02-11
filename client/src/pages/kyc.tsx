import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Upload,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileImage,
  User,
  Video,
} from "lucide-react";

const STEPS = ["Aadhaar Front", "Aadhaar Back", "PAN Card", "Live Selfie"];

const DOC_TYPE_MAP: Record<string, string> = {
  aadhaar_front: "Aadhaar_Front",
  aadhaar_back: "aadhaar_back",
  pan_card: "PAN",
  selfie: "selfie",
};

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export default function KycPage() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    aadhaar_front: null,
    aadhaar_back: null,
    pan_card: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [verificationStatus, setVerificationStatus] = useState<{ [key: string]: { verified: boolean; reason?: string; loading?: boolean; extractedData?: any } }>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: kycStatus, isLoading: kycLoading } = useQuery<{
    kycStatus: string;
    rejectionReason: string | null;
    kycData: any;
  }>({
    queryKey: ["/api/kyc/status"],
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (files.aadhaar_front) formData.append("aadhaar_front", files.aadhaar_front);
      if (files.aadhaar_back) formData.append("aadhaar_back", files.aadhaar_back);
      if (files.pan_card) formData.append("pan_card", files.pan_card);
      if (files.selfie) formData.append("selfie", files.selfie);

      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const verifyImage = async (file: File, docType: string): Promise<{ valid: boolean; reason: string; extracted_data?: any }> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("documentType", docType);

    const res = await fetch("/api/kyc/verify-image", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { valid: false, reason: errData.reason || "Verification service unavailable. Please try again." };
    }
    return res.json();
  };

  const handleFileSelect = async (file: File, fieldKey: string) => {
    const reader = new FileReader();
    reader.onload = () => setPreviews((prev) => ({ ...prev, [fieldKey]: reader.result as string }));
    reader.readAsDataURL(file);

    setFiles((prev) => ({ ...prev, [fieldKey]: file }));
    setVerificationStatus((prev) => ({
      ...prev,
      [fieldKey]: { verified: false, loading: true },
    }));

    try {
      const docType = DOC_TYPE_MAP[fieldKey];
      const result = await verifyImage(file, docType);

      if (result.valid) {
        setVerificationStatus((prev) => ({
          ...prev,
          [fieldKey]: { verified: true, reason: result.reason, extractedData: result.extracted_data },
        }));
      } else {
        setVerificationStatus((prev) => ({
          ...prev,
          [fieldKey]: { verified: false, reason: result.reason },
        }));
        setFiles((prev) => ({ ...prev, [fieldKey]: null }));
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
    } catch (err: any) {
      setVerificationStatus((prev) => ({
        ...prev,
        [fieldKey]: { verified: false, reason: "Verification failed. Please try again." },
      }));
      setFiles((prev) => ({ ...prev, [fieldKey]: null }));
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fieldKey = fieldKeys[step];
    handleFileSelect(file, fieldKey);
    e.target.value = "";
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("Camera access denied. Please allow camera access in your browser settings.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const file = dataURLtoFile(dataUrl, "selfie.jpg");

    stopCamera();
    await handleFileSelect(file, "selfie");
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading || kycLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentStatus = kycStatus?.kycStatus || user.kycStatus;

  if (currentStatus === "verified") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-kyc-verified">KYC Verified</h1>
          <p className="text-muted-foreground mb-6">Your identity has been verified. You have full access to all features.</p>
          <Link href="/dashboard">
            <Button data-testid="button-go-dashboard">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (currentStatus === "submitted") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-kyc-submitted">KYC Under Review</h1>
          <p className="text-muted-foreground mb-6">Your documents have been submitted and are being reviewed. This usually takes 24-48 hours.</p>
          <Link href="/dashboard">
            <Button variant="outline" data-testid="button-back-dashboard">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = currentStatus === "rejected";

  const fieldKeys = ["aadhaar_front", "aadhaar_back", "pan_card", "selfie"];
  const currentField = fieldKeys[step];

  const allFilesReady = files.aadhaar_front && files.aadhaar_back && files.pan_card && files.selfie;
  const allVerified = fieldKeys.every(key => verificationStatus[key]?.verified);

  const handleSubmit = () => {
    if (allFilesReady && allVerified) {
      submitMutation.mutate();
    }
  };

  const removeFile = (fieldKey: string) => {
    setFiles((prev) => ({ ...prev, [fieldKey]: null }));
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setVerificationStatus((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const renderVerificationBadge = (fieldKey: string) => {
    const status = verificationStatus[fieldKey];
    if (!status) return null;

    if (status.loading) {
      return (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm" data-testid={`status-verifying-${fieldKey}`}>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Verifying with AI...</span>
        </div>
      );
    }

    if (status.verified) {
      return (
        <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm" data-testid={`status-valid-${fieldKey}`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Document verified</span>
          </div>
          {status.extractedData && (
            <div className="mt-1 text-xs space-y-0.5">
              {status.extractedData.name && <p>Name: {status.extractedData.name}</p>}
              {status.extractedData.panNumber && <p>PAN: {status.extractedData.panNumber}</p>}
              {status.extractedData.aadhaarLast4 && <p>Aadhaar: ****{status.extractedData.aadhaarLast4}</p>}
              {status.extractedData.faceDetected && <p>Face detected</p>}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm" data-testid={`status-invalid-${fieldKey}`}>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{status.reason || "Document rejected"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-kyc-back">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">KYC Verification</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isRejected && (
          <Card className="mb-6 p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive" data-testid="text-kyc-rejected">KYC Rejected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {kycStatus?.rejectionReason || "Documents were not acceptable."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Please re-submit your documents below.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : verificationStatus[fieldKeys[i]]?.verified
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`button-step-${i}`}
              >
                {verificationStatus[fieldKeys[i]]?.verified ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${verificationStatus[fieldKeys[i]]?.verified ? "bg-green-300 dark:bg-green-700" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-step-title">{STEPS[step]}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {step === 0 && "Upload a clear, original photo of the front side of your Aadhaar card. No photocopies or screenshots."}
            {step === 1 && "Upload a clear, original photo of the back side of your Aadhaar card. No photocopies or screenshots."}
            {step === 2 && "Upload a clear, original photo of your PAN card. No photocopies or screenshots."}
            {step === 3 && "Take a live selfie using your camera. File uploads are not allowed for selfie verification."}
          </p>

          {step < 3 ? (
            <div className="space-y-4">
              {previews[currentField] ? (
                <div className="relative">
                  <img
                    src={previews[currentField]}
                    alt={STEPS[step]}
                    className="w-full max-h-64 object-contain rounded-md border border-border"
                    data-testid={`img-preview-${currentField}`}
                  />
                  {!verificationStatus[currentField]?.loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeFile(currentField)}
                      data-testid={`button-remove-${currentField}`}
                    >
                      Remove
                    </Button>
                  )}
                  {renderVerificationBadge(currentField)}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-8 cursor-pointer hover-elevate transition-colors">
                  <FileImage className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP (max 10MB) - Original documents only</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid={`input-file-${currentField}`}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {cameraActive ? (
                <div className="space-y-4">
                  <div className="rounded-md overflow-hidden border border-border relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-foreground">Live Camera</span>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-3">
                    <Button onClick={capturePhoto} className="flex-1" data-testid="button-capture-selfie">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Selfie
                    </Button>
                    <Button variant="outline" onClick={stopCamera} data-testid="button-cancel-camera">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : previews.selfie ? (
                <div className="relative">
                  <img
                    src={previews.selfie}
                    alt="Selfie"
                    className="w-full max-h-64 object-contain rounded-md border border-border"
                    data-testid="img-preview-selfie"
                  />
                  {!verificationStatus.selfie?.loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeFile("selfie")}
                      data-testid="button-remove-selfie"
                    >
                      Remove
                    </Button>
                  )}
                  {renderVerificationBadge("selfie")}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-8 cursor-pointer hover-elevate transition-colors w-full"
                    data-testid="button-open-camera"
                  >
                    <Video className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">Open Camera for Live Selfie</p>
                    <p className="text-xs text-muted-foreground mt-1">Only live camera capture is allowed - no file uploads</p>
                  </button>
                  {cameraError && (
                    <div className="mt-3 p-2 rounded-md bg-destructive/10 text-destructive text-sm w-full" data-testid="text-camera-error">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              data-testid="button-prev-step"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!verificationStatus[currentField]?.verified}
                data-testid="button-next-step"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allFilesReady || !allVerified || submitMutation.isPending}
                data-testid="button-submit-kyc"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
            )}
          </div>

          {submitMutation.isError && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-kyc-error">
              {(submitMutation.error as Error).message}
            </div>
          )}

          {submitMutation.isSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm" data-testid="text-kyc-success">
              Documents submitted successfully! Your KYC is under review.
            </div>
          )}
        </Card>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {fieldKeys.map((key, i) => (
            <div
              key={key}
              className={`text-center p-3 rounded-md ${
                verificationStatus[key]?.verified
                  ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                  : "bg-muted/30 border border-border"
              }`}
              data-testid={`status-doc-${key}`}
            >
              {verificationStatus[key]?.verified ? (
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              ) : verificationStatus[key]?.loading ? (
                <Loader2 className="w-5 h-5 text-blue-600 mx-auto mb-1 animate-spin" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              )}
              <p className="text-xs text-muted-foreground">{STEPS[i]}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
