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

const COHORT_DATA = [
  { name: 'Summer Engineering (INT-001)', totalTasks: 18, completed: 12 },
  { name: 'Fall Design & Mobile (INT-002)', totalTasks: 12, completed: 6 },
];

const STATUS_DISTRIBUTION = [
  { name: 'Approved', value: 18, color: '#10b981' },
  { name: 'Waiting Review', value: 5, color: '#f59e0b' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'Changes Requested', value: 3, color: '#f97316' },
  { name: 'Pending', value: 6, color: '#71717a' },
];

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: adminApi.getDashboardStats,
  });

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
          value={stats?.total_internships ?? 2}
          icon={GraduationCap}
          to="/admin/internships"
        />
        <StatCard
          title="Active Interns"
          value={stats?.active_interns ?? 6}
          icon={Users}
          to="/admin/interns"
        />
        <StatCard
          title="Active Mentors"
          value={stats?.active_mentors ?? 2}
          icon={Award}
          to="/admin/mentors"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.total_tasks ?? 12}
          icon={CheckSquare}
          to="/admin/tasks"
        />
        <StatCard
          title="Review Queue"
          value={stats?.waiting_reviews ?? 2}
          icon={Eye}
          to="/admin/reviews"
          className="border-amber-500/30 bg-amber-500/5 font-semibold"
        />
        <StatCard
          title="Completed Work"
          value={stats?.completed_tasks ?? 4}
          icon={CheckCircle2}
          to="/admin/tasks"
          className="border-emerald-500/30 bg-emerald-500/5"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Task Completion Velocity */}
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Cohort Completion Velocity
            </h3>
            <span className="text-xs text-muted-foreground">Current Active Quarters</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COHORT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="totalTasks" name="Assigned Tasks" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Approved Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" /> Task Workflow Breakdown
            </h3>
            <span className="text-xs text-muted-foreground">Across All Cohorts</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={STATUS_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {STATUS_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {STATUS_DISTRIBUTION.map((item) => (
              <span key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name} ({item.value})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
