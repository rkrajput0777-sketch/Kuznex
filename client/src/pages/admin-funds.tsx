import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import kuznexLogo from "@assets/image_1770554564085.png";
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
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Power,
  PowerOff,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
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

interface PlatformStatus {
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
}

interface PendingDeposit {
  id: number;
  user_id: number;
  type: string;
  currency: string;
  amount: string;
  network: string;
  status: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  created_at: string;
}

export default function AdminFunds() {
  const { data: user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [coldWalletAddress, setColdWalletAddress] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: masterKeyInfo, isLoading: masterKeyLoading } = useQuery<{ configured: boolean; address: string | null }>({
    queryKey: ["/api/admin/master-key-info"],
    enabled: !!user?.isSuperAdmin,
  });

  const updateKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await apiRequest("POST", "/api/admin/update-master-key", { newKey: key });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-key-info"] });
      setNewMasterKey("");
      setShowKey(false);
      toast({
        title: "Master Key Updated",
        description: `New wallet address: ${data.address}`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const { data: fundOverview, isLoading: fundsLoading } = useQuery<FundOverview>({
    queryKey: ["/api/admin/fund-overview"],
    enabled: !!user?.isSuperAdmin,
  });

  const { data: platformStatus } = useQuery<PlatformStatus>({
    queryKey: ["/api/platform-status"],
    enabled: !!user?.isSuperAdmin,
  });

  const { data: pendingDeposits, isLoading: pendingLoading } = useQuery<PendingDeposit[]>({
    queryKey: ["/api/admin/pending-deposits"],
    enabled: !!user?.isSuperAdmin,
  });

  const forceScanAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/force-scan-all");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fund-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      toast({
        title: "System Scan Complete",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleDepositsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/admin/platform-settings/toggle-deposits", { enabled });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-status"] });
      toast({ title: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Toggle failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleWithdrawalsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/admin/platform-settings/toggle-withdrawals", { enabled });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-status"] });
      toast({ title: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Toggle failed", description: err.message, variant: "destructive" });
    },
  });

  const creditDepositMutation = useMutation({
    mutationFn: async (txId: number) => {
      const res = await apiRequest("POST", `/api/admin/credit-deposit/${txId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fund-overview"] });
      toast({ title: "Deposit Credited", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Credit failed", description: err.message, variant: "destructive" });
    },
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

  const depositsOn = platformStatus?.depositsEnabled ?? true;
  const withdrawalsOn = platformStatus?.withdrawalsEnabled ?? true;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-fund-control-title">Fund Control Center</h1>
              <p className="text-sm text-muted-foreground">Monitor systemwide balances and execute fund sweeps</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("This will scan all 8 chains for every user's deposit addresses. This may take a few minutes. Continue?")) {
                forceScanAllMutation.mutate();
              }
            }}
            disabled={forceScanAllMutation.isPending}
            data-testid="button-admin-force-scan"
          >
            {forceScanAllMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning All Chains...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Force Scan All Deposits</>
            )}
          </Button>
        </div>

        {fundsLoading ? (
          <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowDownCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Deposit Control</h3>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {depositsOn ? "Users can deposit crypto" : "Deposits are disabled for all users"}
                    </p>
                    <Badge variant={depositsOn ? "default" : "destructive"} className="mt-2" data-testid="badge-deposit-status">
                      {depositsOn ? <><Power className="w-3 h-3 mr-1" />Active</> : <><PowerOff className="w-3 h-3 mr-1" />Disabled</>}
                    </Badge>
                  </div>
                  <Button
                    variant={depositsOn ? "destructive" : "default"}
                    onClick={() => {
                      const newState = !depositsOn;
                      if (confirm(`Are you sure you want to ${newState ? "ENABLE" : "DISABLE"} deposits for all users?`)) {
                        toggleDepositsMutation.mutate(newState);
                      }
                    }}
                    disabled={toggleDepositsMutation.isPending}
                    data-testid="button-toggle-deposits"
                  >
                    {toggleDepositsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : depositsOn ? (
                      <><PowerOff className="w-4 h-4 mr-2" />Turn OFF</>
                    ) : (
                      <><Power className="w-4 h-4 mr-2" />Turn ON</>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Withdrawal Control</h3>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {withdrawalsOn ? "Users can request withdrawals" : "Withdrawals are disabled for all users"}
                    </p>
                    <Badge variant={withdrawalsOn ? "default" : "destructive"} className="mt-2" data-testid="badge-withdrawal-status">
                      {withdrawalsOn ? <><Power className="w-3 h-3 mr-1" />Active</> : <><PowerOff className="w-3 h-3 mr-1" />Disabled</>}
                    </Badge>
                  </div>
                  <Button
                    variant={withdrawalsOn ? "destructive" : "default"}
                    onClick={() => {
                      const newState = !withdrawalsOn;
                      if (confirm(`Are you sure you want to ${newState ? "ENABLE" : "DISABLE"} withdrawals for all users?`)) {
                        toggleWithdrawalsMutation.mutate(newState);
                      }
                    }}
                    disabled={toggleWithdrawalsMutation.isPending}
                    data-testid="button-toggle-withdrawals"
                  >
                    {toggleWithdrawalsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : withdrawalsOn ? (
                      <><PowerOff className="w-4 h-4 mr-2" />Turn OFF</>
                    ) : (
                      <><Power className="w-4 h-4 mr-2" />Turn ON</>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {pendingDeposits && pendingDeposits.length > 0 && (
              <Card className="p-6 border-yellow-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-foreground">Pending / Confirming Deposits</h3>
                  <Badge variant="secondary">{pendingDeposits.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  These deposits are stuck in pending/confirming state. You can manually credit them to the user's wallet.
                </p>
                <div className="space-y-3">
                  {pendingDeposits.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-md flex-wrap" data-testid={`card-pending-deposit-${dep.id}`}>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{dep.amount} {dep.currency?.toUpperCase()}</span>
                          <Badge variant="secondary" className="text-xs">{dep.network}</Badge>
                          <Badge variant={dep.status === "confirming" ? "default" : "secondary"} className="text-xs">{dep.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">User ID: {dep.user_id}</p>
                        {dep.tx_hash && (
                          <p className="font-mono text-xs text-muted-foreground truncate">{dep.tx_hash}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{new Date(dep.created_at).toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (confirm(`Credit ${dep.amount} ${dep.currency?.toUpperCase()} to user ${dep.user_id}?`)) {
                            creditDepositMutation.mutate(dep.id);
                          }
                        }}
                        disabled={creditDepositMutation.isPending}
                        data-testid={`button-credit-deposit-${dep.id}`}
                      >
                        {creditDepositMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-1" />Credit</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {pendingLoading && (
              <Card className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading pending deposits...</p>
              </Card>
            )}

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

            <Card className="p-6 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Master Private Key</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {masterKeyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : masterKeyInfo?.configured ? (
                    <Badge variant="default" data-testid="badge-master-key-status">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-master-key-status">Not Set</Badge>
                  )}
                </div>

                {masterKeyInfo?.address && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Current Wallet Address</span>
                    <p className="font-mono text-xs break-all text-foreground" data-testid="text-master-wallet-address">
                      {masterKeyInfo.address}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-border/50 space-y-3">
                  <Label className="text-sm text-muted-foreground">Change Master Private Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder="Enter new private key (0x...)"
                      value={newMasterKey}
                      onChange={e => setNewMasterKey(e.target.value)}
                      className="font-mono text-xs pr-10"
                      data-testid="input-new-master-key"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowKey(!showKey)}
                      data-testid="button-toggle-key-visibility"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (confirm("Are you sure you want to change the Master Private Key? This will affect all crypto operations (withdrawals, sweeps).")) {
                        updateKeyMutation.mutate(newMasterKey);
                      }
                    }}
                    disabled={updateKeyMutation.isPending || !newMasterKey || newMasterKey.trim().length < 20}
                    data-testid="button-update-master-key"
                  >
                    {updateKeyMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                    ) : (
                      <><Key className="w-4 h-4 mr-2" />Update Master Key</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This updates the key for the current server session. To make it permanent, also update the MASTER_PRIVATE_KEY in your environment secrets.
                  </p>
                </div>
              </div>
            </Card>

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
