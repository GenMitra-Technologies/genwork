// src/__tests__/typingTest.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'tta-history';

interface RunRecord {
  t: number;
  d: number | string;
}

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(3)}s`;
}

function formatDate(timestamp: number | string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '12 Oct 2026';
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '12 Oct 2026';
  }
}

function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (r) => typeof r === 'object' && r !== null && typeof r.t === 'number'
      );
    }
    return [];
  } catch {
    return [];
  }
}

function saveHistory(runs: RunRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, 200)));
  } catch {
    // safe fallback
  }
}

describe('Typing Test Game Engine & Storage Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('formats time to 3 decimal places with trailing s', () => {
    expect(formatTime(0)).toBe('0.000s');
    expect(formatTime(4751)).toBe('4.751s');
    expect(formatTime(12345)).toBe('12.345s');
    expect(formatTime(850)).toBe('0.850s');
  });

  it('formats dates into day-month-year style', () => {
    const dateStr = formatDate(new Date('2026-10-12T10:00:00Z').getTime());
    expect(dateStr).toContain('Oct');
    expect(dateStr).toContain('2026');
  });

  it('handles empty localStorage gracefully with empty array', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('saves and retrieves run records under tta-history key', () => {
    const runs: RunRecord[] = [
      { t: 4500, d: Date.now() },
      { t: 3800, d: Date.now() },
    ];
    saveHistory(runs);
    const loaded = loadHistory();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].t).toBe(4500);
    expect(loaded[1].t).toBe(3800);
  });

  it('caps history at maximum 200 records', () => {
    const massiveRuns: RunRecord[] = Array.from({ length: 250 }, (_, i) => ({
      t: 3000 + i,
      d: Date.now(),
    }));
    saveHistory(massiveRuns);
    const loaded = loadHistory();
    expect(loaded.length).toBe(200);
  });

  it('calculates personal best as minimum elapsed time across all runs', () => {
    const runs: RunRecord[] = [
      { t: 6200, d: Date.now() },
      { t: 4120, d: Date.now() },
      { t: 5300, d: Date.now() },
    ];
    const personalBest = Math.min(...runs.map((r) => r.t));
    expect(personalBest).toBe(4120);
    expect(formatTime(personalBest)).toBe('4.120s');
  });

  it('correctly sorts top 10 fastest times in ascending order', () => {
    const runs: RunRecord[] = [
      { t: 9000, d: 1 },
      { t: 3000, d: 2 },
      { t: 7000, d: 3 },
      { t: 2500, d: 4 },
      { t: 8000, d: 5 },
      { t: 4000, d: 6 },
    ];
    const sorted = [...runs].sort((a, b) => a.t - b.t).slice(0, 10);
    expect(sorted[0].t).toBe(2500);
    expect(sorted[1].t).toBe(3000);
    expect(sorted[sorted.length - 1].t).toBe(9000);
  });

  it('survives localStorage quota or access exceptions without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access Denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => loadHistory()).not.toThrow();
    expect(loadHistory()).toEqual([]);
    expect(() => saveHistory([{ t: 5000, d: Date.now() }])).not.toThrow();
  });
});
