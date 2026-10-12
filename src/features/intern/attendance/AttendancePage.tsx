// src/features/intern/attendance/AttendancePage.tsx
import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Laptop,
  Building2,
  Pause,
  Play,
  LogOut,
  Sparkles,
  FileText,
  CalendarCheck,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useAttendanceStore } from '../../../stores/attendance.store';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

interface AttendanceRecord {
  id: string;
  date: string;
  dayName: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  mode: 'remote';
  status: 'present' | 'half_day' | 'in_progress';
  summary: string;
  blockers?: string;
}

const HISTORICAL_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    date: '10 Oct 2026',
    dayName: 'Friday',
    checkIn: '09:30 AM',
    checkOut: '02:00 PM',
    duration: '4h 30m',
    mode: 'remote',
    status: 'present',
    summary: 'Refactored internship dashboard components to match new tokens and fixed horizontal overflow.',
    blockers: 'None',
  },
  {
    id: 'att-2',
    date: '09 Oct 2026',
    dayName: 'Thursday',
    checkIn: '10:00 AM',
    checkOut: '02:15 PM',
    duration: '4h 15m',
    mode: 'remote',
    status: 'present',
    summary: 'Configured Supabase test credentials (test@intern / 123) and session fallback logic.',
    blockers: 'None',
  },
  {
    id: 'att-3',
    date: '08 Oct 2026',
    dayName: 'Wednesday',
    checkIn: '09:45 AM',
    checkOut: '01:50 PM',
    duration: '4h 05m',
    mode: 'remote',
    status: 'present',
    summary: 'Created unit test suite with 15 test cases for deliverable validators and deadline extensions.',
    blockers: 'None',
  },
  {
    id: 'att-4',
    date: '07 Oct 2026',
    dayName: 'Tuesday',
    checkIn: '10:15 AM',
    checkOut: '02:30 PM',
    duration: '4h 15m',
    mode: 'remote',
    status: 'present',
    summary: 'Designed deliverable inspection side-sheet modal with commit summary and preview iframe.',
    blockers: 'None',
  },
  {
    id: 'att-5',
    date: '06 Oct 2026',
    dayName: 'Monday',
    checkIn: '09:30 AM',
    checkOut: '02:00 PM',
    duration: '4h 30m',
    mode: 'remote',
    status: 'present',
    summary: 'Weekly sprint planning and milestone review with Mentor Alex Rivera.',
    blockers: 'None',
  },
  {
    id: 'att-6',
    date: '03 Oct 2026',
    dayName: 'Friday',
    checkIn: '11:00 AM',
    checkOut: '02:30 PM',
    duration: '3h 30m',
    mode: 'remote',
    status: 'half_day',
    summary: 'Worked on database migration schema scripts.',
    blockers: 'Internet disruption in morning',
  },
];

