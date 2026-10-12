// src/__tests__/platformRoutesAndApis.test.ts
import { describe, it, expect } from 'vitest';
import { adminApi } from '../features/admin/api';
import { internApi } from '../features/intern/api';
import { notificationsApi } from '../features/notifications/api';
import { findTestAccount, TEST_ACCOUNTS } from '../lib/testAuth';

describe('A to Z Comprehensive Platform Test Suite', () => {
  describe('1. Authentication & Role Accounts Verification', () => {
    it('should have predefined valid credentials for all three user roles', () => {
      expect(TEST_ACCOUNTS['sindhugangisetty910@gmail.com']).toBeDefined();
      expect(TEST_ACCOUNTS['sindhugangisetty910@gmail.com'].role).toBe('intern');
      expect(TEST_ACCOUNTS['sindhugangisetty910@gmail.com'].supabasePassword).toBe('GENMITRA@INTERN');

      expect(TEST_ACCOUNTS['manireddy@genmitra.com']).toBeDefined();
      expect(TEST_ACCOUNTS['manireddy@genmitra.com'].role).toBe('mentor');
      expect(TEST_ACCOUNTS['manireddy@genmitra.com'].supabasePassword).toBe('GENMITRA@MENTOR');

      expect(TEST_ACCOUNTS['ops@genmitra.com']).toBeDefined();
      expect(TEST_ACCOUNTS['ops@genmitra.com'].role).toBe('admin');
      expect(TEST_ACCOUNTS['ops@genmitra.com'].supabasePassword).toBe('GENMITRA@ADMIN2026');
    });

    it('should correctly resolve test accounts via findTestAccount helper', () => {
      const internAcc = findTestAccount('sindhugangisetty910@gmail.com');
      expect(internAcc).not.toBeNull();
      expect(internAcc?.role).toBe('intern');

      const mentorAcc = findTestAccount('manireddy@genmitra.com');
      expect(mentorAcc).not.toBeNull();
      expect(mentorAcc?.role).toBe('mentor');

      const adminAcc = findTestAccount('ops@genmitra.com');
      expect(adminAcc).not.toBeNull();
      expect(adminAcc?.role).toBe('admin');
    });

    it('admin profile full_name should be strictly "GenMitra Operations" without individual names', () => {
      const adminAcc = findTestAccount('ops@genmitra.com');
      expect(adminAcc?.profile.full_name).toBe('GenMitra Operations');
    });
  });

  describe('2. Notifications System & Mark as Read', () => {
    it('should fetch notifications for a user profile', async () => {
      const testUserId = '00000000-0000-0000-0000-000000000011';
      const notifs = await notificationsApi.getNotifications(testUserId);
      expect(Array.isArray(notifs)).toBe(true);
    });

    it('should mark single notification as read and persist', async () => {
      const notifId = 'test-notif-uuid-1';
      await notificationsApi.markAsRead(notifId);
      const readRaw = localStorage.getItem('genmitra_read_notification_ids');
      expect(readRaw).not.toBeNull();
      const readIds = JSON.parse(readRaw || '[]');
      expect(readIds).toContain(notifId);
    });

    it('should mark all notifications as read and clear unread state', async () => {
      const testIds = ['notif-a', 'notif-b'];
      await notificationsApi.markAllAsRead(testIds);
      const readRaw = localStorage.getItem('genmitra_read_notification_ids');
      const readIds = JSON.parse(readRaw || '[]');
      expect(readIds).toContain('notif-a');
      expect(readIds).toContain('notif-b');
    });
  });

  describe('3. Intern Workflow: Tasks & Submissions', () => {
    it('should return intern task list', async () => {
      const tasks = await internApi.getMyTasks('20000000-0000-0000-0000-000000000001');
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('should successfully start a task', async () => {
      const res = await internApi.startTask('11111111-0000-0000-0000-000000000001');
      expect(res).toBeDefined();
    });

    it('should submit deliverable with GitHub repo and deployment URL', async () => {
      const res = await internApi.submitTask('11111111-0000-0000-0000-000000000001', {
        github_url: 'https://github.com/test/repo',
        deployment_url: 'https://demo.vercel.app',
        note: 'All milestone acceptance criteria met.',
      });
      expect(res).toBeDefined();
    });
  });

  describe('4. Admin Governance: Mentors CRUD', () => {
    it('should list mentors in directory', async () => {
      const mentors = await adminApi.getMentors();
      expect(Array.isArray(mentors)).toBe(true);
      expect(mentors.length).toBeGreaterThan(0);
    });

    it('should create a new mentor with department and profile', async () => {
      const created = await adminApi.createMentor({
        full_name: 'Dr. Evelyn Reed',
        email: 'mentor.evelyn@internship.org',
        department: 'AI & Machine Learning Research',
        bio: 'Leading AI safety and neural architectures.',
      });
      expect(created.id).toBeDefined();
      expect(created.profile.full_name).toBe('Dr. Evelyn Reed');

      const mentorsAfter = await adminApi.getMentors();
      const found = mentorsAfter.find((m: any) => m.id === created.id);
      expect(found).toBeDefined();
    });

    it('should update an existing mentor', async () => {
      const created = await adminApi.createMentor({
        full_name: 'Marcus Brody',
        email: 'mentor.marcus@internship.org',
        department: 'Product Strategy',
        bio: 'Initial bio',
      });

      await adminApi.updateMentor(created.id, {
        department: 'Enterprise Product Leadership',
        bio: 'Updated bio text',
      });

      const mentorsAfter = await adminApi.getMentors();
      const updated = mentorsAfter.find((m: any) => m.id === created.id);
      expect(updated?.department).toBe('Enterprise Product Leadership');
      expect(updated?.bio).toBe('Updated bio text');
    });

    it('should delete a mentor and remove from directory list', async () => {
      const created = await adminApi.createMentor({
        full_name: 'Temporary Mentor',
        email: 'temp.mentor@internship.org',
        department: 'Temporary Department',
      });

      await adminApi.deleteMentor(created.id);
      const mentorsAfter = await adminApi.getMentors();
      const found = mentorsAfter.find((m: any) => m.id === created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('5. Admin Governance: Platform Broadcast Announcements', () => {
    it('should broadcast an announcement and store it locally for dispatch', async () => {
      const title = 'Test System Broadcast Announcement';
      const body = 'Platform scheduled maintenance notice.';
      const res = await adminApi.broadcastAnnouncement({
        title,
        body,
        targetRole: 'all',
      });

      expect(res).toBeDefined();
      expect(res.title).toBe(title);

      const raw = localStorage.getItem('genmitra_platform_announcements');
      expect(raw).not.toBeNull();
      const list = JSON.parse(raw || '[]');
      const found = list.find((a: any) => a.title === title);
      expect(found).toBeDefined();
    });
  });

  describe('6. Admin Governance: Maintenance Mode', () => {
    it('should save and update maintenance mode configurations', () => {
      const config = {
        enabled: true,
        title: 'Emergency Maintenance',
        message: 'Security update in progress',
        estimatedDuration: 45,
      };
      localStorage.setItem('genmitra_maintenance_mode', JSON.stringify(config));

      const readBack = JSON.parse(localStorage.getItem('genmitra_maintenance_mode') || '{}');
      expect(readBack.enabled).toBe(true);
      expect(readBack.title).toBe('Emergency Maintenance');
    });
  });
});
