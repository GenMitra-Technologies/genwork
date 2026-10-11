// src/features/mentor/tasks/MentorTasksPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, CheckSquare, Calendar, Users, Eye } from 'lucide-react';
import { mentorApi } from '../api';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { createTaskSchema, CreateTaskInput } from '../../../lib/validators';
import { formatDateOnly } from '../../../lib/formatters';

export function MentorTasksPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(searchParams.get('new') === 'true');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: myInterns = [] } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => mentorApi.getMyInterns('10000000-0000-0000-0000-000000000001'),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['mentor-created-tasks'],
    queryFn: () => mentorApi.getCreatedTasks('10000000-0000-0000-0000-000000000001'),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      requirements: '',
      expected_output: '',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      require_github: true,
      require_deployment: false,
      require_drive: false,
      assign_all: true,
      intern_ids: [],
    },
  });

  const assignAll = watch('assign_all');
  const selectedInternIds = watch('intern_ids');

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      await mentorApi.createTask(data);
    },
    onSuccess: () => {
      setCreateDialogOpen(false);
      reset();
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['mentor-created-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'mentor'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create task');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Assignments & Curriculum</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Author tasks, define requirements, and assign them to your cohort mentees.
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Create New Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="rounded-xl border bg-card p-6 shadow-xs space-y-4 transition-all hover:border-primary/40"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{task.code}</span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Due: {formatDateOnly(task.due_date)}</span>
              </div>
            </div>

            {/* Assigned Mentees status chips */}
            <div className="pt-3 border-t flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Users className="h-3 w-3" /> Assignees ({task.assignments?.length || 0}):
              </span>
              {task.assignments && task.assignments.length > 0 ? (
                task.assignments.map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-muted/40 text-[11px]"
                  >
                    <span>{a.intern?.profile?.full_name || 'Intern'}</span>
                    <StatusBadge status={a.status} className="px-1.5 py-0 text-[10px]" />
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground italic">None assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle>Create Internship Task</DialogTitle>
          <DialogDescription>
            Specify requirements, deliverable constraints, and select assignee interns.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-3">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createTaskMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Task Title *</label>
            <Input {...register('title')} placeholder="e.g. Implement WebSocket Realtime Updates" />
            {errors.title && <p className="text-[11px] text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description *</label>
            <Textarea {...register('description')} placeholder="Detailed context and purpose of the task..." rows={3} />
            {errors.description && <p className="text-[11px] text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <select
                {...register('priority')}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Due Date & Time *</label>
              <Input type="datetime-local" {...register('due_date')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Step-by-step Instructions</label>
            <Textarea {...register('instructions')} placeholder="1. Checkout branch... 2. Run migrations..." rows={2} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Acceptance Requirements</label>
            <Textarea {...register('requirements')} placeholder="All unit tests green, zero lint errors..." rows={2} />
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-semibold text-foreground block">Required Deliverables on Submission:</span>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" {...register('require_github')} className="rounded" />
                <span>GitHub Repository</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" {...register('require_deployment')} className="rounded" />
                <span>Live Deployment Preview</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" {...register('require_drive')} className="rounded" />
                <span>Google Drive Asset</span>
              </label>
            </div>
          </div>

          {/* Assign To Interns */}
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-semibold text-foreground block">Assign To Mentees:</span>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
              <input
                type="checkbox"
                {...register('assign_all')}
                className="rounded"
              />
              <span>Assign to all of my interns</span>
            </label>

            {!assignAll && (
              <div className="pt-2 pl-4 space-y-1 text-xs">
                {myInterns.map((intern: any) => {
                  const isChecked = selectedInternIds.includes(intern.intern_id);
                  return (
                    <label key={intern.intern_id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValue('intern_ids', [...selectedInternIds, intern.intern_id]);
                          } else {
                            setValue('intern_ids', selectedInternIds.filter((id) => id !== intern.intern_id));
                          }
                        }}
                        className="rounded"
                      />
                      <span>{intern.full_name} ({intern.role_title})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Publishing Task...' : 'Publish & Assign Task'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
