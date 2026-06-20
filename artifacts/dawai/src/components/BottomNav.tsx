import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User, LayoutGrid, ShoppingCart } from 'lucide-react';
import { useGetNotifications } from '@workspace/api-client-react';
import { AuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function BottomNav() {
  const location = useLocation();
  const auth     = useContext(AuthContext);
  const isPharmacy = auth?.user?.role === 'pharmacy';

  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const { totalCount: cartCount } = useCart();

  // الأزرار الأساسية للمريض — السلة زر بارز في المنتصف مع عدّاد حيّ
  const patientTabs = [
    { to: '/home',          icon: Home,         label: 'الرئيسية'  },
    { to: '/orders',        icon: Package,      label: 'طلباتي',   badge: 0 },
    { to: '/cart',          icon: ShoppingCart, label: 'السلة',    cart: true, badge: cartCount },
    { to: '/notifications', icon: Bell,         label: 'الإشعارات', badge: unreadCount },
    { to: '/account',       icon: User,         label: 'حسابي'     },
  ];

  // أزرار الصيدلي — يُضاف "إدارة الصيدلية" بين الرئيسية وطلباتي
  const pharmacyTabs = [
    { to: '/home',          icon: Home,        label: 'الرئيسية'       },
    { to: '/dashboard',     icon: LayoutGrid,  label: 'إدارة الصيدلية', pharmacy: true },
    { to: '/orders',        icon: Package,     label: 'طلباتي',         badge: 0 },
    { to: '/notifications', icon: Bell,        label: 'الإشعارات',      badge: unreadCount },
    { to: '/account',       icon: User,        label: 'حسابي'          },
  ];

  const tabs = isPharmacy ? pharmacyTabs : patientTabs;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div
        className="w-full max-w-[430px] pointer-events-auto
          bg-white/65 backdrop-blur-2xl
          border-t border-white/50
          shadow-[0_-8px_30px_rgb(0,0,0,0.08)]
          pb-safe"
      >
        <div className="flex items-stretch justify-around h-16 px-1">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.to ||
              (tab.to !== '/home' && location.pathname.startsWith(tab.to));
            const Icon       = tab.icon;
            const isPharmTab = 'pharmacy' in tab && tab.pharmacy === true;
            const isCartTab  = 'cart' in tab && tab.cart === true;
            // الأزرار البارزة: السلة دائماً، وزر الصيدلية عند التنشيط
            const elevated   = isCartTab || (isPharmTab && isActive);

            const activeColor   = 'text-emerald-600';
            const inactiveColor = 'text-slate-400 hover:text-slate-600';

            return (
              <Link key={tab.to} to={tab.to} className="flex-1">
                <motion.div
                  className={`relative flex flex-col items-center justify-center h-full gap-1 cursor-pointer ${
                    isActive ? activeColor : inactiveColor
                  }`}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 500 }}
                  data-testid={`nav-${tab.to.replace('/', '')}`}
                >
                  <div className="relative">
                    {/* توهج نابض للأزرار البارزة عند التنشيط */}
                    {elevated && isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-emerald-400/20"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                    <div
                      className={`relative ${
                        elevated
                          ? 'w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.45)] -mt-3'
                          : ''
                      }`}
                    >
                      <Icon
                        className={`transition-colors ${
                          elevated
                            ? 'w-5 h-5 text-white stroke-[2px]'
                            : isActive
                            ? 'w-6 h-6 stroke-[2.5px]'
                            : 'w-6 h-6 stroke-[1.8px]'
                        }`}
                      />
                    </div>

                    {/* Badge — عدّاد السلة / الإشعارات */}
                    {(tab.badge ?? 0) > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white/60"
                        data-testid={isCartTab ? 'badge-cart-count' : undefined}
                      >
                        {tab.badge! > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>

                  {/* التسمية */}
                  <span
                    className={`text-[9px] font-semibold transition-colors leading-tight text-center ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </span>

                  {/* مؤشر النشاط — خط علوي للأزرار العادية فقط */}
                  {isActive && !elevated && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-[1px] w-8 h-[3px] bg-emerald-500 rounded-b-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
