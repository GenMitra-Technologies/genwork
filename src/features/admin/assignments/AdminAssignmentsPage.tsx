// src/features/admin/assignments/AdminAssignmentsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  FileText,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../api';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { PriorityBadge } from '../../../components/shared/PriorityBadge';
import { StatCard, StatCardSkeleton } from '../../../components/shared/StatCard';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { createAssignmentSchema, CreateAssignmentInput } from '../../../lib/validators';
import { formatDateOnly, formatDateTime } from '../../../lib/formatters';

export function AdminAssignmentsPage() {
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<any | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mentorFilter, setMentorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-all-assignments'],
    queryFn: adminApi.getAllAssignments,
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ['admin-mentors'],
    queryFn: adminApi.getMentors,
  });

  const { data: interns = [] } = useQuery({
    queryKey: ['admin-interns'],
    queryFn: adminApi.getInterns,
  });

  // Create Assignment Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssignmentInput & { mentor_id: string }>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      assign_all: true,
      intern_ids: [],
      mentor_id: '',
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
  const [editMentorId, setEditMentorId] = useState('');

  const openEditModal = (asg: any) => {
    setEditingAssignment(asg);
    setEditTitle(asg.title || '');
    setEditDescription(asg.description || '');
    setEditInstructions(asg.instructions || '');
    setEditPriority(asg.priority || 'medium');
    setEditDueDate(asg.due_date ? new Date(asg.due_date).toISOString().slice(0, 16) : '');
    setEditMentorId(asg.mentor_id || '');
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentInput & { mentor_id: string }) => {
      await adminApi.createAssignment(data);
    },
    onSuccess: () => {
      setCreateDialogOpen(false);
      reset();
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create assignment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingAssignment) return;
      await adminApi.updateAssignment(editingAssignment.id, {
        title: editTitle,
        description: editDescription,
        instructions: editInstructions,
        priority: editPriority,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        mentor_id: editMentorId || undefined,
      });
    },
    onSuccess: () => {
      setEditingAssignment(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update assignment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.deleteAssignment(id);
    },
    onSuccess: () => {
      setDeletingAssignment(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg: any) => {
      if (mentorFilter !== 'all' && asg.mentor_id !== mentorFilter) return false;
      if (priorityFilter !== 'all' && asg.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = asg.title?.toLowerCase().includes(q);
        const matchCode = asg.code?.toLowerCase().includes(q);
        const matchDesc = asg.description?.toLowerCase().includes(q);
        const matchMentor = asg.mentor?.profile?.full_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesc && !matchMentor) return false;
      }
      return true;
    });
  }, [assignments, mentorFilter, priorityFilter, searchQuery]);

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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Coursework & Assignments</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete CRUD authority across all internship curriculum assignments, mentor assignments, and submission audits.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-9 px-3.5 text-xs rounded-lg font-medium shadow-2xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Assignment
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
            to="/admin/assignments"
            iconBg="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            title="Active / Pending submissions"
            value={pendingCount}
            icon={Clock}
            to="/admin/assignments"
            iconBg="bg-amber-100"
            iconColor="text-amber-700"
          />
          <StatCard
            title="Completed & Reviewed"
            value={completedCount}
            icon={CheckCircle2}
            to="/admin/assignments"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-700"
          />
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-xl border bg-card p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by code, title, mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs rounded-lg bg-muted/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Mentor Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Mentor:</span>
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Mentors</option>
              {mentors.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.profile?.full_name || 'Mentor'}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Assignment Title & Description</th>
                <th className="p-4">Supervising Mentor</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Recipients / Progress</th>
                <th className="p-4 text-right">Actions (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                    No coursework assignments matching query or filters.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg: any) => {
                  const recipients = asg.recipients || [];
                  const completedRecipients = recipients.filter(
                    (r: any) => r.status === 'completed' || r.status === 'approved' || r.status === 'submitted'
                  ).length;
                  const progressPercent = recipients.length > 0 ? Math.round((completedRecipients / recipients.length) * 100) : 0;

                  return (
                    <tr key={asg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary whitespace-nowrap">
                        {asg.code}
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-semibold text-foreground line-clamp-1">{asg.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{asg.description}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Award className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{asg.mentor?.profile?.full_name || 'System / Admin'}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <PriorityBadge priority={asg.priority} />
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {formatDateOnly(asg.due_date)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1 w-32">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{completedRecipients}/{recipients.length} Done</span>
                            <span className="font-semibold text-foreground">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmissions(asg)}
                            className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 rounded-md"
                            title="View Recipient Submissions"
                          >
                            <Eye className="h-3.5 w-3.5" /> Submissions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(asg)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
                            title="Edit Assignment"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingAssignment(asg)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-md"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Submissions Modal */}
      {selectedSubmissions && (
        <Dialog open={!!selectedSubmissions} onOpenChange={() => setSelectedSubmissions(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {selectedSubmissions.code}
              </span>
              <DialogTitle className="text-sm font-semibold">{selectedSubmissions.title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Supervisory review of all assigned intern submissions and progress.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {(!selectedSubmissions.recipients || selectedSubmissions.recipients.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No interns assigned to this coursework yet.</p>
            ) : (
              selectedSubmissions.recipients.map((rec: any) => (
                <div key={rec.id} className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {(rec.intern?.profile?.full_name || 'I')[0]}
                      </div>
                      <span>{rec.intern?.profile?.full_name || 'Intern'}</span>
                      <span className="text-[11px] text-muted-foreground">({rec.intern?.profile?.email || 'intern'})</span>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>

                  {rec.submitted_at && (
                    <div className="text-[11px] text-muted-foreground">
                      Submitted: <span className="font-medium text-foreground">{formatDateTime(rec.submitted_at)}</span>
                    </div>
                  )}

                  {rec.submission_text && (
                    <div className="bg-card p-2 rounded border text-foreground text-[11px]">
                      {rec.submission_text}
                    </div>
                  )}

                  {rec.submission_url && (
                    <div className="pt-1">
                      <a
                        href={rec.submission_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View Submitted Artifact
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

      {/* Create Assignment Dialog (Admin) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Author Global Curriculum Assignment</DialogTitle>
          <DialogDescription className="text-xs">
            Administer coursework across cohorts, designate supervising mentor, and establish deliverables.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3.5 py-2">
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground">Assignment Title *</label>
            <Input
              {...register('title')}
              placeholder="e.g. Distributed Consensus & Raft Breakdown"
              className="mt-1 h-8 text-xs rounded-lg"
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-0.5">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Description & Objectives *</label>
            <Textarea
              {...register('description')}
              placeholder="Comprehensive summary of what the intern needs to explore and execute..."
              rows={2}
              className="mt-1 text-xs rounded-lg"
            />
            {errors.description && <p className="text-[11px] text-rose-500 mt-0.5">{errors.description.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Detailed Instructions (Optional)</label>
            <Textarea
              {...register('instructions')}
              placeholder="Step-by-step deliverable guidelines or references..."
              rows={2}
              className="mt-1 text-xs rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Supervising Mentor</label>
              <select
                {...register('mentor_id')}
                className="mt-1 w-full h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground"
              >
                <option value="">Admin / Unassigned</option>
                {mentors.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.profile?.full_name || 'Mentor'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Priority Level</label>
              <select
                {...register('priority')}
                className="mt-1 w-full h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Due Date *</label>
              <Input
                type="datetime-local"
                {...register('due_date')}
                className="mt-1 h-8 text-xs rounded-lg"
              />
              {errors.due_date && <p className="text-[11px] text-rose-500 mt-0.5">{errors.due_date.message}</p>}
            </div>
          </div>

          {/* Intern Assignment Selection */}
          <div className="border-t border-border pt-3 space-y-2">
            <label className="text-xs font-medium text-foreground block">Assignees</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="admin_assign_all"
                checked={assignAll}
                onChange={(e) => setValue('assign_all', e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <label htmlFor="admin_assign_all" className="text-xs text-foreground cursor-pointer">
                Assign to all active interns across all cohorts ({interns.length})
              </label>
            </div>

            {!assignAll && (
              <div className="max-h-32 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-muted/20">
                {interns.map((intern: any) => {
                  const isChecked = selectedInternIds?.includes(intern.id);
                  return (
                    <label
                      key={intern.id}
                      className="flex items-center gap-2 text-xs text-foreground p-1 hover:bg-muted/40 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = selectedInternIds || [];
                          if (e.target.checked) {
                            setValue('intern_ids', [...current, intern.id]);
                          } else {
                            setValue('intern_ids', current.filter((id) => id !== intern.id));
                          }
                        }}
                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{intern.profile?.full_name || 'Intern'}</span>
                      <span className="text-[10px] text-muted-foreground">({intern.internship?.name || 'Internship'})</span>
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
              onClick={() => setCreateDialogOpen(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || createMutation.isPending}
              className="h-7 text-xs"
            >
              {createMutation.isPending ? 'Publishing...' : 'Publish Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Assignment Dialog (Admin) */}
      {editingAssignment && (
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Assignment ({editingAssignment.code})</DialogTitle>
            <DialogDescription className="text-xs">
              Administrative update of assignment attributes, instructions, or deadlines.
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
              <label className="text-xs font-medium text-foreground">Assignment Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 h-8 text-xs rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="mt-1 text-xs rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Instructions</label>
              <Textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={2}
                className="mt-1 text-xs rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Supervising Mentor</label>
                <select
                  value={editMentorId}
                  onChange={(e) => setEditMentorId(e.target.value)}
                  className="mt-1 w-full h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground"
                >
                  <option value="">Admin / Unassigned</option>
                  {mentors.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.profile?.full_name || 'Mentor'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Priority Level</label>
                <select
                  value={editPriority}
                  onChange={(e: any) => setEditPriority(e.target.value)}
                  className="mt-1 w-full h-8 text-xs rounded-lg bg-muted/40 border border-input px-2.5 text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Due Date</label>
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
                className="h-7 text-xs"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog (Admin) */}
      {deletingAssignment && (
        <Dialog open={!!deletingAssignment} onOpenChange={() => setDeletingAssignment(null)}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Delete Assignment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete <strong>{deletingAssignment.code}: {deletingAssignment.title}</strong>? All intern submission records and review statuses will be removed from the system.
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
