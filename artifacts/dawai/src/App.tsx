import { Layout } from "@/components/Layout";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import NotFound from "@/pages/not-found";
import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Search } from "@/pages/Search";
import { Orders } from "@/pages/Orders";
import { Notifications } from "@/pages/Notifications";
import { Account } from "@/pages/Account";
import { PharmacyDashboard } from "@/pages/PharmacyDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function Router() {
  const { isAuthenticated, isPharmacy, isLoading } = useAuth();

  // Wait for session restoration before rendering routes
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        {/* Login page — redirect away if already authenticated */}
        <Route path="/login">
          {isAuthenticated ? (
            <Redirect to={isPharmacy ? "/pharmacy-dashboard" : "/"} />
          ) : (
            <Login />
          )}
        </Route>

        {/* Patient-only routes — require auth */}
        <Route path="/">
          {!isAuthenticated ? <Redirect to="/login" /> : isPharmacy ? <Redirect to="/pharmacy-dashboard" /> : <Home />}
        </Route>
        <Route path="/search">
          {!isAuthenticated ? <Redirect to="/login" /> : <Search />}
        </Route>
        <Route path="/orders">
          {!isAuthenticated ? <Redirect to="/login" /> : <Orders />}
        </Route>
        <Route path="/notifications">
          {!isAuthenticated ? <Redirect to="/login" /> : <Notifications />}
        </Route>
        <Route path="/account">
          {!isAuthenticated ? <Redirect to="/login" /> : <Account />}
        </Route>

        {/* Pharmacy-only route */}
        <Route path="/pharmacy-dashboard">
          {!isAuthenticated ? (
            <Redirect to="/login" />
          ) : !isPharmacy ? (
            <Redirect to="/" />
          ) : (
            <PharmacyDashboard />
          )}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
