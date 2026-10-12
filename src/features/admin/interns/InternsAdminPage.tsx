// src/features/admin/interns/InternsAdminPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserCheck, ArrowRightLeft, Building, Download } from 'lucide-react';
import { adminApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

export function InternsAdminPage() {
  const queryClient = useQueryClient();
  const [reassignIntern, setReassignIntern] = useState<any | null>(null);
  const [newMentorId, setNewMentorId] = useState<string>('10000000-0000-0000-0000-000000000002');

  const { data: interns = [], isLoading } = useQuery({
    queryKey: ['admin-interns'],
    queryFn: adminApi.getInterns,
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ['admin-mentors'],
    queryFn: adminApi.getMentors,
  });

  const exportCsv = () => {
    if (!interns || interns.length === 0) return;
    const headers = ['Full Name', 'Email', 'Role Title', 'Company', 'Cohort', 'Assigned Mentor', 'Streak Days'];
    const rows = interns.map((intern: any) => [
      `"${(intern.profile?.full_name || '').replace(/"/g, '""')}"`,
      `"${(intern.profile?.email || '').replace(/"/g, '""')}"`,
      `"${(intern.role_title || '').replace(/"/g, '""')}"`,
      `"${(intern.company_name || '').replace(/"/g, '""')}"`,
      `"${(intern.internship?.name || '').replace(/"/g, '""')}"`,
      `"${(intern.mentor?.profile?.full_name || '').replace(/"/g, '""')}"`,
      `"${intern.current_streak || 0}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genmitra-interns-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const moveMentorMutation = useMutation({
    mutationFn: async () => {
      if (!reassignIntern || !newMentorId) return;
      await adminApi.moveInternToMentor(reassignIntern.id, newMentorId);
    },
    onSuccess: () => {
      setReassignIntern(null);
      queryClient.invalidateQueries({ queryKey: ['admin-interns'] });
      queryClient.invalidateQueries({ queryKey: ['my-interns'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interns Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage intern placements, mentor assignments, and cohort affiliations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={isLoading || interns.length === 0}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV ({interns.length})
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Intern</th>
                <th className="p-4">Role Title & Company</th>
                <th className="p-4">Cohort</th>
                <th className="p-4">Assigned Mentor</th>
                <th className="p-4">Streak</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {interns.map((intern: any) => (
                <tr key={intern.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={intern.profile?.avatar_url} name={intern.profile?.full_name || 'Intern'} size="sm" />
                      <div>
                        <p className="font-semibold text-foreground">{intern.profile?.full_name}</p>
                        <p className="text-muted-foreground text-[11px]">{intern.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-foreground">{intern.role_title}</p>
                    <p className="text-muted-foreground text-[11px]">{intern.company_name}</p>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-[11px]">
                    {intern.internship?.name || 'Cohort 1'}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {intern.mentor?.profile?.full_name || 'Unassigned'}
                  </td>
                  <td className="p-4 font-semibold text-orange-600">
                    🔥 {intern.current_streak}d
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReassignIntern(intern)}
                      className="h-8 text-[11px] gap-1"
                    >
                      <ArrowRightLeft className="h-3 w-3" /> Reassign Mentor
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Mentor Dialog */}
      <Dialog open={!!reassignIntern} onOpenChange={() => setReassignIntern(null)}>
        <DialogHeader>
          <DialogTitle>Reassign Intern Mentor</DialogTitle>
          <DialogDescription>
            Change supervisor for {reassignIntern?.profile?.full_name}. This writes to mentor_assignment_history and dispatches notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">New Mentor</label>
            <select
              value={newMentorId}
              onChange={(e) => setNewMentorId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              {mentors.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.profile?.full_name} ({m.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setReassignIntern(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => moveMentorMutation.mutate()}
            disabled={moveMentorMutation.isPending}
          >
            {moveMentorMutation.isPending ? 'Reassigning...' : 'Confirm Reassignment'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
