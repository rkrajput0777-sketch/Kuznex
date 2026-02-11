import { useState } from "react";
import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Eye,
  UserCheck,
  FileImage,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info,
} from "lucide-react";

interface KycUser {
  id: number;
  username: string;
  email: string;
  kycStatus: string;
  kycData: any;
  createdAt: string;
}

export default function AdminKycReview() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: kycUsers, isLoading: usersLoading } = useQuery<KycUser[]>({
    queryKey: ["/api/admin/kyc"],
    enabled: !!user?.isSuperAdmin,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: number; status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/kyc/${userId}`, {
        status,
        rejectionReason: reason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      setExpandedUser(null);
      setRejectionReason("");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getDocUrl = (kycData: any, field: string) => {
    if (!kycData) return null;
    const filePath = kycData[field];
    if (!filePath) return null;
    const parts = filePath.split("/");
    const userId = parts[parts.length - 2];
    const filename = parts[parts.length - 1];
    return `/api/kyc/file/${userId}/${filename}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-admin-back">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">KYC Review Panel</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-admin-title">Pending KYC Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review submitted documents and approve or reject KYC applications.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Trash2 className="w-3 h-3" />
            <span>Document images are automatically deleted after approval/rejection to save storage.</span>
          </div>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !kycUsers?.length ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-foreground font-medium" data-testid="text-no-pending">No pending KYC reviews</p>
            <p className="text-sm text-muted-foreground mt-1">All submissions have been processed.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {kycUsers.map((kycUser) => {
              const isExpanded = expandedUser === kycUser.id;
              const aiAnalysis = kycUser.kycData?.aiAnalysis;
              const aiVerdict = kycUser.kycData?.aiVerdict;

              return (
                <Card key={kycUser.id} className="overflow-visible" data-testid={`card-kyc-user-${kycUser.id}`}>
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer gap-4"
                    onClick={() => setExpandedUser(isExpanded ? null : kycUser.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{kycUser.username.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{kycUser.username}</p>
                        <p className="text-xs text-muted-foreground">{kycUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {aiVerdict === "documents_appear_valid" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" data-testid={`badge-ai-valid-${kycUser.id}`}>
                          AI: Valid
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" data-testid={`badge-ai-review-${kycUser.id}`}>
                          AI: Review
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Aadhaar Front", field: "aadhaarFrontPath", aiKey: "aadhaarFront" },
                          { label: "Aadhaar Back", field: "aadhaarBackPath", aiKey: "aadhaarBack" },
                          { label: "PAN Card", field: "panCardPath", aiKey: "panCard" },
                          { label: "Selfie", field: "selfiePath", aiKey: "selfie" },
                        ].map(({ label, field, aiKey }) => {
                          const docUrl = getDocUrl(kycUser.kycData, field);
                          const analysis = aiAnalysis?.[aiKey];
                          return (
                            <div key={field} className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">{label}</p>
                              {docUrl ? (
                                <img
                                  src={docUrl}
                                  alt={label}
                                  className="w-full h-32 object-cover rounded-md border border-border"
                                  data-testid={`img-doc-${aiKey}-${kycUser.id}`}
                                />
                              ) : (
                                <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                                  <FileImage className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              {analysis && (
                                <div className={`text-xs p-2 rounded ${(analysis.isValid || analysis.valid) ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
                                  <p>{(analysis.isValid || analysis.valid) ? "Valid" : "Issues found"}</p>
                                  {analysis.reason && <p>{analysis.reason}</p>}
                                  {analysis.confidence && <p>Confidence: {analysis.confidence}%</p>}
                                  {(analysis.name || analysis.extracted_data?.name) && <p>Name: {analysis.name || analysis.extracted_data?.name}</p>}
                                  {(analysis.panNumber || analysis.extracted_data?.panNumber) && <p>PAN: {analysis.panNumber || analysis.extracted_data?.panNumber}</p>}
                                  {(analysis.aadhaarLast4 || analysis.extracted_data?.aadhaarLast4) && <p>Aadhaar: ****{analysis.aadhaarLast4 || analysis.extracted_data?.aadhaarLast4}</p>}
                                  {analysis.issues?.length > 0 && (
                                    <p>Issues: {analysis.issues.join(", ")}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>Extracted data (Name, PAN, Aadhaar) will be saved permanently. Document images will be auto-deleted after your decision.</span>
                      </div>

                      <div className="flex flex-col gap-3 pt-2">
                        <Textarea
                          placeholder="Rejection reason (required if rejecting)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-sm"
                          data-testid={`input-rejection-reason-${kycUser.id}`}
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => reviewMutation.mutate({ userId: kycUser.id, status: "verified" })}
                            disabled={reviewMutation.isPending}
                            className="flex-1"
                            data-testid={`button-approve-${kycUser.id}`}
                          >
                            {reviewMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve KYC
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => reviewMutation.mutate({ userId: kycUser.id, status: "rejected", reason: rejectionReason })}
                            disabled={reviewMutation.isPending || !rejectionReason.trim()}
                            className="flex-1"
                            data-testid={`button-reject-${kycUser.id}`}
                          >
                            {reviewMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject KYC
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
