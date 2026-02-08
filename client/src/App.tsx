import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Swap from "@/pages/swap";
import Deposit from "@/pages/deposit";
import InrRamp from "@/pages/inr";
import KycPage from "@/pages/kyc";
import AdminKycReview from "@/pages/admin-kyc";
import AdminUsers from "@/pages/admin-users";
import AdminWithdrawals from "@/pages/admin-withdrawals";
import SpotTrade from "@/pages/spot-trade";
import NotFound from "@/pages/not-found";
import RequireKYC from "@/components/require-kyc";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/kyc" component={KycPage} />
      <Route path="/admin/kyc-review" component={AdminKycReview} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
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
      <Route path="/deposit">
        <RequireKYC><Deposit /></RequireKYC>
      </Route>
      <Route path="/inr">
        <RequireKYC><InrRamp /></RequireKYC>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
