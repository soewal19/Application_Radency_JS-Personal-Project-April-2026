/**
 * @module Login Page
 * @description Authentication page with login/register/password recovery forms
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be under 255 characters')
    .regex(emailRegex, 'Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be under 100 characters'),
});

const registerSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, 'Name contains invalid characters'),
});

const resetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Enter a valid email address'),
});

const TEST_ACCOUNT = {
  email: 'test@eventhub.com',
  password: 'Test123!',
  name: 'Test User',
};

type ViewMode = 'login' | 'register' | 'forgot';

const Login = () => {
  const [view, setView] = useState<ViewMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (view === 'forgot') {
      const result = resetSchema.safeParse({ email: form.email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      try {
        await apiService.requestPasswordReset(form.email);
      } catch {
        // Silently succeed — don't reveal if email exists (security best practice)
      }
      setResetSent(true);
      toast({
        title: 'Reset link sent',
        description: 'If an account exists with that email, you will receive a password reset link.',
      });
      return;
    }

    const schema = view === 'register' ? registerSchema : loginSchema;
    const result = schema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (view === 'register') {
      await register(form);
    } else {
      await login({ email: form.email, password: form.password });
    }
    navigate('/events');
  };

  const switchView = (newView: ViewMode) => {
    setView(newView);
    setErrors({});
    setResetSent(false);
  };

  const fillTestAccount = () => {
    setForm({ name: TEST_ACCOUNT.name, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password });
    setErrors({});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
            <CalendarDays className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EventHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === 'forgot'
              ? 'Reset your password'
              : view === 'register'
                ? 'Create an account'
                : 'Sign in to your account'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <AnimatePresence mode="wait">
            {view === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {resetSent ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">Check your email</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      We've sent a password reset link to <strong className="text-foreground">{form.email}</strong>
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => switchView('login')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="mt-1.5"
                        maxLength={255}
                        autoFocus
                      />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the email associated with your account. We'll send a link to reset your password.
                    </p>
                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => switchView('login')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                    </Button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {view === 'register' && (
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                        className="mt-1.5"
                        maxLength={50}
                      />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="mt-1.5"
                      maxLength={255}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {view === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchView('forgot')}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="••••••"
                        className="pr-10"
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                    {isLoading ? 'Loading...' : view === 'register' ? 'Sign Up' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => switchView(view === 'register' ? 'login' : 'register')}
                    className="text-sm text-primary hover:underline"
                  >
                    {view === 'register' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {view !== 'forgot' && (
          <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-center">
            <p className="mb-2 text-xs text-muted-foreground">
              Test account: <code className="rounded bg-muted px-1 py-0.5 text-xs">{TEST_ACCOUNT.email}</code> / <code className="rounded bg-muted px-1 py-0.5 text-xs">{TEST_ACCOUNT.password}</code>
            </p>
            <Button variant="outline" size="sm" onClick={fillTestAccount}>
              Fill Test Credentials
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
