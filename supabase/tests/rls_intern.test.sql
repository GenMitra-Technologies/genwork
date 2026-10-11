-- supabase/tests/rls_intern.test.sql
-- pgTAP tests for Intern RLS isolation

begin;
select plan(7);

-- 1. Check extension
select has_extension('pgtap');

-- 2. Verify profiles isolation: Intern should not be able to select unauthorized profiles
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000011", "role": "authenticated"}';

select results_eq(
  'select count(*)::int from public.profiles where role = ''admin''',
  ARRAY[0],
  'Intern cannot see admin profiles'
);

-- 3. Verify interns isolation: Intern can only see own row
select results_eq(
  'select count(*)::int from public.interns',
  ARRAY[1],
  'Intern can only see their own intern record'
);

-- 4. Verify task assignments isolation: Intern only sees own task assignments
select results_eq(
  'select count(*)::int from public.task_assignments where intern_id != ''20000000-0000-0000-0000-000000000001''',
  ARRAY[0],
  'Intern cannot see other interns task assignments'
);

-- 5. Direct status update on task_assignments must fail (privilege revoked)
select throws_ok(
  'update public.task_assignments set status = ''approved'' where intern_id = ''20000000-0000-0000-0000-000000000001''',
  null,
  'Intern cannot directly update status column on task_assignments'
);

-- 6. Verify submissions isolation
select results_eq(
  'select count(*)::int from public.task_submissions where submitted_by != ''00000000-0000-0000-0000-000000000011''',
  ARRAY[0],
  'Intern cannot see submissions of other interns'
);

-- 7. Verify activity_logs isolation: Intern cannot select activity logs
select results_eq(
  'select count(*)::int from public.activity_logs',
  ARRAY[0],
  'Intern has zero access to activity logs'
);

select * from finish();
rollback;
