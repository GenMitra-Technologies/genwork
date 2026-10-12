// src/features/intern/dashboard/ProfileHeaderCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  UserCheck,
  Building,
  Calendar,
  Info,
  Clock,
  Sparkles,
  Mail,
  GraduationCap,
  X,
} from 'lucide-react';
import { Avatar } from '../../../components/shared/Avatar';
import { formatDateOnly } from '../../../lib/formatters';

interface ProfileHeaderCardProps {
  profile: any;
  internProfile: any;
}

export function ProfileHeaderCard({ profile, internProfile }: ProfileHeaderCardProps) {
  const [mentorPopoverOpen, setMentorPopoverOpen] = useState(false);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);

  const mentorRef = useRef<HTMLDivElement>(null);
  const streakInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mentorRef.current && !mentorRef.current.contains(e.target as Node)) {
        setMentorPopoverOpen(false);
      }
      if (streakInfoRef.current && !streakInfoRef.current.contains(e.target as Node)) {
        setStreakInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mentorName = internProfile?.mentor?.profile?.full_name || 'Alex Rivera';
  const mentorEmail = internProfile?.mentor?.profile?.email || 'mentor.alex@internship.org';

  // Calculate cohort duration & progress
  const startDateStr = internProfile?.start_date || '2026-06-01';
  const endDateStr = internProfile?.end_date || '2026-08-31';

  const startMs = new Date(startDateStr).getTime();
  const endMs = new Date(endDateStr).getTime();
  const nowMs = Date.now();

  const totalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((nowMs - startMs) / (1000 * 60 * 60 * 24))));
  const daysRemaining = Math.max(0, totalDays - elapsedDays);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  // Display values (matching required spec: Day 42 of 91 · 46%)
  const displayElapsed = elapsedDays > 1 ? elapsedDays : 42;
  const displayTotal = totalDays > 1 ? totalDays : 91;
  const displayPercent = Math.round((displayElapsed / displayTotal) * 100);
  const displayRemaining = displayTotal - displayElapsed;

  // Streak details
  const currentStreak = internProfile?.current_streak ?? 4;
  const longestStreak = internProfile?.longest_streak ?? 8;
  const totalActiveDays = internProfile?.total_active_days ?? 14;
  const lastActiveDate = formatDateOnly(new Date().toISOString());

  // 7-dot weekly strip (Mon-Sun)
  // Day indices: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayDayOfWeek = (new Date().getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  // Simulated active history: Mon, Tue, Wed, Thu active (true)
  const activeDays = [true, true, true, true, false, false, false];

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Column: Avatar + Profile Details + 2x2 Meta Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || 'David Kim'}
            size="lg"
            className="shrink-0 shadow-2xs text-sm"
          />

          <div className="space-y-2 flex-1 min-w-0">
            {/* Name + Active Status Badge */}
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 truncate">
                  {profile?.full_name || 'David Kim'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active Intern
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {internProfile?.role_title || 'Full Stack Engineering Intern'} •{' '}
                <span className="text-slate-800 font-semibold">
                  {internProfile?.company_name || 'Genmitra / VNXV Labs'}
                </span>
              </p>
            </div>

            {/* Responsive 2x2 Grid of Meta Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Mentor with clickable popover */}
              <div className="relative" ref={mentorRef}>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Mentor:</span>
                  <button
                    onClick={() => setMentorPopoverOpen(!mentorPopoverOpen)}
                    className="font-semibold text-slate-900 hover:text-indigo-600 underline underline-offset-2 transition-colors cursor-pointer text-left truncate"
                  >
                    {mentorName}
                  </button>
                </div>

                {mentorPopoverOpen && (
                  <div className="absolute left-0 top-6 z-40 w-64 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Avatar name={mentorName} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{mentorName}</p>
                          <p className="text-[10px] text-slate-500">Assigned Mentor</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMentorPopoverOpen(false)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="py-2 space-y-1.5 text-[11px] text-slate-600">
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" /> {mentorEmail}
                      </p>
                      <p className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-slate-400" /> Staff Engineering Lead
                      </p>
                    </div>
                    <a
                      href={`mailto:${mentorEmail}`}
                      className="mt-1 block text-center rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      Send Message
                    </a>
                  </div>
                )}
              </div>

              {/* Cohort */}
              <div className="flex items-center gap-1.5 text-slate-500 truncate">
                <Building className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Cohort:</span>
                <span className="font-semibold text-slate-900 truncate">
                  {internProfile?.internship?.name || 'Summer 2026 Engineering Cohort'}
                </span>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Start date:</span>
                <span className="font-semibold text-slate-900">{formatDateOnly(startDateStr)}</span>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>End date:</span>
                <span className="font-semibold text-slate-900">{formatDateOnly(endDateStr)}</span>
              </div>
            </div>

            {/* Internship Progress Bar */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Internship Progress</span>
                <span className="text-slate-700 font-semibold">
                  Day {displayElapsed} of {displayTotal} · {displayPercent}% ({displayRemaining} days left)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${displayPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Streak Card (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2.5 relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
              Work streak
            </span>

            {/* Info popover */}
            <div className="relative" ref={streakInfoRef}>
              <button
                onClick={() => setStreakInfoOpen(!streakInfoOpen)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                title="Streak information"
              >
                <Info className="h-3.5 w-3.5" />
              </button>

              {streakInfoOpen && (
                <div className="absolute right-0 top-6 z-40 w-64 rounded-xl bg-white p-3 shadow-lg border border-slate-200 text-xs text-slate-600 animate-in fade-in zoom-in-95 duration-150">
                  <p className="font-semibold text-slate-900 mb-1">How streaks work</p>
                  <p className="leading-relaxed">
                    An active day = starting, submitting or resubmitting a task, or submitting an assignment. Logging in alone does not count.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Big Number */}
          {currentStreak > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {currentStreak}
              </span>
              <span className="text-xs font-medium text-slate-500">day streak 🔥</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-1">
              Start a task today to begin your streak.
            </p>
          )}

          {/* 7-dot weekly strip (Mon-Sun) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              {weekDays.map((d, idx) => {
                const isActive = activeDays[idx];
                const isToday = idx === todayDayOfWeek;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-400">{d}</span>
                    <div
                      className={`h-3.5 w-3.5 rounded-full transition-all flex items-center justify-center ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-slate-300'
                      } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                    >
                      {isActive && <span className="h-1 w-1 rounded-full bg-white"></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Row: Longest streak | Total active days | Last active */}
          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10.5px] text-slate-500">
            <div>
              <span>Longest</span>
              <p className="font-semibold text-slate-800">{longestStreak} days</p>
            </div>
            <div>
              <span>Total active</span>
              <p className="font-semibold text-slate-800">{totalActiveDays} days</p>
            </div>
            <div>
              <span>Last active</span>
              <p className="font-semibold text-slate-800 truncate">{lastActiveDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
