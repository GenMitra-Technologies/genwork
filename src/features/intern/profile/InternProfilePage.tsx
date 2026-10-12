// src/features/intern/profile/InternProfilePage.tsx
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Building, Calendar, Flame, Shield, Award } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { internApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { formatDateOnly } from '../../../lib/formatters';

export function InternProfilePage() {
  const { profile, user } = useAuth();

  const { data: internProfile } = useQuery({
    queryKey: ['intern-profile', user?.id],
    queryFn: () => internApi.getInternProfile(user?.id || ''),
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Your personal intern credentials, enrolled cohort, and supervisor details.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || 'SINDHU GANGISETTY'}
            size="xl"
          />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-foreground">{profile?.full_name || 'SINDHU GANGISETTY'}</h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {profile?.email || 'sindhugangisetty910@gmail.com'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Role: Intern
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Status: Active
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" /> Role Title & Company
            </span>
            <p className="font-semibold text-sm text-foreground">
              {internProfile?.role_title || 'FRONTEND DEVELOPER'}
            </p>
            <p className="text-muted-foreground">{internProfile?.company_name || 'GenMitra Technologies'}</p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" /> Assigned Mentor
            </span>
            <p className="font-semibold text-sm text-foreground">
              {internProfile?.mentor?.profile?.full_name || 'Kapu Mani Shankar Reddy'}
            </p>
            <p className="text-muted-foreground">
              Department: {internProfile?.mentor?.department || 'Engineering (CTO)'}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Internship Cohort
            </span>
            <p className="font-semibold text-sm text-foreground">
              {internProfile?.internship?.name || 'Engineering Internship Cohort 2026'}
            </p>
            <p className="text-muted-foreground">
              Dates: {formatDateOnly(internProfile?.start_date || '2026-10-01')} to{' '}
              {formatDateOnly(internProfile?.end_date || '2027-03-31')}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" /> Work Streak Performance
            </span>
            <p className="font-semibold text-sm text-foreground">
              Current: {internProfile?.current_streak ?? 5} days 🔥
            </p>
            <p className="text-muted-foreground">
              Longest Streak: {internProfile?.longest_streak ?? 5} days • Total Active Days: {internProfile?.total_active_days ?? 12}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
