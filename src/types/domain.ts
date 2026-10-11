// src/types/domain.ts
import { TaskStatus, PriorityLevel, UserRole, AccountStatus } from './database.types';
import {
  Clock,
  Play,
  Upload,
  Hourglass,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Archive,
  LucideIcon,
} from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  status: AccountStatus;
  must_change_password: boolean;
  intern_id?: string;
  mentor_id?: string;
}

export interface StatusMeta {
  label: string;
  badgeClass: string;
  bgLight: string;
  icon: LucideIcon;
}

export const STATUS_META: Record<TaskStatus | 'overdue', StatusMeta> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    bgLight: 'bg-zinc-50 dark:bg-zinc-900',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    bgLight: 'bg-zinc-50 dark:bg-zinc-900',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    bgLight: 'bg-blue-50/50 dark:bg-blue-950/30',
    icon: Play,
  },
  submitted: {
    label: 'Submitted',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    bgLight: 'bg-indigo-50/50 dark:bg-indigo-950/30',
    icon: Upload,
  },
  waiting_for_review: {
    label: 'Waiting for Review',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    bgLight: 'bg-amber-50/50 dark:bg-amber-950/30',
    icon: Hourglass,
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    bgLight: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    icon: CheckCircle2,
  },
  changes_requested: {
    label: 'Changes Requested',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    bgLight: 'bg-orange-50/50 dark:bg-orange-950/30',
    icon: RotateCcw,
  },
  resubmitted: {
    label: 'Resubmitted',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    bgLight: 'bg-purple-50/50 dark:bg-purple-950/30',
    icon: Upload,
  },
  archived: {
    label: 'Archived',
    badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500',
    bgLight: 'bg-zinc-50 dark:bg-zinc-950',
    icon: Archive,
  },
  overdue: {
    label: 'Overdue',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    bgLight: 'bg-rose-50/50 dark:bg-rose-950/30',
    icon: AlertTriangle,
  },
};

export const PRIORITY_META: Record<PriorityLevel, { label: string; badgeClass: string }> = {
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 font-semibold',
  },
};
