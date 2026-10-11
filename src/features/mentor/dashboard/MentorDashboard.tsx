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
} from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard } from '../../../components/shared/StatCard';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Avatar } from '../../../components/shared/Avatar';
import { Button } from '../../../components/ui/button';
import { formatTimeTaken, formatDateTime } from '../../../lib/formatters';

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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name || 'Alex Rivera'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Senior Staff Mentor • Department: Software Engineering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link to="/mentor/tasks?new=true">
              <Plus className="h-3.5 w-3.5" /> Create Task
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs border-slate-200 dark:border-slate-700">
            <Link to="/mentor/reviews">
              <Eye className="h-3.5 w-3.5" /> Review Queue ({queue.length})
            </Link>
          </Button>
        </div>
      </div>

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Assigned Interns"
          value={stats?.my_interns_count ?? myInterns.length}
          icon={Users}
          to="/mentor/interns"
        />
        <StatCard
          title="Waiting Review"
          value={stats?.waiting_review_count ?? queue.length}
          icon={Eye}
          to="/mentor/reviews?tab=waiting"
        />
        <StatCard
          title="Approved Work"
          value={stats?.approved_count ?? 5}
          icon={CheckCircle2}
          to="/mentor/reviews?tab=approved"
        />
        <StatCard
          title="Changes Needed"
          value={stats?.changes_requested_count ?? 1}
          icon={RotateCcw}
          to="/mentor/reviews?tab=changes"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdue_count ?? 0}
          icon={AlertTriangle}
          to="/mentor/interns"
        />
        <StatCard
          title="Created Tasks"
          value={stats?.total_tasks_created ?? 7}
          icon={CheckSquare}
          to="/mentor/tasks"
        />
      </div>

      {/* Columns: Review Queue & My Interns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Queue */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" /> Pending Review Submissions
            </h3>
            <Link
              to="/mentor/reviews"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 transition-colors"
            >
              View queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {queue.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              All submissions reviewed! No pending items.
            </p>
          ) : (
            <div className="space-y-3">
              {queue.map((sub: any) => (
                <div
                  key={sub.submission_id}
                  className="rounded-lg border border-slate-200/70 dark:border-slate-800 bg-transparent p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={sub.intern_avatar}
                        name={sub.intern_name}
                        size="sm"
                      />
                      <span className="font-semibold text-foreground">{sub.intern_name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {sub.task_code}
                    </span>
                  </div>

                  <h4 className="font-medium text-foreground">{sub.task_title}</h4>

                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {sub.time_taken_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Time taken: {formatTimeTaken(sub.time_taken_seconds)}
                      </span>
                    )}
                    <span>Version {sub.version}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-muted-foreground">
                      Submitted {formatDateTime(sub.submitted_at)}
                    </span>
                    <Button asChild size="sm" className="h-7 text-xs">
                      <Link to="/mentor/reviews">Review Now</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Interns Quick Status */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700 dark:text-slate-300" /> My Mentees
            </h3>
            <Link
              to="/mentor/interns"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 transition-colors"
            >
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {myInterns.map((intern: any) => (
              <div
                key={intern.intern_id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={intern.avatar_url}
                    name={intern.full_name}
                    size="md"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{intern.full_name}</h4>
                    <p className="text-[11px] text-muted-foreground">{intern.role_title}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-medium text-orange-600 block">
                    🔥 {intern.current_streak}d streak
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {intern.approval_rate_percentage}% approval rate
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
