import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Webcam from "react-webcam";
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
} from "lucide-react";

const STEPS = ["Aadhaar Front", "Aadhaar Back", "PAN Card", "Selfie"];

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
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);

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

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const file = dataURLtoFile(imageSrc, "selfie.jpg");
      setFiles((prev) => ({ ...prev, selfie: file }));
      setPreviews((prev) => ({ ...prev, selfie: imageSrc }));
      setShowCamera(false);
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [currentField]: file }));
    const reader = new FileReader();
    reader.onload = () => setPreviews((prev) => ({ ...prev, [currentField]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const allFilesReady = files.aadhaar_front && files.aadhaar_back && files.pan_card && files.selfie;

  const handleSubmit = () => {
    if (allFilesReady) {
      submitMutation.mutate();
    }
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
                    : files[fieldKeys[i]]
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`button-step-${i}`}
              >
                {files[fieldKeys[i]] ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${files[fieldKeys[i]] ? "bg-green-300" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-step-title">{STEPS[step]}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {step === 0 && "Upload a clear photo of the front side of your Aadhaar card."}
            {step === 1 && "Upload a clear photo of the back side of your Aadhaar card."}
            {step === 2 && "Upload a clear photo of your PAN card."}
            {step === 3 && "Take a selfie or upload a clear photo of your face."}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFiles((prev) => ({ ...prev, [currentField]: null }));
                      setPreviews((prev) => {
                        const next = { ...prev };
                        delete next[currentField];
                        return next;
                      });
                    }}
                    data-testid={`button-remove-${currentField}`}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-8 cursor-pointer hover-elevate transition-colors">
                  <FileImage className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP (max 10MB)</p>
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
              {showCamera ? (
                <div className="space-y-4">
                  <div className="rounded-md overflow-hidden border border-border">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={capturePhoto} className="flex-1" data-testid="button-capture-selfie">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture
                    </Button>
                    <Button variant="outline" onClick={() => setShowCamera(false)} data-testid="button-cancel-camera">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFiles((prev) => ({ ...prev, selfie: null }));
                      setPreviews((prev) => {
                        const next = { ...prev };
                        delete next.selfie;
                        return next;
                      });
                    }}
                    data-testid="button-remove-selfie"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover-elevate transition-colors"
                    data-testid="button-open-camera"
                  >
                    <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Take Selfie</p>
                  </button>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover-elevate transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Upload Photo</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                      data-testid="input-file-selfie"
                    />
                  </label>
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
                disabled={!files[currentField]}
                data-testid="button-next-step"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allFilesReady || submitMutation.isPending}
                data-testid="button-submit-kyc"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Documents...
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
            <div className="mt-4 p-3 rounded-md bg-green-50 text-green-700 text-sm" data-testid="text-kyc-success">
              Documents submitted successfully! Your KYC is under review.
            </div>
          )}
        </Card>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {fieldKeys.map((key, i) => (
            <div
              key={key}
              className={`text-center p-3 rounded-md ${
                files[key] ? "bg-green-50 border border-green-200" : "bg-muted/30 border border-border"
              }`}
              data-testid={`status-doc-${key}`}
            >
              {files[key] ? (
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
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
