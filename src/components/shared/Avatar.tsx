// src/components/shared/Avatar.tsx
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Avatar({
  src,
  name,
  className,
  size = 'md',
}: {
  src?: string | null;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-[72px] w-[72px] text-xl',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
    '2xl': 'h-8 w-8',
  };

  const initials = name
    .replace(/[()]/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // If the src is from dicebear cartoon / emoji avataaars generator, ignore it so we render clean professional initials
  const isCartoonGenerator =
    typeof src === 'string' &&
    (src.includes('dicebear.com') || src.includes('avataaars') || src.includes('bottts'));

  const validSrc = !isCartoonGenerator && src ? src : null;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-semibold text-slate-700 border border-slate-200 select-none',
        sizeClasses[size],
        className
      )}
    >
      {validSrc ? (
        <img src={validSrc} alt={name} className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="font-medium tracking-tight text-[11px] sm:text-xs text-slate-700">{initials}</span>
      ) : (
        <User className={cn('text-slate-400', iconSizes[size])} />
      )}
    </div>
  );
}
