// src/features/admin/mentors/MentorsAdminPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Mail,
  Building,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Users,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { adminApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';

export function MentorsAdminPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<any | null>(null);
  const [deletingMentor, setDeletingMentor] = useState<any | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [formError, setFormError] = useState('');

  // Queries
  const { data: mentors = [], isLoading: isMentorsLoading } = useQuery({
    queryKey: ['admin-mentors'],
    queryFn: () => adminApi.getMentors(),
  });

  const { data: interns = [] } = useQuery({
    queryKey: ['admin-interns'],
    queryFn: () => adminApi.getInterns(),
  });

  // Calculate intern count per mentor
  const internCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    interns.forEach((intern: any) => {
      const mId = intern.mentor_id || intern.mentor?.id;
      if (mId) {
        map[mId] = (map[mId] || 0) + 1;
      }
    });
    return map;
  }, [interns]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    mentors.forEach((m: any) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [mentors]);

  // Filtered mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter((m: any) => {
      const matchSearch =
        !searchQuery ||
        m.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'all' || m.department === selectedDept;

      return matchSearch && matchDept;
    });
  }, [mentors, searchQuery, selectedDept]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createMentor({
        full_name: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
        bio: bio.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentors'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create mentor.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateMentor(editingMentor.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
        bio: bio.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentors'] });
      setEditingMentor(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update mentor.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMentor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mentors'] });
      setDeletingMentor(null);
    },
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setDepartment('');
    setBio('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    resetForm();
    setEditingMentor(m);
    setFullName(m.profile?.full_name || '');
    setEmail(m.profile?.email || '');
    setDepartment(m.department || '');
    setBio(m.bio || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !department.trim()) {
      setFormError('Please fill out full name, email, and department.');
      return;
    }
    if (editingMentor) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Mentors & Supervisors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered mentors, departmental allocations, bios, and cohort supervising capacities.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-2xs h-8 w-full sm:w-auto min-h-[36px] justify-center"
        >
          <Plus className="h-3.5 w-3.5" /> Add New Mentor
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mentor name, email, or department..."
            className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Departments ({mentors.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMentors.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-500">
            No mentors match your search criteria.
          </div>
        ) : (
          filteredMentors.map((mentor: any) => {
            const assignedInterns = internCountMap[mentor.id] || 0;
            return (
              <div
                key={mentor.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar
                      src={mentor.profile?.avatar_url}
                      name={mentor.profile?.full_name || 'Mentor'}
                      size="md"
                      className="shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">
                          {mentor.profile?.full_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        {mentor.profile?.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(mentor)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Mentor"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingMentor(mentor)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Mentor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Department & Assigned Interns Badge */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200">
                    <Building className="h-3 w-3 text-indigo-500" />
                    {mentor.department}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    <Users className="h-3 w-3 text-slate-500" />
                    {assignedInterns} Assigned {assignedInterns === 1 ? 'Intern' : 'Interns'}
                  </span>
                </div>

                {/* Bio */}
                {mentor.bio ? (
                  <p className="text-xs text-slate-600 border-t border-slate-100 pt-2.5 leading-relaxed line-clamp-2">
                    {mentor.bio}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400 border-t border-slate-100 pt-2.5">
                    No bio description provided.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Mentor Dialog Modal */}
      <Dialog
        open={isCreateOpen || !!editingMentor}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingMentor(null);
            resetForm();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{editingMentor ? 'Edit Mentor Details' : 'Add New Mentor'}</DialogTitle>
          <DialogDescription>
            {editingMentor
              ? 'Update supervisor departmental assignment and profile details.'
              : 'Register a new mentor to guide internship cohorts and review task submissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3.5">
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Full Name *</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              className="text-xs h-8"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email Address *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mentor.jane@internship.org"
              className="text-xs h-8"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Department / Domain *</label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Full Stack Engineering & Cloud Architecture"
              className="text-xs h-8"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Professional Bio & Focus</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief background on technical domain, focus areas, and cohort coaching style..."
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingMentor(null);
                resetForm();
              }}
              className="text-xs w-full sm:w-auto min-h-[36px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs w-full sm:w-auto min-h-[36px]"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingMentor
                ? 'Save Changes'
                : 'Create Mentor'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingMentor}
        onOpenChange={(open) => {
          if (!open) setDeletingMentor(null);
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-rose-600">Delete Mentor</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{' '}
            <strong className="text-slate-900">{deletingMentor?.profile?.full_name}</strong>? Mentors
            with active interns should have their interns reassigned first.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletingMentor(null)}
            className="text-xs w-full sm:w-auto min-h-[36px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deletingMentor && deleteMutation.mutate(deletingMentor.id)}
            disabled={deleteMutation.isPending}
            className="text-xs w-full sm:w-auto min-h-[36px]"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Mentor'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
