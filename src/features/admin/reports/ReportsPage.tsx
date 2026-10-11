// src/features/admin/reports/ReportsPage.tsx
import React from 'react';
import { Download, FileSpreadsheet, TrendingUp, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function ReportsPage() {
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Cohort,Intern Name,Role Title,Mentor,Current Streak,Approved Tasks,Completion Rate',
        'Summer 2026 Engineering,David Kim,Full Stack Intern,Alex Rivera,4,2,66.7%',
        'Summer 2026 Engineering,Priya Patel,Frontend Intern,Alex Rivera,2,3,100%',
        'Summer 2026 Engineering,Marcus Vance,Backend Intern,Alex Rivera,1,1,100%',
        'Fall 2026 Design & Mobile,Chloe Bennett,UI/UX Intern,Elena Rostova,5,1,100%',
        'Fall 2026 Design & Mobile,Liam O Connor,Mobile Intern,Elena Rostova,0,0,0%',
        'Fall 2026 Design & Mobile,Aisha Al-Mansoor,QA Intern,Elena Rostova,3,0,0%',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `internship_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics & Compliance Reports</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Export cohort performance data and inspect mentor review turnaround metrics.
          </p>
        </div>

        <Button onClick={handleExportCSV} className="gap-1.5 text-xs">
          <Download className="h-4 w-4" /> Export Cohort Report (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Average Completion Rate
          </span>
          <span className="text-3xl font-extrabold text-foreground">78.4%</span>
          <p className="text-xs text-emerald-600 font-medium">↑ +12.3% compared to previous quarter</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Avg. Review Turnaround
          </span>
          <span className="text-3xl font-extrabold text-foreground">6.2 hrs</span>
          <p className="text-xs text-emerald-600 font-medium">Within target 24h SLA</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-2">
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
