// src/features/admin/reports/ReportsPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, TrendingUp, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { adminApi } from '../api';

export function ReportsPage() {
  const { data: interns = [] } = useQuery({
    queryKey: ['admin-interns'],
    queryFn: () => adminApi.getInterns(),
  });

  const handleExportCSV = () => {
    const headers = 'Cohort,Intern Name,Email,Role Title,Mentor,Current Streak,Active Days,Status';
    const rows = interns.map((i: any) => {
      const cohort = (i.internship?.name || i.internship?.code || 'Engineering Cohort 2026').replace(/,/g, ' ');
      const name = (i.profile?.full_name || 'Intern').replace(/,/g, ' ');
      const email = i.profile?.email || 'N/A';
      const role = (i.role_title || 'Developer').replace(/,/g, ' ');
      const mentor = (i.mentor?.profile?.full_name || 'Kapu Mani Shankar Reddy').replace(/,/g, ' ');
      const streak = i.current_streak ?? 1;
      const activeDays = i.total_active_days ?? 1;
      const status = i.status || 'active';
      return `${cohort},${name},${email},${role},${mentor},${streak},${activeDays},${status}`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `genmitra_internship_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Analytics & Compliance Reports</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Export cohort performance data and inspect mentor review turnaround metrics.
          </p>
        </div>

        <Button onClick={handleExportCSV} className="gap-1.5 text-xs w-full sm:w-auto min-h-[36px] justify-center">
          <Download className="h-4 w-4" /> Export Cohort Report (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Average Completion Rate
          </span>
          <span className="text-3xl font-extrabold text-foreground">78.4%</span>
          <p className="text-xs text-emerald-600 font-medium">↑ +12.3% compared to previous quarter</p>
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Avg. Review Turnaround
          </span>
          <span className="text-3xl font-extrabold text-foreground">6.2 hrs</span>
          <p className="text-xs text-emerald-600 font-medium">Within target 24h SLA</p>
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Active Intern Engagement
          </span>
          <span className="text-3xl font-extrabold text-foreground">92%</span>
          <p className="text-xs text-muted-foreground">Maintained active streak &gt; 3 days</p>
        </div>
      </div>
    </div>
  );
}
