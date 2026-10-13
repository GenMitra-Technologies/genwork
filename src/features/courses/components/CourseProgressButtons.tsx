// src/features/courses/components/CourseProgressButtons.tsx
import React from 'react';
import { Play, CheckCircle2, Star, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

interface CourseProgressButtonsProps {
  isStarted: boolean;
  isCompleted: boolean;
  isCourseCompleted: boolean;
  isReviewSubmitted: boolean;
  onStart: () => void;
  onComplete: () => void;
  onOpenReview: () => void;
  isLoading?: boolean;
}

export function CourseProgressButtons({
  isStarted,
  isCompleted,
  isCourseCompleted,
  isReviewSubmitted,
  onStart,
  onComplete,
  onOpenReview,
  isLoading = false,
}: CourseProgressButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
      {/* 1. Started Action */}
      <Button
        type="button"
        variant={isStarted ? 'default' : 'outline'}
        onClick={onStart}
        disabled={isLoading || isStarted}
        className={cn(
          'flex-1 h-9 text-xs font-semibold rounded-lg gap-2 transition-all min-h-[38px] justify-center',
          isStarted
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
            : 'hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 text-slate-700'
        )}
      >
        {isStarted ? (
          <>
            <Check className="h-4 w-4 text-white" />
            <span>Started</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            <span>▶ Started</span>
          </>
        )}
      </Button>

      {/* 2. Completed Action */}
      <Button
        type="button"
        variant={isCompleted ? 'default' : 'outline'}
        onClick={onComplete}
        disabled={isLoading || isCompleted}
        className={cn(
          'flex-1 h-9 text-xs font-semibold rounded-lg gap-2 transition-all min-h-[38px] justify-center',
          isCompleted
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-2xs'
            : 'hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 text-slate-700'
        )}
      >
        <CheckCircle2 className={cn('h-4 w-4', isCompleted ? 'text-white' : 'text-slate-500')} />
        <span>{isCompleted ? '✓ Completed' : '✓ Completed'}</span>
      </Button>

      {/* 3. Review Action (Unlocked after course completion) */}
      <Button
        type="button"
        variant={isReviewSubmitted ? 'default' : isCourseCompleted ? 'outline' : 'ghost'}
        onClick={onOpenReview}
        disabled={isLoading || !isCourseCompleted}
        className={cn(
          'flex-1 h-9 text-xs font-semibold rounded-lg gap-2 transition-all min-h-[38px] justify-center',
          isReviewSubmitted
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
            : isCourseCompleted
            ? 'border-amber-300 bg-amber-50/80 text-amber-800 hover:bg-amber-100 hover:border-amber-400'
            : 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50'
        )}
        title={!isCourseCompleted ? 'Complete all modules in this course to unlock review' : ''}
      >
        <Star className={cn('h-4 w-4', isReviewSubmitted ? 'fill-white text-white' : 'text-amber-500')} />
        <span>
          {isReviewSubmitted ? '★ Review Submitted' : isCourseCompleted ? '★ Write Review' : '★ Review (Locked)'}
        </span>
      </Button>
    </div>
  );
}
