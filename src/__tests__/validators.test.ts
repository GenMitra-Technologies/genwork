import { describe, it, expect } from 'vitest';
import {
  submitTaskSchema,
  createTaskSchema,
  loginSchema,
  reviewSubmissionSchema,
  changeDeadlineSchema,
} from '../lib/validators';

describe('Internship Platform Validation Schemas', () => {
  describe('Login Schema', () => {
    it('validates a correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'intern.david@internship.org',
        password: 'Password123!',
        role: 'intern',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email address', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123!',
        role: 'intern',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('validates test@intern, test@mentor, test@admin with password 123', () => {
      const internRes = loginSchema.safeParse({
        email: 'test@intern',
        password: '123',
        role: 'intern',
      });
      expect(internRes.success).toBe(true);

      const mentorRes = loginSchema.safeParse({
        email: 'test@mentor',
        password: '123',
        role: 'mentor',
      });
      expect(mentorRes.success).toBe(true);

      const adminRes = loginSchema.safeParse({
        email: 'test@admin',
        password: '123',
        role: 'admin',
      });
      expect(adminRes.success).toBe(true);
    });

    it('correctly maps findTestAccount for all roles', async () => {
      const { findTestAccount } = await import('../lib/testAuth');
      expect(findTestAccount('test@intern')?.role).toBe('intern');
      expect(findTestAccount('test@intern.com')?.role).toBe('intern');
      expect(findTestAccount('test@mentor')?.role).toBe('mentor');
      expect(findTestAccount('test@mentor.com')?.role).toBe('mentor');
      expect(findTestAccount('test@admin')?.role).toBe('admin');
      expect(findTestAccount('test@admin.com')?.role).toBe('admin');
      expect(findTestAccount('unknown@domain.com')).toBeNull();
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'intern.david@internship.org',
        password: '',
        role: 'intern',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Submit Task Schema (Deliverable URLs)', () => {
    it('accepts valid GitHub, Vercel preview, and Google Drive URLs', () => {
      const result = submitTaskSchema.safeParse({
        github_url: 'https://github.com/organization/intern-project',
        deployment_url: 'https://preview-staging.vercel.app',
        drive_url: 'https://drive.google.com/file/d/1234567890/view',
        note: 'Completed all backend RPC functions and verified permissions.',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-https URLs for deliverables', () => {
      const result = submitTaskSchema.safeParse({
        github_url: 'http://github.com/org/repo',
        deployment_url: 'https://project.com',
        drive_url: 'https://drive.google.com/file/d/123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('https://'))).toBe(true);
      }
    });

    it('rejects non-GitHub domain for github_url', () => {
      const result = submitTaskSchema.safeParse({
        github_url: 'https://gitlab.com/org/repo',
        deployment_url: 'https://preview.vercel.app',
        drive_url: 'https://drive.google.com/file/d/123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('github.com'))).toBe(true);
      }
    });

    it('rejects non-Drive domain for drive_url', () => {
      const result = submitTaskSchema.safeParse({
        github_url: 'https://github.com/org/repo',
        deployment_url: 'https://preview.vercel.app',
        drive_url: 'https://dropbox.com/file/123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('drive.google.com'))).toBe(true);
      }
    });
  });

  describe('Create Task Schema', () => {
    it('validates a complete task definition with deliverables requirement', () => {
      const result = createTaskSchema.safeParse({
        title: 'Build Secure Storage Buckets with RLS',
        description: 'Configure private Supabase Storage buckets for submission files.',
        instructions: 'Follow migration script 0010_storage_buckets_policies.sql',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        require_github: true,
        require_deployment: true,
        require_drive: false,
        assign_all: true,
        intern_ids: [],
      });
      expect(result.success).toBe(true);
    });

    it('rejects task with empty title or invalid priority', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        description: 'Short task',
        priority: 'extreme', // not in enum
        due_date: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Review Submission Schema', () => {
    it('approves submission with feedback', () => {
      const result = reviewSubmissionSchema.safeParse({
        result: 'approved',
        feedback: 'Excellent test coverage and proper security definer functions.',
      });
      expect(result.success).toBe(true);
    });

    it('requires feedback and accepts required_changes when changes_requested', () => {
      const result = reviewSubmissionSchema.safeParse({
        result: 'changes_requested',
        feedback: 'Please address RLS policy violation on anonymous select.',
        required_changes: 'Revoke public select on mentors table and enforce current_mentor_id() check.',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Change Deadline Schema', () => {
    it('validates valid ISO timestamp for task deadline', () => {
      const result = changeDeadlineSchema.safeParse({
        due_date: '2026-11-01T12:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid timestamp string', () => {
      const result = changeDeadlineSchema.safeParse({
        due_date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});
