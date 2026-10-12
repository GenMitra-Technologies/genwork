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

  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'waiting_for_review', label: 'Under Review' },
    { id: 'changes_requested', label: 'Changes Needed' },
    { id: 'approved', label: 'Approved' },
    { id: 'overdue', label: 'Overdue' },
  ];

  const totalTasks = tasks.length;
  const pendingTasksCount = useMemo(() => tasks.filter((t: any) => t.status === 'pending').length, [tasks]);
  const inProgressCount = useMemo(() => tasks.filter((t: any) => t.status === 'in_progress').length, [tasks]);
  const submittedCount = useMemo(() => tasks.filter((t: any) => t.status === 'submitted' || t.status === 'resubmitted').length, [tasks]);
  const waitingCount = useMemo(() => tasks.filter((t: any) => t.status === 'waiting_for_review').length, [tasks]);
  const approvedCount = useMemo(() => tasks.filter((t: any) => t.status === 'approved').length, [tasks]);
  const changesCount = useMemo(() => tasks.filter((t: any) => t.status === 'changes_requested').length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t: any) => {
    if (t.status === 'approved') return false;
    return t.is_overdue || (t.due_date && new Date(t.due_date) < new Date());
  }).length, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Assigned Tasks</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Execute, submit, and track the progress of your assigned internship tasks.
          </p>
        </div>
      </div>

      {/* Unified Single Text-Only Interactive Filters & Metrics */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 px-1 text-xs border-b border-border/60">
        <button
          onClick={() => handleTabChange('all')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'all' ? 'font-bold text-foreground border-b-2 border-primary pb-0.5' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span>All Tasks</span>
          <span className="font-semibold text-foreground">({totalTasks})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('pending')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'pending' ? 'font-bold text-slate-900 dark:text-white border-b-2 border-slate-900 pb-0.5' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span>Pending</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">({pendingTasksCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('in_progress')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'in_progress' ? 'font-bold text-blue-600 border-b-2 border-blue-600 pb-0.5' : 'text-muted-foreground hover:text-blue-600'
          )}
        >
          <span>In Progress</span>
          <span className="font-semibold text-blue-600">({inProgressCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('submitted')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'submitted' ? 'font-bold text-indigo-600 border-b-2 border-indigo-600 pb-0.5' : 'text-muted-foreground hover:text-indigo-600'
          )}
        >
          <span>Submitted</span>
          <span className="font-semibold text-indigo-600">({submittedCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('waiting_for_review')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'waiting_for_review' ? 'font-bold text-amber-600 border-b-2 border-amber-600 pb-0.5' : 'text-muted-foreground hover:text-amber-600'
          )}
        >
          <span>Under Review</span>
          <span className="font-semibold text-amber-600">({waitingCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('approved')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'approved' ? 'font-bold text-emerald-600 border-b-2 border-emerald-600 pb-0.5' : 'text-muted-foreground hover:text-emerald-600'
          )}
        >
          <span>Approved</span>
          <span className="font-semibold text-emerald-600">({approvedCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('changes_requested')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'changes_requested' ? 'font-bold text-orange-600 border-b-2 border-orange-600 pb-0.5' : 'text-muted-foreground hover:text-orange-600'
          )}
        >
          <span>Changes Needed</span>
          <span className="font-semibold text-orange-600">({changesCount})</span>
        </button>
        <span className="text-border">·</span>

        <button
          onClick={() => handleTabChange('overdue')}
          className={cn(
            'inline-flex items-center gap-1.5 transition-colors',
            activeTab === 'overdue' ? 'font-bold text-rose-600 border-b-2 border-rose-600 pb-0.5' : 'text-muted-foreground hover:text-rose-600'
          )}
        >
          <span>Overdue</span>
          <span className="font-semibold text-rose-600">({overdueCount})</span>
        </button>
      </div>

      {/* Search and Priority Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, code, or description"
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
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

                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {task.task_description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" />
                      {task.mentor_name || 'Assigned Mentor'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      Due {formatDateOnly(task.due_date)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'font-medium text-[11px] flex items-center gap-1',
                      timeInfo.isOverdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {timeInfo.isOverdue && <AlertTriangle className="h-3 w-3" />}
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
