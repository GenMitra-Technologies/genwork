// src/features/admin/maintenance/MaintenanceModePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  Power,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';

export function MaintenanceModePage() {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Scheduled Platform Maintenance');
  const [message, setMessage] = useState(
    'Genmitra Workspace is undergoing scheduled server updates. Submissions and attendance tracking will resume shortly.'
  );
  const [estimatedDuration, setEstimatedDuration] = useState('45');
  const [allowAdmins, setAllowAdmins] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load initial maintenance state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('genmitra_maintenance_mode');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEnabled(Boolean(parsed.enabled));
        if (parsed.title) setTitle(parsed.title);
        if (parsed.message) setMessage(parsed.message);
        if (parsed.estimatedDuration) setEstimatedDuration(parsed.estimatedDuration);
        if (parsed.allowAdmins !== undefined) setAllowAdmins(parsed.allowAdmins);
      }
    } catch {}
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const config = {
      enabled,
      title: title.trim(),
      message: message.trim(),
      estimatedDuration,
      allowAdmins,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('genmitra_maintenance_mode', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('genmitra_maintenance_change', { detail: config }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleToggleState = (newState: boolean) => {
    setEnabled(newState);
    const config = {
      enabled: newState,
      title: title.trim(),
      message: message.trim(),
      estimatedDuration,
      allowAdmins,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('genmitra_maintenance_mode', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('genmitra_maintenance_change', { detail: config }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" /> Maintenance Mode & System Lock
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Temporarily place the workspace under maintenance, display outage notices, or restrict portal access.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Maintenance parameters and live status banner updated successfully!</span>
        </div>
      )}

      {/* Live Status Toggle Card */}
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-6 shadow-xs transition-colors',
          enabled
            ? 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20'
            : 'border-slate-200/80 bg-white'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status:</span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border',
                  enabled
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                {enabled ? 'Active (Under Maintenance)' : 'Normal Operations'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {enabled
                ? 'The maintenance banner is currently active across the platform for all user sessions.'
                : 'All platform services, task submissions, and check-in shifts are operating normally.'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {enabled ? (
              <Button
                type="button"
                onClick={() => handleToggleState(false)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 w-full sm:w-auto min-h-[36px] justify-center"
              >
                <Power className="h-4 w-4" /> Deactivate Maintenance Mode
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleToggleState(true)}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 w-full sm:w-auto min-h-[36px] justify-center"
              >
                <ShieldAlert className="h-4 w-4" /> Enable Maintenance Mode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Notice Configuration Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-600" /> Maintenance Notice Details
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Customize the message displayed on the platform banner when maintenance mode is engaged.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-900">Banner Notice Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Infrastructure Maintenance"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-900">Estimated Duration (Minutes)</label>
              <Input
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="45"
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Public Maintenance Message *</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed message regarding platform availability..."
              rows={3}
              required
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allowAdmins"
              checked={allowAdmins}
              onChange={(e) => setAllowAdmins(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="allowAdmins" className="text-xs text-slate-700 font-medium">
              Allow Administrator bypass (Admins retain unrestricted dashboard access during maintenance)
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" size="sm" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto min-h-[36px] justify-center">
              <Save className="h-3.5 w-3.5" /> Save Configuration
            </Button>
          </div>
        </form>
      </div>

      {/* Live Preview of Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> Banner Appearance Preview
        </h3>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <div className="font-bold flex items-center gap-2">
              <span>{title || 'Scheduled Maintenance'}</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-200 text-amber-900">
                ~{estimatedDuration} mins
              </span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              {message || 'The platform is undergoing system maintenance.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
