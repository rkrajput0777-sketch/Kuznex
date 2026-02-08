import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Loader2, IndianRupee, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminRates() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: rates, isLoading: ratesLoading } = useQuery<{ usdt_buy_rate: string; usdt_sell_rate: string }>({
    queryKey: ["/api/admin/rates"],
    enabled: !!user?.isSuperAdmin,
  });

  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");

  useEffect(() => {
    if (rates) {
      setBuyRate(rates.usdt_buy_rate);
      setSellRate(rates.usdt_sell_rate);
    }
  }, [rates]);

  const updateMutation = useMutation({
    mutationFn: async (data: { usdt_buy_rate: string; usdt_sell_rate: string }) => {
      const res = await apiRequest("POST", "/api/admin/rates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usdt-rates"] });
      toast({ title: "Rates Updated", description: "USDT buy/sell rates have been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading || ratesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.isSuperAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const handleSave = () => {
    const buyNum = parseFloat(buyRate);
    const sellNum = parseFloat(sellRate);
    if (isNaN(buyNum) || isNaN(sellNum) || buyNum <= 0 || sellNum <= 0) {
      toast({ title: "Invalid rates", description: "Please enter valid positive numbers.", variant: "destructive" });
      return;
    }
    if (sellNum >= buyNum) {
      toast({ title: "Invalid rates", description: "Sell rate should be lower than buy rate for profit margin.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ usdt_buy_rate: buyRate, usdt_sell_rate: sellRate });
  };

  const spread = parseFloat(buyRate) - parseFloat(sellRate);
  const spreadPercent = parseFloat(buyRate) > 0 ? (spread / parseFloat(buyRate)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" data-testid="button-back-admin">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-foreground">USDT Rate Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Fiat USDT Rates</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Set the INR per USDT rate for user buy/sell operations. Users buy at the higher rate and sell at the lower rate. The difference is your profit margin.
          </p>

          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Buy Rate (INR per USDT)</Label>
              <p className="text-xs text-muted-foreground mb-2">Users pay this rate when buying USDT</p>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 92.00"
                  className="pl-10"
                  value={buyRate}
                  onChange={(e) => setBuyRate(e.target.value)}
                  data-testid="input-admin-buy-rate"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Sell Rate (INR per USDT)</Label>
              <p className="text-xs text-muted-foreground mb-2">Users receive this rate when selling USDT</p>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 90.00"
                  className="pl-10"
                  value={sellRate}
                  onChange={(e) => setSellRate(e.target.value)}
                  data-testid="input-admin-sell-rate"
                />
              </div>
            </div>

            {parseFloat(buyRate) > 0 && parseFloat(sellRate) > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2" data-testid="rate-spread-preview">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spread</span>
                  <span className="text-foreground font-medium">₹{spread.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spread %</span>
                  <span className="text-foreground font-medium">{spreadPercent.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit per 100 USDT</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">₹{(spread * 100).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={updateMutation.isPending}
              onClick={handleSave}
              data-testid="button-save-rates"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Rates"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
