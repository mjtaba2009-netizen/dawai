import { ReactNode, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { AuthContext } from '@/contexts/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useContext(AuthContext)!;

  const isPharmacy = user?.role === 'pharmacy';
  const showBottomNav = !!user && !isPharmacy;

  return (
    <div className="min-h-[100dvh] bg-muted/30 flex justify-center">
      <div className="w-full max-w-[430px] bg-background relative flex flex-col shadow-2xl overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex-1 flex flex-col ${showBottomNav ? 'pb-20' : ''}`}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
