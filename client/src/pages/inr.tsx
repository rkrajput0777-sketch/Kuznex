import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  ArrowLeftRight,
  Download,
  Upload,
  LogOut,
  Loader2,
  CheckCircle,
  Clock,
  IndianRupee,
  Building2,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inrDepositSchema, inrWithdrawSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InrTransaction, UserWallet } from "@shared/schema";
import { useState } from "react";

export default function InrRamp() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const { data: bankDetails } = useQuery<{
    bankName: string; accountNumber: string; ifscCode: string; accountHolder: string; upiId: string;
  }>({
    queryKey: ["/api/inr/bank-details"],
    enabled: !!user,
  });

  const { data: paymentMethods } = useQuery<{ upi: boolean; imps: boolean; bankTransfer: boolean }>({
    queryKey: ["/api/platform/payment-methods"],
    enabled: !!user,
  });

  const { data: wallets } = useQuery<UserWallet[]>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: history } = useQuery<InrTransaction[]>({
    queryKey: ["/api/inr/history"],
    enabled: !!user,
  });

  const depositForm = useForm<z.infer<typeof inrDepositSchema>>({
    resolver: zodResolver(inrDepositSchema),
    defaultValues: { amount: "", utrNumber: "" },
  });

  const withdrawForm = useForm<z.infer<typeof inrWithdrawSchema>>({
    resolver: zodResolver(inrWithdrawSchema),
    defaultValues: { amount: "", bankName: "", accountNumber: "", ifscCode: "" },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inrDepositSchema>) => {
      const res = await apiRequest("POST", "/api/inr/deposit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inr/history"] });
      depositForm.reset();
      toast({ title: "INR deposit submitted", description: "Your deposit will be verified and credited." });
    },
    onError: (err: any) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inrWithdrawSchema>) => {
      const res = await apiRequest("POST", "/api/inr/withdraw", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inr/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      withdrawForm.reset();
      toast({ title: "Withdrawal submitted", description: "Your withdrawal request is being processed." });
    },
    onError: (err: any) => {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    },
  });

  const { data: usdtRates } = useQuery<{ buyRate: string; sellRate: string }>({
    queryKey: ["/api/usdt-rates"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  const buyUsdtMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/usdt/buy", { type: "buy", amount });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setBuyAmount("");
      toast({ title: "USDT Purchased", description: `${parseFloat(data.usdtReceived).toFixed(2)} USDT credited at rate ₹${data.rate}` });
    },
    onError: (err: any) => {
      toast({ title: "Buy failed", description: err.message, variant: "destructive" });
    },
  });

  const sellUsdtMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/usdt/sell", { type: "sell", amount });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setSellAmount("");
      toast({ title: "USDT Sold", description: `₹${parseFloat(data.netInrReceived).toLocaleString("en-IN")} INR credited (TDS: ₹${data.tdsAmount})` });
    },
    onError: (err: any) => {
      toast({ title: "Sell failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) { setLocation("/login"); return null; }

  const inrWallet = wallets?.find(w => w.currency === "INR");
  const inrBalance = inrWallet ? parseFloat(inrWallet.balance) : 0;
  const usdtWallet = wallets?.find(w => w.currency === "USDT");
  const usdtBalance = usdtWallet ? parseFloat(usdtWallet.balance) : 0;

  const buyRate = parseFloat(usdtRates?.buyRate || "92");
  const sellRate = parseFloat(usdtRates?.sellRate || "90");
  const buyAmountNum = parseFloat(buyAmount) || 0;
  const sellAmountNum = parseFloat(sellAmount) || 0;
  const usdtFromBuy = buyAmountNum > 0 ? buyAmountNum / buyRate : 0;
  const inrFromSell = sellAmountNum > 0 ? sellAmountNum * sellRate : 0;
  const tdsFromSell = inrFromSell * 0.01;
  const netFromSell = inrFromSell - tdsFromSell;

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
              <Link href="/deposit"><Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-2" />Deposit</Button></Link>
              <Link href="/inr"><Button variant="secondary" size="sm"><Upload className="w-4 h-4 mr-2" />INR Ramp</Button></Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-inr-title">INR On/Off Ramp</h1>
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <p className="text-muted-foreground">
            INR: <span className="font-semibold text-foreground">₹{inrBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-muted-foreground">
            USDT: <span className="font-semibold text-foreground">{usdtBalance.toFixed(2)}</span>
          </p>
        </div>

        <Tabs defaultValue="buy-usdt">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="buy-usdt" className="flex-1" data-testid="tab-buy-usdt">Buy USDT</TabsTrigger>
            <TabsTrigger value="sell-usdt" className="flex-1" data-testid="tab-sell-usdt">Sell USDT</TabsTrigger>
            <TabsTrigger value="deposit" className="flex-1" data-testid="tab-inr-deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1" data-testid="tab-inr-withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="buy-usdt">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Buy USDT with INR</h3>
              </div>
              <div className="p-3 rounded-lg bg-secondary border border-border mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Buy Rate</span>
                  <span className="font-semibold text-foreground" data-testid="text-buy-rate">₹{buyRate.toFixed(2)} / USDT</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">INR Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter INR amount"
                      className="pl-10"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      data-testid="input-buy-usdt-amount"
                    />
                  </div>
                </div>
                {buyAmountNum > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2" data-testid="buy-usdt-preview">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You Pay</span>
                      <span className="text-foreground font-medium">₹{buyAmountNum.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="text-foreground">₹{buyRate.toFixed(2)} / USDT</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">You Receive</span>
                      <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-buy-usdt-receive">{usdtFromBuy.toFixed(2)} USDT</span>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={buyUsdtMutation.isPending || buyAmountNum <= 0 || buyAmountNum > inrBalance}
                  onClick={() => buyUsdtMutation.mutate(buyAmount)}
                  data-testid="button-buy-usdt"
                >
                  {buyUsdtMutation.isPending ? "Processing..." : "Buy USDT"}
                </Button>
                {buyAmountNum > inrBalance && buyAmountNum > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 text-center">Insufficient INR balance</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sell-usdt">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-foreground">Sell USDT for INR</h3>
              </div>
              <div className="p-3 rounded-lg bg-secondary border border-border mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sell Rate</span>
                  <span className="font-semibold text-foreground" data-testid="text-sell-rate">₹{sellRate.toFixed(2)} / USDT</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">USDT Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter USDT amount"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    data-testid="input-sell-usdt-amount"
                  />
                </div>
                {sellAmountNum > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2" data-testid="sell-usdt-preview">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You Sell</span>
                      <span className="text-foreground font-medium">{sellAmountNum.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="text-foreground">₹{sellRate.toFixed(2)} / USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gross INR</span>
                      <span className="text-foreground">₹{inrFromSell.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">TDS (1%)</span>
                      <span className="text-red-600 dark:text-red-400">-₹{tdsFromSell.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">You Receive</span>
                      <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-sell-usdt-receive">₹{netFromSell.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={sellUsdtMutation.isPending || sellAmountNum <= 0 || sellAmountNum > usdtBalance}
                  onClick={() => sellUsdtMutation.mutate(sellAmount)}
                  data-testid="button-sell-usdt"
                >
                  {sellUsdtMutation.isPending ? "Processing..." : "Sell USDT"}
                </Button>
                {sellAmountNum > usdtBalance && sellAmountNum > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 text-center">Insufficient USDT balance</p>
                )}
                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    1% TDS is deducted as per Govt of India VDA guidelines (Section 194S).
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="deposit">
            <Card className="p-6 mb-6">
              <div className="mb-6 p-4 rounded-lg bg-secondary border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Admin Bank Details</h3>
                </div>
                <div className="space-y-1 text-sm">
                  {paymentMethods?.bankTransfer && (
                    <>
                      <p className="text-muted-foreground">Bank: <span className="text-foreground">{bankDetails?.bankName || "Loading..."}</span></p>
                      <p className="text-muted-foreground">A/C: <span className="text-foreground">{bankDetails?.accountNumber || "Loading..."}</span></p>
                      <p className="text-muted-foreground">IFSC: <span className="text-foreground">{bankDetails?.ifscCode || "Loading..."}</span></p>
                      <p className="text-muted-foreground">Name: <span className="text-foreground">{bankDetails?.accountHolder || "Loading..."}</span></p>
                    </>
                  )}
                  {paymentMethods?.upi && (
                    <p className="text-muted-foreground">UPI: <span className="text-foreground">{bankDetails?.upiId || "Loading..."}</span></p>
                  )}
                </div>
                {paymentMethods && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Available:</span>
                    {paymentMethods.upi && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">UPI</span>}
                    {paymentMethods.imps && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">IMPS</span>}
                    {paymentMethods.bankTransfer && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">Bank Transfer</span>}
                    {!paymentMethods.upi && !paymentMethods.imps && !paymentMethods.bankTransfer && (
                      <span className="text-xs text-red-600 dark:text-red-400">All payment methods currently disabled</span>
                    )}
                  </div>
                )}
              </div>

              <Form {...depositForm}>
                <form onSubmit={depositForm.handleSubmit((data) => depositMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (INR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="Enter amount" className="pl-10" data-testid="input-inr-deposit-amount" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={depositForm.control}
                    name="utrNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTR / Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter UTR or reference number" data-testid="input-utr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={depositMutation.isPending} data-testid="button-submit-inr-deposit">
                    {depositMutation.isPending ? "Submitting..." : "Submit Deposit"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Send INR to the bank details above, then submit your UTR number for verification.
                  </p>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="p-6 mb-6">
              <Form {...withdrawForm}>
                <form onSubmit={withdrawForm.handleSubmit((data) => withdrawMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={withdrawForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (INR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="Enter amount" className="pl-10" data-testid="input-inr-withdraw-amount" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={withdrawForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. State Bank of India" data-testid="input-bank-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={withdrawForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" data-testid="input-account-number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={withdrawForm.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SBIN0001234" data-testid="input-ifsc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {withdrawForm.watch("amount") && parseFloat(withdrawForm.watch("amount")) > 0 && (() => {
                    const amt = parseFloat(withdrawForm.watch("amount"));
                    const tds = amt * 0.01;
                    const fee = amt * 0.002;
                    const net = amt - tds - fee;
                    return (
                      <div className="space-y-3" data-testid="tds-withdraw-breakdown">
                        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                          <p className="text-sm font-medium text-foreground mb-2">Withdrawal Breakdown</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Withdrawal Amount</span>
                            <span className="text-foreground font-medium" data-testid="text-withdraw-gross">{amt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">TDS (1% Govt Tax)</span>
                            <span className="text-red-600 dark:text-red-400 font-medium" data-testid="text-withdraw-tds">- {tds.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Platform Fee (0.2%)</span>
                            <span className="text-red-600 dark:text-red-400 font-medium" data-testid="text-withdraw-fee">- {fee.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground">You Receive</span>
                            <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-withdraw-net">{net.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex gap-2">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Tax Note:</span> 1% TDS is deducted as per Govt of India VDA guidelines (Section 194S). This amount is claimable against your PAN Card by Kuznex. You can <span className="font-semibold text-foreground">claim this refund</span> while filing your Income Tax Return (ITR).
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <Button type="submit" className="w-full" disabled={withdrawMutation.isPending} data-testid="button-submit-inr-withdraw">
                    {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Funds will be deducted immediately. TDS applied. Payment processed within 24 hours.
                  </p>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>

        {history && history.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Transaction History</h2>
            <div className="space-y-3">
              {history.map((tx) => (
                <Card key={tx.id} className="p-4" data-testid={`card-inr-tx-${tx.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {tx.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tx.type === "deposit" ? "Deposit" : "Withdrawal"} - {parseFloat(tx.amount).toLocaleString("en-IN")}
                        </p>
                        {tx.utr_number && <p className="text-xs text-muted-foreground">UTR: {tx.utr_number}</p>}
                        {tx.tds_amount && parseFloat(tx.tds_amount) > 0 && (
                          <p className="text-xs text-muted-foreground">TDS: <span className="text-red-600 dark:text-red-400">{parseFloat(tx.tds_amount).toLocaleString("en-IN")}</span> | Net: <span className="text-green-600 dark:text-green-400">{parseFloat(tx.net_payout || "0").toLocaleString("en-IN")}</span></p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tx.status === "completed" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        {tx.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
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
