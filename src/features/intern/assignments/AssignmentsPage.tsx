// src/features/intern/assignments/AssignmentsPage.tsx
import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Play, Upload, CheckCircle2, Calendar, Clock, X } from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard, StatCardSkeleton } from '../../../components/shared/StatCard';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { formatDateOnly } from '../../../lib/formatters';

export function AssignmentsPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');

  const statusParam = searchParams.get('status');
  const internId = profile?.intern_id || '20000000-0000-0000-0000-000000000001';

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', 'intern', internId],
    queryFn: () => internApi.getMyAssignments(internId),
  });

  const totalAssignments = assignments.length;
  const pendingAssignmentsCount = useMemo(
    () => assignments.filter((a: any) => a.status === 'pending' || a.status === 'in_progress').length,
    [assignments]
  );
  const completedAssignmentsCount = useMemo(
    () => assignments.filter((a: any) => a.status === 'completed' || a.status === 'approved' || a.status === 'submitted').length,
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    if (statusParam === 'pending') {
      return assignments.filter((a: any) => a.status === 'pending' || a.status === 'in_progress');
    }
    if (statusParam === 'completed') {
      return assignments.filter((a: any) => a.status === 'completed' || a.status === 'approved' || a.status === 'submitted');
    }
    return assignments;
  }, [assignments, statusParam]);

  const startMutation = useMutation({
    mutationFn: (id: string) => internApi.startAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      internApi.submitAssignment(selectedRecipient.id, {
        text: submissionText,
        url: submissionUrl,
      }),
    onSuccess: () => {
      setSelectedRecipient(null);
      setSubmissionText('');
      setSubmissionUrl('');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Coursework & Assignments</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Structured coursework, technical reading, and architectural quizzes assigned by your mentors.
        </p>
      </div>

      {/* 3 Assignments & Coursework Metrics Cards (3-column grid) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Assignments & Coursework Metrics (3)
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <StatCard
              title="Total assignments"
              value={totalAssignments}
              icon={FileText}
              to="/intern/assignments"
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              title="Pending assignments"
              value={pendingAssignmentsCount}
              icon={Clock}
              to="/intern/assignments?status=pending"
              iconBg="bg-amber-100"
              iconColor="text-amber-700"
            />
            <StatCard
              title="Completed assignments"
              value={completedAssignmentsCount}
              icon={CheckCircle2}
              to="/intern/assignments?status=completed"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-700"
            />
          </div>
        )}
      </div>

      {/* Active Filter Indicator */}
      {statusParam && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Filtered by: <strong className="text-foreground capitalize">{statusParam}</strong> ({filteredAssignments.length})
          </span>
          <Link
            to="/intern/assignments"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors"
          >
            <X className="w-3 h-3" /> Clear filter
          </Link>
        </div>
      )}

      {filteredAssignments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-xs text-muted-foreground">
          No assignments found matching this status filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((item: any) => {
          const asg = item.assignment || {};
          const isPending = item.status === 'pending';
          const isInProgress = item.status === 'in_progress';
          const isSubmitted = item.status === 'submitted';

          return (
            <div
              key={item.id}
              className="rounded-xl border bg-card p-6 shadow-xs space-y-4 transition-all hover:border-primary/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{asg.code}</span>
                    <PriorityBadge priority={asg.priority || 'medium'} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{asg.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{asg.description}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {asg.instructions && (
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-foreground/80">
                  <span className="font-semibold block mb-0.5">Instructions:</span>
                  {asg.instructions}
                </div>
              )}

              {item.mentor_feedback && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Mentor Feedback:</span>
                  {item.mentor_feedback}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between pt-2 border-t text-xs gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Due {formatDateOnly(asg.due_date)}
                </span>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => startMutation.mutate(item.id)}
                      disabled={startMutation.isPending}
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play className="h-3.5 w-3.5" /> Start Assignment
                    </Button>
                  )}

                  {isInProgress && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedRecipient(item)}
                      className="gap-1.5 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" /> Submit Work
                    </Button>
                  )}

                  {isSubmitted && (
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Submitted for evaluation
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Submit Assignment Dialog */}
      <Dialog open={!!selectedRecipient} onOpenChange={() => setSelectedRecipient(null)}>
        <DialogHeader>
          <DialogTitle>Submit Coursework Response</DialogTitle>
          <DialogDescription>
            Submit your written analysis or link to your documentation repo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Written Solution / Response</label>
            <Textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Paste your findings, answer, or technical explanation..."
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Documentation or Repo Link (Optional)</label>
            <Input
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedRecipient(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || (!submissionText.trim() && !submissionUrl.trim())}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
