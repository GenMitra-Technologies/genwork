// src/components/shared/StatCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  to: string;
  iconBg?: string;
  iconColor?: string;
  variant?: 'default' | 'overdue' | 'changes';
  isAlert?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  to,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-600',
  variant = 'default',
  isAlert = false,
  className,
}: StatCardProps) {
  const numVal = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;

  // Overdue turns red-tinted ONLY when count > 0; Changes requested turns orange-tinted when count > 0
  const isRedAlert = variant === 'overdue' && numVal > 0;
  const isOrangeAlert = variant === 'changes' && numVal > 0;

  return (
    <Link
      to={to}
      className={cn(
        'group relative flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-2xs hover:shadow-xs',
        isRedAlert
          ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
          : isOrangeAlert
          ? 'bg-orange-50/70 border-orange-200 hover:border-orange-300'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60',
        className
      )}
    >
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <span
          className={cn(
            'text-[11px] sm:text-xs font-medium leading-tight truncate',
            isRedAlert
              ? 'text-rose-700 font-semibold'
              : isOrangeAlert
              ? 'text-orange-700 font-semibold'
              : 'text-slate-500'
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'mt-1 text-lg sm:text-xl font-bold tracking-tight leading-none tabular-nums',
            isRedAlert
              ? 'text-rose-900'
              : isOrangeAlert
              ? 'text-orange-950'
              : 'text-slate-900'
          )}
        >
          {value}
        </span>
      </div>

      <div
        className={cn(
          'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
          isRedAlert
            ? 'bg-rose-100 text-rose-700'
            : isOrangeAlert
            ? 'bg-orange-100 text-orange-700'
            : cn(iconBg, iconColor)
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs animate-pulse min-h-[52px]">
      <div className="space-y-1.5 min-w-0 flex-1 pr-2">
        <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
        <div className="h-4.5 w-8 bg-slate-200 rounded"></div>
      </div>
      <div className="h-7 w-7 sm:h-8 sm:w-8 bg-slate-200 rounded-lg shrink-0"></div>
    </div>
  );
}
