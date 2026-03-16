/**
 * @module Reset Password Page
 * @description Form to set a new password after clicking the reset link
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be under 100 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!token) {
      setErrors({ password: 'Invalid or missing reset token. Please request a new link.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.resetPassword(token, form.password);
      setIsSuccess(true);
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
    } catch {
      toast({
        title: 'Reset failed',
        description: 'The reset link may have expired. Please request a new one.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {isSuccess ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Password Reset Successfully</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Your password has been updated. You can now sign in.
              </p>
              <Button className="w-full gradient-primary" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••"
                    className="pr-10"
                    maxLength={100}
                    autoFocus
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

              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="••••••"
                    className="pr-10"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
