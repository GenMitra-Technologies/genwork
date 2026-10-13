// src/features/courses/components/CourseCard.tsx
import React from 'react';
import { BookOpen, Video, CheckCircle2, Clock, Star, Play, Award } from 'lucide-react';
import { Course, CourseEnrollmentRecord } from '../../../types/courses';
import { cn } from '../../../lib/utils';

interface CourseCardProps {
  course: Course;
  enrollment?: CourseEnrollmentRecord;
  onSelect: (course: Course) => void;
}

export function CourseCard({ course, enrollment, onSelect }: CourseCardProps) {
  const isStarted = enrollment && enrollment.status !== 'not_started';
  const isCompleted = enrollment?.status === 'completed';
  const progressPercent = enrollment?.progress_percentage || 0;
  const isReviewed = enrollment?.review_submitted || false;

  return (
    <div
      onClick={() => onSelect(course)}
      className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md overflow-hidden shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Course Thumbnail Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          {/* Category Pill */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-2xs">
              {course.category}
            </span>
          </div>

          {/* Module Count */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/70 backdrop-blur-md text-white border border-white/10">
            <Video className="h-3 w-3 text-indigo-400" />
            <span>{course.modules?.length || 0} Modules</span>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-12 w-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="h-5 w-5 ml-0.5 fill-white" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
              <Award className="h-3 w-3" /> Mentor: {course.mentor_name}
            </span>

            {course.average_rating ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {course.average_rating} ({course.review_count || 0})
              </span>
            ) : null}
          </div>

          <h3 className="text-sm font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {course.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Progress & Status Footer */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium pt-2">
          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 text-[10px] font-semibold">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Completed
              </span>
            ) : isStarted ? (
              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60 text-[10px] font-semibold">
                <Clock className="h-3 w-3 text-indigo-600" /> In Progress
              </span>
            ) : (
              <span className="text-slate-400 text-[10px]">Not Started</span>
            )}

            {isReviewed && (
              <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60 text-[10px] font-semibold">
                <Star className="h-2.5 w-2.5 fill-amber-400" /> Reviewed
              </span>
            )}
          </div>

          <span className="font-bold text-slate-700 text-xs">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCompleted ? 'bg-emerald-500' : progressPercent > 0 ? 'bg-indigo-600' : 'bg-transparent'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
