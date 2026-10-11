-- supabase/tests/rls_mentor.test.sql
-- pgTAP tests for Mentor RLS isolation

begin;
select plan(5);

set local role authenticated;
set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

-- 1. Mentor should only see interns assigned to them
select results_eq(
  'select count(*)::int from public.interns where mentor_id != ''10000000-0000-0000-0000-000000000001''',
  ARRAY[0],
  'Mentor cannot see interns of other mentors'
);

-- 2. Mentor cannot see tasks of another mentor
select results_eq(
  'select count(*)::int from public.tasks where mentor_id != ''10000000-0000-0000-0000-000000000001''',
  ARRAY[0],
  'Mentor cannot see tasks created by other mentors'
);

-- 3. Mentor cannot review tasks of another mentor''s intern
select throws_ok(
  'select public.review_submission(''00000000-0000-0000-0000-000000000099'', ''approved'', ''Good job'')',
  null,
  'Mentor cannot review submission outside their ownership'
);

-- 4. Mentor can see notifications addressed to them
select results_eq(
  'select count(*)::int from public.notifications where recipient_id != ''00000000-0000-0000-0000-000000000002''',
  ARRAY[0],
  'Mentor can only see notifications sent to themselves'
);

-- 5. Mentor cannot read platform_settings
select results_eq(
  'select count(*)::int from public.platform_settings',
  ARRAY[0],
  'Mentor has no access to platform settings'
);

select * from finish();
rollback;
