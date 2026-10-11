// src/features/notifications/NotificationsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Upload,
  Play,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';
import { notificationsApi } from './api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { formatDateTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/ui.store';

export function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const setUnreadCount = useUIStore((s) => s.setUnreadCount);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(user?.id || '00000000-0000-0000-0000-00000011'),
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n: any) => !n.is_read).length;
  }, [notifications]);

  React.useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n: any) => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'changes_requested':
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      case 'task_submitted':
      case 'task_resubmitted':
        return <Upload className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />;
      case 'task_started':
        return <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case 'deadline_approaching':
      case 'task_overdue':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Realtime notifications on task assignments, mentor reviews, and deadline reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b pb-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            filter === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            filter === 'unread'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No notifications to display.
          </div>
        ) : (
          filteredNotifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markReadMutation.mutate(n.id);
              }}
              className={cn(
                'flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer',
                n.is_read
                  ? 'bg-card text-card-foreground border-border/70 opacity-80'
                  : 'bg-primary/5 border-primary/30 shadow-xs'
              )}
            >
              <div className="rounded-full bg-card p-2 border shadow-2xs mt-0.5">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                  <time className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </time>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                {n.related_code && (
                  <span className="inline-block mt-1 font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {n.related_code}
                  </span>
                )}
              </div>

              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
