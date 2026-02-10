import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  Save,
  CreditCard,
  Building2,
  Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FiatSettings {
  upi_id: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_account_name: string;
  bank_name: string;
  is_upi_enabled: boolean;
  is_bank_enabled: boolean;
  is_imps_enabled: boolean;
}

export default function AdminFiatSettings() {
  const { data: user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<FiatSettings>({
    upi_id: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_account_name: "",
    bank_name: "",
    is_upi_enabled: false,
    is_bank_enabled: false,
    is_imps_enabled: false,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<FiatSettings>({
    queryKey: ["/api/admin/fiat-settings"],
    enabled: !!user?.isSuperAdmin,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: FiatSettings) => {
      const res = await apiRequest("POST", "/api/admin/fiat-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiat-settings"] });
      toast({ title: "Settings saved", description: "Fiat payment settings updated. Changes are live for users now." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
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

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-fiat-settings-title">Fiat Payment Settings</h1>
            <p className="text-sm text-muted-foreground">Configure bank details and payment methods shown to users</p>
          </div>
        </div>

        {settingsLoading ? (
          <Card className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">UPI Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable UPI</Label>
                    <p className="text-xs text-muted-foreground">Show UPI payment option to users</p>
                  </div>
                  <Switch
                    checked={form.is_upi_enabled}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_upi_enabled: checked }))}
                    data-testid="switch-upi-enabled"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">UPI ID</Label>
                  <Input
                    placeholder="e.g., kuznex@upi"
                    value={form.upi_id}
                    onChange={e => setForm(prev => ({ ...prev, upi_id: e.target.value }))}
                    data-testid="input-upi-id"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Bank Transfer Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Bank Transfer</Label>
                    <p className="text-xs text-muted-foreground">Show bank transfer (NEFT/RTGS) option to users</p>
                  </div>
                  <Switch
                    checked={form.is_bank_enabled}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_bank_enabled: checked }))}
                    data-testid="switch-bank-enabled"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable IMPS</Label>
                    <p className="text-xs text-muted-foreground">Show IMPS instant payment option to users</p>
                  </div>
                  <Switch
                    checked={form.is_imps_enabled}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_imps_enabled: checked }))}
                    data-testid="switch-imps-enabled"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Bank Name</Label>
                  <Input
                    placeholder="e.g., State Bank of India"
                    value={form.bank_name}
                    onChange={e => setForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    data-testid="input-bank-name"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Account Holder Name</Label>
                  <Input
                    placeholder="e.g., Kuznex Pvt Ltd"
                    value={form.bank_account_name}
                    onChange={e => setForm(prev => ({ ...prev, bank_account_name: e.target.value }))}
                    data-testid="input-account-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Account Number</Label>
                    <Input
                      placeholder="Enter account number"
                      value={form.bank_account_number}
                      onChange={e => setForm(prev => ({ ...prev, bank_account_number: e.target.value }))}
                      data-testid="input-account-number"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">IFSC Code</Label>
                    <Input
                      placeholder="e.g., SBIN0001234"
                      value={form.bank_ifsc}
                      onChange={e => setForm(prev => ({ ...prev, bank_ifsc: e.target.value }))}
                      data-testid="input-ifsc"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              data-testid="button-save-fiat-settings"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save All Settings</>
              )}
            </Button>

            <Card className="p-4 bg-secondary/50">
              <p className="text-xs text-muted-foreground">
                Changes take effect immediately. When a user opens the "Deposit INR" page,
                they will see the bank details and payment methods you configure here.
                Disabling a payment method will hide it from the user interface.
              </p>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
