// src/components/shared/EmptyState.tsx
import { ReactNode } from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No items found',
  description = 'There are no items matching your criteria at this moment.',
  action,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/50',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
        <Icon className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
