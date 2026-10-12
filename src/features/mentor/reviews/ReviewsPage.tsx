// src/features/mentor/reviews/ReviewsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Clock,
  User,
  AlertTriangle,
  Check,
  Sparkles,
} from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar } from '../../../components/shared/Avatar';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { formatDateTime, formatTimeTaken } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';

export function ReviewsPage() {
  const { profile } = useAuth();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'waiting' | 'all'>('waiting');

  // Dialog states
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'changes_requested' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['review-queue', mentorId],
    queryFn: () => mentorApi.getReviewQueue(mentorId),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubmission || !reviewAction) return;

      if (reviewAction === 'changes_requested' && !feedback.trim()) {
        throw new Error('Feedback comments are required when requesting revisions.');
      }

      await mentorApi.reviewSubmission(selectedSubmission.submission_id, {
        result: reviewAction,
        feedback: feedback.trim() || 'Approved. Great implementation!',
        required_changes: requiredChanges.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSelectedSubmission(null);
      setReviewAction(null);
      setFeedback('');
      setRequiredChanges('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'mentor'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit review');
    },
  });

  const openReviewModal = (sub: any, action: 'approved' | 'changes_requested') => {
    setSelectedSubmission(sub);
    setReviewAction(action);
    setFormError(null);
    if (action === 'approved') {
      setFeedback('Approved. Clean code architecture and meets all requirements.');
      setRequiredChanges('');
    } else {
      setFeedback('Revisions requested. Please review the comments below.');
      setRequiredChanges('');
    }
  };

  return (
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Glossy Header & Tabs */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Submissions Review Queue</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700">
              {queue.length} Pending
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Evaluate pull requests, verify deliverable URLs, and provide constructive feedback.
          </p>
        </div>

        {/* Glossy Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/80 border border-slate-200/60 text-xs">
          <button
            onClick={() => setActiveTab('waiting')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
              activeTab === 'waiting'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            Awaiting Review ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            All Submissions
          </button>
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
            No submissions awaiting review in your queue. All caught up!
          </div>
        ) : (
          queue.map((sub: any) => (
            <div
              key={sub.submission_id}
              className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5 hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={sub.intern_avatar}
                    name={sub.intern_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900">{sub.intern_name}</span>
                      <span className="text-[10px] text-slate-400">({sub.intern_email})</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
                        {sub.task_code}
                      </span>
                      <PriorityBadge priority={sub.task_priority} />
                    </div>
                    <h3 className="text-xs font-medium text-slate-800 mt-0.5 truncate">{sub.task_title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    Version {sub.version}
                  </span>
                </div>
              </div>

              {/* Deliverables Box */}
              <div className="rounded-lg bg-slate-50/70 border border-slate-200/60 p-2.5 space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-slate-700">Submitted Deliverables:</div>
                <div className="flex flex-wrap gap-3 font-mono text-[11px]">
                  {sub.github_url && (
                    <a
                      href={sub.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> GitHub Repo
                    </a>
                  )}
                  {sub.deployment_url && (
                    <a
                      href={sub.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Live Preview
                    </a>
                  )}
                  {sub.drive_url && (
                    <a
                      href={sub.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Drive Assets
                    </a>
                  )}
                </div>

                {sub.note && (
                  <p className="mt-1 text-slate-600 border-t border-slate-200/60 pt-1 text-[11px]">
                    <strong className="text-slate-700">Intern Note:</strong> {sub.note}
                  </p>
                )}
              </div>

              {/* Card Footer with actions */}
              <div className="flex flex-wrap items-center justify-between pt-1 text-xs gap-2">
                <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                  <span>Submitted {formatDateTime(sub.submitted_at)}</span>
                  {sub.time_taken_seconds && (
                    <span>Time spent: {formatTimeTaken(sub.time_taken_seconds)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReviewModal(sub, 'changes_requested')}
                    className="h-7 px-2.5 text-xs rounded-lg text-orange-600 border-orange-200 hover:bg-orange-50 font-medium"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Request Changes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openReviewModal(sub, 'approved')}
                    className="h-7 px-2.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">
            {reviewAction === 'approved' ? 'Approve Task Submission' : 'Request Changes from Intern'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {selectedSubmission?.intern_name} • {selectedSubmission?.task_code} (Version {selectedSubmission?.version})
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 mb-2">
            {formError}
          </div>
        )}

        <div className="space-y-3 py-1">
          {/* Quick Feedback Preset Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500">Quick Templates:</span>
            <div className="flex flex-wrap gap-1.5">
              {reviewAction === 'approved' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setFeedback('LGTM! Approved. Clean architecture and meets all requirements.')}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] transition-colors"
                  >
                    ✨ LGTM - Clean Arch
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback('Great implementation! Delivered on schedule with well-documented PR.')}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] transition-colors"
                  >
                    🚀 Great Implementation
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback('Approved with distinction. Comprehensive test coverage and zero regressions.')}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] transition-colors"
                  >
                    ⭐ High Distinction
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback('Please add unit tests and verify edge case handling before resubmitting.');
                      setRequiredChanges('1. Add unit tests with >80% coverage\n2. Verify input validation');
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] transition-colors"
                  >
                    🧪 Add Unit Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback('Missing live deployment preview link. Please deploy on Vercel or Netlify.');
                      setRequiredChanges('1. Provide working deployment preview URL');
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] transition-colors"
                  >
                    🌐 Missing Deployment URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback('Code formatting and linting errors present. Please run eslint and format code.');
                      setRequiredChanges('1. Run npm run lint\n2. Clean up console logs');
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] transition-colors"
                  >
                    🧹 Fix Linting & Code Style
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Review Feedback <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback on what was done well or what requires revision..."
              rows={3}
              className="text-xs rounded-lg border-slate-200"
            />
          </div>

          {reviewAction === 'changes_requested' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Specific Required Changes
              </label>
              <Textarea
                value={requiredChanges}
                onChange={(e) => setRequiredChanges(e.target.value)}
                placeholder="Bullet points or exact checklist items the intern must address..."
                rows={2}
                className="text-xs rounded-lg border-slate-200"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubmission(null)}
            disabled={reviewMutation.isPending}
            className="h-8 text-xs rounded-lg"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            className={cn(
              'h-8 text-xs rounded-lg font-medium text-white',
              reviewAction === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-orange-600 hover:bg-orange-700'
            )}
          >
            {reviewMutation.isPending
              ? 'Submitting...'
              : reviewAction === 'approved'
              ? 'Confirm Approval'
              : 'Send Change Request'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
