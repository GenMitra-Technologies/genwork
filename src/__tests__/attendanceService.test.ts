// src/__tests__/attendanceService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAttendanceMetrics,
  backfillMissingPastWorkdays,
  formatRawDate,
  formatDisplayDate,
  getPreviousWorkday,
  AttendanceRecord,
} from '../lib/attendanceService';

describe('attendanceService - Absent & Streak Rules', () => {
  const refDate = new Date('2026-10-14T10:00:00'); // Wednesday Oct 14, 2026
  const prevWorkday = getPreviousWorkday(refDate); // Tuesday Oct 13, 2026
  const prevDateStr = formatRawDate(prevWorkday); // '2026-10-13'

  it('marks streak as 0 when yesterday was absent and today is not completed yet', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'att-1',
        rawDate: prevDateStr,
        date: formatDisplayDate(prevWorkday),
        dayName: 'Tuesday',
        checkIn: '—',
        checkOut: '—',
        duration: '0h 00m',
        durationSeconds: 0,
        mode: '—',
        status: 'absent',
        summary: 'Absent - Did not check in & complete check out',
      },
      {
        id: 'att-2',
        rawDate: '2026-10-12',
        date: '12 Oct 2026',
        dayName: 'Monday',
        checkIn: '09:00 AM',
        checkOut: '01:00 PM',
        duration: '4h 00m',
        durationSeconds: 14400,
        mode: 'remote',
        status: 'present',
        summary: 'Tasks completed',
      },
    ];

    const stats = calculateAttendanceMetrics(records, false, false, 0, 4, refDate);
    expect(stats.yesterdayStatus).toBe('absent');
    expect(stats.currentStreak).toBe(0); // Streak broken because yesterday was absent!
  });

  it('sets streak to 1 when yesterday was absent but today is checked in and checked out', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'att-1',
        rawDate: prevDateStr,
        date: formatDisplayDate(prevWorkday),
        dayName: 'Tuesday',
        checkIn: '—',
        checkOut: '—',
        duration: '0h 00m',
        durationSeconds: 0,
        mode: '—',
        status: 'absent',
        summary: 'Absent - Did not check in & complete check out',
      },
    ];

    // Today is completed (isCompletedToday = true)
    const stats = calculateAttendanceMetrics(records, true, false, 14400, 4, refDate);
    expect(stats.yesterdayStatus).toBe('absent');
    expect(stats.currentStreak).toBe(1);
  });

  it('continues streak when yesterday was completed and today is not completed yet', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'att-1',
        rawDate: prevDateStr,
        date: formatDisplayDate(prevWorkday),
        dayName: 'Tuesday',
        checkIn: '09:00 AM',
        checkOut: '01:00 PM',
        duration: '4h 00m',
        durationSeconds: 14400,
        mode: 'remote',
        status: 'present',
        summary: 'Tasks completed',
      },
      {
        id: 'att-2',
        rawDate: '2026-10-12',
        date: '12 Oct 2026',
        dayName: 'Monday',
        checkIn: '09:00 AM',
        checkOut: '01:00 PM',
        duration: '4h 00m',
        durationSeconds: 14400,
        mode: 'remote',
        status: 'present',
        summary: 'Tasks completed',
      },
    ];

    const stats = calculateAttendanceMetrics(records, false, true, 3600, 4, refDate);
    expect(stats.yesterdayStatus).toBe('present');
    expect(stats.currentStreak).toBe(2);
  });

  it('increments streak when yesterday was completed and today is also completed', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'att-1',
        rawDate: prevDateStr,
        date: formatDisplayDate(prevWorkday),
        dayName: 'Tuesday',
        checkIn: '09:00 AM',
        checkOut: '01:00 PM',
        duration: '4h 00m',
        durationSeconds: 14400,
        mode: 'remote',
        status: 'present',
        summary: 'Tasks completed',
      },
      {
        id: 'att-2',
        rawDate: '2026-10-12',
        date: '12 Oct 2026',
        dayName: 'Monday',
        checkIn: '09:00 AM',
        checkOut: '01:00 PM',
        duration: '4h 00m',
        durationSeconds: 14400,
        mode: 'remote',
        status: 'present',
        summary: 'Tasks completed',
      },
    ];

    // Today completed
    const stats = calculateAttendanceMetrics(records, true, false, 14400, 4, refDate);
    expect(stats.yesterdayStatus).toBe('present');
    expect(stats.currentStreak).toBe(3);
  });

  it('auto-backfills missing past workdays as absent', () => {
    const emptyRecords: AttendanceRecord[] = [];
    const backfilled = backfillMissingPastWorkdays(emptyRecords, refDate);

    // From Oct 1 to Oct 13, all weekdays should be populated
    expect(backfilled.length).toBeGreaterThan(5);
    const absentRecords = backfilled.filter((r) => r.status === 'absent');
    expect(absentRecords.length).toBe(backfilled.length);
    expect(absentRecords[0].duration).toBe('0h 00m');
    expect(absentRecords[0].checkIn).toBe('—');
  });
});
