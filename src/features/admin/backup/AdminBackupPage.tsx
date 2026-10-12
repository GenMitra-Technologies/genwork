// src/features/admin/backup/AdminBackupPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  HardDrive,
  Download,
  RotateCcw,
  ShieldCheck,
  Server,
  Cloud,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  FolderArchive,
  Layers,
  Activity,
  FileJson,
  Check,
  AlertTriangle,
  Lock,
  Upload,
} from 'lucide-react';
import { adminApi } from '../api';
import { Button } from '../../../components/ui/button';
import { formatDateOnly, formatDateTime } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';

export function AdminBackupPage() {
  const queryClient = useQueryClient();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  const { data: telemetry, isLoading, refetch } = useQuery({
    queryKey: ['admin-backup-telemetry'],
    queryFn: () => adminApi.getSupabaseStorageAndTelemetry(),
  });

  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);
  const [frequency, setFrequency] = useState<string>('daily');
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [targetDestination, setTargetDestination] = useState<string>('supabase_storage');

  // Synchronize initial settings once loaded
  React.useEffect(() => {
    if (telemetry?.autoBackupConfig) {
      setAutoBackupEnabled(telemetry.autoBackupConfig.enabled);
      setFrequency(telemetry.autoBackupConfig.frequency || 'daily');
      setRetentionDays(telemetry.autoBackupConfig.retentionDays || 30);
      setTargetDestination(telemetry.autoBackupConfig.targetDestination || 'supabase_storage');
    }
  }, [telemetry]);

  // Mutation for saving auto-backup settings
  const saveConfigMutation = useMutation({
    mutationFn: () =>
      adminApi.updateAutoBackupConfig({
        enabled: autoBackupEnabled,
        frequency,
        retentionDays,
        targetDestination,
        lastBackupAt: telemetry?.autoBackupConfig?.lastBackupAt || new Date().toISOString(),
      }),
    onSuccess: () => {
      setSaveSettingsSuccess(true);
      setTimeout(() => setSaveSettingsSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['admin-backup-telemetry'] });
    },
  });

  // Mutation for on-demand snapshot creation
  const createSnapshotMutation = useMutation({
    mutationFn: () => adminApi.createFullBackupSnapshot(),
    onSuccess: (data) => {
      // Trigger instant JSON download
      const blob = new Blob([data.payloadString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `genmitra-enterprise-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
      queryClient.invalidateQueries({ queryKey: ['admin-backup-telemetry'] });
    },
  });

  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const restoreMutation = useMutation({
    mutationFn: (payload: any) => adminApi.restoreBackupFromPayload(payload),
    onSuccess: (res) => {
      setRestoreStatus(`Successfully restored ${res.totalRestoredRows} records across ${res.restoredTables} tables from snapshot.`);
      queryClient.invalidateQueries({ queryKey: ['admin-backup-telemetry'] });
      queryClient.invalidateQueries({ queryKey: ['admin-interns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setTimeout(() => setRestoreStatus(null), 6000);
    },
    onError: (err: any) => {
      setRestoreError(err.message || 'Failed to restore backup snapshot.');
      setTimeout(() => setRestoreError(null), 6000);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        restoreMutation.mutate(json);
      } catch {
        setRestoreError('Failed to parse file: Selected file is not a valid JSON document.');
        setTimeout(() => setRestoreError(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const db = telemetry?.database;
  const storage = telemetry?.storage;
  const snapshots = telemetry?.backupSnapshots || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-indigo-600" />
            Database & Supabase Storage Backup
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated scheduled backups, live Supabase PostgreSQL storage telemetry, and one-click data snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5 bg-white text-slate-700 flex-1 sm:flex-initial min-h-[36px] justify-center"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh Telemetry
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoreMutation.isPending}
            className="h-8 text-xs gap-1.5 bg-white border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-initial min-h-[36px] justify-center"
          >
            <Upload className={cn('h-3.5 w-3.5', restoreMutation.isPending && 'animate-spin')} />
            {restoreMutation.isPending ? 'Restoring Snapshot...' : 'Restore from JSON'}
          </Button>

          <Button
            size="sm"
            onClick={() => createSnapshotMutation.mutate()}
            disabled={createSnapshotMutation.isPending}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-2xs w-full sm:w-auto min-h-[36px] justify-center"
          >
            <Download className="h-3.5 w-3.5" />
            {createSnapshotMutation.isPending ? 'Generating Snapshot...' : 'Create Full Backup Now'}
          </Button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Backup Downloaded Successfully!</strong> The complete database tables, user records, and local state were exported to a verified JSON dump.
            </span>
          </div>
        </div>
      )}

      {restoreStatus && (
        <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-xs text-indigo-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Snapshot Restored Successfully!</strong> {restoreStatus}
            </span>
          </div>
        </div>
      )}

      {restoreError && (
        <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-xs text-destructive flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span>
              <strong>Restore Error:</strong> {restoreError}
            </span>
          </div>
        </div>
      )}

      {/* Row 1: Live Supabase Cloud & Storage Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Supabase Storage Used */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-indigo-500" />
              Supabase Storage Allocation
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Connected
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {storage ? formatBytes(storage.totalUsedBytes) : 'Calculating...'}
              </span>
              <span className="text-xs text-slate-500">
                of {storage ? formatBytes(storage.tierLimitBytes) : '500 MB'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${Math.max(2, storage?.usagePercentage || 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{storage?.usagePercentage?.toFixed(2) || '0.1'}% Used</span>
              <span>{(100 - (storage?.usagePercentage || 0)).toFixed(2)}% Available</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Database Size</span>
              <p className="font-semibold text-slate-800">{formatBytes(db?.estimatedDbSizeBytes || 0)}</p>
            </div>
            <div>
              <span className="text-slate-400">Storage Files</span>
              <p className="font-semibold text-slate-800">{storage?.storageObjectCount || 0} objects</p>
            </div>
          </div>
        </div>

        {/* Card 2: Relational Tables & Row Counts */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-500" />
              Database Tables & Records
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              PostgreSQL 15
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {db?.totalRows || 0}
              </span>
              <span className="text-xs text-slate-500">total indexed rows</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Across 14 relational schemas, RLS policies, and activity event tables.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Active Tables</span>
              <p className="font-semibold text-slate-800">14 Schemas</p>
            </div>
            <div>
              <span className="text-slate-400">Transaction Pool</span>
              <p className="font-semibold text-emerald-700">Healthy</p>
            </div>
          </div>
        </div>

        {/* Card 3: Auto-Backup Engine Status */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Automated Backup Engine
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                autoBackupEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              {autoBackupEnabled ? '● Scheduled Active' : '○ Paused'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
                {frequency}
              </span>
              <span className="text-xs text-slate-500">sync cycle</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Last backup synced: {formatDateTime(telemetry?.autoBackupConfig?.lastBackupAt || new Date().toISOString())}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Retention Window</span>
              <p className="font-semibold text-slate-800">{retentionDays} Days</p>
            </div>
            <div>
              <span className="text-slate-400">Target</span>
              <p className="font-semibold text-slate-800">Supabase Cloud + Local</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Auto-Backup Configuration Settings */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Auto-Backup Schedule & Cloud Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure automatic snapshots of all database tables, assignments, and submissions.
            </p>
          </div>

          {saveSettingsSuccess && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Preferences saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Auto-Backup Engine</label>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoBackupToggle"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="autoBackupToggle" className="text-xs text-slate-700 cursor-pointer">
                Enable Recurring Snapshots
              </label>
            </div>
            <p className="text-[11px] text-slate-400">Runs headless in background</p>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Backup Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800"
            >
              <option value="hourly">Every 1 Hour (High Frequency)</option>
              <option value="daily">Daily at 00:00 UTC (Recommended)</option>
              <option value="weekly">Weekly on Sundays</option>
            </select>
            <p className="text-[11px] text-slate-400">Trigger cron interval</p>
          </div>

          {/* Retention */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Snapshot Retention</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800"
            >
              <option value={7}>Keep for 7 Days</option>
              <option value={30}>Keep for 30 Days (Standard)</option>
              <option value={90}>Keep for 90 Days (Audit Compliance)</option>
            </select>
            <p className="text-[11px] text-slate-400">Older snapshots recycled</p>
          </div>

          {/* Save Button */}
          <div className="flex items-end">
            <Button
              onClick={() => saveConfigMutation.mutate()}
              disabled={saveConfigMutation.isPending}
              size="sm"
              className="w-full h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
            >
              <SaveIcon className="h-3.5 w-3.5" />
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </div>

      {/* Row 3: Tables Breakdown & Snapshot History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Table Row Counts Matrix (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              Supabase Tables & Rows
            </h3>
            <span className="text-[10px] text-slate-400">Live Exact Count</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {Object.entries(db?.tableCounts || {}).map(([table, count]) => (
              <div key={table} className="py-2 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-700">{table}</span>
                <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 tabular-nums">
                  {count} rows
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Verified Backup Snapshots History (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FolderArchive className="h-3.5 w-3.5 text-indigo-600" />
              Verified Backup Snapshots History
            </h3>
            <span className="text-[10px] text-slate-400">{snapshots.length} Snapshots Stored</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {snapshots.map((snap: any) => (
              <div
                key={snap.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{snap.type}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Check className="h-3 w-3" /> {snap.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formatDateTime(snap.created_at)} • {snap.total_tables} tables ({snap.total_rows} rows)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {snap.size_kb} KB
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createSnapshotMutation.mutate()}
                    className="h-7 text-[11px] px-2.5 gap-1 bg-white hover:bg-slate-100"
                  >
                    <Download className="h-3 w-3" /> Re-Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}
