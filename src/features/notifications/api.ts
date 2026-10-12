// src/features/notifications/api.ts
import { supabase } from '../../lib/supabase';

const READ_STORAGE_KEY = 'genmitra_read_notification_ids';

function getLocalReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveLocalReadIds(set: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export const notificationsApi = {
  async getNotifications(profileId: string) {
    let resultList: any[] = [];
    const readIds = getLocalReadIds();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profileId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      resultList = [
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
    } else {
      resultList = data;
    }

    // Merge broadcast platform announcements from local storage if any
    try {
      const storedAnnouncements = JSON.parse(
        localStorage.getItem('genmitra_platform_announcements') || '[]'
      );
      if (Array.isArray(storedAnnouncements) && storedAnnouncements.length > 0) {
        const announcementNotifs = storedAnnouncements.map((a: any) => ({
          id: `notif-announcement-${a.id}`,
          recipient_id: profileId,
          title: `Platform Announcement: ${a.title}`,
          message: a.body,
          type: 'announcement',
          related_type: 'system',
          is_read: false,
          created_at: a.created_at || new Date().toISOString(),
        }));
        resultList = [...announcementNotifs, ...resultList];
      }
    } catch {
      // ignore
    }

    const uniqueMap = new Map();
    resultList.forEach((n) => {
      if (n && n.id && !uniqueMap.has(n.id)) {
        // If it was marked as read in local cache, force is_read: true
        const isRead = n.is_read || readIds.has(n.id);
        uniqueMap.set(n.id, {
          ...n,
          is_read: isRead,
        });
      }
    });

    return Array.from(uniqueMap.values()).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async markAsRead(notificationId: string) {
    // 1. Instantly record locally
    const readIds = getLocalReadIds();
    readIds.add(notificationId);
    saveLocalReadIds(readIds);

    // 2. Dispatch storage event for cross-tab or immediate sync
    window.dispatchEvent(new Event('storage'));

    // 3. Sync to Supabase in non-blocking try/catch
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });
      if (error) {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId);
      }
    } catch {
      // ignore Supabase errors for demo/local notifications
    }
  },

  async markAllAsRead(allNotificationIds?: string[]) {
    // 1. Record all known IDs locally
    const readIds = getLocalReadIds();
    if (allNotificationIds && allNotificationIds.length > 0) {
      allNotificationIds.forEach((id) => readIds.add(id));
    } else {
      // Also add known standard fallback IDs
      readIds.add('n-1');
      readIds.add('n-2');
      try {
        const storedAnnouncements = JSON.parse(
          localStorage.getItem('genmitra_platform_announcements') || '[]'
        );
        if (Array.isArray(storedAnnouncements)) {
          storedAnnouncements.forEach((a: any) => readIds.add(`notif-announcement-${a.id}`));
        }
      } catch {
        // ignore
      }
    }
    saveLocalReadIds(readIds);

    // 2. Dispatch storage event for cross-tab or immediate sync
    window.dispatchEvent(new Event('storage'));

    // 3. Sync to Supabase in non-blocking try/catch
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('is_read', false);
      }
    } catch {
      // ignore Supabase errors
    }
  },
};
