// src/features/mentor/profile/MentorProfilePage.tsx
import { useQuery } from '@tanstack/react-query';
import { Mail, Building, Users, CheckCircle2, Shield, Calendar, Clock, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { mentorApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { Link } from 'react-router-dom';

export function MentorProfilePage() {
  const { profile } = useAuth();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';

  const { data: myInterns = [] } = useQuery({
    queryKey: ['my-interns', mentorId],
    queryFn: () => mentorApi.getMyInterns(mentorId),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'mentor'],
    queryFn: mentorApi.getDashboardStats,
  });

  return (
    <div className="space-y-4 max-w-[860px] mx-auto">
      {/* Glossy Header Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Mentor Profile & Group Credentials</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Mentor profile credentials, assigned department, and supervision metrics.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        {/* Header Profile Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-100">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || 'Alex Rivera'}
            size="lg"
          />
          <div className="text-center sm:text-left space-y-0.5 min-w-0">
            <h2 className="text-base font-bold text-slate-900">{profile?.full_name || 'Alex Rivera'}</h2>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="h-3 w-3 text-slate-400" /> {profile?.email || 'alex.rivera@internship.org'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="rounded-md bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Role: Staff Mentor
              </span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Status: Active
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 uppercase tracking-wider">
              <Building className="h-3 w-3 text-indigo-600" /> Department
            </span>
            <p className="font-semibold text-xs text-slate-900">
              Software Engineering
            </p>
            <p className="text-[11px] text-slate-500">Full Stack & Distributed Systems</p>
          </div>

          <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 uppercase tracking-wider">
              <Users className="h-3 w-3 text-indigo-600" /> Supervised Mentees
            </span>
            <p className="font-semibold text-xs text-slate-900">
              {myInterns.length} Assigned Interns
            </p>
            <p className="text-[11px] text-slate-500">Summer 2026 Engineering Cohort</p>
          </div>

          <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3 text-indigo-600" /> Grading Performance
            </span>
            <p className="font-semibold text-xs text-slate-900">
              {stats?.approved_count ?? 5} Approved Submissions
            </p>
            <p className="text-[11px] text-slate-500">
              {stats?.waiting_review_count ?? 2} pending in review queue
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 uppercase tracking-wider">
              <Clock className="h-3 w-3 text-indigo-600" /> Daily Target Shift
            </span>
            <p className="font-semibold text-xs text-slate-900">
              4.0 Hours / Day
            </p>
            <p className="text-[11px] text-slate-500">Standard guidance & office hours</p>
          </div>
        </div>

        {/* Assigned Mentees Section */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Assigned Cohort Interns</h3>
            <Link
              to="/mentor/interns"
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all mentees &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myInterns.map((intern: any) => (
              <div
                key={intern.intern_id}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/60 bg-white"
              >
                <Avatar
                  src={intern.avatar_url}
                  name={intern.full_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{intern.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{intern.role_title}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="font-semibold text-orange-600">{intern.current_streak}d</span>
                  <span className="text-slate-400 block text-[9px]">streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
