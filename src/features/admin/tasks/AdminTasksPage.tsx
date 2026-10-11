// src/features/admin/tasks/AdminTasksPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, ShieldAlert, Edit3 } from 'lucide-react';
import { adminApi } from '../api';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { TaskStatus } from '../../../types/database.types';

export function AdminTasksPage() {
  const queryClient = useQueryClient();
  const [overrideTarget, setOverrideTarget] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('approved');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-all-tasks'],
    queryFn: adminApi.getAllTasks,
  });

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!overrideTarget || !overrideReason.trim()) {
        throw new Error('A valid reason is strictly required for administrative status overrides.');
      }
      await adminApi.adminOverrideTaskStatus(
        overrideTarget.assignment_id,
        targetStatus,
        overrideReason.trim()
      );
    },
    onSuccess: () => {
      setOverrideTarget(null);
      setOverrideReason('');
      setOverrideError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
    },
    onError: (err: any) => {
      setOverrideError(err.message || 'Override failed');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Tasks & Workflow Overrides</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Full supervisory visibility of assignments across all mentees and mentors with administrative status override controls.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Task Title</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task: any) => {
                const assignments = task.assignments || [];
                return assignments.map((asg: any) => (
                  <tr key={asg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{task.code}</td>
                    <td className="p-4 font-medium text-foreground">{task.title}</td>
                    <td className="p-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {asg.intern?.profile?.full_name || 'Intern'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={asg.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOverrideTarget({
                            assignment_id: asg.id,
                            task_code: task.code,
                            task_title: task.title,
                            intern_name: asg.intern?.profile?.full_name,
                            current_status: asg.status,
                          });
                          setTargetStatus(asg.status === 'approved' ? 'in_progress' : 'approved');
                          setOverrideReason('');
                          setOverrideError(null);
                        }}
                        className="h-8 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> Admin Override
                      </Button>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={!!overrideTarget} onOpenChange={() => setOverrideTarget(null)}>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Administrative Status Override
          </DialogTitle>
          <DialogDescription>
            {overrideTarget?.task_code}: {overrideTarget?.task_title} (Assigned to {overrideTarget?.intern_name})
          </DialogDescription>
        </DialogHeader>

        {overrideError && (
          <div className="rounded border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-3">
            {overrideError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">New Target Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as TaskStatus)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="waiting_for_review">waiting_for_review</option>
              <option value="approved">approved</option>
              <option value="changes_requested">changes_requested</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Audit Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="State the administrative justification for overriding this task status..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOverrideTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => overrideMutation.mutate()}
            disabled={overrideMutation.isPending || !overrideReason.trim()}
          >
            {overrideMutation.isPending ? 'Applying Override...' : 'Confirm Status Override'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
