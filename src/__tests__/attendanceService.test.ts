// src/__tests__/attendanceService.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateAttendanceMetrics,
  backfillMissingPastWorkdays,
  formatRawDate,
  formatDisplayDate,
  getPreviousWorkday,
  AttendanceRecord,
  isDesktopDevice,
} from '../lib/attendanceService';

describe('attendanceService - Historical Clean Present & Device Rules', () => {
  const refDate = new Date('2026-10-14T10:00:00'); // Wednesday Oct 14, 2026
  const prevWorkday = getPreviousWorkday(refDate); // Tuesday Oct 13, 2026
  const prevDateStr = formatRawDate(prevWorkday); // '2026-10-13'

  it('marks all past workdays up to 13-10-2026 as present with empty fields', () => {
    const emptyRecords: AttendanceRecord[] = [];
    const backfilled = backfillMissingPastWorkdays(emptyRecords, refDate);

    // From Oct 1 to Oct 13 (Mon-Fri only): 9 workdays
    expect(backfilled.length).toBe(9);
    for (const record of backfilled) {
      expect(record.status).toBe('present');
      expect(record.checkIn).toBe('—');
      expect(record.checkOut).toBe('—');
      expect(record.duration).toBe('—');
      expect(record.mode).toBe('—');
      expect(record.summary).toBe('—');
      // No weekends
      const d = new Date(record.rawDate);
      expect(d.getDay()).not.toBe(0); // Not Sunday
      expect(d.getDay()).not.toBe(6); // Not Saturday
    }
  });

  it('calculates unbroken 9-day streak for workdays up to 13-10-2026', () => {
    const records = backfillMissingPastWorkdays([], refDate);
    // Today not completed yet
    const stats = calculateAttendanceMetrics(records, false, false, 0, 4, refDate);
    expect(stats.yesterdayStatus).toBe('present');
    expect(stats.currentStreak).toBe(9);
    expect(stats.longestStreak).toBe(9);
    expect(stats.attendanceRate).toBe(100);
  });

  it('increments streak to 10 when today is completed after unbroken 9-day history', () => {
    const records = backfillMissingPastWorkdays([], refDate);
    // Today completed
    const stats = calculateAttendanceMetrics(records, true, false, 14400, 4, refDate);
    expect(stats.yesterdayStatus).toBe('present');
    expect(stats.currentStreak).toBe(10);
  });

  it('marks streak as 0 if yesterday was absent and today is not completed yet', () => {
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

    const stats = calculateAttendanceMetrics(records, false, false, 0, 4, refDate);
    expect(stats.yesterdayStatus).toBe('absent');
    expect(stats.currentStreak).toBe(0);
  });

  it('auto-backfills missing workdays after 13-10-2026 as absent', () => {
    // Reference date: Friday Oct 16, 2026
    const futureDate = new Date('2026-10-16T10:00:00');
    const records = backfillMissingPastWorkdays([], futureDate);
    
    // Dates <= 2026-10-13 should be 'present'
    const cleanRecords = records.filter((r) => r.rawDate <= '2026-10-13');
    expect(cleanRecords.length).toBe(9);
    expect(cleanRecords.every((r) => r.status === 'present')).toBe(true);

    // Dates > 2026-10-13 (Oct 14 and Oct 15) should be 'absent'
    const absentRecords = records.filter((r) => r.rawDate > '2026-10-13');
    expect(absentRecords.length).toBe(2);
    expect(absentRecords.every((r) => r.status === 'absent')).toBe(true);
  });

  it('provides desktop device detection', () => {
    expect(typeof isDesktopDevice()).toBe('boolean');
  });
});
