import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Download,
  IndianRupee,
  Shield,
} from "lucide-react";
import { useState } from "react";
import kuznexLogo from "@assets/image_1770554564085.png";

interface TdsRecord {
  id: number;
  date: string;
  userId: number;
  username: string;
  email: string;
  pan: string;
  type: string;
  grossAmount: string;
  tdsAmount: string;
  netPayout: string;
  fromCurrency: string;
  fromAmount: string;
}

interface TdsReport {
  records: TdsRecord[];
  summary: {
    totalRecords: number;
    totalGross: string;
    totalTds: string;
    period: { start: string; end: string };
  };
}

export default function AdminTdsReports() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

  const { data: report, isLoading: reportLoading } = useQuery<TdsReport>({
    queryKey: ["/api/admin/tds-report", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tds-report?start=${startDate}&end=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load TDS report");
      return res.json();
    },
    enabled: !!user?.isSuperAdmin,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExportCsv = () => {
    if (!report?.records.length) return;

    const headers = ["Date", "User Name", "Email", "PAN Number", "Transaction Type", "Gross Amount (INR)", "TDS Deducted (INR)", "Net Payout (INR)"];
    const rows = report.records.map(r => [
      new Date(r.date).toLocaleDateString("en-IN"),
      r.username,
      r.email,
      r.pan,
      r.type,
      r.grossAmount,
      r.tdsAmount,
      r.netPayout,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuznex-tds-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2" data-testid="link-tds-logo">
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
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-tds-title">TDS Reports</h1>
            <p className="text-sm text-muted-foreground">Tax Deducted at Source - Compliance Report (1% as per VDA laws)</p>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                data-testid="input-tds-start-date"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                data-testid="input-tds-end-date"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={!report?.records.length}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Download TDS CSV
            </Button>
          </div>
        </Card>

        {report?.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-xl font-bold text-foreground" data-testid="text-tds-total-records">{report.summary.totalRecords}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Gross Sale Amount</p>
              <p className="text-xl font-bold text-foreground" data-testid="text-tds-total-gross">{parseFloat(report.summary.totalGross).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Total TDS Collected</p>
              <p className="text-xl font-bold text-primary" data-testid="text-tds-total-collected">{parseFloat(report.summary.totalTds).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </Card>
          </div>
        )}

        {reportLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-tds-records">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">PAN</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Gross (INR)</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">TDS (1%)</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Net Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.records.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No TDS records found for this period</td>
                    </tr>
                  )}
                  {report?.records.map((r, i) => (
                    <tr key={`${r.type}-${r.id}`} className="border-b border-border/50" data-testid={`row-tds-${i}`}>
                      <td className="p-4 text-muted-foreground">
                        {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{r.username}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-primary font-medium" data-testid={`text-pan-${i}`}>{r.pan}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.type === "Crypto Sell (Swap)" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">{parseFloat(r.grossAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right font-medium text-red-600 dark:text-red-400">{parseFloat(r.tdsAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right font-medium text-green-600 dark:text-green-400">{parseFloat(r.netPayout).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="mt-6 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Compliance Note:</span> 1% TDS is deducted on all crypto sell transactions and INR withdrawals as per the Government of India Virtual Digital Asset (VDA) tax regulations (Section 194S). This report can be shared with your CA for quarterly TDS filing.
          </p>
        </div>
      </main>
    </div>
  );
}
