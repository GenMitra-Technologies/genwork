// src/features/mentor/assignments/MentorAssignmentsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  FileText,
  Calendar,
  Users,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { mentorApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { StatCard, StatCardSkeleton } from '../../../components/shared/StatCard';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { createAssignmentSchema, CreateAssignmentInput } from '../../../lib/validators';
import { formatDateOnly, formatDateTime } from '../../../lib/formatters';

export function MentorAssignmentsPage() {
  const { profile } = useAuth();
  const mentorId = profile?.mentor_id || '10000000-0000-0000-0000-000000000001';
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isNewRoute = location.pathname.endsWith('/new') || searchParams.get('new') === 'true';
  const [createDialogOpen, setCreateDialogOpen] = useState(isNewRoute);
  const [selectedSubmissions, setSelectedSubmissions] = useState<any | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    if (location.pathname.endsWith('/new')) {
      navigate('/mentor/assignments', { replace: true });
    }
  };

  // Fetch Mentor's Interns
  const { data: myInterns = [] } = useQuery({
    queryKey: ['my-interns', mentorId],
    queryFn: () => mentorApi.getMyInterns(mentorId),
  });

  // Fetch Mentor's Created Assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['mentor-assignments', mentorId],
    queryFn: () => mentorApi.getAssignments(mentorId),
  });

  // Create Assignment Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssignmentInput>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      assign_all: true,
      intern_ids: [],
    },
  });

  const assignAll = watch('assign_all');
  const selectedInternIds = watch('intern_ids');

  // Edit Assignment Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  const openEditModal = (asg: any) => {
    setEditingAssignment(asg);
    setEditTitle(asg.title || '');
    setEditDescription(asg.description || '');
    setEditInstructions(asg.instructions || '');
    setEditPriority(asg.priority || 'medium');
    setEditDueDate(asg.due_date ? new Date(asg.due_date).toISOString().slice(0, 16) : '');
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentInput) => {
      await mentorApi.createAssignment(data, mentorId);
    },
    onSuccess: () => {
      handleCloseCreateDialog();
      reset();
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create assignment');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingAssignment) return;
      await mentorApi.updateAssignment(editingAssignment.id, {
        title: editTitle,
        description: editDescription,
        instructions: editInstructions,
        priority: editPriority,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      setEditingAssignment(null);
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update assignment');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await mentorApi.deleteAssignment(id);
    },
    onSuccess: () => {
      setDeletingAssignment(null);
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg: any) => {
      if (priorityFilter !== 'all' && asg.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = asg.title?.toLowerCase().includes(q);
        const matchCode = asg.code?.toLowerCase().includes(q);
        const matchDesc = asg.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [assignments, priorityFilter, searchQuery]);

  // Aggregate Metrics
  const totalCount = assignments.length;
  const pendingCount = useMemo(() => {
    let count = 0;
    assignments.forEach((asg: any) => {
      const recs = asg.recipients || [];
      count += recs.filter((r: any) => r.status === 'pending' || r.status === 'in_progress').length;
    });
    return count;
  }, [assignments]);

  const completedCount = useMemo(() => {
    let count = 0;
    assignments.forEach((asg: any) => {
      const recs = asg.recipients || [];
      count += recs.filter((r: any) => r.status === 'completed' || r.status === 'approved' || r.status === 'submitted').length;
    });
    return count;
  }, [assignments]);

  return (
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Header Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Coursework & Curriculum Assignments</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700">
              {totalCount} Assignments
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Create technical coursework, specify requirements, and monitor intern completion rates.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-7 px-3 text-xs rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" /> Create Assignment
        </Button>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <StatCard
            title="Total assignments"
            value={totalCount}
            icon={FileText}
            to="/mentor/assignments"
            iconBg="bg-indigo-100"
            iconColor="text-indigo-700"
          />
          <StatCard
            title="Pending submissions"
            value={pendingCount}
            icon={Clock}
            to="/mentor/assignments"
            iconBg="bg-amber-100"
            iconColor="text-amber-700"
          />
          <StatCard
            title="Completed / Reviewed"
            value={completedCount}
            icon={CheckCircle2}
            to="/mentor/assignments"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-700"
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search assignments by code, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs rounded-lg bg-slate-50/50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Priority:
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-xs rounded-lg bg-slate-50 border border-slate-200 px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-xs font-semibold text-slate-700">No assignments found</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {searchQuery ? 'No coursework assignments match your search.' : 'Create your first assignment to begin coursework tracking.'}
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="outline"
            className="mt-3 h-7 text-xs rounded-lg font-medium"
          >
            <Plus className="h-3 w-3 mr-1" /> New Assignment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAssignments.map((asg: any) => {
            const recipients = asg.recipients || [];
            const completedRecipients = recipients.filter(
              (r: any) => r.status === 'completed' || r.status === 'approved' || r.status === 'submitted'
            ).length;
            const progressPercent = recipients.length > 0 ? Math.round((completedRecipients / recipients.length) * 100) : 0;

            return (
              <div
                key={asg.id}
                className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {asg.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={asg.priority} />
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Due {formatDateOnly(asg.due_date)}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {asg.description}
                  </p>

                  {/* Recipient Progress */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" /> Assignees ({recipients.length}):
                      </span>
                      <span className="font-medium text-slate-700">
                        {completedRecipients}/{recipients.length} Completed ({progressPercent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Assignee Avatars */}
                    <div className="flex items-center gap-1.5 overflow-hidden pt-1">
                      {recipients.slice(0, 4).map((r: any) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200/60 rounded-full px-2 py-0.5 text-slate-600 truncate max-w-[130px]"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.status === 'completed' || r.status === 'approved'
                                ? 'bg-emerald-500'
                                : r.status === 'submitted'
                                ? 'bg-indigo-500'
                                : 'bg-amber-400'
                            }`}
                          />
                          {r.intern?.profile?.full_name || 'Intern'}
                        </span>
                      ))}
                      {recipients.length > 4 && (
                        <span className="text-[10px] text-slate-400">+{recipients.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSubmissions(asg)}
                    className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 px-2.5 gap-1.5 rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5" /> Submissions ({recipients.length})
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(asg)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      title="Edit Assignment"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingAssignment(asg)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submissions Modal */}
      {selectedSubmissions && (
        <Dialog open={!!selectedSubmissions} onOpenChange={() => setSelectedSubmissions(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {selectedSubmissions.code}
              </span>
              <DialogTitle className="text-sm font-semibold">{selectedSubmissions.title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Recipient submission logs and individual progress tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {(!selectedSubmissions.recipients || selectedSubmissions.recipients.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">No interns assigned to this coursework yet.</p>
            ) : (
              selectedSubmissions.recipients.map((rec: any) => (
                <div key={rec.id} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {(rec.intern?.profile?.full_name || 'I')[0]}
                      </div>
                      <span>{rec.intern?.profile?.full_name || 'Intern'}</span>
                      <span className="text-[11px] text-slate-400">({rec.intern?.profile?.email || 'intern'})</span>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>

                  {rec.submitted_at && (
                    <div className="text-[11px] text-slate-500">
                      Submitted: <span className="font-medium text-slate-700">{formatDateTime(rec.submitted_at)}</span>
                    </div>
                  )}

                  {rec.submission_text && (
                    <div className="bg-white p-2 rounded border border-slate-200/60 text-slate-700 text-[11px]">
                      {rec.submission_text}
                    </div>
                  )}

                  {rec.submission_url && (
                    <div className="pt-1">
                      <a
                        href={rec.submission_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View Submitted Work
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedSubmissions(null)} className="h-7 text-xs">
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseCreateDialog(); else setCreateDialogOpen(true); }}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Create New Assignment</DialogTitle>
          <DialogDescription className="text-xs">
            Assign curriculum modules, reading analysis, or practice exercises to your cohort.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3.5 py-2">
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700">Assignment Title *</label>
            <Input
              {...register('title')}
              placeholder="e.g. Distributed Consensus & Raft Breakdown"
              className="mt-1 h-8 text-xs rounded-lg"
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-0.5">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Description & Objective *</label>
            <Textarea
              {...register('description')}
              placeholder="Comprehensive summary of what the intern needs to explore and execute..."
              rows={2}
              className="mt-1 text-xs rounded-lg"
            />
            {errors.description && <p className="text-[11px] text-rose-500 mt-0.5">{errors.description.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Detailed Instructions (Optional)</label>
            <Textarea
              {...register('instructions')}
              placeholder="Step-by-step deliverable guidelines or references..."
              rows={2}
              className="mt-1 text-xs rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Priority Level</label>
              <select
                {...register('priority')}
                className="mt-1 w-full h-8 text-xs rounded-lg bg-slate-50 border border-slate-200 px-2.5 text-slate-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Due Date *</label>
              <Input
                type="datetime-local"
                {...register('due_date')}
                className="mt-1 h-8 text-xs rounded-lg"
              />
              {errors.due_date && <p className="text-[11px] text-rose-500 mt-0.5">{errors.due_date.message}</p>}
            </div>
          </div>

          {/* Intern Assignment Selection */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <label className="text-xs font-medium text-slate-700 block">Assignees</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="assign_all"
                checked={assignAll}
                onChange={(e) => setValue('assign_all', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <label htmlFor="assign_all" className="text-xs text-slate-700 cursor-pointer">
                Assign to all my active interns ({myInterns.length})
              </label>
            </div>

            {!assignAll && (
              <div className="max-h-32 overflow-y-auto space-y-1.5 border border-slate-200/80 rounded-lg p-2 bg-slate-50/40">
                {myInterns.map((intern: any) => {
                  const isChecked = selectedInternIds?.includes(intern.intern_id);
                  return (
                    <label
                      key={intern.intern_id}
                      className="flex items-center gap-2 text-xs text-slate-700 p-1 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = selectedInternIds || [];
                          if (e.target.checked) {
                            setValue('intern_ids', [...current, intern.intern_id]);
                          } else {
                            setValue('intern_ids', current.filter((id) => id !== intern.intern_id));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span>{intern.full_name}</span>
                      <span className="text-[10px] text-slate-400">({intern.role_title})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseCreateDialog}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || createMutation.isPending}
              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createMutation.isPending ? 'Publishing...' : 'Publish Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Assignment ({editingAssignment.code})</DialogTitle>
            <DialogDescription className="text-xs">
              Update assignment parameters, expectations, or deadline.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-3.5 py-2"
          >
            <div>
              <label className="text-xs font-medium text-slate-700">Assignment Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 h-8 text-xs rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="mt-1 text-xs rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Instructions</label>
              <Textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={2}
                className="mt-1 text-xs rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Priority Level</label>
                <select
                  value={editPriority}
                  onChange={(e: any) => setEditPriority(e.target.value)}
                  className="mt-1 w-full h-8 text-xs rounded-lg bg-slate-50 border border-slate-200 px-2.5 text-slate-700"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Due Date</label>
                <Input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAssignment(null)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAssignment && (
        <Dialog open={!!deletingAssignment} onOpenChange={() => setDeletingAssignment(null)}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-rose-600">Delete Assignment</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong>{deletingAssignment.code}: {deletingAssignment.title}</strong>? This action will permanently remove all associated recipient submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingAssignment(null)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingAssignment.id)}
              className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Assignment'}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
