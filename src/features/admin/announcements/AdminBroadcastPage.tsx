// src/features/admin/announcements/AdminBroadcastPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, CheckCircle2, AlertCircle, Clock, Send, Users, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { adminApi } from '../api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDateTime } from '../../../lib/formatters';

export function AdminBroadcastPage() {
  const queryClient = useQueryClient();
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'mentor' | 'intern'>('all');
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Announcements query
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: adminApi.getAnnouncements,
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!announcementTitle.trim() || !announcementBody.trim()) {
        throw new Error('Title and announcement message body are required.');
      }
      return await adminApi.broadcastAnnouncement(
        announcementTitle.trim(),
        announcementBody.trim(),
        targetRole
      );
    },
    onSuccess: () => {
      setBroadcastDone(true);
      setBroadcastError(null);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setTimeout(() => setBroadcastDone(false), 5000);
    },
    onError: (err: any) => {
      setBroadcastError(err.message || 'Failed to dispatch platform announcement.');
    },
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    broadcastMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /> Broadcast Platform Announcement
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Publish real-time system broadcasts and notifications dispatched across interns and mentors.
        </p>
      </div>

      {broadcastDone && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">Announcement Broadcast Dispatched Successfully!</p>
            <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px] mt-0.5">
              The announcement has been stored and delivered to all designated recipient notification centers.
            </p>
          </div>
        </div>
      )}

      {broadcastError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{broadcastError}</span>
        </div>
      )}

      {/* Broadcast Composer */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" /> New Broadcast Dispatcher
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Select the audience and compose your announcement title and message.
          </p>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-900">Announcement Title *</label>
              <Input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Mid-term Assessment Schedule & Standup Reminders"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-900">Target Role Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="all">All Users (Interns + Mentors)</option>
                <option value="intern">Interns Only</option>
                <option value="mentor">Mentors Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Announcement Body *</label>
            <Textarea
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Provide complete announcements, deadlines, sprint milestones, or guidelines..."
              rows={4}
              required
              className="text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-center sm:justify-start">
              <Users className="h-3.5 w-3.5 text-slate-400" /> Target Audience: {targetRole.toUpperCase()}
            </span>

            <Button
              type="submit"
              size="sm"
              disabled={!announcementTitle.trim() || !announcementBody.trim() || broadcastMutation.isPending}
              className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[36px] justify-center"
            >
              <Send className="h-3.5 w-3.5" />
              {broadcastMutation.isPending ? 'Publishing...' : 'Dispatch Announcement'}
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Broadcast Archive ({announcements.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Past Platform Dispatches</span>
        </div>

        {announcementsLoading ? (
          <div className="text-xs text-muted-foreground py-6 text-center">Loading past announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">No platform broadcasts sent yet.</div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {announcements.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 space-y-2 text-xs hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>{a.title}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {a.target_role === 'all' ? 'All Roles' : a.target_role}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDateTime(a.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
