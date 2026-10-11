// src/components/shared/PriorityBadge.tsx
import { PriorityLevel } from '../../types/database.types';
import { PRIORITY_META } from '../../types/domain';
import { cn } from '../../lib/utils';

export function PriorityBadge({
  priority,
  className,
}: {
  priority: PriorityLevel;
  className?: string;
}) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider',
        meta.badgeClass,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
