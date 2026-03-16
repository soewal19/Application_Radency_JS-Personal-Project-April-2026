/**
 * @module Layout
 * @description Main layout with navigation, auth guard, and user avatar
 */

import { Suspense } from 'react';
import { Link, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { CalendarDays, LogOut, Plus, HelpCircle, Menu, X, Home, Users, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { to: '/events', label: 'Events', icon: Home },
  { to: '/events/create', label: 'Create', icon: Plus },
  { to: '/my-events', label: 'My Events', icon: CalendarDays },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

const Layout = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/events" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">EventHub</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* User avatar + name link to profile */}
            <Link to="/my-events" className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground sm:block max-w-[120px] truncate">
                {user?.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      location.pathname === to
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default Layout;
