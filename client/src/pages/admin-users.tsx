import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Eye,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  KeyRound,
} from "lucide-react";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import kuznexLogo from "@assets/image_1770554564085.png";

interface AdminUser {
  id: number;
  kuznexId: string | null;
  username: string;
  email: string;
  kycStatus: string;
  isAdmin: boolean;
  createdAt: string;
  wallets: { currency: string; balance: string }[];
}

interface UserAnalytics {
  userId: number;
  netDeposit: number;
  change24hPercent: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export default function AdminUsers() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isSuperAdmin,
  });

  const { data: userStatsMap } = useQuery<Record<number, UserAnalytics>>({
    queryKey: ["/api/admin/user-stats"],
    enabled: !!user?.isSuperAdmin,
    refetchInterval: 120000,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/admin/reset-password", { userId, newPassword });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Password reset", description: data.message });
      setResetPasswordUser(null);
      setNewPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/impersonate/${userId}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({ title: `Now viewing as ${data.username}` });
      setLocation("/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Impersonation failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getKycBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" data-testid={`badge-kyc-${status}`}>Verified</span>;
      case "submitted":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" data-testid={`badge-kyc-${status}`}>Under Review</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" data-testid={`badge-kyc-${status}`}>Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" data-testid={`badge-kyc-${status}`}>Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-admin-logo">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-admin-users-title">User Management</h1>
            <p className="text-sm text-muted-foreground">View and manage all registered users</p>
          </div>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-users">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Date Joined</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Kuznex ID</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Name & Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">KYC Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Wallet Balance</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Net Deposit</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">24h Activity</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map((u) => {
                    const stats = userStatsMap?.[u.id];
                    const netDeposit = stats?.netDeposit ?? 0;
                    const change24h = stats?.change24hPercent ?? 0;

                    return (
                      <tr key={u.id} className="border-b border-border/50 hover-elevate" data-testid={`row-user-${u.id}`}>
                        <td className="p-4 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-primary font-medium" data-testid={`text-user-kuznex-id-${u.id}`}>
                            {u.kuznexId || "N/A"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{u.username}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-4">{getKycBadge(u.kycStatus)}</td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            {u.wallets.filter(w => parseFloat(w.balance) > 0).length > 0 ? (
                              u.wallets.filter(w => parseFloat(w.balance) > 0).map(w => (
                                <p key={w.currency} className="text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">{parseFloat(w.balance).toFixed(w.currency === "INR" ? 2 : 8)}</span> {w.currency}
                                </p>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">No balance</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4" data-testid={`text-net-deposit-${u.id}`}>
                          {stats ? (
                            <div>
                              <p className={`font-medium text-sm ${netDeposit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {netDeposit >= 0 ? "+" : ""}${netDeposit.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {netDeposit > 500 && <span className="text-green-600 font-medium">Whale</span>}
                                {netDeposit < 0 && <span className="text-red-600 font-medium">Risk</span>}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="p-4" data-testid={`text-24h-activity-${u.id}`}>
                          {stats ? (
                            <div className="flex items-center gap-1">
                              {change24h >= 0 ? (
                                <TrendingUp className={`w-3.5 h-3.5 ${change24h > 0 ? "text-green-600" : "text-muted-foreground"}`} />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                              )}
                              <span className={`text-sm font-medium ${change24h > 0 ? "text-green-600" : change24h < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {change24h >= 0 ? "+" : ""}{change24h.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            {!u.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => impersonateMutation.mutate(u.id)}
                                disabled={impersonateMutation.isPending}
                                data-testid={`button-impersonate-${u.id}`}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Login As
                              </Button>
                            )}
                            {!u.isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setResetPasswordUser(u); setNewPassword(""); }}
                                data-testid={`button-reset-pw-${u.id}`}
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                                Reset PW
                              </Button>
                            )}
                            {u.isAdmin && (
                              <span className="inline-flex items-center gap-1 text-xs text-primary">
                                <Shield className="w-3.5 h-3.5" />
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {allUsers && (
              <div className="p-4 border-t border-border/50 text-sm text-muted-foreground">
                Total users: {allUsers.length}
              </div>
            )}
          </Card>
        )}
      </main>

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) { setResetPasswordUser(null); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetPasswordUser && (
                <>Set a new password for <span className="font-medium text-foreground">{resetPasswordUser.username}</span> ({resetPasswordUser.email})</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">New Password</Label>
              <Input
                type="text"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (resetPasswordUser && newPassword.length >= 6) {
                  resetPasswordMutation.mutate({ userId: resetPasswordUser.id, newPassword });
                }
              }}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
              data-testid="button-confirm-reset-pw"
            >
              {resetPasswordMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>
              ) : (
                <><KeyRound className="w-4 h-4 mr-2" />Reset Password</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
