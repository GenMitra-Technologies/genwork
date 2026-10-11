// src/features/intern/assignments/AssignmentsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Play, Upload, CheckCircle2, Calendar } from 'lucide-react';
import { internApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { formatDateOnly } from '../../../lib/formatters';

export function AssignmentsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');

  const internId = profile?.intern_id || '20000000-0000-0000-0000-000000000001';

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', 'intern', internId],
    queryFn: () => internApi.getMyAssignments(internId),
  });

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

      <div className="space-y-4">
        {assignments.map((item: any) => {
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
