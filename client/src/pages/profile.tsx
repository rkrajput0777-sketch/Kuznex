import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  Receipt,
  User,
} from "lucide-react";
import VanillaTilt from "vanilla-tilt";

interface ProfileData {
  id: number;
  kuznexId: string | null;
  username: string;
  email: string;
  kycStatus: string;
  aadhaarMask: string | null;
  panMask: string | null;
  totalVolume: number;
  totalTds: number;
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: string;
}

function formatCurrency(amount: number, prefix = "$") {
  if (amount >= 1_000_000) return `${prefix}${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${prefix}${(amount / 1_000).toFixed(1)}K`;
  return `${prefix}${amount.toFixed(2)}`;
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function ProfilePage() {
  const { data: authUser, isLoading: authLoading } = useAuth();
  const identityRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/user/profile"],
    enabled: !!authUser,
  });

  useEffect(() => {
    const tiltOptions = {
      max: 8,
      speed: 400,
      glare: true,
      "max-glare": 0.15,
      scale: 1.02,
    };

    if (identityRef.current) {
      VanillaTilt.init(identityRef.current, tiltOptions);
    }
    if (statsRef.current) {
      VanillaTilt.init(statsRef.current, { ...tiltOptions, max: 5 });
    }

    return () => {
      if (identityRef.current) {
        (identityRef.current as any)?.vanillaTilt?.destroy();
      }
      if (statsRef.current) {
        (statsRef.current as any)?.vanillaTilt?.destroy();
      }
    };
  }, [profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-profile" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Unable to load profile.</p>
      </div>
    );
  }

  const isVerified = profile.kycStatus === "verified";
  const isPending = profile.kycStatus === "submitted";
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-profile-back">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">My Profile</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div
            ref={identityRef}
            className="relative rounded-md p-[1px] overflow-visible"
            style={{
              background: isVerified
                ? "linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6)"
                : isPending
                  ? "linear-gradient(135deg, #eab308, #f59e0b, #d97706)"
                  : "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)",
              transformStyle: "preserve-3d",
            }}
            data-testid="card-identity"
          >
            <div
              className="rounded-md p-6 space-y-6"
              style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.95))",
                backdropFilter: "blur(20px)",
                minHeight: "280px",
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs font-mono tracking-widest" style={{ color: "rgba(148, 163, 184, 0.7)" }}>
                    KUZNEX IDENTITY
                  </p>
                  <p className="text-xs font-mono" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
                    {profile.kuznexId || "KUZ-000000"}
                  </p>
                </div>

                <div data-testid="badge-kyc-status">
                  {isVerified ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-950/30 gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      VERIFIED
                    </Badge>
                  ) : isPending ? (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-950/30 gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      UNDER REVIEW
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-950/30 gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      NOT VERIFIED
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#f1f5f9" }} data-testid="text-profile-name">
                  {profile.username}
                </h2>
                <p className="text-sm" style={{ color: "rgba(148, 163, 184, 0.8)" }} data-testid="text-profile-email">
                  {profile.email}
                </p>
              </div>

              <div
                className="pt-4 border-t space-y-3"
                style={{ borderColor: "rgba(148, 163, 184, 0.15)" }}
              >
                {isVerified ? (
                  <>
                    <div className="flex items-center gap-3" data-testid="text-aadhaar-mask">
                      <span className="text-xs font-medium w-20" style={{ color: "rgba(148, 163, 184, 0.6)" }}>Aadhaar</span>
                      <span className="font-mono text-sm tracking-wider" style={{ color: "#cbd5e1" }}>
                        {profile.aadhaarMask || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" data-testid="text-pan-mask">
                      <span className="text-xs font-medium w-20" style={{ color: "rgba(148, 163, 184, 0.6)" }}>PAN Card</span>
                      <span className="font-mono text-sm tracking-wider" style={{ color: "#cbd5e1" }}>
                        {profile.panMask || "Not set"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs italic" style={{ color: "rgba(148, 163, 184, 0.5)" }}>
                    {isPending ? "KYC documents are under review. Details will appear here after verification." : "Complete KYC verification to view your identity details."}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
                  Member since {memberSince}
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isVerified ? "#22c55e" : isPending ? "#eab308" : "#ef4444", opacity: 0.6 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            ref={statsRef}
            className="relative rounded-md overflow-visible"
            style={{ transformStyle: "preserve-3d" }}
            data-testid="card-stats"
          >
            <div
              className="rounded-md p-6 space-y-5 h-full"
              style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(20, 27, 45, 0.96))",
                backgroundImage: `
                  linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(20, 27, 45, 0.96)),
                  repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(56, 189, 248, 0.03) 39px, rgba(56, 189, 248, 0.03) 40px),
                  repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(56, 189, 248, 0.03) 39px, rgba(56, 189, 248, 0.03) 40px)
                `,
                minHeight: "280px",
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#38bdf8" }} />
                <p className="text-xs font-mono tracking-widest" style={{ color: "rgba(56, 189, 248, 0.7)" }}>
                  TRADER COMMAND CENTER
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <StatBlock
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Total Volume"
                  value={formatCurrency(profile.totalVolume)}
                  color="#3b82f6"
                  testId="stat-volume"
                />
                <StatBlock
                  icon={<Download className="w-4 h-4" />}
                  label="Total Deposits"
                  value={formatCurrency(profile.totalDeposited)}
                  color="#22c55e"
                  testId="stat-deposits"
                />
                <StatBlock
                  icon={<Upload className="w-4 h-4" />}
                  label="Total Withdrawals"
                  value={formatCurrency(profile.totalWithdrawn)}
                  color="#f59e0b"
                  testId="stat-withdrawals"
                />
                <StatBlock
                  icon={<Receipt className="w-4 h-4" />}
                  label="TDS Contributed"
                  value={formatCurrency(profile.totalTds)}
                  color="#a3e635"
                  testId="stat-tds"
                  highlight
                />
              </div>

              <div
                className="flex items-center justify-between pt-3 mt-auto border-t"
                style={{ borderColor: "rgba(56, 189, 248, 0.1)" }}
              >
                <p className="text-xs" style={{ color: "rgba(148, 163, 184, 0.4)" }}>
                  Lifetime statistics
                </p>
                <p className="text-xs font-mono" style={{ color: "rgba(56, 189, 248, 0.4)" }}>
                  KUZNEX PRO
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  color,
  testId,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  testId: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-md p-4 space-y-2"
      style={{
        background: highlight
          ? "linear-gradient(135deg, rgba(163, 230, 53, 0.08), rgba(34, 197, 94, 0.05))"
          : "rgba(30, 41, 59, 0.5)",
        border: `1px solid ${highlight ? "rgba(163, 230, 53, 0.2)" : "rgba(148, 163, 184, 0.08)"}`,
      }}
      data-testid={testId}
    >
      <div className="flex items-center gap-2">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs" style={{ color: "rgba(148, 163, 184, 0.7)" }}>{label}</span>
      </div>
      <p className="text-xl font-bold font-mono" style={{ color: "#f1f5f9" }}>
        {value}
      </p>
      {highlight && (
        <p className="text-[10px] font-medium" style={{ color: "rgba(163, 230, 53, 0.6)" }}>
          Tax Payer
        </p>
      )}
    </div>
  );
}
