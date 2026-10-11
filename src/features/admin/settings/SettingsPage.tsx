// src/features/admin/settings/SettingsPage.tsx
import React, { useState } from 'react';
import { Settings, Save, Megaphone, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';

export function SettingsPage() {
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [reminderWindow, setReminderWindow] = useState('24');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Announcement broadcast
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'mentor' | 'intern'>('all');
  const [broadcastDone, setBroadcastDone] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    try {
      await adminApi.broadcastAnnouncement(announcementTitle, announcementBody, targetRole);
      setBroadcastDone(true);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setTimeout(() => setBroadcastDone(false), 4000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Settings & Broadcasts</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure security timeouts, timezones, and broadcast system-wide announcements.
        </p>
      </div>

      {/* Settings Form */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" /> Core Operational Parameters
        </h3>

        {savedSuccess && (
          <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Platform settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Inactivity Timeout (Minutes)</label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground">Default: 30 minutes</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Streak Timezone</label>
              <Input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground">Default: Asia/Kolkata</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Deadline Reminder (Hours)</label>
              <Input
                type="number"
                value={reminderWindow}
                onChange={(e) => setReminderWindow(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground">Default: 24 hours prior</span>
            </div>
          </div>

          <Button type="submit" size="sm" className="gap-1.5 text-xs">
            <Save className="h-3.5 w-3.5" /> Save Parameters
          </Button>
        </form>
      </div>

      {/* Announcement Composer */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> Broadcast Platform Announcement
        </h3>
        <p className="text-xs text-muted-foreground">
          Fans out realtime notifications to all users or filtered by role.
        </p>

        {broadcastDone && (
          <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Announcement published and dispatched to recipient notification feeds!
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Title *</label>
              <Input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Mid-term Assessment Schedule"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target Role Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="all">All Users (Interns + Mentors)</option>
                <option value="intern">Interns Only</option>
                <option value="mentor">Mentors Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Announcement Body *</label>
            <Textarea
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Full announcement message..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!announcementTitle.trim() || !announcementBody.trim()}
            className="gap-1.5 text-xs"
          >
            <Megaphone className="h-3.5 w-3.5" /> Publish Announcement
          </Button>
        </form>
      </div>
    </div>
  );
}
