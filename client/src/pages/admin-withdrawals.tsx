import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeftRight,
  Download,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Users,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

type PendingWithdrawal = Transaction & { username?: string; email?: string };

interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  explorer: string;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFee: number;
}

export default function AdminWithdrawals() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
  const [coldWalletAddress, setColdWalletAddress] = useState("");
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustCurrency, setAdjustCurrency] = useState("USDT");
  const [adjustAmount, setAdjustAmount] = useState("");

  const { data: networkConfigs } = useQuery<NetworkConfig[]>({
    queryKey: ["/api/network-config"],
  });

  const { data: pendingWithdrawals, isLoading: loadingWithdrawals } = useQuery<PendingWithdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: !!user?.isAdmin,
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ txId, adminNote }: { txId: number; adminNote?: string }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${txId}/approve`, { adminNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal approved", description: "The withdrawal has been processed." });
    },
    onError: (err: any) => {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ txId, adminNote }: { txId: number; adminNote?: string }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${txId}/reject`, { adminNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal rejected", description: "Funds have been refunded to user." });
    },
    onError: (err: any) => {
      toast({ title: "Rejection failed", description: err.message, variant: "destructive" });
    },
  });

  const sweepMutation = useMutation({
    mutationFn: async (coldWalletAddress: string) => {
      const res = await apiRequest("POST", "/api/admin/sweep", { coldWalletAddress });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sweep completed",
        description: `${data.swept}/${data.total} addresses swept successfully.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Sweep failed", description: err.message, variant: "destructive" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: { userId: number; currency: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/admin/balance-adjust", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Balance adjusted",
        description: `New ${data.currency} balance for user ${data.userId}: ${data.newBalance}`,
      });
      setAdjustUserId("");
      setAdjustAmount("");
    },
    onError: (err: any) => {
      toast({ title: "Adjustment failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user?.isAdmin) { setLocation("/dashboard"); return null; }

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/") });
  };

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
            <div className="hidden md:flex items-center gap-1 flex-wrap">
              <Link href="/admin/users"><Button variant="ghost" size="sm"><Users className="w-4 h-4 mr-2" />Users</Button></Link>
              <Link href="/admin/kyc-review"><Button variant="ghost" size="sm"><Shield className="w-4 h-4 mr-2" />KYC</Button></Link>
              <Link href="/admin/withdrawals"><Button variant="secondary" size="sm"><ArrowUpRight className="w-4 h-4 mr-2" />Withdrawals</Button></Link>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-admin-logout"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="withdrawals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals"><ArrowUpRight className="w-4 h-4 mr-2" />Withdrawals</TabsTrigger>
            <TabsTrigger value="balance" data-testid="tab-balance"><Wallet className="w-4 h-4 mr-2" />Balance Adjust</TabsTrigger>
            <TabsTrigger value="godmode" data-testid="tab-godmode"><AlertTriangle className="w-4 h-4 mr-2" />God Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Pending Withdrawals</h2>
              <Badge variant="secondary" data-testid="badge-pending-count">
                {pendingWithdrawals?.length || 0} pending
              </Badge>
            </div>

            {loadingWithdrawals ? (
              <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></Card>
            ) : (!pendingWithdrawals || pendingWithdrawals.length === 0) ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending withdrawals. All clear.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((tx) => (
                  <Card key={tx.id} className="p-5" data-testid={`card-pending-withdraw-${tx.id}`}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{parseFloat(tx.amount).toFixed(6)} {tx.currency}</span>
                            <Badge variant="default" className="bg-amber-500/10 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3 mr-1" />Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            User: <span className="font-medium text-foreground">{tx.username || `ID: ${tx.user_id}`}</span>
                            {tx.email && <span className="ml-2">({tx.email})</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Network: {networkConfigs?.find(n => n.id === tx.network)?.name || tx.network}
                          </p>
                        </div>
                      </div>

                      {tx.withdraw_address && (
                        <div className="bg-secondary/50 p-3 rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Withdrawal Address:</p>
                          <p className="font-mono text-xs break-all" data-testid={`text-withdraw-addr-${tx.id}`}>{tx.withdraw_address}</p>
                        </div>
                      )}

                      <div>
                        <Input
                          placeholder="Admin note (optional)"
                          value={rejectNote[tx.id] || ""}
                          onChange={e => setRejectNote(prev => ({ ...prev, [tx.id]: e.target.value }))}
                          className="text-sm mb-3"
                          data-testid={`input-admin-note-${tx.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate({ txId: tx.id, adminNote: rejectNote[tx.id] })}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${tx.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {approveMutation.isPending ? "Processing..." : "Approve & Send"}
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => rejectMutation.mutate({ txId: tx.id, adminNote: rejectNote[tx.id] })}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${tx.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {rejectMutation.isPending ? "Rejecting..." : "Reject & Refund"}
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <h2 className="text-xl font-bold">Manual Balance Adjustment</h2>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">User ID</Label>
                    <Input
                      type="number"
                      placeholder="Enter user ID"
                      value={adjustUserId}
                      onChange={e => setAdjustUserId(e.target.value)}
                      data-testid="input-adjust-user-id"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Currency</Label>
                    <Select value={adjustCurrency} onValueChange={setAdjustCurrency}>
                      <SelectTrigger data-testid="select-adjust-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["INR", "USDT", "BTC", "ETH", "BNB"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Amount (positive to add, negative to subtract)</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="e.g., 100 or -50"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    data-testid="input-adjust-amount"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => adjustMutation.mutate({
                    userId: parseInt(adjustUserId),
                    currency: adjustCurrency,
                    amount: parseFloat(adjustAmount),
                  })}
                  disabled={adjustMutation.isPending || !adjustUserId || !adjustAmount}
                  data-testid="button-adjust-balance"
                >
                  {adjustMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Adjust Balance
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="godmode" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              God Mode - Emergency Controls
            </h2>

            <Card className="p-6 border-red-200 dark:border-red-800">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-700 dark:text-red-400">Sweep All User Deposit Wallets</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will iterate through ALL user deposit addresses and sweep any remaining on-chain balance across all {networkConfigs?.length || 8} supported networks to your cold wallet.
                  Use this only in emergencies.
                </p>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Cold Wallet Address (destination)</Label>
                  <Input
                    placeholder="0x..."
                    value={coldWalletAddress}
                    onChange={e => setColdWalletAddress(e.target.value)}
                    className="font-mono text-xs"
                    data-testid="input-cold-wallet"
                  />
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you absolutely sure? This will sweep ALL user deposit addresses to your cold wallet. This action cannot be undone.")) {
                      sweepMutation.mutate(coldWalletAddress);
                    }
                  }}
                  disabled={sweepMutation.isPending || !coldWalletAddress}
                  data-testid="button-sweep-all"
                >
                  {sweepMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sweeping...</>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Execute Emergency Sweep
                    </>
                  )}
                </Button>

                {sweepMutation.data && (
                  <Card className="p-4 bg-secondary/50">
                    <h4 className="text-sm font-semibold mb-2">Sweep Results</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {(sweepMutation.data as any).swept}/{(sweepMutation.data as any).total} addresses swept
                    </p>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {(sweepMutation.data as any).results?.map((r: any, i: number) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span className={`font-medium ${r.status === 'sent' ? 'text-green-600' : r.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {r.status}
                          </span>
                          {r.chain && <span className="text-muted-foreground">[{r.chain}]</span>}
                          <span className="font-mono truncate">{r.address?.slice(0, 16)}...</span>
                          {r.txHash && <span className="font-mono text-green-600">{r.txHash.slice(0, 16)}...</span>}
                          {r.error && <span className="text-red-500">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
