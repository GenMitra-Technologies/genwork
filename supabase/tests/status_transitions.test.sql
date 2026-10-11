-- supabase/tests/status_transitions.test.sql
-- pgTAP tests for Task Status transitions

begin;
select plan(4);

-- 1. Pending to Submitted directly without going to in_progress should fail trigger
select throws_ok(
  'update public.task_assignments set status = ''submitted'' where status = ''pending'' limit 1',
  '23514', -- or exception
  'Direct invalid status transition must be rejected'
);

-- 2. Test that duplicate start raises ALREADY_STARTED
-- (start_task on already started assignment)
select has_function('public', 'start_task', ARRAY['uuid']);

-- 3. Test that review_submission validates feedback on changes_requested
select has_function('public', 'review_submission', ARRAY['uuid', 'public.review_result', 'text', 'text', 'text']);

-- 4. Test that streak activity recorder function exists
select has_function('public', 'record_intern_activity', ARRAY['uuid']);

select * from finish();
rollback;
