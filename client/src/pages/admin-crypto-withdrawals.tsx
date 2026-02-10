import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ArrowUpRight,
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
}

export default function AdminCryptoWithdrawals() {
  const { data: user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
  const [approveModalTx, setApproveModalTx] = useState<PendingWithdrawal | null>(null);
  const [manualTxHash, setManualTxHash] = useState("");

  const { data: networkConfigs } = useQuery<NetworkConfig[]>({
    queryKey: ["/api/network-config"],
  });

  const { data: pendingWithdrawals, isLoading: loadingWithdrawals } = useQuery<PendingWithdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: !!user?.isSuperAdmin,
    refetchInterval: 15000,
  });

  const sendOnChainMutation = useMutation({
    mutationFn: async (txId: number) => {
      const res = await apiRequest("POST", `/api/admin/crypto-withdrawals/${txId}/send`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Funds sent on-chain", description: `Tx: ${data.txHash?.slice(0, 20)}...` });
      setApproveModalTx(null);
    },
    onError: (err: any) => {
      toast({ title: "On-chain send failed", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ txId, adminNote, manualTxHash }: { txId: number; adminNote?: string; manualTxHash?: string }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${txId}/approve`, { adminNote, manualTxHash });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal approved" });
      setApproveModalTx(null);
      setManualTxHash("");
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
      toast({ title: "Withdrawal rejected", description: "Funds refunded to user's internal wallet." });
    },
    onError: (err: any) => {
      toast({ title: "Rejection failed", description: err.message, variant: "destructive" });
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-crypto-withdrawals-title">Crypto Withdrawal Approvals</h1>
              <p className="text-sm text-muted-foreground">Approve, reject, or send funds on-chain</p>
            </div>
          </div>
          <Badge variant="secondary" data-testid="badge-pending-withdrawals">
            {pendingWithdrawals?.length || 0} pending
          </Badge>
        </div>

        {loadingWithdrawals ? (
          <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></Card>
        ) : (!pendingWithdrawals || pendingWithdrawals.length === 0) ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending crypto withdrawals. All clear.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-crypto-withdrawals">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Coin</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Destination Address</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Network</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWithdrawals.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50" data-testid={`row-withdrawal-${tx.id}`}>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{tx.username || `ID: ${tx.user_id}`}</p>
                          <p className="text-xs text-muted-foreground">{tx.email || ""}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{tx.currency}</Badge>
                      </td>
                      <td className="p-4 font-mono font-medium text-foreground" data-testid={`text-amount-${tx.id}`}>
                        {parseFloat(tx.amount).toFixed(6)}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs break-all text-muted-foreground" data-testid={`text-dest-addr-${tx.id}`}>
                          {tx.withdraw_address ? `${tx.withdraw_address.slice(0, 12)}...${tx.withdraw_address.slice(-8)}` : "N/A"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {networkConfigs?.find(n => n.id === tx.network)?.name || tx.network}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              setApproveModalTx(tx);
                              setManualTxHash("");
                            }}
                            disabled={approveMutation.isPending || sendOnChainMutation.isPending}
                            data-testid={`button-approve-send-${tx.id}`}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />Approve & Send
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate({ txId: tx.id, adminNote: rejectNote[tx.id] || "Rejected by admin" })}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${tx.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                          </Button>
                        </div>
                        <Input
                          placeholder="Admin note..."
                          value={rejectNote[tx.id] || ""}
                          onChange={e => setRejectNote(prev => ({ ...prev, [tx.id]: e.target.value }))}
                          className="text-xs mt-2"
                          data-testid={`input-note-${tx.id}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      <Dialog open={!!approveModalTx} onOpenChange={(open) => { if (!open) { setApproveModalTx(null); setManualTxHash(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve & Send Withdrawal</DialogTitle>
            <DialogDescription>
              {approveModalTx && (
                <>
                  Send {parseFloat(approveModalTx.amount).toFixed(6)} {approveModalTx.currency} to{" "}
                  <span className="font-mono text-xs">{approveModalTx.withdraw_address?.slice(0, 12)}...{approveModalTx.withdraw_address?.slice(-8)}</span>
                  {" "}on {networkConfigs?.find(n => n.id === approveModalTx.network)?.name || approveModalTx.network}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Manual Tx Hash (if already sent manually)</Label>
              <Input
                placeholder="0x... (leave empty to auto-send via hot wallet)"
                value={manualTxHash}
                onChange={e => setManualTxHash(e.target.value)}
                className="font-mono text-xs"
                data-testid="input-approval-tx-hash"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {manualTxHash.trim() ? (
              <Button
                className="w-full sm:flex-1"
                onClick={() => {
                  if (approveModalTx) {
                    approveMutation.mutate({ txId: approveModalTx.id, adminNote: `Manual tx: ${manualTxHash}`, manualTxHash });
                  }
                }}
                disabled={approveMutation.isPending}
                data-testid="button-approve-manual"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Mark as Sent (Manual)
              </Button>
            ) : (
              <Button
                className="w-full sm:flex-1"
                onClick={() => {
                  if (approveModalTx) {
                    sendOnChainMutation.mutate(approveModalTx.id);
                  }
                }}
                disabled={sendOnChainMutation.isPending}
                data-testid="button-send-onchain"
              >
                {sendOnChainMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send On-Chain (Hot Wallet)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
