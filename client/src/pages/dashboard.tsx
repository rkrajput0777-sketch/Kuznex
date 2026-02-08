import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Wallet,
  ArrowLeftRight,
  Download,
  Upload,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  UserCheck,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { UserWallet } from "@shared/schema";
import kuznexLogo from "@assets/image_1770554564085.png";
import { queryClient, apiRequest } from "@/lib/queryClient";

const CURRENCY_LABELS: Record<string, string> = {
  INR: "Indian Rupee",
  USDT: "Tether USD",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "BNB",
};

export default function Dashboard() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();

  const { data: wallets, isLoading: walletsLoading } = useQuery<UserWallet[]>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: prices } = useQuery<Record<string, { usd: number; inr: number }>>({
    queryKey: ["/api/prices"],
    refetchInterval: 30000,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const stopImpersonation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/stop-impersonation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setLocation("/admin/users");
    },
  });

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/") });
  };

  const totalInrValue = wallets?.reduce((sum, w) => {
    const bal = parseFloat(w.balance);
    if (bal === 0) return sum;
    if (w.currency === "INR") return sum + bal;
    const price = prices?.[w.currency]?.inr || 0;
    return sum + bal * price;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {user.impersonating && (
        <div className="bg-yellow-500 text-white py-2 px-4 text-center text-sm font-medium sticky top-0 z-[60] flex items-center justify-center gap-3" data-testid="banner-impersonation">
          <span>Viewing as {user.username} ({user.kuznexId})</span>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/20 border-white/40 text-white h-7"
            onClick={() => stopImpersonation.mutate()}
            disabled={stopImpersonation.isPending}
            data-testid="button-exit-impersonation"
          >
            <X className="w-3 h-3 mr-1" />
            Exit to Admin
          </Button>
        </div>
      )}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-dashboard-logo">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="link-nav-dashboard">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet
                </Button>
              </Link>
              <Link href="/swap">
                <Button variant="ghost" size="sm" data-testid="link-nav-swap">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Swap
                </Button>
              </Link>
              <Link href="/deposit">
                <Button variant="ghost" size="sm" data-testid="link-nav-deposit">
                  <Download className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
              </Link>
              <Link href="/inr">
                <Button variant="ghost" size="sm" data-testid="link-nav-inr">
                  <Upload className="w-4 h-4 mr-2" />
                  INR Ramp
                </Button>
              </Link>
              {user.isAdmin && (
                <>
                  <Link href="/admin/kyc-review">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-kyc">
                      <UserCheck className="w-4 h-4 mr-2" />
                      KYC Admin
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-users">
                      <Users className="w-4 h-4 mr-2" />
                      Users
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-username">
                {user.username}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm"><Wallet className="w-4 h-4 mr-1" /> Wallet</Button>
            </Link>
            <Link href="/swap">
              <Button variant="ghost" size="sm"><ArrowLeftRight className="w-4 h-4 mr-1" /> Swap</Button>
            </Link>
            <Link href="/deposit">
              <Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-1" /> Deposit</Button>
            </Link>
            <Link href="/inr">
              <Button variant="ghost" size="sm"><Upload className="w-4 h-4 mr-1" /> INR</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-dashboard-title">
            Welcome, {user.username}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-muted-foreground">Manage your crypto portfolio</p>
            {user.kuznexId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20" data-testid="text-kuznex-id">
                {user.kuznexId}
              </span>
            )}
          </div>
        </div>

        <Card className="mb-8 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-value">
                {walletsLoading ? "Loading..." : `₹${totalInrValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Secured</span>
            </div>
          </div>
        </Card>

        {user.kycStatus !== "verified" && (
          <Card className="mb-6 p-4 border-yellow-200 bg-yellow-50" data-testid="card-kyc-banner">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {user.kycStatus === "pending" && "Complete KYC to unlock trading"}
                    {user.kycStatus === "submitted" && "KYC under review"}
                    {user.kycStatus === "rejected" && "KYC rejected - please resubmit"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.kycStatus === "pending" && "Identity verification is required to access Swap, Deposit, and INR features."}
                    {user.kycStatus === "submitted" && "Your documents are being reviewed. This usually takes 24-48 hours."}
                    {user.kycStatus === "rejected" && "Your documents were not accepted. Please submit again."}
                  </p>
                </div>
              </div>
              {user.kycStatus !== "submitted" && (
                <Link href="/kyc">
                  <Button size="sm" data-testid="button-kyc-banner">
                    <Shield className="w-4 h-4 mr-2" />
                    {user.kycStatus === "rejected" ? "Re-submit" : "Start KYC"}
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        <h2 className="text-lg font-semibold text-foreground mb-4">Your Wallets</h2>
        
        {walletsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets?.map((wallet) => {
              const bal = parseFloat(wallet.balance);
              const priceInr = wallet.currency === "INR" ? 1 : (prices?.[wallet.currency]?.inr || 0);
              const valueInr = bal * priceInr;
              return (
                <Card key={wallet.id} className="p-5" data-testid={`card-wallet-${wallet.currency}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{wallet.currency.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{wallet.currency}</p>
                        <p className="text-xs text-muted-foreground">{CURRENCY_LABELS[wallet.currency] || wallet.currency}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground" data-testid={`text-balance-${wallet.currency}`}>
                    {bal.toFixed(wallet.currency === "INR" ? 2 : 8)}
                  </p>
                  {wallet.currency !== "INR" && priceInr > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ₹{valueInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Link href="/swap">
            <Card className="p-5 hover-elevate cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Instant Swap</p>
                  <p className="text-xs text-muted-foreground">Convert any crypto</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/deposit">
            <Card className="p-5 hover-elevate cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Deposit Crypto</p>
                  <p className="text-xs text-muted-foreground">BSC & Polygon</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/inr">
            <Card className="p-5 hover-elevate cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">INR Ramp</p>
                  <p className="text-xs text-muted-foreground">Deposit & Withdraw</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
