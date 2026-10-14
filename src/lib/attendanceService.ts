// src/lib/attendanceService.ts
import React, { useState, useEffect } from 'react';

/**
 * GenMitra Attendance Service
 * 
 * Strict Business Rules:
 * 1. For all interns up to yesterday (13-10-2026):
 *    - All Monday to Friday working days are marked as 'present'.
 *    - Check-in time, check-out time, duration, and notes are set to empty/clean ('—').
 *    - Only Monday to Friday working days are tracked.
 * 2. From today (14-10-2026 onwards):
 *    - Full real timing, duration, standups, and check-in/out logic apply.
 *    - If an intern fails to check in & complete check out on any day from today onwards,
 *      that day is recorded as 'absent' once the day passes.
 * 3. Streaks:
 *    - All days up to 13-10-2026 are present (unbroken streak of 9 workdays).
 *    - Streak continues today if checked out (+1), or continues from yesterday if yesterday was attended.
 * 4. Device Restriction:
 *    - Check-in and check-out actions can only be accessed on PC / desktop devices.
 *    - Mobile devices are restricted from punching in or out.
 */

export interface AttendanceRecord {
  id: string;
  internId?: string;
  date: string; // e.g. "13 Oct 2026"
  rawDate: string; // e.g. "2026-10-13" (YYYY-MM-DD for deterministic math)
  dayName: string; // e.g. "Tuesday"
  checkIn: string; // e.g. "09:00 AM" or "—"
  checkOut: string; // e.g. "01:04 PM" or "—"
  duration: string; // e.g. "4h 04m" or "—"
  durationSeconds: number;
  mode: 'remote' | 'office' | '—';
  status: 'present' | 'half_day' | 'absent' | 'in_progress';
  summary: string;
  blockers?: string;
}

export interface AttendanceStats {
  totalHours: number;
  totalLoggedDays: number;
  presentDaysCount: number;
  halfDaysCount: number;
  absentDaysCount: number;
  attendanceRate: number; // percentage compliant
  avgShiftHours: string;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  yesterdayStatus: 'present' | 'half_day' | 'absent' | 'weekend';
  yesterdayDateFormatted: string;
  yesterdayRawDate: string;
}

export const STORAGE_RECORDS_KEY = 'genmitra_intern_attendance_records';
export const COHORT_START_DATE = '2026-10-01';
export const HISTORICAL_CLEAN_CUTOFF = '2026-10-13'; // All days <= this date are clean 'present'

/** Helper to format date as "13 Oct 2026" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Helper to format ISO date string "YYYY-MM-DD" */
export function formatRawDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Check if a date is a weekday (Monday to Friday only) */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/** Get previous workday (yesterday if weekday, or previous Friday if today is Monday) */
export function getPreviousWorkday(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  do {
    date.setDate(date.getDate() - 1);
  } while (!isWeekday(date));
  return date;
}

/**
 * Baseline Seed Records:
 * All workdays (Monday to Friday) from cohort start (2026-10-01) up to 2026-10-13
 * are marked as 'present' with clean/empty fields ('—').
 */
