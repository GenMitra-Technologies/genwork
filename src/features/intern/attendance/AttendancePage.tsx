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
  RefreshCw,
  Flame,
} from 'lucide-react';
import { useAttendanceStore } from '../../../stores/attendance.store';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import {
  AttendanceRecord,
  getStoredAttendanceRecords,
  saveStoredAttendanceRecords,
  calculateAttendanceMetrics,
  toggleYesterdayAttendanceRecord,
  formatDisplayDate,
  formatRawDate,
  useIsDesktopDevice,
  isDesktopDevice,
} from '../../../lib/attendanceService';

export function AttendancePage() {
  const isDesktop = useIsDesktopDevice();
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

  const [records, setRecords] = useState<AttendanceRecord[]>(() => getStoredAttendanceRecords());
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [blockersInput, setBlockersInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'half_day' | 'absent'>('all');

  const handleCheckIn = () => {
    if (!isDesktopDevice()) {
      alert('Shift punch clock is restricted to PC devices only. Please log in from a laptop or desktop computer.');
      return;
    }
    checkIn();
  };

  // Format active shift
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  const targetSeconds = targetHours * 3600; // 4 hours = 14400s
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const isTargetAchieved = elapsedSeconds >= targetSeconds;

  // Strict metric computation including yesterday audit & streaks
  const metrics = calculateAttendanceMetrics(
    records,
    isCompletedToday,
    isCheckedIn,
    elapsedSeconds,
    targetHours
  );

  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryInput.trim()) return;
    checkOut(summaryInput, blockersInput);

    const now = new Date();
    const durationHours = Math.floor(elapsedSeconds / 3600);
    const durationMinutes = Math.floor((elapsedSeconds % 3600) / 60);
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      internId: '20000000-0000-0000-0000-000000000001',
      date: formatDisplayDate(now),
      rawDate: formatRawDate(now),
      dayName: now.toLocaleDateString('en-US', { weekday: 'long' }),
      checkIn: checkInTime ? new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
      checkOut: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${durationHours}h ${String(durationMinutes).padStart(2, '0')}m`,
      durationSeconds: elapsedSeconds,
      mode: 'remote',
      status: elapsedSeconds >= targetSeconds ? 'present' : 'half_day',
      summary: summaryInput,
      blockers: blockersInput || 'None',
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    saveStoredAttendanceRecords(updated);
    setShowCheckOutModal(false);
  };

  const handleToggleYesterday = () => {
    const updated = toggleYesterdayAttendanceRecord(records);
    setRecords(updated);
  };

  const handleExportCSV = () => {
    const headers = ['Date,Day,Work Mode,Check-In,Check-Out,Duration,Status,Summary,Blockers\n'];
    const rows = records.map(
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

  const filteredRecords = records.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
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
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm space-y-6">
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

          {/* Action Buttons & PC Device Restriction */}
          <div className="flex flex-col items-start lg:items-end justify-center gap-2">
            {/* Mobile Device Restriction Alert */}
            <div className="flex lg:hidden rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 text-xs text-amber-900 shadow-2xs items-start gap-2.5 w-full">
              <Laptop className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                  PC / Desktop Device Required
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                    Desktop Only
                  </span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Attendance check-in and check-out can only be accessed from a PC or laptop computer. Mobile device punch actions are restricted.
                </p>
              </div>
            </div>

            {/* Desktop Action Buttons (Visible and clickable on PC) */}
            <div className="hidden lg:flex items-center justify-end gap-2.5 w-full">
              {!isCheckedIn && !isCompletedToday && (
                <Button
                  onClick={handleCheckIn}
                  size="default"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm font-semibold text-xs min-h-[42px] justify-center"
                >
                  <Laptop className="h-4 w-4" /> Check In (Online Remote)
                </Button>
              )}

              {isCheckedIn && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleBreak}
                    variant="outline"
                    size="default"
                    className="text-xs text-slate-700 border-slate-200 gap-1.5 min-h-[42px] justify-center"
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
                    className="bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs font-semibold shadow-sm min-h-[42px] justify-center"
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
      </div>

      {/* 2.5. Yesterday Attendance Audit & Streak Validation Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              metrics.yesterdayStatus === 'absent'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            {metrics.yesterdayStatus === 'absent' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Yesterday's Attendance Audit ({metrics.yesterdayDateFormatted})
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  metrics.yesterdayStatus === 'absent'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {metrics.yesterdayStatus === 'absent' ? 'Absent (No Check-In & Check-Out)' : 'Present & Checked Out ✓'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics.yesterdayStatus === 'absent'
                ? 'Attendance was not completed yesterday. Streak is reset to 0 until today is checked in & checked out.'
                : `Consecutive attendance verified. Current active streak: ${metrics.currentStreak} day${metrics.currentStreak === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={handleToggleYesterday}
            variant="outline"
            size="sm"
            className="text-[11px] h-7 px-2.5 gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            title="Toggle yesterday between Present and Absent to verify streak behavior"
          >
            <RefreshCw className="h-3 w-3 text-slate-400" />
            <span>Simulate Yesterday ({metrics.yesterdayStatus === 'absent' ? 'Mark Present' : 'Mark Absent'})</span>
          </Button>
        </div>
      </div>

      {/* 3. Monthly Metrics Overview (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Total hours this month</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">{metrics.totalHours}h</p>
          <p className="text-[11px] text-slate-400">Target: {targetHours * 20}h mandatory / month</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Attendance rate</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-emerald-700 tabular-nums">{metrics.attendanceRate}%</p>
          <p className="text-[11px] text-slate-400">
            {metrics.presentDaysCount} compliant · {metrics.absentDaysCount} absent of {metrics.totalLoggedDays} days
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Average daily shift</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">{metrics.avgShiftHours}h</p>
          <p className="text-[11px] text-slate-400">{targetHours}h required daily shift</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Active work streak</span>
            <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-orange-600 tabular-nums">
            {metrics.currentStreak} day{metrics.currentStreak === 1 ? '' : 's'}
          </p>
          <p className="text-[11px] text-slate-400">Requires daily check-in & check-out</p>
        </div>
      </div>

      {/* 4. Historical Attendance Timesheet Log */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Attendance Timesheet Logs</h3>
            <p className="text-xs text-slate-500">Records of past shifts, work modes, present and absent days</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setFilterStatus('present')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterStatus === 'present'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Present ({records.filter((r) => r.status === 'present').length})
              </button>
              <button
                onClick={() => setFilterStatus('half_day')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterStatus === 'half_day'
                    ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Half Day ({records.filter((r) => r.status === 'half_day').length})
              </button>
              <button
                onClick={() => setFilterStatus('absent')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterStatus === 'absent'
                    ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absent ({records.filter((r) => r.status === 'absent').length})
              </button>
            </div>
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
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
                    Shift currently in progress (Requires check out to complete)...
                  </td>
                </tr>
              )}

              {filteredRecords.map((r) => {
                const isAbsent = r.status === 'absent';

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isAbsent ? 'bg-rose-50/25 hover:bg-rose-50/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <p className={`font-semibold ${isAbsent ? 'text-slate-800' : 'text-slate-900'}`}>{r.date}</p>
                      <p className="text-[11px] text-slate-400">{r.dayName}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      {isAbsent || r.mode === '—' || !r.mode ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Laptop className="h-3 w-3" /> Online Remote
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-mono">{r.checkIn || '—'}</td>
                    <td className="py-3.5 px-3 text-slate-700 font-mono">{r.checkOut || '—'}</td>
                    <td className={`py-3.5 px-3 font-mono font-semibold ${isAbsent || r.duration === '—' ? 'text-slate-400' : 'text-slate-800'}`}>
                      {r.duration || '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      {isAbsent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="h-3 w-3 text-rose-500" />
                          Absent
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.status === 'present' ? 'Present' : 'Half Day'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 max-w-xs">
                      {r.summary === '—' || !r.summary ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <p
                          className={`truncate ${isAbsent ? 'text-rose-700 font-medium' : 'text-slate-800'}`}
                          title={r.summary}
                        >
                          {r.summary}
                        </p>
                      )}
                      {r.blockers && r.blockers !== 'None' && (
                        <p
                          className="text-[10px] text-rose-500 truncate"
                          title={`Blocker: ${r.blockers}`}
                        >
                          Blocker: {r.blockers}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && !isCheckedIn && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-80" />
                    <p className="font-medium text-slate-600">No records matching filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Punch in with the Shift Clock above to start tracking your working hours from today.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check Out & Standup Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
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

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-2">
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
