// src/stores/attendance.store.ts
import { create } from 'zustand';

export interface AttendanceState {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  elapsedSeconds: number;
  targetHours: number; // default 4 hours
  workMode: 'remote';
  dailySummary: string;
  blockers: string;
  isCompletedToday: boolean;
  
  // Actions
  checkIn: () => void;
  checkOut: (summary: string, blockers?: string) => void;
  toggleBreak: () => void;
  tick: () => void;
  resetDay: () => void;
}

const STORAGE_KEY = 'genmitra_intern_attendance';

function loadPersistedState(): Partial<AttendanceState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const todayStr = new Date().toISOString().split('T')[0];
    // If the saved date is from a previous day, auto-complete or reset
    if (parsed.savedDate && parsed.savedDate !== todayStr) {
      return {
        isCheckedIn: false,
        isOnBreak: false,
        checkInTime: null,
        checkOutTime: null,
        elapsedSeconds: 0,
        isCompletedToday: false,
      };
    }
    // Calculate elapsed time catch-up if checked in and not on break
    if (parsed.isCheckedIn && !parsed.isOnBreak && parsed.checkInTime) {
      const now = Date.now();
      const lastSavedTime = parsed.lastSavedTimestamp || now;
      const additionalSec = Math.floor((now - lastSavedTime) / 1000);
      return {
        ...parsed,
        elapsedSeconds: (parsed.elapsedSeconds || 0) + Math.max(0, additionalSec),
      };
    }
    return parsed;
  } catch {
    return {};
  }
}

function persistState(state: any) {
  if (typeof window === 'undefined') return;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        savedDate: todayStr,
        lastSavedTimestamp: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

const initial = loadPersistedState();

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  isCheckedIn: initial.isCheckedIn ?? false,
  isOnBreak: initial.isOnBreak ?? false,
  checkInTime: initial.checkInTime ?? null,
  checkOutTime: initial.checkOutTime ?? null,
  elapsedSeconds: initial.elapsedSeconds ?? 0,
  targetHours: 4, // Strict Default: 4 hours working day
  workMode: 'remote',
  dailySummary: initial.dailySummary ?? '',
  blockers: initial.blockers ?? '',
  isCompletedToday: initial.isCompletedToday ?? false,

  checkIn: () => {
    const nowIso = new Date().toISOString();
    const updated = {
      isCheckedIn: true,
      isOnBreak: false,
      checkInTime: nowIso,
      checkOutTime: null,
      workMode: 'remote' as const,
      isCompletedToday: false,
    };
    set(updated);
    persistState({ ...get(), ...updated });
  },

  checkOut: (summary: string, blockers = '') => {
    const nowIso = new Date().toISOString();
    const updated = {
      isCheckedIn: false,
      isOnBreak: false,
      checkOutTime: nowIso,
      dailySummary: summary,
      blockers,
      isCompletedToday: true,
    };
    set(updated);
    persistState({ ...get(), ...updated });
  },

  toggleBreak: () => {
    const nextBreak = !get().isOnBreak;
    set({ isOnBreak: nextBreak });
    persistState({ ...get(), isOnBreak: nextBreak });
  },

  tick: () => {
    const state = get();
    if (state.isCheckedIn && !state.isOnBreak) {
      const nextSeconds = state.elapsedSeconds + 1;
      set({ elapsedSeconds: nextSeconds });
      // Periodically persist every 10 seconds
      if (nextSeconds % 10 === 0) {
        persistState({ ...state, elapsedSeconds: nextSeconds });
      }
    }
  },

  resetDay: () => {
    const reset = {
      isCheckedIn: false,
      isOnBreak: false,
      checkInTime: null,
      checkOutTime: null,
      elapsedSeconds: 0,
      dailySummary: '',
      blockers: '',
      isCompletedToday: false,
    };
    set(reset);
    persistState({ ...get(), ...reset });
  },
}));