export function getInitialSeedRecords(internId = '20000000-0000-0000-0000-000000000001'): AttendanceRecord[] {
  return [
    {
      id: 'att-20261013',
      internId,
      date: '13 Oct 2026',
      rawDate: '2026-10-13',
      dayName: 'Tuesday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261012',
      internId,
      date: '12 Oct 2026',
      rawDate: '2026-10-12',
      dayName: 'Monday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261009',
      internId,
      date: '09 Oct 2026',
      rawDate: '2026-10-09',
      dayName: 'Friday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261008',
      internId,
      date: '08 Oct 2026',
      rawDate: '2026-10-08',
      dayName: 'Thursday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261007',
      internId,
      date: '07 Oct 2026',
      rawDate: '2026-10-07',
      dayName: 'Wednesday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261006',
      internId,
      date: '06 Oct 2026',
      rawDate: '2026-10-06',
      dayName: 'Tuesday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261005',
      internId,
      date: '05 Oct 2026',
      rawDate: '2026-10-05',
      dayName: 'Monday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261002',
      internId,
      date: '02 Oct 2026',
      rawDate: '2026-10-02',
      dayName: 'Friday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
    {
      id: 'att-20261001',
      internId,
      date: '01 Oct 2026',
      rawDate: '2026-10-01',
      dayName: 'Thursday',
      checkIn: '—',
      checkOut: '—',
      duration: '—',
      durationSeconds: 14400,
      mode: '—',
      status: 'present',
      summary: '—',
      blockers: '',
    },
  ];
}

/**
 * Scans past workdays (Monday-Friday only) from cohort start up to yesterday (inclusive).
 * - Workdays <= 2026-10-13: Ensured to be 'present' with clean/empty fields ('—').
 * - Workdays > 2026-10-13: If missing from records, automatically marked as 'absent'.
 */
export function backfillMissingPastWorkdays(
  existingRecords: AttendanceRecord[],
  referenceDate = new Date(),
  internId = '20000000-0000-0000-0000-000000000001'
): AttendanceRecord[] {
  const recordMap = new Map<string, AttendanceRecord>();

  // Filter out any weekends from existing records and map by rawDate
  for (const r of existingRecords) {
    if (r.rawDate) {
      const d = new Date(r.rawDate);
      if (isWeekday(d)) {
        recordMap.set(r.rawDate, r);
      }
    }
  }

  const startDate = new Date(COHORT_START_DATE);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const cur = new Date(startDate);
  while (cur <= yesterday) {
    if (isWeekday(cur)) {
      const rawDateStr = formatRawDate(cur);

      if (rawDateStr <= HISTORICAL_CLEAN_CUTOFF) {
        // Enforce clean 'present' state for all dates up to 13-10-2026
        recordMap.set(rawDateStr, {
          id: `att-${rawDateStr.replace(/-/g, '')}`,
          internId,
          date: formatDisplayDate(cur),
          rawDate: rawDateStr,
          dayName: cur.toLocaleDateString('en-US', { weekday: 'long' }),
          checkIn: '—',
          checkOut: '—',
          duration: '—',
          durationSeconds: 14400,
          mode: '—',
          status: 'present',
          summary: '—',
          blockers: '',
        });
      } else {
        // From 14-10-2026 onwards: if missing, mark as absent
        if (!recordMap.has(rawDateStr)) {
          const absentRecord: AttendanceRecord = {
            id: `att-absent-${rawDateStr.replace(/-/g, '')}`,
            internId,
            date: formatDisplayDate(cur),
            rawDate: rawDateStr,
            dayName: cur.toLocaleDateString('en-US', { weekday: 'long' }),
            checkIn: '—',
            checkOut: '—',
            duration: '0h 00m',
            durationSeconds: 0,
            mode: '—',
            status: 'absent',
            summary: 'Absent - Did not check in & complete check out',
            blockers: 'Unplanned absence / no shift logged',
          };
          recordMap.set(rawDateStr, absentRecord);
        }
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Return sorted descending by rawDate (newest first)
  return Array.from(recordMap.values()).sort((a, b) => b.rawDate.localeCompare(a.rawDate));
}

/**
 * Load attendance records from localStorage (with auto-seed & auto-backfill).
 */
export function getStoredAttendanceRecords(internId = '20000000-0000-0000-0000-000000000001'): AttendanceRecord[] {
  if (typeof window === 'undefined') {
    return getInitialSeedRecords(internId);
  }

  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    let records: AttendanceRecord[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        records = parsed.map((item) => {
          if (!item.rawDate && item.date) {
            const parsedD = new Date(item.date);
            if (!isNaN(parsedD.getTime())) {
              item.rawDate = formatRawDate(parsedD);
            }
          }
          return item;
        });
      }
    }

    if (records.length === 0) {
      records = getInitialSeedRecords(internId);
    }

    // Run clean normalization and backfill
    const backfilled = backfillMissingPastWorkdays(records, new Date(), internId);
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(backfilled));
    return backfilled;
  } catch (err) {
    console.warn('[attendanceService] Failed to load records:', err);
    return getInitialSeedRecords(internId);
  }
}

/**
 * Save records to localStorage.
 */
export function saveStoredAttendanceRecords(records: AttendanceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('[attendanceService] Failed to save records:', err);
  }
}

/**
 * Calculate streak and detailed attendance metrics.
 */
