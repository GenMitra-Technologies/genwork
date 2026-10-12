// src/features/auth/StandaloneLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, AlertCircle, Sparkles, User, GraduationCap, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, LoginInput } from '../../lib/validators';
import { findTestAccount } from '../../lib/testAuth';
import { UserRole } from '../../types/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Logo } from '../../components/shared/Logo';
import { cn } from '../../lib/utils';

interface StandaloneLoginPageProps {
  role: UserRole;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    title: string;
    subtitle: string;
    icon: typeof User;
    portalBadge: string;
    themeGradient: string;
  }
> = {
  intern: {
    title: 'Intern Workspace',
    subtitle: 'Sign in to access tasks, track streaks, and submit coursework',
    icon: User,
    portalBadge: 'Intern Workspace',
    themeGradient: 'from-slate-500/10 via-zinc-500/5 to-transparent',
  },
  mentor: {
    title: 'Mentor Workspace',
    subtitle: 'Sign in to review code deliverables, guide interns, and assign tasks',
    icon: GraduationCap,
    portalBadge: 'Mentor Workspace',
    themeGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
  },
  admin: {
    title: 'Administration Control Center',
    subtitle: 'Sign in to manage cohorts, credentials, policies, and system audit logs',
    icon: Shield,
    portalBadge: 'Admin Workspace',
    themeGradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
  },
};

export function StandaloneLoginPage({ role }: StandaloneLoginPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, role: currentRole, loginAsTestAccount } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = ROLE_CONFIG[role];
  const reason = searchParams.get('reason');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: role,
    },
  });

  // Ensure form role matches prop
  useEffect(() => {
    setValue('role', role);
  }, [role, setValue]);

  // If already authenticated and matches role, navigate directly
  useEffect(() => {
    if (session && currentRole) {
      if (currentRole === 'intern') navigate('/intern');
      else if (currentRole === 'mentor') navigate('/mentor');
      else if (currentRole === 'admin') navigate('/admin');
    }
  }, [session, currentRole, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const testAcc = findTestAccount(data.email);
      if (testAcc) {
        // Strict role verification against this dedicated standalone portal
        if (testAcc.role !== role) {
          setAuthError(
            `Access Denied: This is the dedicated ${config.portalBadge}. Your account has the "${testAcc.role}" role. Please use the appropriate login workspace.`
          );
          setIsSubmitting(false);
          return;
        }

        if (data.password === testAcc.supabasePassword) {
          // Attempt Supabase sign-in with account
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testAcc.supabaseEmail,
            password: testAcc.supabasePassword,
          });

          if (signInError || !authData.user) {
            // Fallback to local session
            loginAsTestAccount(testAcc);
          }

          if (role === 'intern') navigate('/intern');
          else if (role === 'mentor') navigate('/mentor');
          else if (role === 'admin') navigate('/admin');
          return;
        } else {
          setAuthError('Invalid email or password.');
          setIsSubmitting(false);
          return;
        }
      }

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError || !authData.user) {
        setAuthError(signInError?.message || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      // Check role verification:
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userRole = profile?.role || authData.user.user_metadata?.role;
      const status = profile?.status || 'active';

      if (status === 'inactive' || status === 'suspended') {
        await supabase.auth.signOut();
        setAuthError('Your account has been deactivated. Please contact an administrator.');
        setIsSubmitting(false);
        return;
      }

      // Strict role verification against this dedicated standalone portal
      if (userRole !== role) {
        await supabase.auth.signOut();
        setAuthError(
          `Access Denied: This is the dedicated ${config.portalBadge}. Your account has the "${userRole}" role. Please use the appropriate login workspace.`
        );
        setIsSubmitting(false);
        return;
      }

      // Record login event in activity logs
      try {
        await supabase.rpc('log_event', {
          p_action: 'user_login',
          p_entity_type: 'profiles',
          p_entity_id: authData.user.id,
          p_prev: null,
          p_new: null,
          p_meta: { portal: role, portal_type: 'standalone' },
          p_user_agent: navigator.userAgent,
        });
      } catch {
        // non-blocking
      }

      // Redirect to portal
      if (role === 'intern') navigate('/intern');
      else if (role === 'mentor') navigate('/mentor');
      else if (role === 'admin') navigate('/admin');
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-b pointer-events-none opacity-60', config.themeGradient)} />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Banner reason */}
        {reason === 'expired' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your session expired due to inactivity. Please sign in again.</span>
          </div>
        )}

        {reason === 'deactivated' && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Account deactivated. Please contact system administration.</span>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          {/* Logo & Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="flex justify-center pb-2">
              <Logo size="lg" className="h-14" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted border border-border">
              <config.icon className="h-3 w-3 text-primary" />
              <span>{config.portalBadge}</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground">{config.title}</h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {config.subtitle}
            </p>
          </div>

          {/* Error notice */}
          {authError && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('email')}
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  placeholder={role === 'intern' ? 'intern@example.com' : role === 'mentor' ? 'mentor@example.com' : 'admin@example.com'}
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : `Sign in to ${config.portalBadge}`}
            </Button>
          </form>

          {/* Back to Unified Login */}
          <div className="mt-5 pt-4 border-t border-border/70 text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center gap-1"
            >
              ← Back to Intern Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