export function AttendancePage() {
  const {
    isCheckedIn,
    isOnBreak,
    checkInTime,
    elapsedSeconds,
    targetHours,
    workMode,
    isCompletedToday,
    dailySummary,
    checkIn,
    checkOut,
    toggleBreak,
    resetDay,
  } = useAttendanceStore();

  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [blockersInput, setBlockersInput] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'remote' | 'office'>('all');

  // Format active shift
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  const targetSeconds = targetHours * 3600; // 4 hours = 14400s
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const isTargetAchieved = elapsedSeconds >= targetSeconds;

  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryInput.trim()) return;
    checkOut(summaryInput, blockersInput);
    setShowCheckOutModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['Date,Day,Work Mode,Check-In,Check-Out,Duration,Status,Summary,Blockers\n'];
    const rows = HISTORICAL_RECORDS.map(
      (r) =>
        `"${r.date}","${r.dayName}","${r.mode}","${r.checkIn}","${r.checkOut}","${r.duration}","${r.status}","${r.summary.replace(/"/g, '""')}","${(r.blockers || '').replace(/"/g, '""')}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = HISTORICAL_RECORDS.filter((r) => {
    if (filterMode === 'all') return true;
    return r.mode === filterMode;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance & Shifts</h1>
            <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Target: {targetHours}h Shift / Day
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log your daily internship presence, track working hours, and review timesheets.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" /> Export Timesheet (CSV)
        </Button>
      </div>

      {/* 2. Live Shift Punch Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Today's Shift Punch Clock</h2>
              <p className="text-xs text-slate-500">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> Shift Completed Today
              </span>
            ) : isCheckedIn ? (
              isOnBreak ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Pause className="h-4 w-4" /> On Short Break (Timer Paused)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Shift Active (Online Remote)
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                ⚪ Not Checked In Today
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Timer Display */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Logged Working Time</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
                {formattedTime}
              </span>
              <span className="text-xs text-slate-400">/ {targetHours}h 00m target</span>
            </div>
          </div>

          {/* Progress toward 4-hour target */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-600">Daily Target Completion</span>
              <span className="font-semibold text-slate-900">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isTargetAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {isTargetAchieved && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Mandatory 4-hour threshold reached!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-start lg:justify-end gap-2.5">
            {!isCheckedIn && !isCompletedToday && (
              <Button
                onClick={() => checkIn()}
                size="default"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm font-semibold text-xs w-full lg:w-auto"
              >
                <Laptop className="h-4 w-4" /> Check In (Online Remote)
              </Button>
            )}

            {isCheckedIn && (
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Button
                  onClick={toggleBreak}
                  variant="outline"
                  size="default"
                  className="text-xs text-slate-700 border-slate-200 gap-1.5"
                >
                  {isOnBreak ? (
                    <>
                      <Play className="h-4 w-4 text-emerald-600" /> Resume Shift
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 text-amber-600" /> Take Break
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowCheckOutModal(true)}
                  size="default"
                  className="bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs font-semibold shadow-sm"
                >
                  <LogOut className="h-4 w-4" /> Check Out
                </Button>
              </div>
            )}

            {isCompletedToday && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  Standup logged for today
                </span>
                <Button
                  onClick={resetDay}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Restart Shift
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Monthly Metrics Overview (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total hours this month</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">84.5h</p>
          <p className="text-[11px] text-slate-400">Target: 80h mandatory / month</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Attendance rate</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-emerald-700 tabular-nums">96.2%</p>
          <p className="text-[11px] text-slate-400">21 full days of 22 working days</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Average daily shift</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">4.2h</p>
          <p className="text-[11px] text-slate-400">Above 4h required minimum</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Active work streak</span>
            <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-orange-600 tabular-nums">4 days</p>
          <p className="text-[11px] text-slate-400">Consecutive verified days</p>
        </div>
      </div>

      {/* 4. Historical Attendance Timesheet Log */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Attendance Timesheet Logs</h3>
            <p className="text-xs text-slate-500">Records of past shifts, work modes, and submitted standups</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Laptop className="h-3.5 w-3.5" /> 100% Online Remote Shifts
            </span>
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 px-3">Mode</th>
                <th className="pb-3 px-3">Check-In</th>
                <th className="pb-3 px-3">Check-Out</th>
                <th className="pb-3 px-3">Duration</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 pl-4">Daily Standup Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Today's running record if checked in */}
              {isCheckedIn && (
                <tr className="bg-indigo-50/40">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    Today (In Progress)
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 capitalize">
                      {workMode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono">
                    {checkInTime ? new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </td>
                  <td className="py-3 px-3 text-slate-400">—</td>
                  <td className="py-3 px-3 font-mono font-semibold text-indigo-700">
                    {formattedTime}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 italic">
                    Shift currently in progress...
                  </td>
                </tr>
              )}

              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-slate-900">{r.date}</p>
                    <p className="text-[11px] text-slate-400">{r.dayName}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Laptop className="h-3 w-3" /> Online Remote
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-mono">{r.checkIn}</td>
                  <td className="py-3.5 px-3 text-slate-700 font-mono">{r.checkOut}</td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">{r.duration}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.status === 'present' ? 'Present' : 'Half Day'}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 max-w-xs">
                    <p className="text-slate-800 truncate" title={r.summary}>
                      {r.summary}
                    </p>
                    {r.blockers && r.blockers !== 'None' && (
                      <p className="text-[10px] text-rose-500 truncate" title={`Blocker: ${r.blockers}`}>
                        Blocker: {r.blockers}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check Out & Standup Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-slate-900">Check-Out & Daily Standup</h3>
                <p className="text-xs text-slate-500">
                  Total shift time: <strong className="text-slate-800">{formattedTime}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCheckOut} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  What did you complete during your shift today? <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  placeholder="e.g. Completed tasks, tested endpoints, fixed UI issues..."
                  rows={3}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Any blockers or items needing mentor review tomorrow? (Optional)
                </label>
                <Textarea
                  value={blockersInput}
                  onChange={(e) => setBlockersInput(e.target.value)}
                  placeholder="e.g. None / Need clarification on deliverable format..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCheckOutModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  Submit Log & Check Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
