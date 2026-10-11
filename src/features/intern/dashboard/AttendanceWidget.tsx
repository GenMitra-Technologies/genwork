import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Play,
  Pause,
  LogOut,
  CheckCircle2,
  Laptop,
  Building2,
  Calendar,
  Sparkles,
  Send,
} from 'lucide-react';
import { useAttendanceStore } from '../../../stores/attendance.store';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

export function AttendanceWidget() {
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

  // Format elapsed time: hh:mm:ss
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  // Progress towards 4h target
  const targetSeconds = targetHours * 3600; // 4 * 3600 = 14400
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const isTargetAchieved = elapsedSeconds >= targetSeconds;

  const handleOpenCheckOut = () => {
    setShowCheckOutModal(true);
  };

  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryInput.trim()) return;
    checkOut(summaryInput, blockersInput);
    setShowCheckOutModal(false);
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <>
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Daily Attendance & Work Log</h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                  Target: {targetHours}h Shift
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" /> {todayStr}
              </p>
            </div>
          </div>

          {/* Status Badge & Link to Dedicated Page */}
          <div className="flex items-center gap-3">
            <Link
              to="/intern/attendance"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Timesheets & History →
            </Link>

            {isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Shift Completed Today
              </span>
            ) : isCheckedIn ? (
              isOnBreak ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Pause className="h-3.5 w-3.5" /> On Break (Timer Paused)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active Shift Running
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                ⚪ Not Checked In
              </span>
            )}
          </div>
        </div>

        {/* Counter & Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Working Timer Display */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-500 font-medium">Logged Time Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {formattedTime}
              </span>
              <span className="text-xs text-slate-400">/ {targetHours}h 00m</span>
            </div>
          </div>

          {/* Progress Bar toward 4 Hours */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Daily Goal Progress</span>
              <span className="font-semibold text-slate-900">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isTargetAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {isTargetAchieved && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Mandatory 4-hour threshold achieved!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-start md:justify-end gap-2">
            {!isCheckedIn && !isCompletedToday && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  onClick={() => checkIn('remote')}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
                >
                  <Laptop className="h-3.5 w-3.5" /> Check In (Remote)
                </Button>
                <Button
                  onClick={() => checkIn('office')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-slate-700 border-slate-200"
                >
                  <Building2 className="h-3.5 w-3.5" /> Office
                </Button>
              </div>
            )}

            {isCheckedIn && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  onClick={toggleBreak}
                  variant="outline"
                  size="sm"
                  className="text-xs text-slate-700 border-slate-200 gap-1"
                >
                  {isOnBreak ? (
                    <>
                      <Play className="h-3.5 w-3.5 text-emerald-600" /> Resume Shift
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5 text-amber-600" /> Take Break
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleOpenCheckOut}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5" /> Check Out
                </Button>
              </div>
            )}

            {isCompletedToday && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Logged: {dailySummary ? `"${dailySummary.slice(0, 32)}..."` : 'Standup submitted'}</span>
                <Button
                  onClick={resetDay}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Restart
                </Button>
              </div>
            )}
          </div>
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
                  placeholder="e.g. Worked on Supabase RLS policies, pushed 2 commits, fixed responsive layout bugs..."
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
                  placeholder="e.g. Need mentor clarification on task #4 deliverable format..."
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
                  <Send className="h-3.5 w-3.5" /> Submit Log & Check Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
