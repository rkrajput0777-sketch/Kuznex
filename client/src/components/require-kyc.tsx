import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

export default function RequireKYC({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.kycStatus === "verified") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-kyc-required">
          KYC Verification Required
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {user.kycStatus === "pending" &&
            "Complete your identity verification to access trading features. This is required by Indian regulations."}
          {user.kycStatus === "submitted" &&
            "Your KYC documents are being reviewed. You'll get access once verification is complete."}
          {user.kycStatus === "rejected" &&
            "Your KYC was rejected. Please re-submit your documents to continue."}
        </p>
        {user.kycStatus === "submitted" ? (
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span data-testid="text-kyc-pending-review">Under review (24-48 hours)</span>
          </div>
        ) : (
          <Link href="/kyc">
            <Button className="w-full" data-testid="button-start-kyc">
              <Shield className="w-4 h-4 mr-2" />
              {user.kycStatus === "rejected" ? "Re-submit KYC" : "Start KYC Verification"}
            </Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-3 w-full" data-testid="button-back-dashboard-kyc">
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
