import { useAppStore } from '@/store/useAppStore';
import { AlertCircle, WifiOff, DatabaseZap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StatusBanner = () => {
  const { isDbConnected, isWsConnected } = useAppStore();

  if (isDbConnected && isWsConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-destructive/10 border-b border-destructive/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-[10px] font-black uppercase tracking-widest">
          {!isDbConnected && (
            <div className="flex items-center gap-2.5 text-destructive animate-pulse">
              <DatabaseZap className="h-4 w-4" />
              <span>Database Connection Lost — Events cannot be saved</span>
            </div>
          )}
          {!isWsConnected && (
            <div className="flex items-center gap-2.5 text-destructive animate-pulse">
              <WifiOff className="h-4 w-4" />
              <span>Real-time Sync Offline — Refresh manually to see updates</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <AlertCircle className="h-3 w-3" />
            <span>Limited Functionality</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
