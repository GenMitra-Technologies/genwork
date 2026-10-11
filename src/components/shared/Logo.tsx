// src/components/shared/Logo.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intervalMs?: number;
}

export function Logo({
  className,
  imageClassName,
  showSubtitle = false,
  subtitle,
  size = 'md',
  intervalMs = 3000,
}: LogoProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1 select-none', className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: '800px' }}
      >
        <div
          className="relative transition-transform duration-700 ease-in-out flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Logo: Genmitra */}
          <div
            className="flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <img
              src="/genmitra-logo.png"
              alt="Genmitra"
              className={cn(
                'w-auto object-contain transition-all dark:invert dark:brightness-100',
                sizeClasses[size],
                imageClassName
              )}
            />
          </div>

          {/* Back Logo: VNXV */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src="/vnxv-logo.png"
              alt="VNXV"
              className={cn(
                'w-auto object-contain transition-all dark:invert dark:brightness-100',
                sizeClasses[size],
                imageClassName
              )}
            />
          </div>
        </div>
      </div>

      {showSubtitle && subtitle && (
        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          {subtitle}
        </span>
      )}
    </div>
  );
}
