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
  Copy,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CryptoDeposit } from "@shared/schema";

export default function Deposit() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [txHash, setTxHash] = useState("");

  const { data: depositInfo } = useQuery<{
    wallets: Record<string, string>;
    networks: Array<{ id: string; name: string; explorer: string }>;
  }>({
    queryKey: ["/api/deposit/address"],
    enabled: !!user,
  });

  const { data: deposits } = useQuery<CryptoDeposit[]>({
    queryKey: ["/api/deposit/crypto/history"],
    enabled: !!user,
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { currency: string; network: string; txHash?: string }) => {
      const res = await apiRequest("POST", "/api/deposit/crypto", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposit/crypto/history"] });
      setTxHash("");
      toast({ title: "Deposit submitted", description: "Your deposit has been submitted for verification." });
    },
    onError: (err: any) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) { setLocation("/login"); return null; }

  const walletAddress = selectedNetwork === "bsc"
    ? depositInfo?.wallets?.BSC_BEP20
    : depositInfo?.wallets?.POLYGON_MATIC;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({ title: "Copied", description: "Wallet address copied to clipboard." });
    }
  };

  const handleDeposit = () => {
    depositMutation.mutate({ currency: selectedCurrency, network: selectedNetwork, txHash: txHash || undefined });
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
              <Link href="/swap"><Button variant="ghost" size="sm"><ArrowLeftRight className="w-4 h-4 mr-2" />Swap</Button></Link>
              <Link href="/deposit"><Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Deposit</Button></Link>
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
        <h1 className="text-2xl font-bold text-foreground mb-6" data-testid="text-deposit-title">Deposit Crypto</h1>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger data-testid="select-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bsc">BSC (BEP20)</SelectItem>
                  <SelectItem value="polygon">Polygon (MATIC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USDT", "BTC", "ETH", "BNB"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Deposit Address</Label>
              <div className="flex gap-2">
                <Input
                  value={walletAddress || "Loading..."}
                  readOnly
                  className="font-mono text-xs bg-secondary/50"
                  data-testid="input-wallet-address"
                />
                <Button variant="outline" size="icon" onClick={copyAddress} data-testid="button-copy-address">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Send {selectedCurrency} to this address on the {selectedNetwork === "bsc" ? "BSC (BEP20)" : "Polygon"} network only.
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Transaction Hash (optional)</Label>
              <Input
                placeholder="0x..."
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                className="font-mono text-xs"
                data-testid="input-tx-hash"
              />
            </div>

            <Button className="w-full" onClick={handleDeposit} disabled={depositMutation.isPending} data-testid="button-submit-deposit">
              {depositMutation.isPending ? "Submitting..." : "I Have Sent Funds"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              After sending, click above. Your deposit will be verified and credited to your wallet.
            </p>
          </div>
        </Card>

        {deposits && deposits.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Deposit History</h2>
            <div className="space-y-3">
              {deposits.map((dep) => (
                <Card key={dep.id} className="p-4" data-testid={`card-deposit-${dep.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {dep.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{dep.currency} on {dep.network}</p>
                        {dep.tx_hash && (
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-48">{dep.tx_hash}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      dep.status === "completed" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {dep.status}
                    </span>
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
