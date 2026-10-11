// src/lib/formatters.ts
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return 'Invalid Date';
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  } catch {
    return 'Invalid Date';
  }
}

export function formatTimeTaken(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatTimeRemaining(dueDateString: string | null | undefined): {
  text: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  if (!dueDateString) return { text: 'No due date', isOverdue: false, isUrgent: false };
  try {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const overdue = isPast(dueDate);
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isUrgent = !overdue && diffHours <= 24;
    const distance = formatDistanceToNow(dueDate, { addSuffix: true });
    return {
      text: overdue ? `Overdue (${distance})` : `Due ${distance}`,
      isOverdue: overdue,
      isUrgent,
    };
  } catch {
    return { text: '—', isOverdue: false, isUrgent: false };
  }
}
