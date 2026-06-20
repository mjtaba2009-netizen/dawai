import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

// Pages
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { Orders } from '@/pages/Orders';
import { Notifications } from '@/pages/Notifications';
import { Account } from '@/pages/Account';
import { PharmacyDashboard } from '@/pages/PharmacyDashboard';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const AppRoutes = () => {
  const { user } = useContext(AuthContext)!;

  // إذا لم يسجل الدخول، وجهه دائماً لصفحة الدخول
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // إذا كان مسجلاً، وجهه حسب نوع حسابه (صيدلية أو مريض)
  return (
    <Routes>
      {user.role === 'pharmacy' ? (
        <>
          <Route path="/dashboard" element={<PharmacyDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <>
          <Route path="/home"          element={<Home />} />
          <Route path="/search"        element={<Search />} />
          <Route path="/orders"        element={<Orders />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/account"       element={<Account />} />
          <Route path="*"              element={<Navigate to="/home" replace />} />
        </>
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Layout>
              <AppRoutes />
            </Layout>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
