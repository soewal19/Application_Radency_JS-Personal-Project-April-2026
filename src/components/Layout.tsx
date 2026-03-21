/**
 * @module Layout
 * @description Main layout with navigation, auth guard, and user avatar
 */

import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { socketService } from '@/services/socket';
import { CalendarDays, Plus, HelpCircle, Home, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { StatusBanner } from './StatusBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

const navItems = [
  { to: '/events', label: 'Events', icon: Home },
  { to: '/events/create', label: 'Create', icon: Plus },
  { to: '/assistant', label: 'Assistant', icon: Zap },
  { to: '/my-events', label: 'My Events', icon: CalendarDays },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

const PageSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="space-y-2">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[350px]" />
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-[300px] rounded-xl" />
      ))}
    </div>
  </div>
);

const Layout = () => {
  const { logout, isAuthenticated, accessToken } = useAuthStore();
  const { checkHealth, setWsConnected, pingWs } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    logger.navigation(location.pathname);
  }, [location.pathname]);

  // Status monitoring
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Connect socket if not already connected
    if (!socketService.isConnected) {
      logger.debug('Initializing socket connection from Layout', 'Socket');
      socketService.connect(accessToken);
    }

    // Initial check
    checkHealth();
    setWsConnected(socketService.isConnected);

    // Polling health check
    const healthInterval = setInterval(checkHealth, 30000);

    // Socket status listeners
    const onConnect = () => {
      setWsConnected(true);
      pingWs();
    };
    const onDisconnect = () => setWsConnected(false);

    socketService.on('connect', onConnect);
    socketService.on('disconnect', onDisconnect);

    const pingInterval = setInterval(pingWs, 15000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(pingInterval);
      socketService.off('connect');
      socketService.off('disconnect');
    };
  }, [isAuthenticated, checkHealth, setWsConnected, pingWs]);

  const handleLogout = () => {
    logger.info('User initiated logout', 'Auth');
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {/* Progress Bar Loader Simulation on Navigation */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none">
        <motion.div
          key={location.pathname}
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
        />
      </div>

      <Header navItems={navItems} onLogout={handleLogout} />
      <StatusBanner />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Suspense fallback={<PageSkeleton />}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
