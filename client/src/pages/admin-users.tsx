import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  UserCheck,
  Eye,
  Shield,
  Users,
} from "lucide-react";
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

export default function AdminUsers() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
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

  if (!user || !user.isAdmin) {
    setLocation("/dashboard");
    return null;
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

  const getTotalBalance = (wallets: { currency: string; balance: string }[]) => {
    return wallets.reduce((sum, w) => sum + parseFloat(w.balance || "0"), 0);
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
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map((u) => (
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
                      <td className="p-4">
                        {!u.isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => impersonateMutation.mutate(u.id)}
                            disabled={impersonateMutation.isPending}
                            data-testid={`button-impersonate-${u.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Login As User
                          </Button>
                        )}
                        {u.isAdmin && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
