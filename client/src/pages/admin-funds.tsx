import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Wallet,
  Database,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FundOverview {
  systemBalances: Record<string, number>;
  totalWallets: number;
  coldWallet: string;
  sampleOnChainBalances: Record<string, Record<string, string>>;
}

export default function AdminFunds() {
  const { data: user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [coldWalletAddress, setColdWalletAddress] = useState("");

  const { data: fundOverview, isLoading: fundsLoading } = useQuery<FundOverview>({
    queryKey: ["/api/admin/fund-overview"],
    enabled: !!user?.isSuperAdmin,
  });

  const sweepMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest("POST", "/api/admin/sweep", { coldWalletAddress: address });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fund-overview"] });
      toast({
        title: "Sweep completed",
        description: `${data.swept}/${data.total} addresses swept successfully.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Sweep failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Kuznex Admin</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-fund-control-title">Fund Control Center</h1>
            <p className="text-sm text-muted-foreground">Monitor systemwide balances and execute fund sweeps</p>
          </div>
        </div>

        {fundsLoading ? (
          <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Total User Balances (System DB)</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Sum of all user wallet balances stored in the database
                </p>
                <div className="space-y-2">
                  {fundOverview?.systemBalances && Object.entries(fundOverview.systemBalances).map(([currency, total]) => (
                    <div key={currency} className="flex items-center justify-between" data-testid={`text-system-balance-${currency}`}>
                      <span className="text-sm font-medium text-foreground">{currency}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {total.toFixed(currency === "INR" ? 2 : 8)}
                      </span>
                    </div>
                  ))}
                  {(!fundOverview?.systemBalances || Object.keys(fundOverview.systemBalances).length === 0) && (
                    <p className="text-sm text-muted-foreground">No balance data available</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Wallet Infrastructure</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Deposit Wallets</span>
                    <Badge variant="secondary" data-testid="badge-total-wallets">{fundOverview?.totalWallets || 0}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Cold Wallet</span>
                    <p className="font-mono text-xs break-all text-foreground" data-testid="text-cold-wallet">
                      {fundOverview?.coldWallet || "Not configured"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {fundOverview?.sampleOnChainBalances && Object.keys(fundOverview.sampleOnChainBalances).length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-3">Sample On-Chain Balances (first 5 wallets)</h3>
                <div className="space-y-2">
                  {Object.entries(fundOverview.sampleOnChainBalances).map(([addr, chains]) => (
                    <div key={addr} className="bg-secondary/50 p-3 rounded-md">
                      <p className="font-mono text-xs text-muted-foreground mb-1">{addr}</p>
                      {Object.entries(chains).length > 0 ? (
                        Object.entries(chains).map(([chain, bal]) => (
                          <p key={chain} className="text-xs text-foreground ml-4">
                            {chain}: <span className="font-mono">{bal}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground ml-4">No on-chain balance detected</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 border-destructive/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <h3 className="font-semibold text-destructive">Emergency: Sweep All Funds to Cold Wallet</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This will iterate through ALL user deposit wallets, check on-chain balances across all supported networks,
                and sweep any available funds (after gas) to the specified cold wallet address. Use only when necessary.
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Cold Wallet Destination Address</Label>
                  <Input
                    placeholder="0x..."
                    value={coldWalletAddress}
                    onChange={e => setColdWalletAddress(e.target.value)}
                    className="font-mono text-xs"
                    data-testid="input-sweep-cold-wallet"
                  />
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("WARNING: This will sweep ALL user deposit wallets to your cold wallet. This action CANNOT be undone. Continue?")) {
                      sweepMutation.mutate(coldWalletAddress);
                    }
                  }}
                  disabled={sweepMutation.isPending || !coldWalletAddress || coldWalletAddress.length < 10}
                  data-testid="button-sweep-all-funds"
                >
                  {sweepMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sweeping All Wallets...</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 mr-2" />SWEEP ALL FUNDS TO COLD WALLET</>
                  )}
                </Button>

                {sweepMutation.data && (
                  <Card className="p-4 bg-secondary/50">
                    <h4 className="text-sm font-semibold mb-2">Sweep Results</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {(sweepMutation.data as any).swept}/{(sweepMutation.data as any).total} addresses swept
                    </p>
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {(sweepMutation.data as any).results?.map((r: any, i: number) => (
                        <div key={i} className="text-xs flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${r.status === 'sent' ? 'text-green-600' : r.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {r.status}
                          </span>
                          {r.chain && <span className="text-muted-foreground">[{r.chain}]</span>}
                          <span className="font-mono truncate">{r.address?.slice(0, 20)}...</span>
                          {r.amount && <span className="text-green-600">{r.amount} sent</span>}
                          {r.txHash && <span className="font-mono text-green-600">{r.txHash.slice(0, 16)}...</span>}
                          {r.error && <span className="text-destructive">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
