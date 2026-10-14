// src/lib/attendanceService.ts
/**
 * GenMitra Attendance Service
 * 
 * Strict Business Rules:
 * 1. Only when an intern logs in, clicks Check In, AND successfully completes Check Out
 *    is that day considered attended/done ('present' if >= targetHours, or 'half_day').
 * 2. If the intern fails to check in and complete check out on any past workday (including yesterday),
 *    that day is marked as 'absent' in historical records.
 * 3. Streaks are strictly calculated from continuous completed days:
 *    - An active streak continues from yesterday ONLY if yesterday was attended (check-in + check-out).
 *    - If yesterday was absent (or not completed), the streak breaks (resets to 0, or 1 if today is completed).
 */

export interface AttendanceRecord {
  id: string;
  internId?: string;
  date: string; // e.g. "13 Oct 2026"
  rawDate: string; // e.g. "2026-10-13" (YYYY-MM-DD for deterministic math)
  dayName: string; // e.g. "Tuesday"
  checkIn: string; // e.g. "09:00 AM" or "—"
  checkOut: string; // e.g. "01:04 PM" or "—"
  duration: string; // e.g. "4h 04m" or "0h 00m"
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

/** Check if a date is a weekday (Monday to Friday) */
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
 * Baseline Seed Records for cohort starting 2026-10-01.
 * Reflects authentic history including present and absent days.
 */
export function getInitialSeedRecords(internId = '20000000-0000-0000-0000-000000000001'): AttendanceRecord[] {
  return [
    {
      id: 'att-20261013',
      internId,
      date: '13 Oct 2026',
      rawDate: '2026-10-13',
      dayName: 'Tuesday',
      checkIn: '09:00 AM',
      checkOut: '01:04 PM',
      duration: '4h 04m',
      durationSeconds: 14640,
      mode: 'remote',
      status: 'present',
      summary: 'Completed YouTube course player integration, validated API contracts',
      blockers: 'None',
    },
    {
      id: 'att-20261012',
      internId,
      date: '12 Oct 2026',
      rawDate: '2026-10-12',
      dayName: 'Monday',
      checkIn: '09:05 AM',
      checkOut: '01:10 PM',
      duration: '4h 05m',
      durationSeconds: 14700,
      mode: 'remote',
      status: 'present',
      summary: 'Worked on admin courses list & course creation UI',
      blockers: 'None',
    },
    {
      id: 'att-20261009',
      internId,
      date: '09 Oct 2026',
      rawDate: '2026-10-09',
      dayName: 'Friday',
      checkIn: '09:00 AM',
      checkOut: '01:00 PM',
      duration: '4h 00m',
      durationSeconds: 14400,
      mode: 'remote',
      status: 'present',
      summary: 'Reviewed mobile responsiveness for admin and intern pages',
      blockers: 'None',
    },
    {
      id: 'att-20261008',
      internId,
      date: '08 Oct 2026',
      rawDate: '2026-10-08',
      dayName: 'Thursday',
      checkIn: '09:12 AM',
      checkOut: '01:15 PM',
      duration: '4h 03m',
      durationSeconds: 14580,
      mode: 'remote',
      status: 'present',
      summary: 'Frontend roadmaps viewer & folder navigation styling',
      blockers: 'None',
    },
    {
      id: 'att-20261007',
      internId,
      date: '07 Oct 2026',
      rawDate: '2026-10-07',
      dayName: 'Wednesday',
      checkIn: '—',
      checkOut: '—',
      duration: '0h 00m',
      durationSeconds: 0,
      mode: '—',
      status: 'absent',
      summary: 'Absent - Did not check in & complete check out',
      blockers: 'Unplanned absence / no shift logged',
    },
    {
      id: 'att-20261006',
      internId,
      date: '06 Oct 2026',
      rawDate: '2026-10-06',
      dayName: 'Tuesday',
      checkIn: '09:00 AM',
      checkOut: '01:02 PM',
      duration: '4h 02m',
      durationSeconds: 14520,
      mode: 'remote',
      status: 'present',
      summary: 'Mentors page assignment modal fixes and unit tests',
      blockers: 'None',
    },
    {
      id: 'att-20261005',
      internId,
      date: '05 Oct 2026',
      rawDate: '2026-10-05',
      dayName: 'Monday',
      checkIn: '09:15 AM',
      checkOut: '01:15 PM',
      duration: '4h 00m',
      durationSeconds: 14400,
      mode: 'remote',
      status: 'present',
      summary: 'Onboarding tasks, repository setup, and local environment verification',
      blockers: 'None',
    },
    {
      id: 'att-20261002',
      internId,
      date: '02 Oct 2026',
      rawDate: '2026-10-02',
      dayName: 'Friday',
      checkIn: '09:08 AM',
      checkOut: '01:12 PM',
      duration: '4h 04m',
      durationSeconds: 14640,
      mode: 'remote',
      status: 'present',
      summary: 'Sprint planning and task breakdown with mentor',
      blockers: 'None',
    },
    {
      id: 'att-20261001',
      internId,
      date: '01 Oct 2026',
      rawDate: '2026-10-01',
      dayName: 'Thursday',
      checkIn: '09:00 AM',
      checkOut: '01:00 PM',
      duration: '4h 00m',
      durationSeconds: 14400,
      mode: 'remote',
      status: 'present',
      summary: 'Internship orientation & kickoff session',
      blockers: 'None',
    },
  ];
}

/**
 * Scans past workdays from cohort start up to yesterday (inclusive).
 * If any past workday is missing or incomplete, marks it as 'absent'.
 */
export function backfillMissingPastWorkdays(
  existingRecords: AttendanceRecord[],
  referenceDate = new Date(),
  internId = '20000000-0000-0000-0000-000000000001'
): AttendanceRecord[] {
  const recordMap = new Map<string, AttendanceRecord>();
  for (const r of existingRecords) {
    recordMap.set(r.rawDate, r);
  }

  const startDate = new Date(COHORT_START_DATE);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const cur = new Date(startDate);
  while (cur <= yesterday) {
    if (isWeekday(cur)) {
      const rawDateStr = formatRawDate(cur);
      if (!recordMap.has(rawDateStr)) {
        // Automatically mark as absent
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
          blockers: 'Absence recorded by attendance monitor',
        };
        recordMap.set(rawDateStr, absentRecord);
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Return sorted descending by rawDate
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
          // Normalize records to ensure rawDate exists
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

    // Run absent backfill for past workdays
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
 * 
 * Strict logic:
 * - Streaks require check-in AND completed check-out.
 * - If yesterday was absent (or not completed), streak resets to 0 (or 1 if today is completed).
 * - If today is completed (checked out), streak = 1 + consecutive completed days ending yesterday.
 * - If today is not completed yet, streak = consecutive completed days ending yesterday.
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

    // If day was completed (present or half_day)
    if (rec && (rec.status === 'present' || rec.status === 'half_day')) {
      pastConsecutiveStreak++;
      // Move to previous workday
      do {
        curWorkday.setDate(curWorkday.getDate() - 1);
      } while (!isWeekday(curWorkday));
    } else {
      // Hit an absent day or missing day -> streak broken!
      break;
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  if (isCompletedToday) {
    // Today is completed!
    currentStreak = pastConsecutiveStreak + 1;
  } else {
    // Today not completed yet: streak is based on whether yesterday was attended
    if (yesterdayStatus === 'absent') {
      currentStreak = 0; // "if not checckin and checkout - not streak"
    } else {
      currentStreak = pastConsecutiveStreak;
    }
  }

  // Longest streak calculation across historical records
  // Sort records chronologically ascending
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
      return acc + (r.durationSeconds ? r.durationSeconds / 3600 : 0);
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
  const avgShiftHours = totalAttended > 0 ? (totalHours / totalAttended).toFixed(1) : '0.0';

  return {
    totalHours,
    totalLoggedDays,
    presentDaysCount,
    halfDaysCount,
    absentDaysCount,
    attendanceRate,
    avgShiftHours,
    currentStreak,
    longestStreak: Math.max(longestStreak, 1),
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
        checkIn: '09:00 AM',
        checkOut: '01:04 PM',
        duration: '4h 04m',
        durationSeconds: 14640,
        mode: 'remote',
        status: 'present',
        summary: 'Completed YouTube course player integration, validated API contracts',
        blockers: 'None',
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
    // Create new absent record for yesterday
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
