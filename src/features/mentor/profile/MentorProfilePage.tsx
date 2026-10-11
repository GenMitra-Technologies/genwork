// src/features/mentor/profile/MentorProfilePage.tsx
import { useQuery } from '@tanstack/react-query';
import { Mail, Building, Users, CheckCircle2, Shield, Calendar, Clock, Award } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mentor Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Mentor credentials, department information, and mentee cohort supervision metrics.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Header Profile Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || 'Alex Rivera'}
            size="xl"
          />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || 'Alex Rivera'}</h2>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {profile?.email || 'alex.rivera@internship.org'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Role: Staff Mentor
              </span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Status: Active
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-indigo-600" /> Department & Specialty
            </span>
            <p className="font-semibold text-sm text-slate-900">
              Software Engineering
            </p>
            <p className="text-slate-500">Full Stack Web Architecture & Systems Design</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-600" /> Active Mentees Supervised
            </span>
            <p className="font-semibold text-sm text-slate-900">
              {myInterns.length} Assigned Interns
            </p>
            <p className="text-slate-500">Across Summer 2026 Cohorts</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Review & Grading Performance
            </span>
            <p className="font-semibold text-sm text-slate-900">
              {stats?.approved_count ?? 5} Approved Submissions
            </p>
            <p className="text-slate-500">
              {stats?.waiting_review_count ?? 2} Pending reviews in queue
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600" /> Daily Mentoring Shift
            </span>
            <p className="font-semibold text-sm text-slate-900">
              4.0 Hours Target / Day
            </p>
            <p className="text-slate-500">Standard office hours & supervision window</p>
          </div>
        </div>

        {/* Assigned Mentees Section */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Assigned Cohort Interns</h3>
            <Link
              to="/mentor/interns"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all mentees &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myInterns.map((intern: any) => (
              <div
                key={intern.intern_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white"
              >
                <Avatar
                  src={intern.avatar_url}
                  name={intern.full_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{intern.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{intern.role_title}</p>
                </div>
                <div className="text-right text-[11px]">
                  <span className="font-semibold text-orange-600">{intern.current_streak}d</span>
                  <span className="text-slate-400 block text-[10px]">streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
