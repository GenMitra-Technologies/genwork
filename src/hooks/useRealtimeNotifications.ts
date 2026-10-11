// src/hooks/useRealtimeNotifications.ts
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../stores/ui.store';
import { NotificationType } from '../types/database.types';

export function useRealtimeNotifications(recipientProfileId?: string) {
  const queryClient = useQueryClient();
  const incrementUnreadCount = useUIStore((s) => s.incrementUnreadCount);

  const handleNewNotification = useCallback(
    (notification: { title: string; message: string; type: NotificationType }) => {
      incrementUnreadCount();
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    [queryClient, incrementUnreadCount]
  );

  useEffect(() => {
    if (!recipientProfileId) return;

    // Supabase Realtime channel
    const channel = supabase
      .channel(`notifications:${recipientProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientProfileId}`,
        },
        (payload) => {
          handleNewNotification(payload.new as any);
        }
      )
      .subscribe();

    // 30s polling fallback
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [recipientProfileId, handleNewNotification, queryClient]);
}
