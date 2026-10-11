// src/components/shared/Logo.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({
  className,
  imageClassName,
  showSubtitle = false,
  subtitle,
  size = 'md',
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <img
        src="/genmitra-logo.png"
        alt="Genmitra"
        className={cn('w-auto object-contain transition-all dark:invert dark:brightness-100', sizeClasses[size], imageClassName)}
      />
      {showSubtitle && subtitle && (
        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          {subtitle}
        </span>
      )}
    </div>
  );
}
