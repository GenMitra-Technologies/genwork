// src/features/intern/tasks/TasksPage.tsx
import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Clock, AlertTriangle, Calendar, User, ArrowRight } from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { SearchInput } from '../../../components/shared/SearchInput';
import { Pagination } from '../../../components/shared/Pagination';
import { EmptyState } from '../../../components/shared/EmptyState';
import { SkeletonCard } from '../../../components/shared/SkeletonCard';
import { formatTimeRemaining, formatDateOnly } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';
import { usePagination } from '../../../hooks/usePagination';

export function TasksPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'intern'],
    queryFn: () => internApi.getMyTasks('20000000-0000-0000-0000-000000000001'),
  });

  const handleTabChange = (tab: string) => {
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
      if (activeTab === 'waiting_for_review' && t.status !== 'waiting_for_review') return false;
      if (activeTab === 'approved' && t.status !== 'approved') return false;
      if (activeTab === 'changes_requested' && t.status !== 'changes_requested') return false;
      if (activeTab === 'overdue' && !t.is_overdue) return false;

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Priority Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, code (TSK-...), or description"
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
          title="No tasks match the filter"
          description="Try selecting a different status tab or adjusting your search keywords."
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
                      {task.mentor_name || 'Alex Rivera'}
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
