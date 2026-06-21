import { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthContext, AuthProvider, isVendor } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SplashIntro } from '@/components/SplashIntro';
import { PartnershipAgreementModal } from '@/components/PartnershipAgreementModal';
import { Layout } from '@/components/Layout';
import { ROUTER_BASENAME } from '@/lib/api-base';

// Pages
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { Orders } from '@/pages/Orders';
import { Cart } from '@/pages/Cart';
import { Notifications } from '@/pages/Notifications';
import { Account } from '@/pages/Account';
import { PharmacyDashboard } from '@/pages/PharmacyDashboard';
import { PharmacyRegister } from '@/pages/PharmacyRegister';
import { VendorProfile } from '@/pages/VendorProfile';

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

  // بوابة الانضمام — البائع المعتمَد (صيدلية/كوزماتك) ينتظر التوقيع الرقمي قبل الوصول للوحة التحكم
  if (isVendor(user) && user.status === 'approved_pending_signature') {
    return <PartnershipAgreementModal />;
  }

  return (
    <Routes>
      <Route path="/home"          element={<Home />} />
      <Route path="/search"        element={<Search />} />
      <Route path="/orders"        element={<Orders />} />
      <Route path="/cart"          element={<Cart />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/account"       element={<Account />} />
      <Route path="/vendor/:id"    element={<VendorProfile />} />

      {isVendor(user) && (
        <Route path="/dashboard" element={<PharmacyDashboard />} />
      )}
      <Route path="/pharmacy-register" element={<PharmacyRegister />} />

      <Route
        path="*"
        element={<Navigate to={isVendor(user) ? '/dashboard' : '/home'} replace />}
      />
    </Routes>
  );
};

export default function App() {
  // شاشة الترحيب — تُعرض عند فتح التطبيق لمرة واحدة
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // يبدأ الخروج (Glass Wipe) عند 2.5 ثانية، ومدته 1 ثانية → الإجمالي 3.5 ثانية كحد أقصى
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer); // Cleanup لمنع Memory Leak
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter basename={ROUTER_BASENAME}>

              {/* ── شاشة الترحيب — خارج Layout لتغطي كامل الشاشة ── */}
              <AnimatePresence mode="wait">
                {showIntro && <SplashIntro key="splash" />}
              </AnimatePresence>

              {/* ── المحتوى الرئيسي — يُحمَّل في الخلفية أثناء الـ Splash ── */}
              <Layout>
                <AppRoutes />
              </Layout>

              <Toaster />

            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
