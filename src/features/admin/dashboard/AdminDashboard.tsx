// src/features/admin/dashboard/AdminDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Users,
  Award,
  CheckSquare,
  Eye,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../api';
import { StatCard } from '../../../components/shared/StatCard';

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: internships = [] } = useQuery({
    queryKey: ['admin', 'internships'],
    queryFn: adminApi.getInternships,
  });

  const cohortData = internships.map((cohort: any) => ({
    name: cohort.name,
    totalTasks: stats?.total_tasks || 0,
    completed: stats?.completed_tasks || 0,
  }));

  const statusDistribution = [
    { name: 'Approved', value: stats?.completed_tasks || 0, color: '#10b981' },
    { name: 'Waiting Review', value: stats?.waiting_reviews || 0, color: '#f59e0b' },
    {
      name: 'In Progress / Pending',
      value: Math.max(0, (stats?.total_tasks || 0) - (stats?.completed_tasks || 0) - (stats?.waiting_reviews || 0)),
      color: '#64748b',
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Platform Administration Overview
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Complete organizational visibility across internships, mentors, intern performance, and compliance audits.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Internships"
          value={stats?.total_internships ?? 0}
          icon={GraduationCap}
          to="/admin/internships"
        />
        <StatCard
          title="Active Interns"
          value={stats?.active_interns ?? 0}
          icon={Users}
          to="/admin/interns"
        />
        <StatCard
          title="Active Mentors"
          value={stats?.active_mentors ?? 0}
          icon={Award}
          to="/admin/mentors"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.total_tasks ?? 0}
          icon={CheckSquare}
          to="/admin/tasks"
        />
        <StatCard
          title="Review Queue"
          value={stats?.waiting_reviews ?? 0}
          icon={Eye}
          to="/admin/reviews"
          className="border-amber-500/30 bg-amber-500/5 font-semibold"
        />
        <StatCard
          title="Completed Work"
          value={stats?.completed_tasks ?? 0}
          icon={CheckCircle2}
          to="/admin/tasks"
          className="border-emerald-500/30 bg-emerald-500/5"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Task Completion Velocity */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Cohort Completion Velocity
            </h3>
            <span className="text-xs text-muted-foreground">Current Active Quarters</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {cohortData.length === 0 || (stats?.total_tasks || 0) === 0 ? (
              <div className="text-center text-xs text-muted-foreground">
                <p>No active cohort tasks recorded yet.</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">Velocity metrics will render once tasks are assigned.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="totalTasks" name="Assigned Tasks" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Approved Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-transparent p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-700 dark:text-slate-300" /> Task Workflow Breakdown
            </h3>
            <span className="text-xs text-muted-foreground">Across All Cohorts</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusDistribution.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground">
                <p>No task distribution data yet.</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">Distribution breakdown appears once tasks are in flight.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {statusDistribution.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {statusDistribution.map((item) => (
                <span key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name} ({item.value})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
