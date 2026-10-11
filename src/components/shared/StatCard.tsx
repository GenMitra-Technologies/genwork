// src/components/shared/StatCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ChevronRight } from 'lucide-react';
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
        'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'hover:-translate-y-0.5 hover:shadow-md shadow-sm',
        isRedAlert
          ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
          : isOrangeAlert
          ? 'bg-orange-50/70 border-orange-200 hover:border-orange-300'
          : 'bg-white border-slate-200/90 hover:border-slate-300',
        className
      )}
    >
      {/* Top Row: 13px sentence case label + 36px rounded-lg tinted icon square */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-[13px] font-medium leading-tight',
            isRedAlert ? 'text-rose-800' : isOrangeAlert ? 'text-orange-800' : 'text-slate-500'
          )}
        >
          {title}
        </span>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
            isRedAlert ? 'bg-rose-100 text-rose-700' : isOrangeAlert ? 'bg-orange-100 text-orange-700' : cn(iconBg, iconColor)
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Bottom Row: 28px semibold tabular-nums + subtle chevron on hover */}
      <div className="mt-4 flex items-end justify-between">
        <span
          className={cn(
            'text-[28px] font-semibold tracking-tight leading-none tabular-nums',
            isRedAlert ? 'text-rose-900' : isOrangeAlert ? 'text-orange-950' : 'text-slate-900'
          )}
        >
          {value}
        </span>
        <ChevronRight
          className={cn(
            'h-4 w-4 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0',
            isRedAlert ? 'text-rose-600' : isOrangeAlert ? 'text-orange-600' : 'text-slate-400'
          )}
        />
      </div>
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm animate-pulse min-h-[104px]">
      <div className="flex items-start justify-between">
        <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
        <div className="h-9 w-9 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="mt-4 h-7 w-12 bg-slate-200 rounded"></div>
    </div>
  );
}
