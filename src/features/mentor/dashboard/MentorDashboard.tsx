// src/features/mentor/dashboard/MentorDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
  Sparkles,
  Flame,
} from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar } from '../../../components/shared/Avatar';
import { Button } from '../../../components/ui/button';
import { formatTimeTaken, formatDateTime } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';

export function MentorDashboard() {
  const { profile } = useAuth();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'mentor'],
    queryFn: mentorApi.getDashboardStats,
  });

  const { data: queue = [] } = useQuery({
    queryKey: ['review-queue', mentorId],
    queryFn: () => mentorApi.getReviewQueue(mentorId),
  });

  const { data: myInterns = [] } = useQuery({
    queryKey: ['my-interns', mentorId],
    queryFn: () => mentorApi.getMyInterns(mentorId),
  });

  const statItems = [
    {
      title: 'Mentees',
      value: stats?.my_interns_count ?? myInterns.length,
      icon: Users,
      to: '/mentor/interns',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/70 border-indigo-100',
    },
    {
      title: 'In Queue',
      value: stats?.waiting_review_count ?? queue.length,
      icon: Eye,
      to: '/mentor/reviews?tab=waiting',
      color: 'text-amber-600',
      bg: 'bg-amber-50/70 border-amber-100',
    },
    {
      title: 'Approved',
      value: stats?.approved_count ?? 0,
      icon: CheckCircle2,
      to: '/mentor/reviews?tab=approved',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/70 border-emerald-100',
    },
    {
      title: 'Changes Req.',
      value: stats?.changes_requested_count ?? 0,
      icon: RotateCcw,
      to: '/mentor/reviews?tab=changes',
      color: 'text-orange-600',
      bg: 'bg-orange-50/70 border-orange-100',
    },
    {
      title: 'Overdue',
      value: stats?.overdue_count ?? 0,
      icon: AlertTriangle,
      to: '/mentor/interns',
      color: 'text-rose-600',
      bg: 'bg-rose-50/70 border-rose-100',
    },
    {
      title: 'Total Tasks',
      value: stats?.total_tasks_created ?? 0,
      icon: CheckSquare,
      to: '/mentor/tasks',
      color: 'text-blue-600',
      bg: 'bg-blue-50/70 border-blue-100',
    },
  ];

  return (
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Glossy Classy Compact Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Subtle glass specular highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                Welcome back, {profile?.full_name || 'Mentor'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 border border-indigo-200/60 text-indigo-700">
                <Sparkles className="w-2.5 h-2.5" /> Staff Mentor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Software Engineering • {myInterns.length} assigned mentees • {queue.length} items awaiting review
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              size="sm"
              className="h-7 px-3 text-xs rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1.5"
            >
              <Link to="/mentor/tasks?new=true">
                <Plus className="h-3 w-3" /> Create Task
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs rounded-lg font-medium border-slate-200 bg-white/70 hover:bg-slate-50 text-slate-700 gap-1.5 shadow-2xs"
            >
              <Link to="/mentor/reviews">
                <Eye className="h-3 w-3 text-amber-500" /> Review Queue ({queue.length})
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Compact Glossy Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {statItems.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.to}
              className="group relative rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-xs hover:border-indigo-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-medium text-slate-500 truncate">{stat.title}</span>
                <div className={cn('p-1 rounded-md border text-xs', stat.bg, stat.color)}>
                  <Icon className="h-3 w-3" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">
                  &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Review Queue & My Interns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Review Queue Column */}
        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Pending Submissions ({queue.length})
              </h3>
            </div>
            <Link
              to="/mentor/reviews"
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
              All submissions reviewed! No pending items in queue.
            </div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 4).map((sub: any) => (
                <div
                  key={sub.submission_id}
                  className="group rounded-lg border border-slate-200/60 bg-slate-50/50 hover:bg-white p-2.5 transition-all duration-150 hover:border-slate-300 hover:shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={sub.intern_avatar}
                        name={sub.intern_name}
                        size="sm"
                      />
                      <span className="font-medium text-slate-800 text-xs truncate">{sub.intern_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {sub.task_code}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                        v{sub.version}
                      </span>
                    </div>
                  </div>

                  <p className="font-medium text-slate-900 text-xs truncate">
                    {sub.task_title}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatDateTime(sub.submitted_at)}
                    </span>
                    <Button asChild size="sm" className="h-6 px-2.5 text-[11px] rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                      <Link to="/mentor/reviews">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Interns Column */}
        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Assigned Mentees ({myInterns.length})
              </h3>
            </div>
            <Link
              to="/mentor/interns"
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {myInterns.slice(0, 4).map((intern: any) => (
              <div
                key={intern.intern_id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/60 bg-slate-50/50 hover:bg-white transition-all duration-150 hover:border-slate-300 hover:shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={intern.avatar_url}
                    name={intern.full_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{intern.full_name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{intern.role_title}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                    <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> {intern.current_streak}d
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {intern.approval_rate_percentage}% approval
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
