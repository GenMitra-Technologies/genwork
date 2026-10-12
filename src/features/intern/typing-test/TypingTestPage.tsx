// src/features/intern/typing-test/TypingTestPage.tsx
/**
 * Type The Alphabet Game - Typing Speed Test
 * Built to exact specification:
 * - Pure single-file implementation matching theme & game logic
 * - A to Z alphabet speed run with timer starting on first letter 'A'
 * - requestAnimationFrame precision timer (3 decimal places)
 * - LocalStorage history persistence under 'tta-history'
 * - Mobile virtual keyboard support via hidden input
 * - Accessible semantic HTML structure with screen-reader status announcements
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Timer, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RunRecord {
  t: number; // elapsed time in milliseconds
  d: number | string; // timestamp
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const STORAGE_KEY = 'tta-history';
const MAX_HISTORY_RECORDS = 200;

// Helper: Format milliseconds into "0.000s"
function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(3)}s`;
}

// Helper: Format date into "12 Oct 2026"
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

// Safe storage access functions
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
  } catch (err) {
    console.warn('Unable to access localStorage for typing history', err);
    return [];
  }
}

function saveHistory(runs: RunRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_HISTORY_RECORDS)));
  } catch (err) {
    console.warn('Unable to save to localStorage', err);
  }
}

export function TypingTestPage() {
  // Game states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeDisplay, setTimeDisplay] = useState<string>('0.000s');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [finished, setFinished] = useState<boolean>(false);
  const [history, setHistory] = useState<RunRecord[]>([]);

  // Refs for high-precision timing loop
  const isRunningRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  // Sync state with refs for event callbacks
  currentIndexRef.current = currentIndex;
  finishedRef.current = finished;

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Calculate personal best time from history
  const personalBest = history.length > 0 ? Math.min(...history.map((r) => r.t)) : null;

  // Focus hidden input for mobile/desktop keyboard readiness
  const focusInput = useCallback(() => {
    try {
      hiddenInputRef.current?.focus();
    } catch {
      // safe no-op
    }
  }, []);

  // RequestAnimationFrame update loop
  const updateLoop = useCallback(() => {
    if (!isRunningRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    setTimeDisplay(formatTime(elapsed));
    rafIdRef.current = requestAnimationFrame(updateLoop);
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isRunningRef.current = false;
    currentIndexRef.current = 0;
    finishedRef.current = false;

    setCurrentIndex(0);
    setFinished(false);
    setTimeDisplay('0.000s');
    setStatusMessage('');

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
    focusInput();
  }, [focusInput]);

  // Handle individual typed character
  const handleChar = useCallback(
    (charInput: string) => {
      if (finishedRef.current) return;

      const expectedChar = ALPHABET[currentIndexRef.current];
      if (!expectedChar) return;

      const upper = charInput.toUpperCase();

      // Only the correct next letter registers. Wrong keys are ignored.
      if (upper === expectedChar) {
        // First letter 'A' starts the timer
        if (currentIndexRef.current === 0 && !isRunningRef.current) {
          isRunningRef.current = true;
          startTimeRef.current = performance.now();
          rafIdRef.current = requestAnimationFrame(updateLoop);
        }

        const nextIndex = currentIndexRef.current + 1;
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);

        // Reached 'Z' - Completed run!
        if (nextIndex >= 26) {
          const finalElapsed = Math.round(performance.now() - startTimeRef.current);
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          isRunningRef.current = false;
          finishedRef.current = true;
          setFinished(true);
          setTimeDisplay(formatTime(finalElapsed));

          // Compute personal best comparison
          const existingHistory = loadHistory();
          const prevBest = existingHistory.length > 0 ? Math.min(...existingHistory.map((r) => r.t)) : null;
          const isNewPersonalBest = prevBest === null || finalElapsed < prevBest;

          // Save new record
          const newRecord: RunRecord = { t: finalElapsed, d: Date.now() };
          const updated = [newRecord, ...existingHistory].slice(0, MAX_HISTORY_RECORDS);
          saveHistory(updated);
          setHistory(updated);

          // Update status message
          if (isNewPersonalBest) {
            setStatusMessage('New personal best!');
          } else {
            setStatusMessage('Finished. Press Enter to try again.');
          }
        }
      }
    },
    [updateLoop]
  );

  // Keyboard events listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key resets at any time
      if (e.key === 'Enter') {
        e.preventDefault();
        resetGame();
        return;
      }

      // Check if key is a single alphabet letter
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        handleChar(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame, handleChar]);

  // Hidden input listener for mobile on-screen keyboard
  const handleHiddenInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    if (val) {
      for (let i = 0; i < val.length; i++) {
        handleChar(val[i]);
      }
      e.currentTarget.value = '';
    }
  };

  // Re-focus hidden input on load and when lost to body
  useEffect(() => {
    focusInput();

    const handleFocusOut = (e: FocusEvent) => {
      // If focus went to body or null (and not clicking the Reset button intentionally)
      if (!e.relatedTarget || e.relatedTarget === document.body) {
        focusInput();
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, [focusInput]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Top 10 fastest runs for history table
  const top10Runs = [...history].sort((a, b) => a.t - b.t).slice(0, 10);

  return (
    <main
      className="min-h-screen bg-[#ffffff] text-[#0b1727] px-4 py-8 sm:py-12 flex flex-col items-center justify-start pb-[env(safe-area-inset-bottom,2rem)]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Visually hidden text input for mobile soft keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="opacity-0 fixed -top-[9999px] left-0 h-1 w-1 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
        onInput={handleHiddenInput}
      />

      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* 1. Header */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Speed Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
            Type The Alphabet Game
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-normal">
            Typing game to see how fast you type. Timer starts when you do :)
          </p>
        </header>

        {/* 2. Main Card */}
        <section
          aria-label="Game board"
          onClick={focusInput}
          className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 text-center cursor-text transition-all select-none"
        >
          {/* Letters A to Z in a SINGLE line key tray */}
          <div className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 mb-5">
            <div
              className="flex flex-nowrap items-center justify-between w-full leading-none select-none overflow-hidden"
              style={{
                fontSize: 'clamp(0.75rem, 1.8vw, 1.25rem)',
              }}
            >
              {ALPHABET.map((letter, idx) => {
                const isTyped = idx < currentIndex;
                const isCurrent = idx === currentIndex && !finished;

                return (
                  <span
                    key={letter}
                    className={cn(
                      'transition-all duration-150 select-none inline-flex items-center justify-center flex-1 text-center py-1 sm:py-1.5 rounded-md shrink-0',
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs font-bold scale-105'
                        : isTyped
                        ? 'text-slate-900 font-bold'
                        : 'text-slate-300 font-medium'
                    )}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Time & Stats Display */}
          <div className="flex flex-col items-center justify-center space-y-2.5 pt-1">
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-xl shadow-2xs">
              <Timer className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Time:
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                {timeDisplay}
              </span>
            </div>

            {/* Smaller text: Personal best in a subtle pill */}
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/70 px-3 py-1 rounded-full border border-slate-200/60">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Personal best:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {personalBest !== null ? formatTime(personalBest) : '--'}
              </span>
            </div>

            {/* Status line for screen readers & visual results */}
            <div
              role="status"
              aria-live="polite"
              className="min-h-[22px] text-xs sm:text-sm font-semibold text-indigo-600 pt-0.5"
            >
              {statusMessage || '\u00A0'}
            </div>
          </div>
        </section>

        {/* 3. Below the card: Reset button & enter hint */}
        <div className="flex flex-col items-center mt-5 mb-8">
          <button
            ref={resetButtonRef}
            onClick={resetGame}
            type="button"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <span className="text-xs text-slate-500 mt-2 select-none inline-flex items-center gap-1">
            or press <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded shadow-2xs">Enter ↵</kbd>
          </span>
        </div>

        {/* 4. Best Time History panel */}
        <section
          aria-labelledby="history-heading"
          className="w-full bg-white rounded-2xl sm:rounded-[24px] border border-slate-200 shadow-sm p-5 sm:p-8 mb-8"
        >
          <h2
            id="history-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 mb-4 text-center sm:text-left"
          >
            Best Time History
          </h2>

          {top10Runs.length === 0 ? (
            <div className="py-8 text-center text-sm sm:text-base text-slate-500">
              Finish a run to see your times here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="py-3 px-3 sm:px-4">
                      Rank
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4">
                      Time
                    </th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top10Runs.map((run, i) => {
                    const isTopRow = i === 0;
                    return (
                      <tr
                        key={`${run.t}-${run.d}-${i}`}
                        className={`transition-colors ${
                          isTopRow
                            ? 'bg-indigo-50/80 font-bold text-indigo-700'
                            : 'text-slate-800 hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3 sm:px-4">
                          {isTopRow ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-600" />
                              #{i + 1}
                            </span>
                          ) : (
                            `#${i + 1}`
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-mono tabular-nums">
                          {formatTime(run.t)}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-xs sm:text-sm text-slate-500">
                          {formatDate(run.d)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. How to Play panel */}
        <section
          aria-labelledby="how-to-play-heading"
          className="w-full bg-white rounded-2xl sm:rounded-[24px] border border-slate-200 shadow-sm p-5 sm:p-8"
        >
          <h2
            id="how-to-play-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 mb-6 text-center sm:text-left"
          >
            How to Play
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Column 1 */}
            <div className="flex flex-col bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">Start Typing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The timer begins when you press the first letter. No need to click start. Just
                begin typing A.
              </p>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">Complete A-Z</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Type each letter in order. The current letter is highlighted. Only
                correct keys register.
              </p>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">Reset Anytime</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Press{' '}
                <kbd className="inline-block px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded shadow-xs">
                  Enter ↵
                </kbd>{' '}
                to instantly reset. Your best times save automatically.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
export default TypingTestPage;
