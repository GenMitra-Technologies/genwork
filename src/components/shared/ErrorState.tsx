// src/components/shared/ErrorState.tsx
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data.',
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center',
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-destructive">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
