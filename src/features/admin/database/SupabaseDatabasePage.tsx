// src/features/admin/database/SupabaseDatabasePage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Database,
  Cloud,
  Layers,
  Activity,
  Server,
  RefreshCw,
  HardDrive,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Table,
} from 'lucide-react';
import { adminApi } from '../api';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

export function SupabaseDatabasePage() {
  const { data: telemetry, isLoading, refetch } = useQuery({
    queryKey: ['admin-backup-telemetry'],
    queryFn: () => adminApi.getSupabaseStorageAndTelemetry(),
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const db = telemetry?.database;
  const storage = telemetry?.storage;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            Supabase Database & Storage Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live PostgreSQL instance telemetry, Supabase storage bucket utilization, table schemas, and health status.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-8 text-xs gap-1.5 bg-white text-slate-700 shadow-2xs"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          Refresh Metrics
        </Button>
      </div>

      {/* Row 1: Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: File Storage Buckets (1 GB Limit) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-indigo-500" />
              File Storage (Buckets)
            </span>
            <span className="text-[11px] font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
              1 GB Quota
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {storage ? formatBytes(storage.estimatedStorageSizeBytes) : '0 Bytes'}
              </span>
              <span className="text-xs text-slate-500">
                of 1.00 GB (1,024 MB)
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${Math.max(1, storage?.storageUsagePercentage || 0.1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{storage?.storageUsagePercentage?.toFixed(2) || '0.01'}% Used</span>
              <span>{(100 - (storage?.storageUsagePercentage || 0)).toFixed(2)}% Available</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Media Objects</span>
              <p className="font-semibold text-slate-800">{storage?.storageObjectCount || 0} files</p>
            </div>
            <div>
              <span className="text-slate-400">Buckets</span>
              <p className="font-semibold text-slate-800">3 Configured</p>
            </div>
          </div>
        </div>

        {/* Card 2: PostgreSQL Database Tables (500 MB Limit) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-blue-500" />
              PostgreSQL Database
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              500 MB Quota
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {db ? formatBytes(db.estimatedDbSizeBytes) : 'Calculating...'}
              </span>
              <span className="text-xs text-slate-500">
                of 500 MB
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.max(1, db?.dbUsagePercentage || 0.1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{db?.dbUsagePercentage?.toFixed(2) || '0.02'}% Used</span>
              <span>{db?.totalRows || 0} indexed rows</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Active Tables</span>
              <p className="font-semibold text-slate-800">14 Schemas</p>
            </div>
            <div>
              <span className="text-slate-400">Engine</span>
              <p className="font-semibold text-slate-800">PostgreSQL 15</p>
            </div>
          </div>
        </div>

        {/* Card 3: Combined Free Allocation (1.5 GB Total) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-emerald-600" />
              Combined Free Tier
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              1.5 GB Total
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {storage ? formatBytes(storage.totalUsedBytes) : 'Calculating...'}
              </span>
              <span className="text-xs text-slate-500">
                of 1,536 MB (1.5 GB)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              500 MB (PostgreSQL relational data) + 1 GB (S3 object storage).
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Cloud Region</span>
              <p className="font-semibold text-slate-800">ap-south-1 (Mumbai)</p>
            </div>
            <div>
              <span className="text-slate-400">Connection Mode</span>
              <p className="font-semibold text-emerald-700">Transaction Pooler</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Table Breakdown & Storage Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Table Schema Row Counts (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Table className="h-3.5 w-3.5 text-indigo-600" />
              Database Tables & Record Metrics
            </h3>
            <span className="text-[10px] text-slate-400">Exact live rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Table Name</th>
                  <th className="py-2 px-3">Purpose</th>
                  <th className="py-2 px-3 text-right">Row Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {Object.entries(db?.tableCounts || {}).map(([table, count]) => (
                  <tr key={table} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{table}</td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-500">
                      {getTableDescription(table)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage Buckets & Engine Status (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-indigo-600" />
              Storage Buckets & Media Assets
            </h3>
            <span className="text-[10px] text-slate-400">S3 Compliant</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">avatars / profile-pictures</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold border border-indigo-200">
                  Public Bucket
                </span>
              </div>
              <p className="text-[11px] text-slate-500">User profile photos, avatars, and icons.</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">task-deliverables</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                  Private Bucket
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Intern milestone deliverables, attachments, and docs.</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">database-snapshots</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                  Secured Bucket
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Automated JSON and SQL database dump archives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTableDescription(tbl: string): string {
  switch (tbl) {
    case 'profiles':
      return 'User account identities, emails, roles & auth links';
    case 'internships':
      return 'Cohort batches, cycles, and timeline durations';
    case 'mentors':
      return 'Supervisor records, departments, and bios';
    case 'interns':
      return 'Intern roster, track assignments, and streak stats';
    case 'tasks':
      return 'Curriculum tasks, instructions & milestones';
    case 'task_assignments':
      return 'Intern-task allocation mapping and lifecycle state';
    case 'task_submissions':
      return 'Deliverable submissions with GitHub & deployment links';
    case 'reviews':
      return 'Mentor evaluation records, ratings, and feedback';
    case 'assignments':
      return 'Coursework modules, challenges, and quizzes';
    case 'assignment_recipients':
      return 'Assignment distribution and completion state';
    case 'attendance_records':
      return 'Daily shift clock-ins, breaks, and standup notes';
    case 'notifications':
      return 'Realtime push notifications and read states';
    case 'announcements':
      return 'Cross-role broadcast alerts and platform news';
    case 'activity_logs':
      return 'Immutable audit logs and administrative events';
    default:
      return 'Relational system table';
  }
}
