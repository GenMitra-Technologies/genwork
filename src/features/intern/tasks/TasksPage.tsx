import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  Play,
  Upload,
  Hourglass,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard, StatCardSkeleton } from '../../../components/shared/StatCard';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { SearchInput } from '../../../components/shared/SearchInput';
import { Pagination } from '../../../components/shared/Pagination';
import { EmptyState } from '../../../components/shared/EmptyState';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { formatTimeRemaining, formatDateOnly } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';
import { usePagination } from '../../../hooks/usePagination';
import { STATUS_META } from '../../../types/domain';

export function TasksPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const rawTab = searchParams.get('tab');
  const rawFilter = searchParams.get('filter');

  // Normalize aliases (?tab=started, ?tab=waiting, ?tab=changes, ?filter=overdue)
  const activeTab = useMemo(() => {
    if (rawFilter === 'overdue' || rawTab === 'overdue') return 'overdue';
    if (rawTab === 'started' || rawTab === 'in_progress') return 'in_progress';
    if (rawTab === 'submitted') return 'submitted';
    if (rawTab === 'waiting' || rawTab === 'waiting_for_review') return 'waiting_for_review';
    if (rawTab === 'changes' || rawTab === 'changes_requested') return 'changes_requested';
    if (rawTab === 'approved') return 'approved';
    if (rawTab === 'pending') return 'pending';
    return 'all';
  }, [rawTab, rawFilter]);

  const internId = profile?.intern_id || '20000000-0000-0000-0000-000000000001';

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'intern', internId],
    queryFn: () => internApi.getMyTasks(internId),
  });

  const handleTabChange = (tab: string) => {
    searchParams.delete('filter');
    if (tab === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      // Tab filter
      if (activeTab === 'pending' && t.status !== 'pending') return false;
      if (activeTab === 'in_progress' && t.status !== 'in_progress') return false;
      if (activeTab === 'submitted' && t.status !== 'submitted' && t.status !== 'resubmitted') return false;
      if (activeTab === 'waiting_for_review' && t.status !== 'waiting_for_review') return false;
      if (activeTab === 'approved' && t.status !== 'approved') return false;
      if (activeTab === 'changes_requested' && t.status !== 'changes_requested') return false;
      if (activeTab === 'overdue') {
        const isTaskOverdue =
          t.is_overdue ||
          (t.status !== 'approved' && t.due_date && new Date(t.due_date) < new Date());
        if (!isTaskOverdue) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.task_title?.toLowerCase().includes(q);
        const matchCode = t.task_code?.toLowerCase().includes(q);
        const matchDesc = t.task_description?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, activeTab, priorityFilter, searchQuery]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems,
    goToPage,
  } = usePagination(filteredTasks, 8);

  // Computed counts for tab badges
  const totalTasks = tasks.length;
  const pendingTasksCount = tasks.filter((t: any) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'in_progress').length;
  const submittedCount = tasks.filter((t: any) => t.status === 'submitted' || t.status === 'resubmitted').length;
  const waitingCount = tasks.filter((t: any) => t.status === 'waiting_for_review').length;
  const approvedCount = tasks.filter((t: any) => t.status === 'approved').length;
  const changesCount = tasks.filter((t: any) => t.status === 'changes_requested').length;
  const overdueCount = tasks.filter((t: any) =>
    t.is_overdue || (t.status !== 'approved' && t.due_date && new Date(t.due_date) < new Date())
  ).length;

  const tabs = useMemo(() => [
    { id: 'all', label: 'All Tasks', count: totalTasks },
    { id: 'pending', label: 'Pending', count: pendingTasksCount },
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'submitted', label: 'Submitted', count: submittedCount },
    { id: 'waiting_for_review', label: 'Under Review', count: waitingCount },
    { id: 'approved', label: 'Approved', count: approvedCount },
    { id: 'changes_requested', label: 'Changes Needed', count: changesCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
  ], [totalTasks, pendingTasksCount, inProgressCount, submittedCount, waitingCount, approvedCount, changesCount, overdueCount]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Assigned Tasks</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Execute, submit, and track the progress of your assigned internship tasks.
          </p>
        </div>
      </div>

      {/* Horizontally scrollable status filter tabs pill bar */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 min-h-[36px]',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10.5px] font-bold px-1.5 py-0.2 rounded-full tabular-nums',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background text-muted-foreground border border-border/50'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Priority Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, code, or description"
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 sm:w-36 h-9 rounded-lg border border-input bg-background px-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : paginatedItems.length === 0 ? (
        <EmptyState
          title={totalTasks === 0 ? "No tasks assigned yet" : "No tasks match the filter"}
          description={totalTasks === 0 ? "You do not have any active task assignments. Your mentor will assign tasks as curriculum milestones begin." : "Try selecting a different status tab or adjusting your search keywords."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedItems.map((task: any) => {
            const timeInfo = formatTimeRemaining(task.due_date);
            return (
              <Link
                key={task.task_assignment_id}
                to={`/intern/tasks/${task.task_code}`}
                className="group flex flex-col justify-between rounded-xl border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-primary">
                        {task.task_code}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <StatusBadge status={task.status} isOverdue={task.is_overdue} />
                  </div>

                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {task.task_title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.task_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-none">
                      <User className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{task.mentor_name || 'Assigned Mentor'}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      Due {formatDateOnly(task.due_date)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'font-medium text-[11px] flex items-center gap-1 shrink-0',
                      timeInfo.isOverdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {timeInfo.isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                    {timeInfo.text}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={goToPage}
      />
    </div>
  );
}
