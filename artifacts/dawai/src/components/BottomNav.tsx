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
    { to: '/orders',        icon: Package, label: 'طلباتي' },
    { to: '/notifications', icon: Bell,    label: 'الإشعارات', badge: unreadCount },
    { to: '/account',       icon: User,    label: 'حسابي' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-background/80 backdrop-blur-xl border-t border-white/20 pb-safe pointer-events-auto shadow-[0_-8px_32px_rgba(0,0,0,0.05)]">
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
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive ? 'stroke-[2.5px]' : 'stroke-2'
                      }`}
                    />
                    {(tab.badge ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                        {tab.badge! > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-primary' : ''
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-[1px] w-8 h-[3px] bg-primary rounded-b-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
