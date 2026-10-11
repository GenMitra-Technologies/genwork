// src/components/shared/Timeline.tsx
import { CheckCircle2, Clock, Play, RotateCcw, Upload, ShieldAlert } from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';

export interface TimelineEventItem {
  id: string;
  eventType: string;
  actorName?: string;
  fromStatus?: string | null;
  toStatus?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export function Timeline({ events }: { events: TimelineEventItem[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No workflow events recorded yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assigned':
        return <Clock className="h-4 w-4 text-zinc-500" />;
      case 'started':
        return <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'submitted':
        return <Upload className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />;
      case 'waiting_for_review':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'changes_requested':
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      case 'resubmitted':
        return <Upload className="h-4 w-4 text-purple-500" />;
      case 'status_override':
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventTitle = (item: TimelineEventItem) => {
    switch (item.eventType) {
      case 'assigned':
        return 'Task Assigned';
      case 'started':
        return 'Task Started';
      case 'submitted':
        return item.metadata?.version ? `Version ${item.metadata.version} Submitted` : 'Task Submitted';
      case 'waiting_for_review':
        return 'Moved to Waiting for Review';
      case 'approved':
        return 'Submission Approved';
      case 'changes_requested':
        return 'Changes Requested by Mentor';
      case 'resubmitted':
        return item.metadata?.version ? `Version ${item.metadata.version} Resubmitted` : 'Task Resubmitted';
      case 'status_override':
        return `Status Overridden: ${item.toStatus}`;
      default:
        return item.eventType.replace('_', ' ');
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:left-2 before:top-2 before:w-0.5 before:bg-border">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          <div className="absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-4 ring-background">
            {getEventIcon(event.eventType)}
          </div>

          <div className="rounded-lg border bg-card p-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-sm font-semibold capitalize text-foreground">
                {getEventTitle(event)}
              </span>
              <time className="text-xs text-muted-foreground">
                {formatDateTime(event.createdAt)}
              </time>
            </div>

            {event.actorName && (
              <p className="mt-1 text-xs text-muted-foreground">
                Actor: <span className="font-medium text-foreground">{event.actorName}</span>
              </p>
            )}

            {event.metadata?.reason && (
              <p className="mt-2 text-xs rounded bg-muted/60 p-2 text-foreground">
                Reason: {event.metadata.reason}
              </p>
            )}

            {event.metadata?.feedback && (
              <p className="mt-2 text-xs rounded bg-muted/60 p-2 text-foreground">
                Feedback: {event.metadata.feedback}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
