// src/features/mentor/interns/MyInternsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Users, Flame, CheckCircle2, Clock, Hourglass, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar } from '../../../components/shared/Avatar';
import { Link, useParams } from 'react-router-dom';
import { CandidateOperationalProfileCard } from '../../intern/profile/CandidateOperationalProfileCard';

export function MyInternsPage() {
  const { profile } = useAuth();
  const { internId } = useParams<{ internId?: string }>();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';

  const { data: myInterns = [], isLoading } = useQuery({
    queryKey: ['my-interns', mentorId],
    queryFn: () => mentorApi.getMyInterns(mentorId),
  });

  const selectedIntern = internId
    ? myInterns.find((i: any) => i.intern_id === internId || i.id === internId) || myInterns[0]
    : null;

  if (internId && selectedIntern) {
    return (
      <div className="space-y-4 max-w-[1140px] mx-auto">
        <div className="flex items-center justify-between">
          <Link
            to="/mentor/interns"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to assigned interns
          </Link>
          <span className="text-xs text-slate-400">Mentee Profile View</span>
        </div>
        <CandidateOperationalProfileCard intern={selectedIntern} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Glossy Header Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Assigned Cohort Interns</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700">
              {myInterns.length} Active Mentees
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Monitor daily streaks, attendance consistency, task completion velocity, and approval ratios.
          </p>
        </div>
      </div>

      {/* Compact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {myInterns.map((intern: any) => (
          <div
            key={intern.intern_id}
            className="group relative rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3 transition-all duration-200 hover:shadow-xs hover:border-slate-300"
          >
            {/* Intern Identity */}
            <div className="flex items-start gap-3">
              <Avatar
                src={intern.avatar_url}
                name={intern.full_name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-xs text-slate-900 truncate">{intern.full_name}</h3>
                <p className="text-[11px] text-slate-500 truncate">{intern.role_title}</p>
                <p className="text-[10px] text-slate-400 truncate">{intern.company_name}</p>
              </div>
            </div>

            {/* Streak & Active Days Pill */}
            <div className="flex items-center justify-between rounded-lg bg-orange-50/60 border border-orange-100 p-2 text-xs">
              <div className="flex items-center gap-1 font-semibold text-orange-700 text-[11px]">
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                <span>{intern.current_streak} Day Streak</span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Active: <strong className="text-slate-800">{intern.total_active_days}d</strong>
              </div>
            </div>

            {/* 4 Mini Stat Blocks */}
            <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
              <div className="rounded-md p-1.5 bg-slate-50 border border-slate-100">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">Approved</span>
                <span className="font-bold text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {intern.approved_tasks_count}
                </span>
              </div>
              <div className="rounded-md p-1.5 bg-slate-50 border border-slate-100">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">Under Review</span>
                <span className="font-bold text-xs text-amber-600 flex items-center gap-1">
                  <Hourglass className="h-3 w-3" /> {intern.waiting_review_count}
                </span>
              </div>
              <div className="rounded-md p-1.5 bg-slate-50 border border-slate-100">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">Revisions</span>
                <span className="font-bold text-xs text-orange-600 flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> {intern.changes_requested_count}
                </span>
              </div>
              <div className="rounded-md p-1.5 bg-slate-50 border border-slate-100">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">Approval Rate</span>
                <span className="font-bold text-xs text-slate-800">
                  {intern.approval_rate_percentage}%
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <Link
                to={`/mentor/interns/${intern.intern_id || intern.id}`}
                className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                View Profile
              </Link>
              <Link
                to={`/mentor/reviews`}
                className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                Inspect work <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
