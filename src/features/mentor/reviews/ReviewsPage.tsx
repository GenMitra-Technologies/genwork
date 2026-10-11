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
} from 'lucide-react';
import { mentorApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { formatDateTime, formatTimeTaken } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'waiting' | 'all' | 'approved' | 'changes'>('waiting');

  // Dialog states
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'changes_requested' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['review-queue'],
    queryFn: () => mentorApi.getReviewQueue('10000000-0000-0000-0000-000000000001'),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Submissions Review Queue</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review deliverable links, inspect GitHub repositories, and provide constructive feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-2">
        <button
          onClick={() => setActiveTab('waiting')}
          className={cn(
            'px-3.5 py-2 text-xs font-medium rounded-lg transition-colors',
            activeTab === 'waiting'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          Waiting for Review ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-3.5 py-2 text-xs font-medium rounded-lg transition-colors',
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          All Submissions
        </button>
      </div>

      {/* Queue Cards */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No submissions awaiting review in your queue.
          </div>
        ) : (
          queue.map((sub: any) => (
            <div
              key={sub.submission_id}
              className="rounded-xl border bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <Avatar
                    src={sub.intern_avatar}
                    name={sub.intern_name}
                    size="md"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{sub.intern_name}</span>
                      <span className="text-xs text-muted-foreground">({sub.intern_email})</span>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                        {sub.task_code}
                      </span>
                      <PriorityBadge priority={sub.task_priority} />
                    </div>
                    <h3 className="text-base font-medium text-foreground">{sub.task_title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Version {sub.version}
                  </span>
                </div>
              </div>

              {/* Links to deliverables (with rel="noopener noreferrer") */}
              <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-xs">
                <div className="font-semibold text-foreground">Submitted Deliverables:</div>
                <div className="flex flex-wrap gap-4 pt-1 font-mono">
                  {sub.github_url && (
                    <a
                      href={sub.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {sub.github_url}
                    </a>
                  )}
                  {sub.deployment_url && (
                    <a
                      href={sub.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {sub.deployment_url}
                    </a>
                  )}
                  {sub.drive_url && (
                    <a
                      href={sub.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {sub.drive_url}
                    </a>
                  )}
                </div>

                {sub.note && (
                  <p className="mt-2 text-muted-foreground border-t border-border/50 pt-2 text-[11px]">
                    <strong>Intern Note:</strong> {sub.note}
                  </p>
                )}
              </div>

              {/* Card Footer with actions */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t text-xs gap-3">
                <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
                  <span>Submitted {formatDateTime(sub.submitted_at)}</span>
                  {sub.time_taken_seconds && (
                    <span>Time taken: {formatTimeTaken(sub.time_taken_seconds)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReviewModal(sub, 'changes_requested')}
                    className="gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Request Changes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openReviewModal(sub, 'approved')}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Task
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
          <DialogTitle>
            {reviewAction === 'approved' ? 'Approve Task Submission' : 'Request Changes from Intern'}
          </DialogTitle>
          <DialogDescription>
            {selectedSubmission?.intern_name} • {selectedSubmission?.task_code} (Version {selectedSubmission?.version})
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-3">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Review Feedback <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback on what was done well or what requires revision..."
              rows={3}
            />
          </div>

          {reviewAction === 'changes_requested' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Specific Required Changes
              </label>
              <Textarea
                value={requiredChanges}
                onChange={(e) => setRequiredChanges(e.target.value)}
                placeholder="Bullet points or exact checklist items the intern must address..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSelectedSubmission(null)}
            disabled={reviewMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            className={
              reviewAction === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }
          >
            {reviewMutation.isPending
              ? 'Submitting Review...'
              : reviewAction === 'approved'
              ? 'Confirm Approval'
              : 'Send Change Request'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
