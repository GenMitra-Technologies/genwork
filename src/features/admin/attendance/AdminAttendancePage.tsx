// src/features/admin/attendance/AdminAttendancePage.tsx
import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Search,
  Filter,
  CalendarCheck,
  TrendingUp,
  SlidersHorizontal,
  Building,
  GraduationCap,
  ShieldCheck,
  Edit3,
  X,
  Save,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Avatar } from '../../../components/shared/Avatar';

interface AdminInternAttendance {
  id: string;
  name: string;
  email: string;
  cohort: string;
  mentor: string;
  todayStatus: 'active' | 'completed' | 'absent';
  todayHours: string;
  monthHours: number; // e.g. 84.5
  attendanceRate: number; // e.g. 96.2
  isCompliant: boolean;
}

const INITIAL_ADMIN_DATA: AdminInternAttendance[] = [
  {
    id: 'int-1',
    name: 'David Kim',
    email: 'intern.david@internship.org',
    cohort: 'Summer 2026 Engineering Cohort',
    mentor: 'Alex Rivera',
    todayStatus: 'active',
    todayHours: '3h 45m',
    monthHours: 84.5,
    attendanceRate: 96.2,
    isCompliant: true,
  },
  {
    id: 'int-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@internship.org',
    cohort: 'Summer 2026 Engineering Cohort',
    mentor: 'Alex Rivera',
    todayStatus: 'active',
    todayHours: '2h 50m',
    monthHours: 78.0,
    attendanceRate: 91.0,
    isCompliant: true,
  },
  {
    id: 'int-3',
    name: 'Alex Chen',
    email: 'alex.chen@internship.org',
    cohort: 'Summer 2026 Cloud Infrastructure',
    mentor: 'Marcus Vance',
    todayStatus: 'completed',
    todayHours: '4h 15m',
    monthHours: 86.0,
    attendanceRate: 98.0,
    isCompliant: true,
  },
  {
    id: 'int-4',
    name: 'Rahul Verma',
    email: 'rahul.verma@internship.org',
    cohort: 'Summer 2026 Engineering Cohort',
    mentor: 'Alex Rivera',
    todayStatus: 'absent',
    todayHours: '0h 00m',
    monthHours: 62.0,
    attendanceRate: 78.5,
    isCompliant: false,
  },
  {
    id: 'int-5',
    name: 'Emily Watson',
    email: 'emily.w@internship.org',
    cohort: 'Summer 2026 Cloud Infrastructure',
    mentor: 'Marcus Vance',
    todayStatus: 'completed',
    todayHours: '4h 30m',
    monthHours: 88.0,
    attendanceRate: 100.0,
    isCompliant: true,
  },
];

