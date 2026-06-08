'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { extractError } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const session = await authApi.loginEmail(data.email, data.password);
      if (session.user?.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }
      login(session);
      router.replace('/dashboard');
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-text-primary">Investly</h1>
              <p className="text-xs text-text-muted">Admin Control Panel</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Welcome back</h2>
          <p className="text-sm text-text-muted mt-1">Sign in to manage your platform</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border-light shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@investly.ly"
                className={`
                  w-full px-4 py-3 rounded-xl border bg-background text-sm text-text-primary
                  placeholder:text-text-muted outline-none transition-all duration-200
                  focus:ring-2 focus:ring-primary/20 focus:border-primary
                  ${errors.email ? 'border-danger' : 'border-border'}
                `}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`
                    w-full px-4 py-3 pr-11 rounded-xl border bg-background text-sm text-text-primary
                    placeholder:text-text-muted outline-none transition-all duration-200
                    focus:ring-2 focus:ring-primary/20 focus:border-primary
                    ${errors.password ? 'border-danger' : 'border-border'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                bg-primary text-white font-semibold text-sm
                hover:bg-primary/90 transition-all duration-200
                shadow-lg shadow-primary/30
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Shield size={18} />
              )}
              {isSubmitting ? 'Signing in...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © {new Date().getFullYear()} Investly Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
