// src/features/mentor/interns/MyInternsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Users, Flame, CheckCircle2, Clock, Hourglass, RotateCcw } from 'lucide-react';
import { mentorApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';

export function MyInternsPage() {
  const { data: myInterns = [], isLoading } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => mentorApi.getMyInterns('10000000-0000-0000-0000-000000000001'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Assigned Interns</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor your mentees' daily streaks, workflow progress, and task approval rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myInterns.map((intern: any) => (
          <div
            key={intern.intern_id}
            className="rounded-xl border bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-4">
              <Avatar
                src={intern.avatar_url}
                name={intern.full_name}
                size="lg"
              />
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-foreground">{intern.full_name}</h3>
                <p className="text-xs text-muted-foreground">{intern.role_title}</p>
                <p className="text-[11px] text-muted-foreground">{intern.company_name}</p>
              </div>
            </div>

            {/* Streak & Active Days */}
            <div className="flex items-center justify-between rounded-lg bg-orange-500/5 border border-orange-500/20 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-orange-700 dark:text-orange-400">
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                <span>{intern.current_streak} Day Streak</span>
              </div>
              <div className="text-muted-foreground text-[11px]">
                Active: <strong className="text-foreground">{intern.total_active_days} days</strong>
              </div>
            </div>

            {/* Task stats pills */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
              <div className="rounded p-2 bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Approved Tasks</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {intern.approved_tasks_count}
                </span>
              </div>
              <div className="rounded p-2 bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Under Review</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Hourglass className="h-3 w-3" /> {intern.waiting_review_count}
                </span>
              </div>
              <div className="rounded p-2 bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Changes Needed</span>
                <span className="font-bold text-orange-600 flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> {intern.changes_requested_count}
                </span>
              </div>
              <div className="rounded p-2 bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Approval Rate</span>
                <span className="font-bold text-foreground">
                  {intern.approval_rate_percentage}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
