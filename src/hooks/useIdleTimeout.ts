// src/hooks/useIdleTimeout.ts
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { INACTIVITY_TIMEOUT_MINUTES } from '../lib/constants';

export function useIdleTimeout(enabled: boolean = true) {
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimeout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate('/genmitraworkspace?reason=expired', { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (enabled) {
      const timeoutMs = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
      timerRef.current = setTimeout(handleTimeout, timeoutMs);
    }
  }, [enabled, handleTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer]);
}
