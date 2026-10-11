import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, AlertCircle, ShieldCheck, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, LoginInput } from '../../lib/validators';
import { UserRole } from '../../types/database.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Logo } from '../../components/shared/Logo';
import { cn } from '../../lib/utils';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, role: currentRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('intern');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reason = searchParams.get('reason');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'intern.david@internship.org',
      password: 'Password123!',
      role: 'intern',
    },
  });

  // If already authenticated and matches role, navigate
  useEffect(() => {
    if (session && currentRole) {
      if (currentRole === 'intern') navigate('/intern');
      else if (currentRole === 'mentor') navigate('/mentor');
      else if (currentRole === 'admin') navigate('/admin');
    }
  }, [session, currentRole, navigate]);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setValue('role', role);
    setAuthError(null);

    // Auto-fill demo credentials for convenience
    if (role === 'intern') {
      setValue('email', 'intern.david@internship.org');
      setValue('password', 'Password123!');
    } else if (role === 'mentor') {
      setValue('email', 'mentor.alex@internship.org');
      setValue('password', 'Password123!');
    } else if (role === 'admin') {
      setValue('email', 'admin@internship.org');
      setValue('password', 'Password123!');
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    setIsSubmitting(true);

    try {
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
      // Try to read profile
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

      // Strict role verification against selected tab (Requirement 2.2)
      if (userRole !== selectedRole) {
        await supabase.auth.signOut();
        setAuthError(`Wrong workspace for this account. This account is registered as a ${userRole}.`);
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
          p_meta: { portal: selectedRole },
          p_user_agent: navigator.userAgent,
        });
      } catch {
        // non-blocking
      }

      // Redirect to portal
      if (selectedRole === 'intern') navigate('/intern');
      else if (selectedRole === 'mentor') navigate('/mentor');
      else if (selectedRole === 'admin') navigate('/admin');
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
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

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-1">
              <Logo size="lg" className="h-14" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Genmitra Platform</h1>
            <p className="text-xs text-muted-foreground">
              Sign in to your dedicated role workspace
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 mb-6">
            {(['intern', 'mentor', 'admin'] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleTabChange(role)}
                className={cn(
                  'rounded-lg py-2 text-xs font-semibold capitalize transition-all',
                  selectedRole === role
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {role}
              </button>
            ))}
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
                  type="email"
                  placeholder="name@internship.org"
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
              {isSubmitting ? 'Authenticating...' : `Sign in as ${selectedRole}`}
            </Button>
          </form>

          {/* Demo account selector pill */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Quick Demo Credentials:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleRoleTabChange('intern')}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground"
              >
                👤 Intern: David
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('mentor')}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground"
              >
                🎓 Mentor: Alex
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] font-medium text-foreground"
              >
                🛡️ Admin: Sarah
              </button>
            </div>
          </div>

          {/* Standalone login workspaces */}
          <div className="mt-5 pt-4 border-t border-dashed border-border/70">
            <p className="text-[11px] text-muted-foreground mb-2 font-medium">
              Direct standalone login workspaces:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Link
                to="/login/intern"
                className="rounded-lg border border-border/60 bg-muted/40 p-2 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Intern Login →
              </Link>
              <Link
                to="/login/mentor"
                className="rounded-lg border border-border/60 bg-muted/40 p-2 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Mentor Login →
              </Link>
              <Link
                to="/login/admin"
                className="rounded-lg border border-border/60 bg-muted/40 p-2 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Admin Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
