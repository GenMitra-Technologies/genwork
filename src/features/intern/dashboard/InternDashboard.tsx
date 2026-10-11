// src/features/intern/dashboard/InternDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Play,
  Upload,
  Hourglass,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Calendar,
  UserCheck,
  Check,
} from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard, StatCardSkeleton } from '../../../components/shared/StatCard';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Button } from '../../../components/ui/button';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { AttendanceWidget } from './AttendanceWidget';
import { DeadlineExtensionModal } from './DeadlineExtensionModal';
import { DeliverablePreviewModal } from './DeliverablePreviewModal';
import { formatDateOnly, formatTimeRemaining } from '../../../lib/formatters';
import { STATUS_META } from '../../../types/domain';

export function InternDashboard() {
  const { user, profile } = useAuth();

  // Extension Modal state
  const [extensionModalTask, setExtensionModalTask] = useState<{
    isOpen: boolean;
    taskTitle: string;
    taskCode: string;
    currentDueDate?: string;
  }>({
    isOpen: false,
    taskTitle: '',
    taskCode: '',
  });

  // Deliverable Preview Modal state
  const [deliverableModal, setDeliverableModal] = useState<{
    isOpen: boolean;
    title: string;
    githubUrl?: string;
    deploymentUrl?: string;
  }>({
    isOpen: false,
    title: '',
  });

  // Data Queries
  const { data: internProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['intern-profile', user?.id],
    queryFn: () => internApi.getInternProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'intern'],
    queryFn: internApi.getDashboardStats,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'intern'],
    queryFn: () => internApi.getMyTasks(internProfile?.id || '20000000-0000-0000-0000-000000000001'),
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', 'intern'],
    queryFn: () => internApi.getMyAssignments(internProfile?.id || '20000000-0000-0000-0000-000000000001'),
  });

  // Compute metrics with reliable fallbacks
  const totalTasks = stats?.total_tasks ?? tasks.length;
  const pendingTasksCount = stats?.pending_tasks ?? tasks.filter((t: any) => t.status === 'pending').length;
  const inProgressCount = stats?.in_progress_tasks ?? tasks.filter((t: any) => t.status === 'in_progress').length;
  const submittedCount = stats?.submitted_tasks ?? tasks.filter((t: any) => t.status === 'submitted' || t.status === 'resubmitted').length;
  const waitingCount = stats?.waiting_review_tasks ?? tasks.filter((t: any) => t.status === 'waiting_for_review').length;
  const approvedCount = stats?.approved_tasks ?? tasks.filter((t: any) => t.status === 'approved').length;
  const changesCount = stats?.changes_requested_tasks ?? tasks.filter((t: any) => t.status === 'changes_requested').length;
  const overdueCount = stats?.overdue_tasks ?? tasks.filter((t: any) => {
    if (t.status === 'approved') return false;
    return t.is_overdue || (t.due_date && new Date(t.due_date) < new Date());
  }).length;

  const totalAssignments = stats?.total_assignments ?? assignments.length;
  const pendingAssignmentsCount = stats?.pending_assignments ?? assignments.filter((a: any) => a.status === 'pending' || a.status === 'in_progress').length;
  const completedAssignmentsCount = stats?.completed_assignments ?? assignments.filter((a: any) => a.status === 'completed' || a.status === 'approved').length;

  // "Needs your attention" items (Changes requested + Overdue)
  const attentionItems = tasks.filter((t: any) => {
    const isChanges = t.status === 'changes_requested';
    const isOverdue = t.status !== 'approved' && (t.is_overdue || (t.due_date && new Date(t.due_date) < new Date()));
    return isChanges || isOverdue;
  });

  // Pending Tasks list (max 5)
  const activeTaskList = tasks
    .filter((t: any) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'changes_requested')
    .slice(0, 5);

  // Pending Coursework list (max 4)
  const activeAssignmentList = assignments
    .filter((a: any) => a.status === 'pending' || a.status === 'in_progress')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Profile Header & Streak Card */}
      <ProfileHeaderCard profile={profile} internProfile={internProfile} />

      {/* 2. "Needs your attention" Alert Row (Only shown if any changes requested or overdue items exist) */}
      {attentionItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                    Needs your attention ({attentionItems.length})
                  </h3>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  You have {attentionItems.length} task(s) with revision requests or pending deadlines. Review comments and update deliverables.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setExtensionModalTask({
                    isOpen: true,
                    taskTitle: attentionItems[0]?.task_title || 'Deliverable Task',
                    taskCode: attentionItems[0]?.task_code || 'TSK-0042',
                    currentDueDate: formatDateOnly(attentionItems[0]?.due_date),
                  })
                }
                className="text-xs bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60"
              >
                Request Extension (+48h)
              </Button>
              <Link to="/intern/tasks?tab=changes_requested">
                <Button size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-xs">
                  Resubmit Now <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stat Cards Section (All 11 Metrics) */}
      <div className="space-y-5">
        {/* Sub-heading 1: TASKS (8 Cards, 4-column grid: 2 rows of 4) */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tasks Metrics (8)
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total tasks"
                value={totalTasks}
                icon={FileText}
                to="/intern/tasks"
                iconBg="bg-slate-100"
                iconColor="text-slate-600"
              />
              <StatCard
                title="Pending"
                value={pendingTasksCount}
                icon={Clock}
                to="/intern/tasks?tab=pending"
                iconBg={STATUS_META.pending.iconBg}
                iconColor={STATUS_META.pending.iconColor}
              />
              <StatCard
                title="In progress"
                value={inProgressCount}
                icon={Play}
                to="/intern/tasks?tab=started"
                iconBg={STATUS_META.in_progress.iconBg}
                iconColor={STATUS_META.in_progress.iconColor}
              />
              <StatCard
                title="Submitted"
                value={submittedCount}
                icon={Upload}
                to="/intern/tasks?tab=submitted"
                iconBg={STATUS_META.submitted.iconBg}
                iconColor={STATUS_META.submitted.iconColor}
              />
              <StatCard
                title="Waiting for review"
                value={waitingCount}
                icon={Hourglass}
                to="/intern/tasks?tab=waiting"
                iconBg={STATUS_META.waiting_for_review.iconBg}
                iconColor={STATUS_META.waiting_for_review.iconColor}
              />
              <StatCard
                title="Approved"
                value={approvedCount}
                icon={CheckCircle2}
                to="/intern/tasks?tab=approved"
                iconBg={STATUS_META.approved.iconBg}
                iconColor={STATUS_META.approved.iconColor}
              />
              <StatCard
                title="Changes requested"
                value={changesCount}
                icon={RotateCcw}
                to="/intern/tasks?tab=changes"
                variant="changes"
                iconBg={STATUS_META.changes_requested.iconBg}
                iconColor={STATUS_META.changes_requested.iconColor}
              />
              <StatCard
                title="Overdue"
                value={overdueCount}
                icon={AlertTriangle}
                to="/intern/tasks?filter=overdue"
                variant="overdue"
                iconBg={STATUS_META.overdue.iconBg}
                iconColor={STATUS_META.overdue.iconColor}
              />
            </div>
          )}
        </div>

        {/* Sub-heading 2: ASSIGNMENTS (3 Cards, 3-column grid) */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Assignments & Coursework Metrics (3)
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total assignments"
                value={totalAssignments}
                icon={FileText}
                to="/intern/assignments"
                iconBg="bg-slate-100"
                iconColor="text-slate-600"
              />
              <StatCard
                title="Pending assignments"
                value={pendingAssignmentsCount}
                icon={Clock}
                to="/intern/assignments?status=pending"
                iconBg="bg-amber-100"
                iconColor="text-amber-700"
              />
              <StatCard
                title="Completed assignments"
                value={completedAssignmentsCount}
                icon={CheckCircle2}
                to="/intern/assignments?status=completed"
                iconBg="bg-emerald-100"
                iconColor="text-emerald-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Daily Attendance & Working Hours Tracker (Default 4 Hours) */}
      <AttendanceWidget />

      {/* 5. Two-Column Layout (60% Pending Tasks / 40% Pending Coursework) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (60%): Pending Tasks */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Play className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pending Tasks</h3>
                <p className="text-[11px] text-slate-500">Active milestones assigned for your cohort</p>
              </div>
            </div>
            <Link
              to="/intern/tasks"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View all tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
              ))}
            </div>
          ) : activeTaskList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">You're all caught up!</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No pending tasks right now. Great job keeping your deliverables up to date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTaskList.map((t: any) => {
                const remaining = formatTimeRemaining(t.due_date);
                const isOverdue = remaining.isOverdue;
                const isUrgent = remaining.isUrgent;

                return (
                  <div
                    key={t.task_assignment_id || t.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {t.task_code || 'TSK-0042'}
                          </span>
                          <PriorityBadge priority={t.priority || 'high'} />
                          <StatusBadge status={t.status} isOverdue={isOverdue} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {t.task_title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {t.task_description}
                        </p>
                      </div>

                      {/* Live Time Remaining Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 border ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isUrgent
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {remaining.text}
                      </span>
                    </div>

                    {/* Metadata & Actions row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-slate-400" />
                          {t.mentor_name || internProfile?.mentor?.profile?.full_name || 'Alex Rivera'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Due: {formatDateOnly(t.due_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Extension Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExtensionModalTask({
                              isOpen: true,
                              taskTitle: t.task_title,
                              taskCode: t.task_code,
                              currentDueDate: formatDateOnly(t.due_date),
                            })
                          }
                          className="text-[11px] h-7 px-2 text-slate-500 hover:text-slate-800"
                        >
                          Request +48h
                        </Button>

                        {/* Deliverable preview modal launcher */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDeliverableModal({
                              isOpen: true,
                              title: `${t.task_code}: ${t.task_title}`,
                              githubUrl: 'https://github.com/organization/intern-workspace',
                              deploymentUrl: 'https://preview-staging.vercel.app',
                            })
                          }
                          className="text-[11px] h-7 px-2 text-slate-600 border-slate-200"
                        >
                          Deliverables <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>

                        {/* Primary Action Button */}
                        <Link to={`/intern/tasks/${t.task_code}`}>
                          <Button size="sm" className="text-xs h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
                            {t.status === 'pending' ? 'Start task' : 'Continue'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (40%): Pending Coursework / Assignments */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pending Assignments</h3>
                <p className="text-[11px] text-slate-500">Modules, code challenges & quizzes</p>
              </div>
            </div>
            <Link
              to="/intern/assignments"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {assignmentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse"></div>
              ))}
            </div>
          ) : activeAssignmentList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-900">All coursework submitted!</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No active assignment deadlines pending for your track.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAssignmentList.map((a: any) => (
                <Link
                  key={a.id}
                  to={`/intern/assignments/${a.assignment?.code}`}
                  className="block p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {a.assignment?.code}
                        </span>
                        <PriorityBadge priority={a.assignment?.priority || 'medium'} />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {a.assignment?.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {a.assignment?.description}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Assigned by {internProfile?.mentor?.profile?.full_name || 'Mentor'}</span>
                    <span className="font-medium text-slate-700">Due: {formatDateOnly(a.assignment?.due_date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Extension Modal */}
      <DeadlineExtensionModal
        isOpen={extensionModalTask.isOpen}
        onClose={() => setExtensionModalTask((prev) => ({ ...prev, isOpen: false }))}
        taskTitle={extensionModalTask.taskTitle}
        taskCode={extensionModalTask.taskCode}
        currentDueDate={extensionModalTask.currentDueDate}
        mentorName={internProfile?.mentor?.profile?.full_name || 'Alex Rivera'}
      />

      {/* Deliverable Preview Side-Sheet Modal */}
      <DeliverablePreviewModal
        isOpen={deliverableModal.isOpen}
        onClose={() => setDeliverableModal((prev) => ({ ...prev, isOpen: false }))}
        title={deliverableModal.title}
        githubUrl={deliverableModal.githubUrl}
        deploymentUrl={deliverableModal.deploymentUrl}
      />
    </div>
  );
}
