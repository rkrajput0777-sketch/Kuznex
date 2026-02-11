import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Swap from "@/pages/swap";
import Deposit from "@/pages/deposit";
import FiatPage from "@/pages/fiat";
import KycPage from "@/pages/kyc";
import Contact from "@/pages/contact";
import AdminKycReview from "@/pages/admin-kyc";
import AdminUsers from "@/pages/admin-users";
import AdminWithdrawals from "@/pages/admin-withdrawals";
import AdminTdsReports from "@/pages/admin-tds";
import AdminMessages from "@/pages/admin-messages";
import AdminRates from "@/pages/admin-rates";
import AdminFiatApprovals from "@/pages/admin-fiat";
import AdminFunds from "@/pages/admin-funds";
import AdminFiatSettings from "@/pages/admin-fiat-settings";
import AdminCryptoWithdrawals from "@/pages/admin-crypto-withdrawals";
import AdminNotifications from "@/pages/admin-notifications";
import SpotTrade from "@/pages/spot-trade";
import { PrivacyPolicy, TermsOfService, RiskDisclosure, AmlPolicy, TdsCompliance } from "@/pages/legal";
import NotFound from "@/pages/not-found";
import RequireKYC from "@/components/require-kyc";
import AdminGuard from "@/components/admin-guard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/contact" component={Contact} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/kyc" component={KycPage} />
      <Route path="/legal/privacy-policy" component={PrivacyPolicy} />
      <Route path="/legal/terms" component={TermsOfService} />
      <Route path="/legal/risk-disclosure" component={RiskDisclosure} />
      <Route path="/legal/aml-policy" component={AmlPolicy} />
      <Route path="/legal/tds-compliance" component={TdsCompliance} />
      <Route path="/admin/kyc-review">
        <AdminGuard><AdminKycReview /></AdminGuard>
      </Route>
      <Route path="/admin/users">
        <AdminGuard><AdminUsers /></AdminGuard>
      </Route>
      <Route path="/admin/withdrawals">
        <AdminGuard><AdminWithdrawals /></AdminGuard>
      </Route>
      <Route path="/admin/tds-reports">
        <AdminGuard><AdminTdsReports /></AdminGuard>
      </Route>
      <Route path="/admin/messages">
        <AdminGuard><AdminMessages /></AdminGuard>
      </Route>
      <Route path="/admin/rates">
        <AdminGuard><AdminRates /></AdminGuard>
      </Route>
      <Route path="/admin/fiat-approvals">
        <AdminGuard><AdminFiatApprovals /></AdminGuard>
      </Route>
      <Route path="/admin/funds">
        <AdminGuard><AdminFunds /></AdminGuard>
      </Route>
      <Route path="/admin/fiat-settings">
        <AdminGuard><AdminFiatSettings /></AdminGuard>
      </Route>
      <Route path="/admin/crypto-withdrawals">
        <AdminGuard><AdminCryptoWithdrawals /></AdminGuard>
      </Route>
      <Route path="/admin/notifications">
        <AdminGuard><AdminNotifications /></AdminGuard>
      </Route>
      <Route path="/trade/:pair">
        {(params: { pair: string }) => (
          <RequireKYC><SpotTrade pair={params.pair} /></RequireKYC>
        )}
      </Route>
      <Route path="/trade">
        <RequireKYC><SpotTrade pair="BTCUSDT" /></RequireKYC>
      </Route>
      <Route path="/swap">
        <RequireKYC><Swap /></RequireKYC>
      </Route>
      <Route path="/wallet">
        <RequireKYC><Deposit /></RequireKYC>
      </Route>
      <Route path="/deposit">
        <RequireKYC><Deposit /></RequireKYC>
      </Route>
      <Route path="/fiat">
        <RequireKYC><FiatPage /></RequireKYC>
      </Route>
      <Route path="/inr">
        <RequireKYC><FiatPage /></RequireKYC>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
