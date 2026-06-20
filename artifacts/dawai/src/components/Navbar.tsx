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
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="sticky top-0 z-40 w-full bg-slate-800 shadow-lg shadow-slate-900/30"
    >
      <div className="flex items-center justify-between px-4 h-11">
        <span className="text-slate-300 text-xs font-medium">حساب صيدلية</span>

        {onDashboard ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">لوحة الإدارة</span>
          </div>
        ) : (
          <Link to="/dashboard">
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 transition-colors px-3 py-1.5 rounded-lg"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-bold whitespace-nowrap">لوحة إدارة الصيدلية</span>
              <ChevronLeft className="w-3 h-3 text-emerald-200" />
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
