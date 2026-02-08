import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FiatTransaction } from "@shared/schema";

type FiatTxWithUser = FiatTransaction & { username?: string; email?: string };

export default function AdminFiatApprovals() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: allTransactions = [], isLoading: txLoading } = useQuery<FiatTxWithUser[]>({
    queryKey: ["/api/admin/fiat-transactions"],
    enabled: !!user?.isSuperAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/fiat-transactions/${id}/approve`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiat-transactions"] });
      toast({ title: "Approved", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/fiat-transactions/${id}/reject`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiat-transactions"] });
      toast({ title: "Rejected", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/fiat-transactions/${id}/complete`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiat-transactions"] });
      toast({ title: "Completed", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading || txLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user?.isSuperAdmin) { setLocation("/dashboard"); return null; }

  const buyTransactions = allTransactions.filter(t => t.type === "buy");
  const sellTransactions = allTransactions.filter(t => t.type === "sell");

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved": return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "completed": return <Badge variant="outline" className="text-blue-600 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "rejected": return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  function TransactionCard({ tx }: { tx: FiatTxWithUser }) {
    const isPending = tx.status === "pending";
    const isApproved = tx.status === "approved";

    return (
      <Card className="p-4" data-testid={`admin-fiat-tx-${tx.id}`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {tx.type === "buy" ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium text-sm text-foreground">
              {tx.type === "buy" ? "Buy USDT" : "Sell USDT"}
            </span>
            <span className="text-xs text-muted-foreground">#{tx.id}</span>
          </div>
          {getStatusBadge(tx.status)}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
          <div><span className="text-muted-foreground">User:</span> <span className="text-foreground font-medium">{tx.username || `ID ${tx.user_id}`}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{tx.email || "—"}</span></div>
          <div><span className="text-muted-foreground">INR:</span> <span className="text-foreground font-medium">₹{parseFloat(tx.amount).toLocaleString("en-IN")}</span></div>
          <div><span className="text-muted-foreground">USDT:</span> <span className="text-foreground font-medium">{parseFloat(tx.usdt_amount).toFixed(2)}</span></div>
          <div><span className="text-muted-foreground">Rate:</span> <span className="text-foreground">₹{tx.rate}</span></div>
          <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{new Date(tx.created_at).toLocaleString()}</span></div>
          {tx.utr_number && (
            <div className="col-span-2"><span className="text-muted-foreground">UTR:</span> <span className="text-foreground font-mono">{tx.utr_number}</span></div>
          )}
          {tx.bank_name && (
            <>
              <div><span className="text-muted-foreground">Bank:</span> <span className="text-foreground">{tx.bank_name}</span></div>
              <div><span className="text-muted-foreground">A/C:</span> <span className="text-foreground font-mono">{tx.account_number}</span></div>
              <div><span className="text-muted-foreground">IFSC:</span> <span className="text-foreground font-mono">{tx.ifsc_code}</span></div>
            </>
          )}
          {tx.tds_amount && (
            <div><span className="text-muted-foreground">TDS:</span> <span className="text-red-600">₹{tx.tds_amount}</span></div>
          )}
          {tx.net_payout && (
            <div><span className="text-muted-foreground">Net:</span> <span className="text-foreground">₹{tx.net_payout}</span></div>
          )}
          {tx.admin_reply && (
            <div className="col-span-2"><span className="text-muted-foreground">Admin Note:</span> <span className="text-foreground">{tx.admin_reply}</span></div>
          )}
        </div>

        {isPending && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-green-600 text-white"
              onClick={() => approveMutation.mutate(tx.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${tx.id}`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              {tx.type === "buy" ? "Approve & Credit USDT" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300"
              onClick={() => rejectMutation.mutate(tx.id)}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${tx.id}`}
            >
              <XCircle className="w-3 h-3 mr-1" />
              {tx.type === "sell" ? "Reject & Refund USDT" : "Reject"}
            </Button>
          </div>
        )}
        {isApproved && tx.type === "sell" && (
          <Button
            size="sm"
            className="bg-blue-600 text-white"
            onClick={() => completeMutation.mutate(tx.id)}
            disabled={completeMutation.isPending}
            data-testid={`button-complete-${tx.id}`}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Mark as INR Sent
          </Button>
        )}
      </Card>
    );
  }

  const pendingBuys = buyTransactions.filter(t => t.status === "pending").length;
  const pendingSells = sellTransactions.filter(t => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <h1 className="text-lg font-bold text-foreground">Fiat Approvals</h1>
            </div>
            <div className="hidden md:flex items-center gap-1 flex-wrap">
              <Link href="/admin/users"><Button variant="ghost" size="sm"><Users className="w-4 h-4 mr-2" />Users</Button></Link>
              <Link href="/admin/kyc-review"><Button variant="ghost" size="sm"><Shield className="w-4 h-4 mr-2" />KYC</Button></Link>
              <Link href="/admin/fiat-approvals"><Button variant="secondary" size="sm"><CreditCard className="w-4 h-4 mr-2" />Fiat</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="buy">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="buy" className="flex-1" data-testid="tab-admin-buy">
              Buy Requests {pendingBuys > 0 && <Badge variant="outline" className="ml-2 text-amber-600">{pendingBuys}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex-1" data-testid="tab-admin-sell">
              Sell Requests {pendingSells > 0 && <Badge variant="outline" className="ml-2 text-amber-600">{pendingSells}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            {buyTransactions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No buy requests yet</Card>
            ) : (
              <div className="space-y-4">
                {buyTransactions.map(tx => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sell">
            {sellTransactions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No sell requests yet</Card>
            ) : (
              <div className="space-y-4">
                {sellTransactions.map(tx => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
