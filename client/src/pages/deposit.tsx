import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertCircle,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

function ConfirmationBar({ current, required }: { current: number; required: number }) {
  const percentage = Math.min((current / required) * 100, 100);
  const isComplete = current >= required;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Block Confirmations</span>
        <span className={isComplete ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
          {current}/{required}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? "bg-green-500" : "bg-amber-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200" data-testid="badge-status-completed"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case "confirming":
      return <Badge variant="default" className="bg-amber-500/10 text-amber-700 border-amber-200" data-testid="badge-status-confirming"><Clock className="w-3 h-3 mr-1 animate-pulse" />Confirming</Badge>;
    case "pending":
      return <Badge variant="default" className="bg-blue-500/10 text-blue-700 border-blue-200" data-testid="badge-status-pending"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive" data-testid="badge-status-rejected"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Deposit() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("USDT");
  const [withdrawNetwork, setWithdrawNetwork] = useState("bsc");

  const { data: depositInfo } = useQuery<{
    addresses: Record<string, string>;
    networks: Array<{ id: string; name: string; explorer: string }>;
  }>({
    queryKey: ["/api/deposit/address"],
    enabled: !!user,
  });

  const { data: depositTxs } = useQuery<Transaction[]>({
    queryKey: ["/api/deposit/transactions"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: withdrawTxs } = useQuery<Transaction[]>({
    queryKey: ["/api/withdraw/transactions"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: wallets } = useQuery<Array<{ currency: string; balance: string }>>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: string; network: string; withdrawAddress: string }) => {
      const res = await apiRequest("POST", "/api/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdraw/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setWithdrawAmount("");
      setWithdrawAddress("");
      toast({ title: "Withdrawal submitted", description: "Your withdrawal is pending admin approval." });
    },
    onError: (err: any) => {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) { setLocation("/login"); return null; }

  const depositAddress = depositInfo?.addresses?.[selectedCurrency] || "";

  const copyAddress = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress);
      toast({ title: "Copied", description: "Deposit address copied to clipboard." });
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/") });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawAddress) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      currency: withdrawCurrency,
      amount: withdrawAmount,
      network: withdrawNetwork,
      withdrawAddress,
    });
  };

  const getWalletBalance = (currency: string) => {
    const w = wallets?.find(w => w.currency === currency);
    return w ? parseFloat(w.balance).toFixed(4) : "0.0000";
  };

  const networkLabel = (n: string) => n === "bsc" ? "BSC (BEP20)" : n === "polygon" ? "Polygon (MATIC)" : n;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Kuznex</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 flex-wrap">
              <Link href="/dashboard"><Button variant="ghost" size="sm" data-testid="link-wallet"><Wallet className="w-4 h-4 mr-2" />Wallet</Button></Link>
              <Link href="/swap"><Button variant="ghost" size="sm" data-testid="link-swap"><ArrowLeftRight className="w-4 h-4 mr-2" />Swap</Button></Link>
              <Link href="/deposit"><Button variant="secondary" size="sm" data-testid="link-deposit"><Download className="w-4 h-4 mr-2" />Deposit</Button></Link>
              <Link href="/inr"><Button variant="ghost" size="sm" data-testid="link-inr"><Upload className="w-4 h-4 mr-2" />INR Ramp</Button></Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6" data-testid="text-deposit-title">Deposit & Withdraw</h1>

        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" data-testid="tab-deposit"><Download className="w-4 h-4 mr-2" />Deposit</TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="tab-withdraw"><ArrowUpRight className="w-4 h-4 mr-2" />Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Crypto Deposit</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger data-testid="select-deposit-network">
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
                      <SelectTrigger data-testid="select-deposit-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["USDT", "BTC", "ETH", "BNB"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Your {selectedCurrency} Deposit Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={depositAddress || "Generating..."}
                      readOnly
                      className="font-mono text-xs bg-secondary/30"
                      data-testid="input-deposit-address"
                    />
                    <Button variant="outline" size="icon" onClick={copyAddress} data-testid="button-copy-address">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                      <p className="font-medium">Important:</p>
                      <p>Send only {selectedCurrency} on the {networkLabel(selectedNetwork)} network to this address.</p>
                      <p>Deposits are detected automatically. 12 block confirmations required.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Deposits</h2>
                <span className="text-xs text-muted-foreground">Auto-refreshes every 10s</span>
              </div>

              {(!depositTxs || depositTxs.length === 0) ? (
                <Card className="p-8 text-center">
                  <Download className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No deposits yet. Send crypto to your deposit address above.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {depositTxs.map((tx) => (
                    <Card key={tx.id} className="p-4" data-testid={`card-deposit-${tx.id}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Download className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{parseFloat(tx.amount).toFixed(6)} {tx.currency}</p>
                              <p className="text-xs text-muted-foreground">{networkLabel(tx.network)}</p>
                            </div>
                          </div>
                          <StatusBadge status={tx.status} />
                        </div>

                        {tx.status === "confirming" && (
                          <ConfirmationBar
                            current={tx.confirmations}
                            required={tx.required_confirmations}
                          />
                        )}

                        {tx.tx_hash && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Tx:</span>
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{tx.tx_hash}</span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpRight className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Crypto Withdrawal</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Currency</Label>
                    <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                      <SelectTrigger data-testid="select-withdraw-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["USDT", "BTC", "ETH", "BNB"].map(c => (
                          <SelectItem key={c} value={c}>{c} ({getWalletBalance(c)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Network</Label>
                    <Select value={withdrawNetwork} onValueChange={setWithdrawNetwork}>
                      <SelectTrigger data-testid="select-withdraw-network">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bsc">BSC (BEP20)</SelectItem>
                        <SelectItem value="polygon">Polygon (MATIC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Withdrawal Address</Label>
                  <Input
                    placeholder="0x..."
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    className="font-mono text-xs"
                    data-testid="input-withdraw-address"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Amount</Label>
                    <button
                      className="text-xs text-primary font-medium"
                      onClick={() => setWithdrawAmount(getWalletBalance(withdrawCurrency))}
                      data-testid="button-max-amount"
                    >
                      MAX: {getWalletBalance(withdrawCurrency)} {withdrawCurrency}
                    </button>
                  </div>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    data-testid="input-withdraw-amount"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawAddress}
                  data-testid="button-submit-withdraw"
                >
                  {withdrawMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                  ) : (
                    "Submit Withdrawal"
                  )}
                </Button>

                <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Withdrawals require admin approval for security. Processing time: 1-24 hours.
                    </p>
                  </div>
                </Card>
              </div>
            </Card>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Withdrawal History</h2>
              {(!withdrawTxs || withdrawTxs.length === 0) ? (
                <Card className="p-8 text-center">
                  <ArrowUpRight className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {withdrawTxs.map((tx) => (
                    <Card key={tx.id} className="p-4" data-testid={`card-withdraw-${tx.id}`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                              <ArrowUpRight className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{parseFloat(tx.amount).toFixed(6)} {tx.currency}</p>
                              <p className="text-xs text-muted-foreground">{networkLabel(tx.network)}</p>
                            </div>
                          </div>
                          <StatusBadge status={tx.status} />
                        </div>

                        {tx.withdraw_address && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">To:</span>
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">{tx.withdraw_address}</span>
                          </div>
                        )}

                        {tx.admin_note && (
                          <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                            {tx.admin_note}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
