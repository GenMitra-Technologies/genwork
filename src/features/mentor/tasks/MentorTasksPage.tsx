// src/features/mentor/tasks/MentorTasksPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, CheckSquare, Calendar, Users, Eye, Sparkles } from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { createTaskSchema, CreateTaskInput } from '../../../lib/validators';
import { formatDateOnly } from '../../../lib/formatters';

export function MentorTasksPage() {
  const { profile } = useAuth();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(searchParams.get('new') === 'true');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: myInterns = [] } = useQuery({
    queryKey: ['my-interns', mentorId],
    queryFn: () => mentorApi.getMyInterns(mentorId),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['mentor-created-tasks', mentorId],
    queryFn: () => mentorApi.getCreatedTasks(mentorId),
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
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Glossy Header Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Task Assignments & Curriculum</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700">
              {tasks.length} Created Tasks
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Author technical assignments, specify deliverable requirements, and manage cohort deadlines.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-7 px-3 text-xs rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-3 w-3" /> Create New Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5 hover:border-slate-300 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-indigo-700">
                    {task.code}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <h3 className="text-xs font-semibold text-slate-900">{task.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Due: {formatDateOnly(task.due_date)}</span>
              </div>
            </div>

            {/* Assigned Mentees status chips */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium flex items-center gap-1 text-[10px]">
                <Users className="h-2.5 w-2.5" /> Assignees ({task.assignments?.length || 0}):
              </span>
              {task.assignments && task.assignments.length > 0 ? (
                task.assignments.map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200/60 bg-slate-50/70 text-[10px]"
                  >
                    <span className="text-slate-700">{a.intern?.profile?.full_name || 'Intern'}</span>
                    <StatusBadge status={a.status} className="px-1 py-0 text-[9px]" />
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-[10px]">None assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">Create Internship Task</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Specify requirements, deliverable constraints, and select assignee interns.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 mb-2">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createTaskMutation.mutate(d))} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Task Title *</label>
            <Input {...register('title')} placeholder="e.g. Implement WebSocket Realtime Updates" className="h-8 text-xs rounded-lg" />
            {errors.title && <p className="text-[10px] text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Description *</label>
            <Textarea {...register('description')} placeholder="Detailed context and purpose of the task..." rows={2} className="text-xs rounded-lg" />
            {errors.description && <p className="text-[10px] text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Priority</label>
              <select
                {...register('priority')}
                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Due Date & Time *</label>
              <Input type="datetime-local" {...register('due_date')} className="h-8 text-xs rounded-lg" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Instructions</label>
            <Textarea {...register('instructions')} placeholder="1. Checkout branch... 2. Run migrations..." rows={2} className="text-xs rounded-lg" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Acceptance Requirements</label>
            <Textarea {...register('requirements')} placeholder="All unit tests green, zero lint errors..." rows={2} className="text-xs rounded-lg" />
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-700 block">Required Deliverables on Submission:</span>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                <input type="checkbox" {...register('require_github')} className="rounded text-indigo-600" />
                <span className="text-[11px]">GitHub Repository</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                <input type="checkbox" {...register('require_deployment')} className="rounded text-indigo-600" />
                <span className="text-[11px]">Live Preview</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                <input type="checkbox" {...register('require_drive')} className="rounded text-indigo-600" />
                <span className="text-[11px]">Drive Assets</span>
              </label>
            </div>
          </div>

          {/* Assign To Interns */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-700 block">Assign To Mentees:</span>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                {...register('assign_all')}
                className="rounded text-indigo-600"
              />
              <span className="text-[11px]">Assign to all of my interns</span>
            </label>

            {!assignAll && (
              <div className="pt-1 pl-4 space-y-1 text-xs">
                {myInterns.map((intern: any) => {
                  const isChecked = selectedInternIds.includes(intern.intern_id);
                  return (
                    <label key={intern.intern_id} className="flex items-center gap-2 cursor-pointer text-slate-600">
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
                        className="rounded text-indigo-600"
                      />
                      <span className="text-[11px]">{intern.full_name} ({intern.role_title})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)} className="h-8 text-xs rounded-lg">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createTaskMutation.isPending} className="h-8 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              {createTaskMutation.isPending ? 'Publishing...' : 'Publish & Assign'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