export function calculateAttendanceMetrics(
  records: AttendanceRecord[],
  isCompletedToday: boolean,
  isCheckedIn: boolean,
  elapsedSeconds: number,
  targetHours = 4,
  referenceDate = new Date()
): AttendanceStats {
  const previousWorkday = getPreviousWorkday(referenceDate);
  const prevWorkdayRaw = formatRawDate(previousWorkday);
  const prevWorkdayDisplay = formatDisplayDate(previousWorkday);

  // Map of records by rawDate
  const mapByDate = new Map<string, AttendanceRecord>();
  for (const r of records) {
    if (r.rawDate) {
      mapByDate.set(r.rawDate, r);
    }
  }

  // Check yesterday's / previous workday's status
  const prevRecord = mapByDate.get(prevWorkdayRaw);
  let yesterdayStatus: 'present' | 'half_day' | 'absent' | 'weekend' = 'absent';
  if (prevRecord) {
    if (prevRecord.status === 'present' || prevRecord.status === 'half_day') {
      yesterdayStatus = prevRecord.status;
    } else {
      yesterdayStatus = 'absent';
    }
  } else {
    yesterdayStatus = 'absent';
  }

  // Consecutive streak ending yesterday
  let pastConsecutiveStreak = 0;
  const curWorkday = new Date(previousWorkday);

  while (true) {
    const rawKey = formatRawDate(curWorkday);
    const rec = mapByDate.get(rawKey);

    if (rec && (rec.status === 'present' || rec.status === 'half_day')) {
      pastConsecutiveStreak++;
      do {
        curWorkday.setDate(curWorkday.getDate() - 1);
      } while (!isWeekday(curWorkday));
    } else {
      break;
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  if (isCompletedToday) {
    currentStreak = pastConsecutiveStreak + 1;
  } else {
    if (yesterdayStatus === 'absent') {
      currentStreak = 0;
    } else {
      currentStreak = pastConsecutiveStreak;
    }
  }

  // Longest streak calculation across historical records
  const chronological = [...records]
    .filter((r) => r.rawDate)
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  let longestStreak = 0;
  let tempStreak = 0;
  for (const r of chronological) {
    if (r.status === 'present' || r.status === 'half_day') {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Total attended hours
  const pastRecordedHours = records.reduce((acc, r) => {
    if (r.status === 'present' || r.status === 'half_day') {
      return acc + (r.durationSeconds ? r.durationSeconds / 3600 : 4);
    }
    return acc;
  }, 0);
  const currentRunningHours = elapsedSeconds / 3600;
  const totalHours = parseFloat((pastRecordedHours + (isCheckedIn || isCompletedToday ? currentRunningHours : 0)).toFixed(1));

  // Counts
  const presentDaysCount = records.filter((r) => r.status === 'present').length + (isCompletedToday && elapsedSeconds >= targetHours * 3600 ? 1 : 0);
  const halfDaysCount = records.filter((r) => r.status === 'half_day').length + (isCompletedToday && elapsedSeconds < targetHours * 3600 ? 1 : 0);
  const absentDaysCount = records.filter((r) => r.status === 'absent').length;
  const totalLoggedDays = records.length + (isCompletedToday || isCheckedIn ? 1 : 0);

  // Attendance compliance rate
  const totalAttended = presentDaysCount + halfDaysCount;
  const rateDenominator = Math.max(1, totalAttended + absentDaysCount);
  const attendanceRate = Math.round((presentDaysCount / rateDenominator) * 100);

  // Average shift hours for attended days
  const avgShiftHours = totalAttended > 0 ? (totalHours / totalAttended).toFixed(1) : '4.0';

  return {
    totalHours,
    totalLoggedDays,
    presentDaysCount,
    halfDaysCount,
    absentDaysCount,
    attendanceRate,
    avgShiftHours,
    currentStreak,
    longestStreak: Math.max(longestStreak, 9),
    totalActiveDays: totalAttended + (isCheckedIn || isCompletedToday ? 1 : 0),
    yesterdayStatus,
    yesterdayDateFormatted: prevWorkdayDisplay,
    yesterdayRawDate: prevWorkdayRaw,
  };
}

/**
 * Toggle yesterday's record between Present and Absent for testing/simulation.
 */
export function toggleYesterdayAttendanceRecord(
  records: AttendanceRecord[],
  referenceDate = new Date(),
  internId = '20000000-0000-0000-0000-000000000001'
): AttendanceRecord[] {
  const prevWorkday = getPreviousWorkday(referenceDate);
  const rawDateStr = formatRawDate(prevWorkday);
  const displayDateStr = formatDisplayDate(prevWorkday);
  const dayName = prevWorkday.toLocaleDateString('en-US', { weekday: 'long' });

  const existingIndex = records.findIndex((r) => r.rawDate === rawDateStr);

  let updatedRecords: AttendanceRecord[];

  if (existingIndex >= 0) {
    const current = records[existingIndex];
    if (current.status === 'absent') {
      // Toggle to Present
      const newPresent: AttendanceRecord = {
        ...current,
        checkIn: '—',
        checkOut: '—',
        duration: '—',
        durationSeconds: 14400,
        mode: '—',
        status: 'present',
        summary: '—',
        blockers: '',
      };
      updatedRecords = [...records];
      updatedRecords[existingIndex] = newPresent;
    } else {
      // Toggle to Absent
      const newAbsent: AttendanceRecord = {
        ...current,
        checkIn: '—',
        checkOut: '—',
        duration: '0h 00m',
        durationSeconds: 0,
        mode: '—',
        status: 'absent',
        summary: 'Absent - Did not check in & complete check out',
        blockers: 'Unplanned absence / no shift logged',
      };
      updatedRecords = [...records];
      updatedRecords[existingIndex] = newAbsent;
    }
  } else {
    const newAbsent: AttendanceRecord = {
      id: `att-${rawDateStr.replace(/-/g, '')}`,
      internId,
      date: displayDateStr,
      rawDate: rawDateStr,
      dayName,
      checkIn: '—',
      checkOut: '—',
      duration: '0h 00m',
      durationSeconds: 0,
      mode: '—',
      status: 'absent',
      summary: 'Absent - Did not check in & complete check out',
      blockers: 'Unplanned absence / no shift logged',
    };
    updatedRecords = [newAbsent, ...records];
  }

  saveStoredAttendanceRecords(updatedRecords);
  return updatedRecords;
}

/**
 * Device restriction helper:
 * Detects whether the current device is a desktop / PC device.
 * Only desktop / PC devices can access Check-In and Check-Out actions.
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isNarrowScreen = window.innerWidth < 1024;
  return !isMobileUA && !isNarrowScreen;
}

/**
 * React hook to reactively track whether current device is PC / Desktop.
 */
export function useIsDesktopDevice(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    return !isMobileUA && window.innerWidth >= 1024;
  });

  useEffect(() => {
    function handleResize() {
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
      setIsDesktop(!isMobileUA && window.innerWidth >= 1024);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}
