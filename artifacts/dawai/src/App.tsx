import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';
import { OrderAutomationProvider } from '@/contexts/OrderAutomationContext';
import { OrderAutomationManager } from '@/components/OrderAutomationManager';
import { SplashIntro } from '@/components/SplashIntro';
import { Layout } from '@/components/Layout';

// Pages
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { Orders } from '@/pages/Orders';
import { Notifications } from '@/pages/Notifications';
import { Account } from '@/pages/Account';
import { PharmacyDashboard } from '@/pages/PharmacyDashboard';
import { PharmacyRegister } from '@/pages/PharmacyRegister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const AppRoutes = () => {
  const { user } = useContext(AuthContext)!;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/home"          element={<Home />} />
      <Route path="/search"        element={<Search />} />
      <Route path="/orders"        element={<Orders />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/account"       element={<Account />} />

      {user.role === 'pharmacy' && (
        <Route path="/dashboard" element={<PharmacyDashboard />} />
      )}
      <Route path="/pharmacy-register" element={<PharmacyRegister />} />

      <Route
        path="*"
        element={<Navigate to={user.role === 'pharmacy' ? '/dashboard' : '/home'} replace />}
      />
    </Routes>
  );
};

export default function App() {
  // شاشة الترحيب — تُعرض عند فتح التطبيق لمرة واحدة
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // تختفي الشاشة بعد 3.5 ثانية — يكفي لإتمام تسلسل الحركة
    const timer = setTimeout(() => setShowIntro(false), 2800);
    return () => clearTimeout(timer); // Cleanup لمنع Memory Leak
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OrderAutomationProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>

              {/* ── شاشة الترحيب — خارج Layout لتغطي كامل الشاشة ── */}
              <AnimatePresence mode="wait">
                {showIntro && <SplashIntro key="splash" />}
              </AnimatePresence>

              {/* ── المحتوى الرئيسي — يُحمَّل في الخلفية أثناء الـ Splash ── */}
              <Layout>
                <AppRoutes />
              </Layout>

              {/* لوحة الأتمتة العائمة */}
              <OrderAutomationManager />
              <Toaster />

            </BrowserRouter>
          </OrderAutomationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
