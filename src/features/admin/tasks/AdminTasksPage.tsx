// src/features/admin/tasks/AdminTasksPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckSquare,
  ShieldAlert,
  Pencil,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Users,
} from 'lucide-react';
import { adminApi } from '../api';
import { mentorApi } from '../../mentor/api';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { TaskStatus } from '../../../types/database.types';
import { createTaskSchema, CreateTaskInput } from '../../../lib/validators';
import { formatDateOnly } from '../../../lib/formatters';

export function AdminTasksPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dialog States
  const [overrideTarget, setOverrideTarget] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('approved');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [deletingTask, setDeletingTask] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Queries
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-all-tasks'],
    queryFn: adminApi.getAllTasks,
  });

  const { data: interns = [] } = useQuery({
    queryKey: ['admin-interns'],
    queryFn: adminApi.getInterns,
  });

  // Edit Task Form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
  });

  const selectedEditInternIds = watchEdit('intern_ids') || [];

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setEditFormError(null);
    const assignedIds = task.assignments?.map((a: any) => a.intern?.id || a.intern_id).filter(Boolean) || [];
    resetEdit({
      title: task.title || '',
      description: task.description || '',
      instructions: task.instructions || '',
      requirements: task.requirements || '',
      expected_output: task.expected_output || '',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      require_github: !!task.require_github,
      require_deployment: !!task.require_deployment,
      require_drive: !!task.require_drive,
      assign_all: false,
      intern_ids: assignedIds,
    });
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setEditFormError(null);
  };

  // Create Task Form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    setValue: setValueCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
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

  const assignAllCreate = watchCreate('assign_all');
  const selectedCreateInternIds = watchCreate('intern_ids') || [];

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      if (!editingTask) return;
      await adminApi.updateTask(editingTask.id, data);
    },
    onSuccess: () => {
      handleCloseEdit();
      queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-created-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setEditFormError(err.message || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!deletingTask) return;
      await adminApi.deleteTask(deletingTask.id);
    },
    onSuccess: () => {
      setDeletingTask(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-created-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Failed to delete task');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      await mentorApi.createTask(data);
    },
    onSuccess: () => {
      setCreateDialogOpen(false);
      resetCreate();
      setCreateFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-created-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setCreateFormError(err.message || 'Failed to create task');
    },
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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Global Tasks & Workflow Overrides</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Supervisory visibility, curriculum editing, deletion, and status overrides across all mentees and mentors.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-8 px-3 text-xs rounded-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs gap-1.5 w-full sm:w-auto min-h-[36px] justify-center"
        >
          <Plus className="h-3.5 w-3.5" /> Create Task
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Task Title</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assignees</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                    No curriculum tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task: any) => {
                  const assignments = task.assignments || [];

                  return (
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary align-top">{task.code}</td>
                      <td className="p-4 align-top max-w-[280px]">
                        <div className="font-semibold text-foreground">{task.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{task.description}</div>
                      </td>
                      <td className="p-4 align-top">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="p-4 align-top">
                        {assignments.length === 0 ? (
                          <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignments.map((asg: any) => (
                              <div
                                key={asg.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-muted/40 text-[10px]"
                              >
                                <span className="font-medium text-foreground">{asg.intern?.profile?.full_name || 'Intern'}</span>
                                <StatusBadge status={asg.status} className="px-1 py-0 text-[9px]" />
                                <button
                                  type="button"
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
                                  className="text-amber-600 hover:text-amber-700 ml-0.5 font-bold"
                                  title="Override status"
                                >
                                  ⚡
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top text-muted-foreground whitespace-nowrap text-[11px]">
                        {formatDateOnly(task.due_date)}
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/tasks/${task.code}`)}
                            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            title="View Task Details"
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(task)}
                            className="h-7 px-2 text-[11px] gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            title="Edit Task"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingTask(task);
                              setDeleteError(null);
                            }}
                            className="h-7 px-2 text-[11px] gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Delete Task"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) handleCloseEdit(); }}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Pencil className="h-4 w-4 text-indigo-600" /> Administrative Task Editor
            {editingTask && <span className="font-mono text-xs text-indigo-600">({editingTask.code})</span>}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update task details, deliverables, priority, deadline, or assignees in real time.
          </DialogDescription>
        </DialogHeader>

        {editFormError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-2">
            {editFormError}
          </div>
        )}

        <form onSubmit={handleSubmitEdit((d) => updateTaskMutation.mutate(d))} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Task Title *</label>
            <Input {...registerEdit('title')} placeholder="e.g. Implement WebSocket Realtime Updates" className="h-8 text-xs rounded-lg" />
            {editErrors.title && <p className="text-[10px] text-destructive">{editErrors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description *</label>
            <Textarea {...registerEdit('description')} placeholder="Detailed context and purpose of the task..." rows={2} className="text-xs rounded-lg" />
            {editErrors.description && <p className="text-[10px] text-destructive">{editErrors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <select
                {...registerEdit('priority')}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Due Date & Time *</label>
              <Input type="datetime-local" {...registerEdit('due_date')} className="h-8 text-xs rounded-lg" />
              {editErrors.due_date && <p className="text-[10px] text-destructive">{editErrors.due_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Instructions</label>
            <Textarea {...registerEdit('instructions')} placeholder="Instructions..." rows={2} className="text-xs rounded-lg" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Acceptance Requirements</label>
            <Textarea {...registerEdit('requirements')} placeholder="Requirements..." rows={2} className="text-xs rounded-lg" />
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-1.5 pt-2 border-t">
            <span className="text-[11px] font-semibold text-foreground block">Required Deliverables on Submission:</span>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerEdit('require_github')} className="rounded text-primary" />
                <span className="text-[11px]">GitHub Repository</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerEdit('require_deployment')} className="rounded text-primary" />
                <span className="text-[11px]">Live Preview</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerEdit('require_drive')} className="rounded text-primary" />
                <span className="text-[11px]">Drive Assets</span>
              </label>
            </div>
          </div>

          {/* Additional Assignees */}
          <div className="space-y-1.5 pt-2 border-t">
            <span className="text-[11px] font-semibold text-foreground block">Assignees (Add more mentees):</span>
            <div className="pt-1 space-y-1 text-xs max-h-36 overflow-y-auto">
              {interns.map((intern: any) => {
                const internId = intern.id || intern.intern_id;
                const isChecked = selectedEditInternIds.includes(internId);
                return (
                  <label key={internId} className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValueEdit('intern_ids', [...selectedEditInternIds, internId]);
                        } else {
                          setValueEdit('intern_ids', selectedEditInternIds.filter((id) => id !== internId));
                        }
                      }}
                      className="rounded text-primary"
                    />
                    <span className="text-[11px]">{intern.profile?.full_name || intern.full_name} ({intern.role_title})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCloseEdit} className="h-8 text-xs rounded-lg">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={updateTaskMutation.isPending} className="h-8 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              {updateTaskMutation.isPending ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={!!deletingTask} onOpenChange={(open) => { if (!open) setDeletingTask(null); }}>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Delete Curriculum Task
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete task <span className="font-semibold text-foreground">{deletingTask?.code}: {deletingTask?.title}</span>? This will archive the task and remove it from active assignments.
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <div className="rounded border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-3">
            {deleteError}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => setDeletingTask(null)} disabled={deleteTaskMutation.isPending} className="w-full sm:w-auto min-h-[36px]">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteTaskMutation.mutate()}
            disabled={deleteTaskMutation.isPending}
            className="w-full sm:w-auto min-h-[36px]"
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">Create Internship Task</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Author and assign a new curriculum task across interns.
          </DialogDescription>
        </DialogHeader>

        {createFormError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive mb-2">
            {createFormError}
          </div>
        )}

        <form onSubmit={handleSubmitCreate((d) => createTaskMutation.mutate(d))} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Task Title *</label>
            <Input {...registerCreate('title')} placeholder="e.g. Implement WebSocket Realtime Updates" className="h-8 text-xs rounded-lg" />
            {createErrors.title && <p className="text-[10px] text-destructive">{createErrors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description *</label>
            <Textarea {...registerCreate('description')} placeholder="Detailed context and purpose..." rows={2} className="text-xs rounded-lg" />
            {createErrors.description && <p className="text-[10px] text-destructive">{createErrors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <select
                {...registerCreate('priority')}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Due Date & Time *</label>
              <Input type="datetime-local" {...registerCreate('due_date')} className="h-8 text-xs rounded-lg" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Instructions</label>
            <Textarea {...registerCreate('instructions')} placeholder="Instructions..." rows={2} className="text-xs rounded-lg" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Acceptance Requirements</label>
            <Textarea {...registerCreate('requirements')} placeholder="Requirements..." rows={2} className="text-xs rounded-lg" />
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <span className="text-[11px] font-semibold text-foreground block">Required Deliverables:</span>
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerCreate('require_github')} className="rounded text-primary" />
                <span className="text-[11px]">GitHub Repository</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerCreate('require_deployment')} className="rounded text-primary" />
                <span className="text-[11px]">Live Preview</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                <input type="checkbox" {...registerCreate('require_drive')} className="rounded text-primary" />
                <span className="text-[11px]">Drive Assets</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <span className="text-[11px] font-semibold text-foreground block">Assign To Mentees:</span>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-foreground">
              <input type="checkbox" {...registerCreate('assign_all')} className="rounded text-primary" />
              <span className="text-[11px]">Assign to all interns</span>
            </label>

            {!assignAllCreate && (
              <div className="pt-1 pl-4 space-y-1 text-xs">
                {interns.map((intern: any) => {
                  const internId = intern.id || intern.intern_id;
                  const isChecked = selectedCreateInternIds.includes(internId);
                  return (
                    <label key={internId} className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValueCreate('intern_ids', [...selectedCreateInternIds, internId]);
                          } else {
                            setValueCreate('intern_ids', selectedCreateInternIds.filter((id) => id !== internId));
                          }
                        }}
                        className="rounded text-primary"
                      />
                      <span className="text-[11px]">{intern.profile?.full_name || intern.full_name} ({intern.role_title})</span>
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
            <Button type="submit" size="sm" disabled={createTaskMutation.isPending} className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              {createTaskMutation.isPending ? 'Publishing...' : 'Publish & Assign'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

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
          <Button variant="outline" onClick={() => setOverrideTarget(null)} className="w-full sm:w-auto min-h-[36px]">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => overrideMutation.mutate()}
            disabled={overrideMutation.isPending || !overrideReason.trim()}
            className="w-full sm:w-auto min-h-[36px]"
          >
            {overrideMutation.isPending ? 'Applying Override...' : 'Confirm Status Override'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
