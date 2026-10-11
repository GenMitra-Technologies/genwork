-- 0001_enums_and_extensions.sql

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Role & Account enums
create type public.user_role as enum ('intern', 'mentor', 'admin');
create type public.account_status as enum ('active', 'inactive', 'suspended');
create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');

-- Task workflow status
create type public.task_status as enum (
  'assigned',
  'pending',
  'in_progress',
  'submitted',
  'waiting_for_review',
  'approved',
  'changes_requested',
  'resubmitted',
  'archived'
);

create type public.review_result as enum ('approved', 'changes_requested');

-- Assignment workflow status
create type public.assignment_status as enum (
  'pending',
  'in_progress',
  'submitted',
  'under_review',
  'approved',
  'changes_requested'
);

-- Notification types
create type public.notification_type as enum (
  'task_assigned',
  'assignment_assigned',
  'task_started',
  'task_submitted',
  'task_resubmitted',
  'task_approved',
  'changes_requested',
  'mentor_feedback',
  'deadline_approaching',
  'task_overdue',
  'assignment_deadline',
  'assignment_submitted',
  'intern_assigned',
  'announcement'
);
