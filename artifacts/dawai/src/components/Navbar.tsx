import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChevronLeft } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';

export function Navbar() {
  const { user } = useContext(AuthContext)!;
  const location = useLocation();

  if (!user || user.role !== 'pharmacy') return null;

  const onDashboard = location.pathname === '/dashboard';

  return (
    <motion.div
      initial={{ y: -44, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
      className="sticky top-0 z-40 w-full
        bg-slate-900/70 backdrop-blur-2xl
        border-b border-white/10
        shadow-[0_8px_30px_rgb(0,0,0,0.18)]"
    >
      <div className="flex items-center justify-between px-4 h-11">
        <span className="text-slate-300/80 text-xs font-medium tracking-wide">حساب صيدلية</span>

        {onDashboard ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">لوحة الإدارة</span>
          </div>
        ) : (
          <Link to="/dashboard">
            <motion.div
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="flex items-center gap-1.5
                bg-emerald-500/20 hover:bg-emerald-500/35
                border border-emerald-400/30
                backdrop-blur-sm
                px-3 py-1.5 rounded-xl
                transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-bold whitespace-nowrap">لوحة إدارة الصيدلية</span>
              <ChevronLeft className="w-3 h-3 text-emerald-400/60" />
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
