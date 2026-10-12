// src/features/admin/settings/SettingsPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Save, Megaphone, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export function SettingsPage() {
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [reminderWindow, setReminderWindow] = useState('24');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

      {/* Quick Navigation to Dedicated Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/broadcast"
          className="rounded-xl border border-slate-200/80 bg-card p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 transition-colors">
                Broadcast Platform Announcement
              </h4>
              <span className="text-[11px] text-muted-foreground">Dedicated Dispatcher Page →</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dispatch urgent updates, standup links, or cohort announcements to all or filtered roles.
          </p>
        </Link>

        <Link
          to="/admin/maintenance"
          className="rounded-xl border border-slate-200/80 bg-card p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground group-hover:text-amber-600 transition-colors">
                Maintenance Mode & System Lock
              </h4>
              <span className="text-[11px] text-muted-foreground">Dedicated Maintenance Page →</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Activate emergency maintenance notices, set downtime duration, and safeguard active shifts.
          </p>
        </Link>
      </div>
    </div>
  );
}