export function AdminAttendancePage() {
  const [data, setData] = useState<AdminInternAttendance[]>(INITIAL_ADMIN_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [regularizeModal, setRegularizeModal] = useState<AdminInternAttendance | null>(null);
  const [adjustHoursInput, setAdjustHoursInput] = useState('4.0');
  const [adjustReason, setAdjustReason] = useState('System / Hardware punch issue');

  const handleSaveRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regularizeModal) return;
    const addedHours = parseFloat(adjustHoursInput) || 0;
    setData((prev) =>
      prev.map((item) =>
        item.id === regularizeModal.id
          ? {
              ...item,
              monthHours: parseFloat((item.monthHours + addedHours).toFixed(1)),
              todayStatus: 'completed',
              todayHours: `${adjustHoursInput}h (Adjusted)`,
              isCompliant: true,
            }
          : item
      )
    );
    setRegularizeModal(null);
  };

  const handleExportCSV = () => {
    const headers = ['Intern Name,Email,Cohort,Assigned Mentor,Today Status,Today Hours,Monthly Hours Logged,Attendance Rate,4h Compliant\n'];
    const rows = data.map(
      (r) =>
        `"${r.name}","${r.email}","${r.cohort}","${r.mentor}","${r.todayStatus}","${r.todayHours}","${r.monthHours}h","${r.attendanceRate}%","${r.isCompliant ? 'Yes' : 'No'}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-cohort-attendance-timesheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mentor.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (cohortFilter !== 'all' && item.cohort !== cohortFilter) return false;
    return true;
  });

  const totalCohortHours = data.reduce((acc, curr) => acc + curr.monthHours, 0).toFixed(1);
  const activeTodayCount = data.filter((d) => d.todayStatus === 'active' || d.todayStatus === 'completed').length;
  const compliantCount = data.filter((d) => d.isCompliant).length;
  const overallRate = (data.reduce((acc, curr) => acc + curr.attendanceRate, 0) / data.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cohort Attendance & Timesheet Administration</h1>
            <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Online Remote Shifts • 4h Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervise all cohort check-in logs, regularize missing punch entries, and export certified timesheets.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" /> Export Company Timesheets (CSV)
        </Button>
      </div>

      {/* 2. Top Metrics (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Cohort attendance</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-emerald-700 tabular-nums">{overallRate}%</p>
          <p className="text-[11px] text-slate-400">Average across active cohorts</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Active today</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-indigo-700 tabular-nums">
            {activeTodayCount} <span className="text-sm font-normal text-slate-400">/ {data.length} interns</span>
          </p>
          <p className="text-[11px] text-slate-400">Punched in or completed shift</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total hours logged</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">{totalCohortHours}h</p>
          <p className="text-[11px] text-slate-400">Cumulative internship work time</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">4h Target compliance</span>
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-purple-700 tabular-nums">
            {compliantCount} <span className="text-sm font-normal text-slate-400">/ {data.length} interns</span>
          </p>
          <p className="text-[11px] text-slate-400">Meeting minimum requirements</p>
        </div>
      </div>

      {/* 3. Cohort Timesheet Control Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Cohort Timesheet Master Roster</h3>
            <p className="text-xs text-slate-500">Manage all registered interns, verify hours, and adjust missed punches</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search intern or mentor..."
                className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Cohort Dropdown Filter */}
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Cohorts</option>
              <option value="Summer 2026 Engineering Cohort">Engineering Cohort</option>
              <option value="Summer 2026 Cloud Infrastructure">Cloud Infrastructure</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Intern</th>
                <th className="pb-3 px-3">Cohort</th>
                <th className="pb-3 px-3">Mentor</th>
                <th className="pb-3 px-3">Today Shift</th>
                <th className="pb-3 px-3">Logged (Month)</th>
                <th className="pb-3 px-3">Rate</th>
                <th className="pb-3 px-3">Compliance</th>
                <th className="pb-3 pl-3 text-right">Regularize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Intern Profile */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.name} size="md" />
                      <div>
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        <p className="text-[11px] text-slate-400">{row.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cohort */}
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      <GraduationCap className="h-3 w-3 text-indigo-600" /> {row.cohort.replace('Summer 2026 ', '')}
                    </span>
                  </td>

                  {/* Mentor */}
                  <td className="py-3.5 px-3 text-slate-700">{row.mentor}</td>

                  {/* Today Status & Hours */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          row.todayStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.todayStatus === 'completed'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.todayStatus === 'active' && 'Punched In'}
                        {row.todayStatus === 'completed' && 'Completed'}
                        {row.todayStatus === 'absent' && 'Absent'}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500">{row.todayHours}</p>
                    </div>
                  </td>

                  {/* Month Hours */}
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-900">
                    {row.monthHours}h <span className="text-[10px] text-slate-400 font-normal">/ 80h</span>
                  </td>

                  {/* Rate */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-semibold ${
                        row.attendanceRate >= 90 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {row.attendanceRate}%
                    </span>
                  </td>

                  {/* Compliance */}
                  <td className="py-3.5 px-3">
                    {row.isCompliant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Certified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="h-3 w-3" /> At Risk (&lt;80h)
                      </span>
                    )}
                  </td>

                  {/* Regularization Override Button */}
                  <td className="py-3.5 pl-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRegularizeModal(row)}
                      className="h-6 px-2 text-[10px] text-slate-700 border-slate-200 hover:bg-slate-100 gap-1"
                    >
                      <Edit3 className="h-3 w-3" /> Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Regularization Modal */}
      {regularizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-slate-900">Regularize Punch Entry</h3>
                <p className="text-xs text-slate-500">
                  Override / credit shift hours for <strong>{regularizeModal.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setRegularizeModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRegularization} className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Current Month Total:</span>
                  <strong className="text-slate-900">{regularizeModal.monthHours}h</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Attendance Rate:</span>
                  <strong className="text-slate-900">{regularizeModal.attendanceRate}%</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Hours to Credit / Adjust</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="8.0"
                  value={adjustHoursInput}
                  onChange={(e) => setAdjustHoursInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Administrative Justification / Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="System / Hardware punch issue">System / Hardware punch issue</option>
                  <option value="Approved on-site / offline field visit">Approved on-site / offline field visit</option>
                  <option value="Emergency medical leave adjustment">Emergency medical leave adjustment</option>
                  <option value="Mentor requested timesheet correction">Mentor requested timesheet correction</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setRegularizeModal(null)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Apply Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
