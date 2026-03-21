import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, LogOut, Menu, X, User, Database, Activity } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  to: string;
  label: string;
  icon: any;
}

interface HeaderProps {
  navItems: NavItem[];
  onLogout: () => void;
}

export const Header = ({ navItems, onLogout }: HeaderProps) => {
  const { user } = useAuthStore();
  const { isDbConnected, isWsConnected, lastPing } = useAppStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/events" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-sm shadow-primary/20">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">EventHub</span>
          </Link>

          {/* System Status Indicators */}
          <div className="hidden sm:flex items-center gap-4 border-l border-border pl-6">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5" title={isDbConnected ? 'Database Connected' : 'Database Disconnected'}>
                <Database className={`h-3 w-3 ${isDbConnected ? 'text-emerald-500' : 'text-destructive'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${isDbConnected ? 'text-emerald-500' : 'text-destructive'}`}>
                  Database: {isDbConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-1.5" title={isWsConnected ? `Real-time Active (${lastPing || 0}ms)` : 'Real-time Offline'}>
                <Activity className={`h-3 w-3 ${isWsConnected ? 'text-emerald-500' : 'text-destructive'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${isWsConnected ? 'text-emerald-500' : 'text-destructive'}`}>
                  WebSocket: {isWsConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            {isDbConnected && isWsConnected && (
              <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tight text-emerald-600">System Ready</span>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
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
          <Link to="/my-events" className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted">
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-foreground sm:block max-w-[120px] truncate">
              {user?.name}
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 hidden sm:flex"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>

          <button
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border md:hidden bg-card"
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
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors mt-2 pt-2 border-t border-border/50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
