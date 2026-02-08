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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inrDepositSchema, inrWithdrawSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InrTransaction, UserWallet } from "@shared/schema";

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

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) { setLocation("/login"); return null; }

  const inrWallet = wallets?.find(w => w.currency === "INR");
  const inrBalance = inrWallet ? parseFloat(inrWallet.balance) : 0;

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
        <p className="text-muted-foreground mb-6">
          INR Balance: <span className="font-semibold text-foreground">₹{inrBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </p>

        <Tabs defaultValue="deposit">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="deposit" className="flex-1" data-testid="tab-inr-deposit">Deposit INR</TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1" data-testid="tab-inr-withdraw">Withdraw INR</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card className="p-6 mb-6">
              <div className="mb-6 p-4 rounded-lg bg-secondary border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Admin Bank Details</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Bank: <span className="text-foreground">{bankDetails?.bankName || "Loading..."}</span></p>
                  <p className="text-muted-foreground">A/C: <span className="text-foreground">{bankDetails?.accountNumber || "Loading..."}</span></p>
                  <p className="text-muted-foreground">IFSC: <span className="text-foreground">{bankDetails?.ifscCode || "Loading..."}</span></p>
                  <p className="text-muted-foreground">Name: <span className="text-foreground">{bankDetails?.accountHolder || "Loading..."}</span></p>
                  <p className="text-muted-foreground">UPI: <span className="text-foreground">{bankDetails?.upiId || "Loading..."}</span></p>
                </div>
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
                  <Button type="submit" className="w-full" disabled={withdrawMutation.isPending} data-testid="button-submit-inr-withdraw">
                    {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Funds will be deducted immediately. Payment processed manually within 24 hours.
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
                          {tx.type === "deposit" ? "Deposit" : "Withdrawal"} - ₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                        </p>
                        {tx.utr_number && <p className="text-xs text-muted-foreground">UTR: {tx.utr_number}</p>}
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
