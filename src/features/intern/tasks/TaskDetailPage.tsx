// src/features/intern/tasks/TaskDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Play,
  Upload,
  Calendar,
  User,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { internApi } from '../api';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Timeline, TimelineEventItem } from '../../../components/shared/Timeline';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { submitTaskSchema, SubmitTaskInput } from '../../../lib/validators';
import { formatDateTime, formatTimeTaken, formatTimeRemaining } from '../../../lib/formatters';

export function TaskDetailPage() {
  const { code } = useParams<{ code: string }>();
  const queryClient = useQueryClient();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Fetch Task
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', code],
    queryFn: () => internApi.getTaskDetail(code || ''),
    enabled: !!code,
  });

  // 2. Fetch Task Assignment for David
  const taskObj = task as any;
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['task-assignment', taskObj?.id],
    queryFn: () => internApi.getTaskAssignment(taskObj?.id || '', '20000000-0000-0000-0000-000000000001'),
    enabled: !!taskObj?.id,
  });

  const assignmentObj = assignment as any;

  // 3. Fetch Submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ['task-submissions', assignmentObj?.id],
    queryFn: () => internApi.getSubmissions(assignmentObj?.id || ''),
    enabled: !!assignmentObj?.id,
  });

  // 4. Fetch Timeline Events
  const { data: rawEvents = [] } = useQuery({
    queryKey: ['task-events', assignmentObj?.id],
    queryFn: () => internApi.getTaskEvents(assignmentObj?.id || ''),
    enabled: !!assignmentObj?.id,
  });

  // Form for submission
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitTaskInput>({
    resolver: zodResolver(submitTaskSchema),
    defaultValues: {
      github_url: 'https://github.com/internship-demo/project-repo',
      deployment_url: 'https://demo-preview.vercel.app',
      drive_url: 'https://drive.google.com/file/d/spec-demo',
      note: 'Here is my completed work meeting all the acceptance criteria.',
    },
  });

  // Start Task Mutation
  const startTaskMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentObj?.id) return;
      await internApi.startTask(assignmentObj.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignment', taskObj?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-events', assignmentObj?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to start task');
    },
  });

  // Submit Task Mutation
  const submitTaskMutation = useMutation({
    mutationFn: async (data: SubmitTaskInput) => {
      if (!assignmentObj?.id) return;
      await internApi.submitTask(assignmentObj.id, data);
    },
    onSuccess: () => {
      setSubmitDialogOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['task-assignment', taskObj?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-submissions', assignmentObj?.id] });
      queryClient.invalidateQueries({ queryKey: ['task-events', assignmentObj?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Submission failed');
    },
  });

  if (taskLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading task details...</div>;
  }

  if (!taskObj) {
    return <div className="p-8 text-center text-sm text-destructive">Task not found.</div>;
  }

  const currentStatus = assignmentObj?.status || 'pending';
  const hasStarted = assignmentObj?.started_at !== null && assignmentObj?.started_at !== undefined;
  const canStart = currentStatus === 'pending' && !hasStarted;
  const canSubmit = currentStatus === 'in_progress' || currentStatus === 'changes_requested';
  const isWaitingReview = currentStatus === 'waiting_for_review';
  const isApproved = currentStatus === 'approved';

  // Latest review if changes requested
  const latestSubmission = (submissions as any[])[0];
  const latestReview = latestSubmission?.review?.[0] || latestSubmission?.review;

  const events: TimelineEventItem[] = rawEvents.map((e: any) => ({
    id: e.id,
    eventType: e.event_type,
    actorName: e.actor?.full_name,
    fromStatus: e.from_status,
    toStatus: e.to_status,
    metadata: e.metadata,
    createdAt: e.created_at,
  }));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/intern/tasks"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to tasks
        </Link>
        <StatusBadge status={currentStatus} />
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold">×</button>
        </div>
      )}

      {/* Main Task Header */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{taskObj.code}</span>
              <PriorityBadge priority={taskObj.priority || 'medium'} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{taskObj.title}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {canStart && (
              <Button
                onClick={() => startTaskMutation.mutate()}
                disabled={startTaskMutation.isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="h-4 w-4" /> Start Task
              </Button>
            )}

            {canSubmit && (
              <Button
                onClick={() => setSubmitDialogOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="h-4 w-4" />
                {currentStatus === 'changes_requested' ? 'Resubmit Task' : 'Submit Task'}
              </Button>
            )}

            {isWaitingReview && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20">
                <Clock className="h-4 w-4 animate-spin text-amber-600" /> Waiting for Mentor Review
              </div>
            )}

            {isApproved && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Task Approved
              </div>
            )}
          </div>
        </div>

        {/* Requirements Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          <span className="text-muted-foreground font-medium">Deliverables required:</span>
          {taskObj.require_github && (
            <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              📦 GitHub Repository (https://github.com/...)
            </span>
          )}
          {taskObj.require_deployment && (
            <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              🚀 Live Deployment URL (https://...)
            </span>
          )}
          {taskObj.require_drive && (
            <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
              📁 Google Drive Spec (https://drive.google.com/...)
            </span>
          )}
        </div>

        {/* Timestamps Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Assigned Date</span>
            <span className="font-medium text-foreground">{formatDateTime(assignmentObj?.assigned_at)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Due Date</span>
            <span className="font-medium text-foreground">{formatDateTime(taskObj.due_date)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Started At</span>
            <span className="font-medium text-foreground">
              {assignmentObj?.started_at ? formatDateTime(assignmentObj.started_at) : 'Not started yet'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Review Mentor</span>
            <span className="font-medium text-foreground">{taskObj.mentor?.profile?.full_name || 'Alex Rivera'}</span>
          </div>
        </div>
      </div>

      {/* Changes Requested Banner */}
      {currentStatus === 'changes_requested' && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-300">
            <RotateCcw className="h-4 w-4 text-orange-600" /> Mentor Requested Changes
          </div>
          {latestReview && (
            <div className="text-xs space-y-1.5 pl-6">
              <p className="text-foreground">
                <strong>Feedback:</strong> {latestReview.feedback}
              </p>
              {latestReview.required_changes && (
                <p className="text-muted-foreground">
                  <strong>Required Revisions:</strong> {latestReview.required_changes}
                </p>
              )}
            </div>
          )}
          <div className="pl-6 pt-2">
            <Button
              size="sm"
              onClick={() => setSubmitDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" /> Submit Revision (v{(assignmentObj?.current_version || 1) + 1})
            </Button>
          </div>
        </div>
      )}

      {/* Grid: Description & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground">Task Overview & Instructions</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground/90 space-y-4">
              <div>
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed">{taskObj.description}</p>
              </div>

              {taskObj.instructions && (
                <div>
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1">
                    Instructions
                  </h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{taskObj.instructions}</p>
                </div>
              )}

              {taskObj.requirements && (
                <div>
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1">
                    Requirements
                  </h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{taskObj.requirements}</p>
                </div>
              )}

              {taskObj.expected_output && (
                <div>
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1">
                    Expected Output
                  </h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{taskObj.expected_output}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submission History */}
          <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Submission Versions ({submissions.length})
            </h2>

            {submissions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No submissions uploaded yet. Start the task and submit your links when ready.
              </p>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub: any) => {
                  const rev = sub.review?.[0] || sub.review;
                  return (
                    <div
                      key={sub.id}
                      className="rounded-lg border bg-muted/30 p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">
                          Version {sub.version}
                        </span>
                        <time className="text-muted-foreground text-[11px]">
                          Submitted {formatDateTime(sub.submitted_at)}
                        </time>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-1">
                        {sub.github_url && (
                          <a
                            href={sub.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <ExternalLink className="h-3 w-3" /> GitHub Repo
                          </a>
                        )}
                        {sub.deployment_url && (
                          <a
                            href={sub.deployment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <ExternalLink className="h-3 w-3" /> Live App
                          </a>
                        )}
                        {sub.drive_url && (
                          <a
                            href={sub.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <ExternalLink className="h-3 w-3" /> Drive Asset
                          </a>
                        )}
                        {sub.time_taken_seconds && (
                          <span className="text-muted-foreground ml-auto">
                            Time Taken: {formatTimeTaken(sub.time_taken_seconds)}
                          </span>
                        )}
                      </div>

                      {sub.note && (
                        <p className="text-muted-foreground bg-card p-2 rounded border text-[11px]">
                          Note: {sub.note}
                        </p>
                      )}

                      {/* Review Status */}
                      {rev && (
                        <div
                          className={`mt-2 rounded p-2.5 border text-[11px] ${
                            rev.result === 'approved'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              : 'bg-orange-500/10 border-orange-500/20 text-orange-800 dark:text-orange-300'
                          }`}
                        >
                          <div className="font-semibold capitalize flex items-center gap-1">
                            {rev.result === 'approved' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                            )}
                            Review Result: {rev.result.replace('_', ' ')}
                          </div>
                          <p className="mt-1">{rev.feedback}</p>
                          {rev.required_changes && (
                            <p className="mt-0.5 font-medium">Changes required: {rev.required_changes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Event Timeline */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-xs">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Lifecycle Timeline
            </h2>
            <Timeline events={events} />
          </div>
        </div>
      </div>

      {/* Submit Task Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {currentStatus === 'changes_requested'
              ? `Resubmit Task (Version ${(assignment?.current_version || 1) + 1})`
              : 'Submit Task for Review'}
          </DialogTitle>
          <DialogDescription>
            Provide verifiable links to your deliverables. All submissions are append-only and stamped on Postgres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => submitTaskMutation.mutate(d))} className="space-y-4">
          {taskObj.require_github && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                GitHub Repository URL <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('github_url')}
                placeholder="https://github.com/org/repo"
                disabled={isSubmitting || submitTaskMutation.isPending}
              />
              {errors.github_url && (
                <p className="text-[11px] text-destructive">{errors.github_url.message}</p>
              )}
            </div>
          )}

          {taskObj.require_deployment && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Deployment Preview URL <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('deployment_url')}
                placeholder="https://project-preview.vercel.app"
                disabled={isSubmitting || submitTaskMutation.isPending}
              />
              {errors.deployment_url && (
                <p className="text-[11px] text-destructive">{errors.deployment_url.message}</p>
              )}
            </div>
          )}

          {taskObj.require_drive && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Google Drive URL <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('drive_url')}
                placeholder="https://drive.google.com/file/d/..."
                disabled={isSubmitting || submitTaskMutation.isPending}
              />
              {errors.drive_url && (
                <p className="text-[11px] text-destructive">{errors.drive_url.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Submission Notes (Optional)</label>
            <Textarea
              {...register('note')}
              placeholder="Describe what was built, testing performed, or architectural choices..."
              rows={3}
              disabled={isSubmitting || submitTaskMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={isSubmitting || submitTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || submitTaskMutation.isPending}>
              {submitTaskMutation.isPending ? 'Verifying & Submitting...' : 'Confirm Submission'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
