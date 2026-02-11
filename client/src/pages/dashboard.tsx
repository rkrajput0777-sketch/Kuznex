import { useRef, useEffect } from "react";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  Vault,
  CreditCard,
  ArrowDownUp,
  Bell,
} from "lucide-react";
import type { UserWallet, UserStats } from "@shared/schema";
import kuznexLogo from "@assets/image_1770554564085.png";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NotificationBell } from "@/components/notification-bell";

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

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const tiltRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    let tiltInstance: any = null;
    import("vanilla-tilt").then((VanillaTilt) => {
      if (el) {
        VanillaTilt.default.init(el, {
          max: 8,
          speed: 400,
          glare: true,
          "max-glare": 0.15,
          scale: 1.02,
          perspective: 1000,
        });
        tiltInstance = (el as any).vanillaTilt;
      }
    });
    return () => { tiltInstance?.destroy(); };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

  const totalUsdValue = wallets?.reduce((sum, w) => {
    const bal = parseFloat(w.balance);
    if (bal === 0) return sum;
    if (w.currency === "INR") return sum + bal / (prices?.["USDT"]?.inr || 90);
    const price = prices?.[w.currency]?.usd || 0;
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
              <Link href="/trade/BTCUSDT">
                <Button variant="ghost" size="sm" data-testid="link-nav-trade">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Trade
                </Button>
              </Link>
              <Link href="/swap">
                <Button variant="ghost" size="sm" data-testid="link-nav-swap">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Swap
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant="ghost" size="sm" data-testid="link-nav-deposit">
                  <Download className="w-4 h-4 mr-2" />
                  Crypto
                </Button>
              </Link>
              <Link href="/fiat">
                <Button variant="ghost" size="sm" data-testid="link-nav-fiat">
                  <Upload className="w-4 h-4 mr-2" />
                  Fiat
                </Button>
              </Link>
              {user.isSuperAdmin && (
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
                  <Link href="/admin/tds-reports">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-tds">
                      <Shield className="w-4 h-4 mr-2" />
                      TDS
                    </Button>
                  </Link>
                  <Link href="/admin/messages">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-messages">
                      <Mail className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  <Link href="/admin/rates">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-rates">
                      <Settings className="w-4 h-4 mr-2" />
                      Rates
                    </Button>
                  </Link>
                  <Link href="/admin/fiat-approvals">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-fiat">
                      <Upload className="w-4 h-4 mr-2" />
                      Fiat Approvals
                    </Button>
                  </Link>
                  <Link href="/admin/funds">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-funds">
                      <Vault className="w-4 h-4 mr-2" />
                      Fund Control
                    </Button>
                  </Link>
                  <Link href="/admin/fiat-settings">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-fiat-settings">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Fiat Settings
                    </Button>
                  </Link>
                  <Link href="/admin/crypto-withdrawals">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-crypto-withdrawals">
                      <ArrowDownUp className="w-4 h-4 mr-2" />
                      Withdrawals
                    </Button>
                  </Link>
                  <Link href="/admin/notifications">
                    <Button variant="ghost" size="sm" data-testid="link-nav-admin-notifications">
                      <Bell className="w-4 h-4 mr-2" />
                      Notify
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
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
            <Link href="/trade/BTCUSDT">
              <Button variant="ghost" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Trade</Button>
            </Link>
            <Link href="/swap">
              <Button variant="ghost" size="sm"><ArrowLeftRight className="w-4 h-4 mr-1" /> Swap</Button>
            </Link>
            <Link href="/wallet">
              <Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-1" /> Crypto</Button>
            </Link>
            <Link href="/fiat">
              <Button variant="ghost" size="sm"><Upload className="w-4 h-4 mr-1" /> Fiat</Button>
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

        <div
          ref={tiltRef}
          className="mb-8 rounded-xl overflow-visible"
          style={{ transformStyle: "preserve-3d" }}
          data-testid="card-portfolio-3d"
        >
          <div
            className="relative p-6 rounded-xl border border-white/20 dark:border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(59, 130, 246, 0.15) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="absolute inset-0 rounded-xl opacity-30 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.2), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.15), transparent 50%)",
              }}
            />
            <div className="relative" style={{ transform: "translateZ(30px)" }}>
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Total Portfolio Value
                  </p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-total-value">
                    {walletsLoading ? "Loading..." : `₹${totalInrValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                  </p>
                  {!walletsLoading && prices && (
                    <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-total-usdt">
                      ≈ ${totalUsdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                    </p>
                  )}
                </div>

                {userStats && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                      userStats.change24hAmount >= 0
                        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                    }`}
                    style={{ transform: "translateZ(40px)" }}
                    data-testid="badge-24h-pnl"
                  >
                    {userStats.change24hAmount >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {userStats.change24hAmount >= 0 ? "+" : ""}${Math.abs(userStats.change24hAmount).toFixed(2)}
                      {" "}({userStats.change24hPercent >= 0 ? "+" : ""}{userStats.change24hPercent.toFixed(1)}%)
                    </span>
                    <span className="text-xs opacity-70">24h</span>
                  </div>
                )}
              </div>

              {userStats && (
                <div className="flex items-center gap-6 text-xs text-muted-foreground pt-3 border-t border-white/10 flex-wrap" data-testid="stats-mini">
                  <span>Total Deposited: <span className="text-foreground font-medium">${userStats.totalDeposited.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span></span>
                  <span>Total Withdrawn: <span className="text-foreground font-medium">${userStats.totalWithdrawn.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span></span>
                  <span>Net: <span className={`font-medium ${(userStats.totalDeposited - userStats.totalWithdrawn) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>${(userStats.totalDeposited - userStats.totalWithdrawn).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  {wallet.currency !== "INR" && (
                    <div className="mt-1 space-y-0.5">
                      {(prices?.[wallet.currency]?.usd || 0) > 0 && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-usd-${wallet.currency}`}>
                          ≈ ${(bal * (prices?.[wallet.currency]?.usd || 0)).toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                        </p>
                      )}
                      {priceInr > 0 && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-inr-${wallet.currency}`}>
                          ≈ ₹{valueInr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} INR
                        </p>
                      )}
                    </div>
                  )}
                  {wallet.currency === "INR" && bal > 0 && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-usd-INR`}>
                      ≈ ${(bal / (prices?.["USDT"]?.inr || 90)).toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/trade/BTCUSDT">
            <Card className="p-5 hover-elevate cursor-pointer" data-testid="card-spot-trade">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Spot Trading</p>
                  <p className="text-xs text-muted-foreground">Buy & Sell crypto</p>
                </div>
              </div>
            </Card>
          </Link>
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
          <Link href="/fiat">
            <Card className="p-5 hover-elevate cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Buy / Sell USDT</p>
                  <p className="text-xs text-muted-foreground">Fiat INR Exchange</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
