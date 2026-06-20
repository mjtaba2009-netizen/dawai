import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User } from 'lucide-react';
import { useGetNotifications } from '@workspace/api-client-react';

export function BottomNav() {
  const location = useLocation();
  const { data: notifications } = useGetNotifications();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const tabs = [
    { to: '/home',          icon: Home,    label: 'الرئيسية' },
    { to: '/orders',        icon: Package, label: 'طلباتي'   },
    { to: '/notifications', icon: Bell,    label: 'الإشعارات', badge: unreadCount },
    { to: '/account',       icon: User,    label: 'حسابي'    },
  ];

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
        <div className="flex items-center justify-around h-16 px-4">
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.to ||
              (tab.to !== '/home' && location.pathname.startsWith(tab.to));
            const Icon = tab.icon;

            return (
              <Link key={tab.to} to={tab.to}>
                <motion.div
                  className={`relative flex flex-col items-center justify-center w-16 h-full gap-1 cursor-pointer ${
                    isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 500 }}
                >
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                      }`}
                    />
                    {(tab.badge ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white/60">
                        {tab.badge! > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
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
