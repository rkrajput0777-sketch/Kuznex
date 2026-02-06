import { useAuth, useLogout } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import type { UserWallet } from "@shared/schema";

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
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-dashboard-logo">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Kuznex</span>
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
          <p className="text-muted-foreground">Manage your crypto portfolio</p>
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
