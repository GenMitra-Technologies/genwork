// src/features/admin/internships/InternshipsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../api';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatDateOnly } from '../../../lib/formatters';

export function InternshipsPage() {
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-08-31');

  const { data: cohorts = [], isLoading } = useQuery({
    queryKey: ['admin-internships'],
    queryFn: adminApi.getInternships,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await adminApi.createInternship({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
      });
    },
    onSuccess: () => {
      setOpenModal(false);
      setName('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Internship Cohorts</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create, schedule, and track cohorts and their respective start/end dates.
          </p>
        </div>

        <Button onClick={() => setOpenModal(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Create Cohort
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cohorts.map((cohort: any) => (
          <div
            key={cohort.id}
            className="rounded-xl border bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{cohort.code}</span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">{cohort.name}</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 capitalize">
                {cohort.status}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{cohort.description}</p>

            <div className="flex items-center gap-2 pt-3 border-t text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>
                {formatDateOnly(cohort.start_date)} – {formatDateOnly(cohort.end_date)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogHeader>
          <DialogTitle>Create New Internship Cohort</DialogTitle>
          <DialogDescription>Define cohort title, description, and timeline bounds.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Cohort Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter 2026 AI & Systems Cohort"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on this cohort's engineering objectives..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Start Date *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">End Date *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Cohort'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
