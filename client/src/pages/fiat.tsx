import { useEffect } from "react";
import { useAuth, useLogout } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  XCircle,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fiatBuySchema, fiatSellSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FiatTransaction, UserWallet } from "@shared/schema";
import { useState } from "react";
import kuznexLogo from "@assets/image_1770554564085.png";

export default function FiatPage() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();

  const { data: paymentInfo } = useQuery<{
    upiId: string | null;
    bankDetails: { accountNumber: string | null; ifsc: string | null; accountName: string | null; bankName: string | null } | null;
    isImpsEnabled: boolean;
    isUpiEnabled: boolean;
    isBankEnabled: boolean;
  }>({
    queryKey: ["/api/fiat/payment-info"],
    enabled: !!user,
  });

  const { data: wallets } = useQuery<UserWallet[]>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: usdtRates } = useQuery<{ buyRate: string; sellRate: string }>({
    queryKey: ["/api/usdt-rates"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: fiatHistory = [] } = useQuery<FiatTransaction[]>({
    queryKey: ["/api/fiat/history"],
    enabled: !!user,
  });

  const buyForm = useForm<z.infer<typeof fiatBuySchema>>({
    resolver: zodResolver(fiatBuySchema),
    defaultValues: { amount: "", utrNumber: "" },
  });

  const sellForm = useForm<z.infer<typeof fiatSellSchema>>({
    resolver: zodResolver(fiatSellSchema),
    defaultValues: { amount: "", bankName: "", accountNumber: "", ifscCode: "" },
  });

  const buyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fiatBuySchema>) => {
      const res = await apiRequest("POST", "/api/fiat/buy", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fiat/history"] });
      buyForm.reset();
      toast({ title: "Buy Request Submitted", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Buy request failed", description: err.message, variant: "destructive" });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fiatSellSchema>) => {
      const res = await apiRequest("POST", "/api/fiat/sell", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fiat/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      sellForm.reset();
      toast({ title: "Sell Request Submitted", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Sell request failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) { return null; }

  const usdtWallet = wallets?.find(w => w.currency === "USDT");
  const usdtBalance = usdtWallet ? parseFloat(usdtWallet.balance) : 0;

  const buyRate = parseFloat(usdtRates?.buyRate || "92");
  const sellRate = parseFloat(usdtRates?.sellRate || "90");

  const watchBuyAmount = buyForm.watch("amount");
  const buyAmountNum = parseFloat(watchBuyAmount) || 0;
  const usdtFromBuy = buyAmountNum > 0 ? buyAmountNum / buyRate : 0;

  const watchSellAmount = sellForm.watch("amount");
  const sellAmountNum = parseFloat(watchSellAmount) || 0;
  const inrFromSell = sellAmountNum > 0 ? sellAmountNum * sellRate : 0;
  const tdsFromSell = inrFromSell * 0.01;
  const netFromSell = inrFromSell - tdsFromSell;

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/") });
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved": return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "completed": return <Badge variant="outline" className="text-blue-600 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "rejected": return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard"><Button variant="ghost" size="sm"><Wallet className="w-4 h-4 mr-2" />Dashboard</Button></Link>
              <Link href="/trade/BTCUSDT"><Button variant="ghost" size="sm"><BarChart3 className="w-4 h-4 mr-2" />Trade</Button></Link>
              <Link href="/swap"><Button variant="ghost" size="sm"><ArrowLeftRight className="w-4 h-4 mr-2" />Swap</Button></Link>
              <Link href="/wallet"><Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-2" />Crypto</Button></Link>
              <Link href="/fiat"><Button variant="secondary" size="sm"><CreditCard className="w-4 h-4 mr-2" />Fiat</Button></Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto bg-background">
        <Link href="/dashboard"><Button variant="ghost" size="sm" data-testid="link-mobile-wallet"><Wallet className="w-4 h-4 mr-1" />Wallet</Button></Link>
        <Link href="/swap"><Button variant="ghost" size="sm" data-testid="link-mobile-swap"><ArrowLeftRight className="w-4 h-4 mr-1" />Swap</Button></Link>
        <Link href="/deposit"><Button variant="ghost" size="sm" data-testid="link-mobile-crypto"><Download className="w-4 h-4 mr-1" />Crypto</Button></Link>
        <Link href="/fiat"><Button variant="secondary" size="sm" data-testid="link-mobile-fiat"><CreditCard className="w-4 h-4 mr-1" />Fiat</Button></Link>
      </div>

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-fiat-title">Fiat (INR) Exchange</h1>
        <p className="text-muted-foreground mb-6">
          USDT Balance: <span className="font-semibold text-foreground">{usdtBalance.toFixed(2)} USDT</span>
        </p>

        <Tabs defaultValue="buy-usdt">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="buy-usdt" className="flex-1" data-testid="tab-buy-usdt">Buy USDT</TabsTrigger>
            <TabsTrigger value="sell-usdt" className="flex-1" data-testid="tab-sell-usdt">Sell USDT</TabsTrigger>
            <TabsTrigger value="history" className="flex-1" data-testid="tab-fiat-history">History</TabsTrigger>
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

              {paymentInfo?.isUpiEnabled && paymentInfo.upiId && (
                <div className="mb-4 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-foreground text-sm">Pay via UPI</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">UPI ID: <span className="text-foreground font-mono font-medium" data-testid="text-upi-id">{paymentInfo.upiId}</span></p>
                  </div>
                </div>
              )}

              {paymentInfo?.isBankEnabled && paymentInfo.bankDetails && (
                <div className="mb-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-foreground text-sm">Pay via Bank Transfer{paymentInfo.isImpsEnabled ? " / IMPS" : ""}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Bank: <span className="text-foreground" data-testid="text-bank-name">{paymentInfo.bankDetails.bankName || "N/A"}</span></p>
                    <p className="text-muted-foreground">A/C: <span className="text-foreground font-mono" data-testid="text-account-number">{paymentInfo.bankDetails.accountNumber || "N/A"}</span></p>
                    <p className="text-muted-foreground">IFSC: <span className="text-foreground font-mono" data-testid="text-ifsc">{paymentInfo.bankDetails.ifsc || "N/A"}</span></p>
                    <p className="text-muted-foreground">Name: <span className="text-foreground" data-testid="text-account-name">{paymentInfo.bankDetails.accountName || "N/A"}</span></p>
                  </div>
                </div>
              )}

              {!paymentInfo?.isUpiEnabled && !paymentInfo?.isBankEnabled && (
                <div className="mb-4 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-muted-foreground">Payment methods are currently unavailable. Please try again later or contact support.</p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex gap-2 mb-4">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Transfer INR to the bank details above, then enter your UTR number below. Admin will verify and credit USDT to your account.
                </p>
              </div>

              <Form {...buyForm}>
                <form onSubmit={buyForm.handleSubmit((data) => buyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={buyForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>INR Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="Enter INR amount" className="pl-10" data-testid="input-buy-inr-amount" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <span className="font-semibold text-foreground">You Receive (est.)</span>
                        <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-buy-usdt-receive">{usdtFromBuy.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  )}
                  <FormField
                    control={buyForm.control}
                    name="utrNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTR / Transaction Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter UTR or reference number" data-testid="input-buy-utr" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={buyMutation.isPending || buyAmountNum <= 0} data-testid="button-submit-buy">
                    {buyMutation.isPending ? "Submitting..." : "Submit Buy Request"}
                  </Button>
                </form>
              </Form>
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

              <Form {...sellForm}>
                <form onSubmit={sellForm.handleSubmit((data) => sellMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={sellForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>USDT Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter USDT amount" data-testid="input-sell-usdt-amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <span className="font-semibold text-foreground">You Receive (est.)</span>
                        <span className="font-bold text-green-600 dark:text-green-400" data-testid="text-sell-usdt-receive">₹{netFromSell.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                  {sellAmountNum > usdtBalance && sellAmountNum > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 text-center">Insufficient USDT balance</p>
                  )}

                  <FormField
                    control={sellForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. State Bank of India" data-testid="input-sell-bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sellForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" data-testid="input-sell-account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sellForm.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SBIN0001234" data-testid="input-sell-ifsc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      1% TDS is deducted as per Govt of India VDA guidelines (Section 194S). USDT will be deducted immediately, and INR will be sent to your bank after admin verification.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sellMutation.isPending || sellAmountNum <= 0 || sellAmountNum > usdtBalance}
                    data-testid="button-submit-sell"
                  >
                    {sellMutation.isPending ? "Submitting..." : "Submit Sell Request"}
                  </Button>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Fiat Transaction History</h3>
              {fiatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No fiat transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {fiatHistory.map(tx => (
                    <div key={tx.id} className="p-4 rounded-lg border border-border space-y-2" data-testid={`fiat-tx-${tx.id}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {tx.type === "buy" ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm text-foreground">
                            {tx.type === "buy" ? "Buy USDT" : "Sell USDT"}
                          </span>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">INR:</span>{" "}
                          <span className="text-foreground">₹{parseFloat(tx.amount).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">USDT:</span>{" "}
                          <span className="text-foreground">{parseFloat(tx.usdt_amount).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span>{" "}
                          <span className="text-foreground">₹{tx.rate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          <span className="text-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                        </div>
                        {tx.utr_number && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">UTR:</span>{" "}
                            <span className="text-foreground font-mono">{tx.utr_number}</span>
                          </div>
                        )}
                        {tx.admin_reply && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Admin:</span>{" "}
                            <span className="text-foreground">{tx.admin_reply}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
