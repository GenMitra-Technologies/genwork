// src/features/courses/intern/InternCourseLearnPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  Sparkles,
  Layers,
  Star,
  Check,
  Share2,
} from 'lucide-react';
import { coursesApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { CourseProgressButtons } from '../components/CourseProgressButtons';
import { CourseReviewModal } from '../components/CourseReviewModal';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { SubmitReviewInput } from '../../../types/courses';

export function InternCourseLearnPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const internId = profile?.intern_id || profile?.id || '20000000-0000-0000-0000-000000000001';
  const internName = profile?.full_name || 'Intern';

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Course details
  const {
    data: course,
    isLoading: isCourseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => (courseId ? coursesApi.getCourseById(courseId) : null),
    enabled: !!courseId,
  });

  // Fetch Intern's progress on this course
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['courseProgress', courseId, internId],
    queryFn: () => (courseId ? coursesApi.getInternCourseProgress(courseId, internId) : null),
    enabled: !!courseId && !!internId,
  });

  const activeModule = course?.modules?.[activeModuleIndex] || course?.modules?.[0];
  const activeModuleId = activeModule?.id || '';

  const activeModProgress = progressData?.moduleProgress?.[activeModuleId];
  const isStarted = !!activeModProgress?.started;
  const isCompleted = !!activeModProgress?.completed;
  const enrollment = progressData?.enrollment;
  const isCourseCompleted =
    (enrollment?.status === 'completed' || enrollment?.progress_percentage === 100) &&
    (course?.modules?.length || 0) > 0;
  const isReviewSubmitted = !!enrollment?.review_submitted || !!progressData?.review;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Mutation 1: Start Module
  const startMutation = useMutation({
    mutationFn: () => coursesApi.markModuleStarted(courseId!, activeModuleId, { id: internId, name: internName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId, internId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showToast('Module marked as Started. Your mentor has been notified.');
    },
  });

  // Mutation 2: Complete Module
  const completeMutation = useMutation({
    mutationFn: () => coursesApi.markModuleCompleted(courseId!, activeModuleId, { id: internId, name: internName }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId, internId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (data.isCourseFinished) {
        showToast('🎉 Course Complete! Review is now unlocked.');
      } else {
        showToast('Module completed! Keep going to finish the course.');
      }
    },
  });

  // Mutation 3: Submit Review
  const reviewMutation = useMutation({
    mutationFn: (data: SubmitReviewInput) =>
      coursesApi.submitCourseReview(data, {
        id: internId,
        name: internName,
        avatar: profile?.avatar_url || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId, internId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showToast('Review submitted successfully! Thank you for your feedback.');
    },
  });

  if (isCourseLoading) {
    return (
      <div className="max-w-[1280px] mx-auto py-10 space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 aspect-video bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course || courseError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Course Not Found</h2>
        <p className="text-xs text-slate-500">The requested course could not be loaded or may have been unpublished.</p>
        <Button onClick={() => navigate('/intern/courses')} variant="outline" size="sm">
          Back to Courses
        </Button>
      </div>
    );
  }

  const completedModulesCount = enrollment?.completed_modules?.length || 0;
  const totalModulesCount = course.modules?.length || 0;
  const progressPercent = enrollment?.progress_percentage || 0;

  return (
    <div className="space-y-5 max-w-[1300px] mx-auto pb-10">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/intern/courses')}
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Courses Catalog</span>
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-slate-500 truncate max-w-xs sm:max-w-md">{course.title}</span>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-xs shadow-2xs">
            <span className="text-slate-500">Course Progress:</span>
            <span className="font-bold text-indigo-600">{progressPercent}%</span>
            <span className="text-slate-400">
              ({completedModulesCount}/{totalModulesCount} completed)
            </span>
          </div>
          {isCourseCompleted && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Learning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Player & Active Module Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* YouTube Video Player (Official embed, distraction free) */}
          {activeModule ? (
            <div className="space-y-3">
              <YouTubePlayer
                videoId={activeModule.youtube_video_id}
                title={activeModule.title}
                thumbnailUrl={activeModule.thumbnail_url}
              />

              {/* Exact 3 Progress Action Buttons */}
              <CourseProgressButtons
                isStarted={isStarted}
                isCompleted={isCompleted}
                isCourseCompleted={isCourseCompleted}
                isReviewSubmitted={isReviewSubmitted}
                onStart={() => startMutation.mutate()}
                onComplete={() => completeMutation.mutate()}
                onOpenReview={() => setReviewModalOpen(true)}
                isLoading={startMutation.isPending || completeMutation.isPending}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No modules uploaded for this course yet.
            </div>
          )}

          {/* Active Module Meta & Objectives */}
          {activeModule && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Module {activeModuleIndex + 1} of {totalModulesCount}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{activeModule.title}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  ) : isStarted ? (
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 flex items-center gap-1">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      In Progress
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      Not Started
                    </span>
                  )}
                </div>
              </div>

              {/* Module Learning Objectives */}
              {activeModule.learning_objectives && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                    Module Learning Objectives
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {activeModule.learning_objectives}
                  </p>
                </div>
              )}

              {/* Course Overview & Mentor Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Course Overview</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span>
                      Mentor: <strong className="text-slate-700">{course.mentor_name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>
                      Category: <strong className="text-slate-700">{course.category}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submitted Review Snapshot if available */}
          {progressData?.review && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <h4 className="text-xs font-bold text-amber-950">Your Submitted Course Review</h4>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-3.5 w-3.5',
                        star <= progressData.review!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      )}
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-900 ml-1">({progressData.review.rating}/5)</span>
                </div>
              </div>

              <p className="text-xs text-amber-900/90 leading-relaxed italic bg-white/70 p-3 rounded-xl border border-amber-200/50">
                "{progressData.review.overall_feedback}"
              </p>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalOpen(true)}
                  className="h-7 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                >
                  View Full Review Answers
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Playlist / Modules Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Course Syllabus & Videos</h3>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {totalModulesCount} {totalModulesCount === 1 ? 'Module' : 'Modules'}
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Completion Status</span>
                <span className="font-bold text-slate-700">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Module Items List */}
            <div className="space-y-2 pt-1 max-h-[520px] overflow-y-auto pr-1">
              {course.modules?.map((mod, index) => {
                const isCurrent = index === activeModuleIndex;
                const modProgress = progressData?.moduleProgress?.[mod.id];
                const modCompleted = !!modProgress?.completed;
                const modStarted = !!modProgress?.started;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModuleIndex(index)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 relative group',
                      isCurrent
                        ? 'border-indigo-400 bg-indigo-50/70 shadow-2xs'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    )}
                  >
                    {/* Index / Status Icon */}
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 transition-colors',
                        modCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}
                    >
                      {modCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>

                    {/* Module Title & Duration */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Part {index + 1}
                        </span>
                        {modCompleted && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            Completed
                          </span>
                        )}
                        {!modCompleted && modStarted && (
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            Started
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-xs font-semibold line-clamp-2 leading-snug',
                          isCurrent ? 'text-indigo-950 font-bold' : 'text-slate-800'
                        )}
                      >
                        {mod.title}
                      </p>
                    </div>

                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform mt-2',
                        isCurrent ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Review Prompt Card */}
          {isCourseCompleted && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-950">Course Fully Completed!</h4>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {isReviewSubmitted
                  ? 'Your course review has been registered and verified by your mentor.'
                  : 'Submit your course review to share feedback and verify your learning milestones.'}
              </p>
              <Button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                {isReviewSubmitted ? 'View Submitted Review' : '★ Write Course Review'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <CourseReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        courseTitle={course.title}
        courseId={course.id}
        existingReview={progressData?.review}
        onSubmitReview={async (data) => {
          await reviewMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
