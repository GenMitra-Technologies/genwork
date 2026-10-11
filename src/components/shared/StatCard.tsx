// src/components/shared/StatCard.tsx
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  to,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  to?: string;
  trend?: { text: string; positive?: boolean };
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        'group relative rounded-xl border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40',
        to && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trend.text}
          </span>
        )}
      </div>

      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
