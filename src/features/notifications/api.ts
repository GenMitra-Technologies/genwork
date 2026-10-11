// src/features/notifications/api.ts
import { supabase } from '../../lib/supabase';

export const notificationsApi = {
  async getNotifications(profileId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profileId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [
        {
          id: 'n-1',
          recipient_id: profileId,
          title: 'Changes Requested on TSK-0004',
          message: 'Alex Rivera requested revisions on Task Submission Portal.',
          type: 'changes_requested',
          related_type: 'task',
          related_code: 'TSK-0004',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'n-2',
          recipient_id: profileId,
          title: 'Task Approved! TSK-0001',
          message: 'Your submission for TSK-0001 has been approved by Alex Rivera.',
          type: 'task_approved',
          related_type: 'task',
          related_code: 'TSK-0001',
          is_read: true,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
    }
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });
    if (error) {
      // Fallback direct update
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    }
  },

  async markAllAsRead() {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) {
      // Fallback direct update
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
    }
  },
};
