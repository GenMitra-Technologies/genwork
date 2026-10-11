// src/components/shared/SkeletonCard.tsx
import { cn } from '../../lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl border bg-card p-5 space-y-3', className)}>
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-5 w-16 bg-muted rounded-full"></div>
      </div>
      <div className="h-5 w-3/4 bg-muted rounded"></div>
      <div className="h-4 w-full bg-muted rounded"></div>
      <div className="h-4 w-1/2 bg-muted rounded"></div>
      <div className="pt-2 flex justify-between">
        <div className="h-4 w-20 bg-muted rounded"></div>
        <div className="h-4 w-20 bg-muted rounded"></div>
      </div>
    </div>
  );
}
