import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet,
  ArrowLeftRight,
  Download,
  Upload,
  LogOut,
  ArrowDown,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserWallet, SwapHistory } from "@shared/schema";

const CRYPTO_CURRENCIES = ["USDT", "BTC", "ETH", "BNB", "INR"];

export default function Swap() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const [fromCurrency, setFromCurrency] = useState("USDT");
  const [toCurrency, setToCurrency] = useState("BTC");
  const [fromAmount, setFromAmount] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState("");

  const { data: prices, isLoading: pricesLoading } = useQuery<Record<string, { usd: number; inr: number }>>({
    queryKey: ["/api/prices"],
    refetchInterval: 15000,
  });

  const { data: wallets } = useQuery<UserWallet[]>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: history } = useQuery<SwapHistory[]>({
    queryKey: ["/api/swap/history"],
    enabled: !!user,
  });

  const swapMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; fromAmount: string }) => {
      const res = await apiRequest("POST", "/api/swap", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swap/history"] });
      setFromAmount("");
      setEstimatedOutput("");
      toast({ title: "Swap completed", description: "Your swap has been executed successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Swap failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!fromAmount || !prices || fromCurrency === toCurrency) {
      setEstimatedOutput("");
      return;
    }
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setEstimatedOutput("");
      return;
    }

    let fromPriceUsd = 1;
    let toPriceUsd = 1;

    if (fromCurrency === "INR") {
      const usdInr = prices["USDT"]?.inr || 83;
      fromPriceUsd = 1 / usdInr;
    } else {
      fromPriceUsd = prices[fromCurrency]?.usd || 0;
    }

    if (toCurrency === "INR") {
      const usdInr = prices["USDT"]?.inr || 83;
      toPriceUsd = 1 / usdInr;
    } else {
      toPriceUsd = prices[toCurrency]?.usd || 0;
    }

    if (fromPriceUsd > 0 && toPriceUsd > 0) {
      const rawRate = fromPriceUsd / toPriceUsd;
      const effectiveRate = rawRate * 0.99;
      setEstimatedOutput((amount * effectiveRate).toFixed(8));
    }
  }, [fromAmount, fromCurrency, toCurrency, prices]);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) { setLocation("/login"); return null; }

  const fromWallet = wallets?.find(w => w.currency === fromCurrency);
  const fromBalance = fromWallet ? parseFloat(fromWallet.balance) : 0;

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    swapMutation.mutate({ fromCurrency, toCurrency, fromAmount });
  };

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/") });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Kuznex</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard"><Button variant="ghost" size="sm"><Wallet className="w-4 h-4 mr-2" />Wallet</Button></Link>
              <Link href="/swap"><Button variant="secondary" size="sm"><ArrowLeftRight className="w-4 h-4 mr-2" />Swap</Button></Link>
              <Link href="/deposit"><Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-2" />Deposit</Button></Link>
              <Link href="/inr"><Button variant="ghost" size="sm"><Upload className="w-4 h-4 mr-2" />INR Ramp</Button></Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6" data-testid="text-swap-title">Instant Swap</h1>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">You Send</Label>
              <div className="flex gap-3">
                <Select value={fromCurrency} onValueChange={(v) => { setFromCurrency(v); if (v === toCurrency) setToCurrency(fromCurrency); }}>
                  <SelectTrigger className="w-32" data-testid="select-from-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  data-testid="input-from-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {fromBalance.toFixed(fromCurrency === "INR" ? 2 : 8)} {fromCurrency}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                className="p-2 rounded-full bg-secondary border border-border"
                onClick={() => { const temp = fromCurrency; setFromCurrency(toCurrency); setToCurrency(temp); }}
                data-testid="button-swap-direction"
              >
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">You Receive (estimated)</Label>
              <div className="flex gap-3">
                <Select value={toCurrency} onValueChange={(v) => { setToCurrency(v); if (v === fromCurrency) setFromCurrency(toCurrency); }}>
                  <SelectTrigger className="w-32" data-testid="select-to-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="0.00"
                  value={estimatedOutput}
                  readOnly
                  className="bg-secondary/50"
                  data-testid="input-to-amount"
                />
              </div>
            </div>

            {pricesLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Price loading...
              </div>
            )}

            {prices && fromCurrency !== toCurrency && (
              <p className="text-xs text-muted-foreground">
                1% spread applied to market rate
              </p>
            )}

            {toCurrency === "INR" && estimatedOutput && parseFloat(estimatedOutput) > 0 && (
              <div className="space-y-3" data-testid="tds-breakdown">
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <p className="text-sm font-medium text-foreground mb-2">Transaction Breakdown</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span className="text-foreground font-medium" data-testid="text-tds-gross">{parseFloat(estimatedOutput).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">TDS (1% Govt Tax)</span>
                    <span className="text-red-600 dark:text-red-400 font-medium" data-testid="text-tds-amount">- {(parseFloat(estimatedOutput) * 0.01).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">You Receive</span>
                    <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-tds-net">{(parseFloat(estimatedOutput) * 0.99).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Tax Note:</span> 1% TDS is deducted as per Govt of India VDA guidelines (Section 194S). This amount is deposited against your PAN Card by Kuznex. You can <span className="font-semibold text-foreground">claim this refund</span> while filing your Income Tax Return (ITR).
                  </p>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSwap}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0 || fromCurrency === toCurrency || swapMutation.isPending}
              data-testid="button-execute-swap"
            >
              {swapMutation.isPending ? "Swapping..." : `Swap ${fromCurrency} to ${toCurrency}`}
            </Button>
          </div>
        </Card>

        {history && history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Swaps</h2>
            <div className="space-y-3">
              {history.slice(0, 10).map((swap) => (
                <Card key={swap.id} className="p-4" data-testid={`card-swap-${swap.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{parseFloat(swap.from_amount).toFixed(4)} {swap.from_currency}</span>
                      <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-primary">{parseFloat(swap.to_amount).toFixed(swap.to_currency === "INR" ? 2 : 4)} {swap.to_currency}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{new Date(swap.created_at).toLocaleDateString()}</span>
                      {swap.tds_amount && parseFloat(swap.tds_amount) > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">TDS: <span className="text-red-600 dark:text-red-400">{parseFloat(swap.tds_amount).toFixed(2)}</span></p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
