// src/components/shared/StatusBadge.tsx
import { TaskStatus } from '../../types/database.types';
import { STATUS_META } from '../../types/domain';
import { cn } from '../../lib/utils';

export function StatusBadge({
  status,
  isOverdue = false,
  className,
}: {
  status: TaskStatus;
  isOverdue?: boolean;
  className?: string;
}) {
  const meta = isOverdue ? STATUS_META.overdue : STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors',
        meta.badgeClass,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}
