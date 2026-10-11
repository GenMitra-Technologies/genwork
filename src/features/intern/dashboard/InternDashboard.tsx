// src/features/intern/dashboard/InternDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Flame,
  CheckCircle2,
  Clock,
  Play,
  Hourglass,
  RotateCcw,
  AlertTriangle,
  FileText,
  Calendar,
  Building,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard } from '../../../components/shared/StatCard';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Avatar } from '../../../components/shared/Avatar';
import { formatDateOnly } from '../../../lib/formatters';

export function InternDashboard() {
  const { user, profile } = useAuth();

  const { data: internProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['intern-profile', user?.id],
    queryFn: () => internApi.getInternProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'intern'],
    queryFn: internApi.getDashboardStats,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'intern'],
    queryFn: () => internApi.getMyTasks(internProfile?.id || '20000000-0000-0000-0000-000000000001'),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', 'intern'],
    queryFn: () => internApi.getMyAssignments(internProfile?.id || '20000000-0000-0000-0000-000000000001'),
  });

  const pendingTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').slice(0, 4);
  const pendingAssignments = assignments.filter((a: any) => a.status === 'pending' || a.status === 'in_progress').slice(0, 3);

  return (
    <div className="space-y-8">
      {/* 1. Profile Header */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || 'David Kim'}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {profile?.full_name || 'David Kim'}
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Active Intern
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {internProfile?.role_title || 'Full Stack Intern'} •{' '}
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {internProfile?.company_name || 'Tech Corp'}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                  Mentor:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {internProfile?.mentor?.profile?.full_name || 'Alex Rivera'}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                  Cohort:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {internProfile?.internship?.name || 'Summer 2026 Engineering Cohort'}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                  {formatDateOnly(internProfile?.start_date || '2026-06-01')} –{' '}
                  {formatDateOnly(internProfile?.end_date || '2026-08-31')}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Streak Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-4 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                Active Work Streak
              </span>
              <span className="text-[10px] text-slate-400 cursor-help" title="Active day: started/submitted a task or submitted an assignment in local timezone">
                ⓘ info
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {internProfile?.current_streak ?? 4}
              </span>
              <span className="text-xs font-medium text-slate-500">days streak 🔥</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2 text-[11px] text-slate-500">
              <span>Best: <strong className="text-slate-800 dark:text-slate-200">{internProfile?.longest_streak ?? 8}d</strong></span>
              <span>Total Active: <strong className="text-slate-800 dark:text-slate-200">{internProfile?.total_active_days ?? 14}d</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 9 Stat Cards linked to filtered views */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Overview & Task Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <StatCard
            title="Total Tasks"
            value={stats?.total_tasks ?? tasks.length}
            icon={FileText}
            to="/intern/tasks"
          />
          <StatCard
            title="In Progress"
            value={stats?.in_progress_tasks ?? 1}
            icon={Play}
            to="/intern/tasks?tab=in_progress"
          />
          <StatCard
            title="Waiting Review"
            value={stats?.waiting_review_tasks ?? 1}
            icon={Hourglass}
            to="/intern/tasks?tab=waiting_for_review"
          />
          <StatCard
            title="Changes Needed"
            value={stats?.changes_requested_tasks ?? 1}
            icon={RotateCcw}
            to="/intern/tasks?tab=changes_requested"
          />
          <StatCard
            title="Approved Tasks"
            value={stats?.approved_tasks ?? 2}
            icon={CheckCircle2}
            to="/intern/tasks?tab=approved"
          />
          <StatCard
            title="Pending Start"
            value={stats?.pending_tasks ?? 1}
            icon={Clock}
            to="/intern/tasks?tab=pending"
          />
          <StatCard
            title="Overdue Tasks"
            value={stats?.overdue_tasks ?? 0}
            icon={AlertTriangle}
            to="/intern/tasks?tab=overdue"
          />
          <StatCard
            title="Coursework Asg."
            value={stats?.total_assignments ?? assignments.length}
            icon={FileText}
            to="/intern/assignments"
          />
          <StatCard
            title="Pending Asg."
            value={stats?.pending_assignments ?? 1}
            icon={Clock}
            to="/intern/assignments?status=pending"
          />
        </div>
      </div>

      {/* 4. Active Workflow Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Tasks to Complete
            </h3>
            <Link
              to="/intern/tasks"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No pending tasks right now. Great job!
            </p>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((t: any) => (
                <Link
                  key={t.task_assignment_id}
                  to={`/intern/tasks/${t.task_code}`}
                  className="block p-3.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-transparent hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {t.task_code}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {t.task_title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {t.task_description}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Coursework / Assignments */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Active Coursework & Quizzes
            </h3>
            <Link
              to="/intern/assignments"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pendingAssignments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No pending coursework assignments.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingAssignments.map((a: any) => (
                <Link
                  key={a.id}
                  to={`/intern/assignments/${a.assignment?.code}`}
                  className="block p-3.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-transparent hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {a.assignment?.code}
                        </span>
                        <PriorityBadge priority={a.assignment?.priority || 'medium'} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {a.assignment?.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {a.assignment?.description}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
