-- seed.sql
-- Demo seed data with 1 Admin, 2 Mentors, 6 Interns, 2 Internships, 12 Tasks, 4 Assignments

-- Setup UUIDs for reproducible seed
do $$
declare
  -- Admin
  v_admin_uid uuid := '00000000-0000-0000-0000-000000000001';
  -- Mentors
  v_mentor1_uid uuid := '00000000-0000-0000-0000-000000000002';
  v_mentor2_uid uuid := '00000000-0000-0000-0000-000000000003';
  v_mentor1_id uuid := '10000000-0000-0000-0000-000000000001';
  v_mentor2_id uuid := '10000000-0000-0000-0000-000000000002';
  -- Interns
  v_intern1_uid uuid := '00000000-0000-0000-0000-000000000011';
  v_intern2_uid uuid := '00000000-0000-0000-0000-000000000012';
  v_intern3_uid uuid := '00000000-0000-0000-0000-000000000013';
  v_intern4_uid uuid := '00000000-0000-0000-0000-000000000014';
  v_intern5_uid uuid := '00000000-0000-0000-0000-000000000015';
  v_intern6_uid uuid := '00000000-0000-0000-0000-000000000016';
  v_intern1_id uuid := '20000000-0000-0000-0000-000000000001';
  v_intern2_id uuid := '20000000-0000-0000-0000-000000000002';
  v_intern3_id uuid := '20000000-0000-0000-0000-000000000003';
  v_intern4_id uuid := '20000000-0000-0000-0000-000000000004';
  v_intern5_id uuid := '20000000-0000-0000-0000-000000000005';
  v_intern6_id uuid := '20000000-0000-0000-0000-000000000006';
  -- Internships
  v_cohort1_id uuid := '30000000-0000-0000-0000-000000000001';
  v_cohort2_id uuid := '30000000-0000-0000-0000-000000000002';
  -- Tasks
  v_t1 uuid; v_t2 uuid; v_t3 uuid; v_t4 uuid; v_t5 uuid; v_t6 uuid;
  v_t7 uuid; v_t8 uuid; v_t9 uuid; v_t10 uuid; v_t11 uuid; v_t12 uuid;
  -- Task Assignments
  v_ta1 uuid; v_ta2 uuid; v_ta3 uuid; v_ta4 uuid; v_ta5 uuid; v_ta6 uuid;
  -- Submissions
  v_sub1 uuid; v_sub2_v1 uuid; v_sub2_v2 uuid; v_sub3 uuid; v_sub4 uuid;
  -- Default hashed password for Password123!
  v_password_hash text := crypt('Password123!', gen_salt('bf'));
begin

  -- 1. Create auth.users rows if not present
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at)
  values
    (v_admin_uid, '00000000-0000-0000-0000-000000000000', 'admin@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins (Admin)"}', 'authenticated', 'authenticated', now(), now()),
    (v_mentor1_uid, '00000000-0000-0000-0000-000000000000', 'mentor.alex@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Rivera"}', 'authenticated', 'authenticated', now(), now()),
    (v_mentor2_uid, '00000000-0000-0000-0000-000000000000', 'mentor.elena@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Rostova"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern1_uid, '00000000-0000-0000-0000-000000000000', 'intern.david@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Kim"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern2_uid, '00000000-0000-0000-0000-000000000000', 'intern.priya@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Patel"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern3_uid, '00000000-0000-0000-0000-000000000000', 'intern.marcus@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Vance"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern4_uid, '00000000-0000-0000-0000-000000000000', 'intern.chloe@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chloe Bennett"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern5_uid, '00000000-0000-0000-0000-000000000000', 'intern.liam@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Liam O''Connor"}', 'authenticated', 'authenticated', now(), now()),
    (v_intern6_uid, '00000000-0000-0000-0000-000000000000', 'intern.aisha@internship.org', v_password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Al-Mansoor"}', 'authenticated', 'authenticated', now(), now())
  on conflict (id) do nothing;

  -- 2. Profiles
  insert into public.profiles (id, full_name, email, role, status, avatar_url, must_change_password)
  values
    (v_admin_uid, 'Sarah Jenkins', 'admin@internship.org', 'admin', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', false),
    (v_mentor1_uid, 'Alex Rivera', 'mentor.alex@internship.org', 'mentor', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', false),
    (v_mentor2_uid, 'Elena Rostova', 'mentor.elena@internship.org', 'mentor', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', false),
    (v_intern1_uid, 'David Kim', 'intern.david@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', false),
    (v_intern2_uid, 'Priya Patel', 'intern.priya@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', false),
    (v_intern3_uid, 'Marcus Vance', 'intern.marcus@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', false),
    (v_intern4_uid, 'Chloe Bennett', 'intern.chloe@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe', false),
    (v_intern5_uid, 'Liam O''Connor', 'intern.liam@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', false),
    (v_intern6_uid, 'Aisha Al-Mansoor', 'intern.aisha@internship.org', 'intern', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha', false)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status;

  -- 3. Internships
  insert into public.internships (id, code, name, description, start_date, end_date, status, created_by)
  values
    (v_cohort1_id, 'INT-001', 'Summer 2026 Engineering Cohort', '12-week intensive software engineering internship focusing on scalable web platforms.', '2026-06-01', '2026-08-31', 'active', v_admin_uid),
    (v_cohort2_id, 'INT-002', 'Fall 2026 Design & Mobile Cohort', '12-week UI/UX and mobile development cohort building cross-platform applications.', '2026-09-01', '2026-11-30', 'active', v_admin_uid)
  on conflict (id) do nothing;

  -- 4. Mentors
  insert into public.mentors (id, profile_id, department, bio, status)
  values
    (v_mentor1_id, v_mentor1_uid, 'Software Engineering', 'Senior Staff Software Engineer specializing in distributed databases and cloud native architectures.', 'active'),
    (v_mentor2_id, v_mentor2_uid, 'Product & UI/UX', 'Lead Product Designer and Mobile Specialist with 10+ years shaping intuitive design systems.', 'active')
  on conflict (id) do nothing;

  -- 5. Interns
  insert into public.interns (id, profile_id, internship_id, mentor_id, role_title, company_name, start_date, end_date, status, current_streak, longest_streak, total_active_days, last_active_date)
  values
    (v_intern1_id, v_intern1_uid, v_cohort1_id, v_mentor1_id, 'Full Stack Intern', 'NovaTech Systems', '2026-06-01', '2026-08-31', 'active', 4, 8, 14, (now() at time zone 'Asia/Kolkata')::date),
    (v_intern2_id, v_intern2_uid, v_cohort1_id, v_mentor1_id, 'Frontend Engineer Intern', 'NovaTech Systems', '2026-06-01', '2026-08-31', 'active', 2, 5, 11, (now() at time zone 'Asia/Kolkata')::date),
    (v_intern3_id, v_intern3_uid, v_cohort1_id, v_mentor1_id, 'Backend Systems Intern', 'NovaTech Systems', '2026-06-01', '2026-08-31', 'active', 1, 3, 7, (now() at time zone 'Asia/Kolkata')::date),
    (v_intern4_id, v_intern4_uid, v_cohort2_id, v_mentor2_id, 'UI/UX Design Intern', 'Apex Digital', '2026-09-01', '2026-11-30', 'active', 5, 5, 16, (now() at time zone 'Asia/Kolkata')::date),
    (v_intern5_id, v_intern5_uid, v_cohort2_id, v_mentor2_id, 'Mobile Developer Intern', 'Apex Digital', '2026-09-01', '2026-11-30', 'active', 0, 4, 8, ((now() at time zone 'Asia/Kolkata')::date - interval '3 days')::date),
    (v_intern6_id, v_intern6_uid, v_cohort2_id, v_mentor2_id, 'QA Automation Intern', 'Apex Digital', '2026-09-01', '2026-11-30', 'active', 3, 6, 12, (now() at time zone 'Asia/Kolkata')::date)
  on conflict (id) do nothing;

  -- 6. Tasks
  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0001', 'Setup Local Dev Environment & Tooling', 'Configure Git, Docker, Node.js and Supabase CLI. Verify workspace setup by running test suite.', 'Follow the onboarding doc in the repository wiki.', 'All local services running; test suite passing green.', 'Terminal screenshot and verified PR link.', v_mentor1_id, 'high', now() + interval '5 days', true, false, false, v_mentor1_uid)
    returning id into v_t1;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0002', 'Design PostgreSQL Schema & Migration Files', 'Draft database schema for relational entity workflow including constraints, foreign keys, and indexes.', 'Provide migrations and schema diagram in markdown.', 'Strict SQL scripts with zero syntax flaws; idempotency.', 'SQL migration scripts and ER diagram link.', v_mentor1_id, 'urgent', now() + interval '2 days', true, true, false, v_mentor1_uid)
    returning id into v_t2;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0003', 'Implement Authentication & Role-Based Routing', 'Setup Supabase Auth with custom role JWT claims and client-side RoleGuard route protection.', 'Integrate login page with role tabs (Intern, Mentor, Admin).', 'Unauthenticated or unauthorized routes must redirect properly.', 'Deployed authentication preview URL and code repo.', v_mentor1_id, 'high', now() + interval '7 days', true, true, false, v_mentor1_uid)
    returning id into v_t3;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0004', 'Build Task Submission & Versioning Module', 'Create submission modal with URL validation (GitHub, Deployment, Google Drive) and immutable history.', 'Validate URL schemes on client and Postgres functions.', 'Strict validation on domain hosts; calculate time taken.', 'Functional submission dialog and timeline viewer.', v_mentor1_id, 'medium', now() + interval '4 days', true, false, true, v_mentor1_uid)
    returning id into v_t4;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0005', 'Interactive Analytics & Recharts Widgets', 'Build stat cards, streak flame trackers, and completion velocity charts.', 'Use recharts responsive containers.', 'Support responsive viewports down to 375px mobile.', 'Component PR and demo video link.', v_mentor1_id, 'medium', now() + interval '9 days', true, true, false, v_mentor1_uid)
    returning id into v_t5;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0006', 'Realtime WebSockets Notification Bell', 'Subscribe to postgres_changes channel for recipient notifications with toast and query invalidation.', 'Support reconnect with polling fallback 30s.', 'Instant unread badge increment upon new notification event.', 'Video demo of cross-tab realtime notification trigger.', v_mentor1_id, 'low', now() + interval '12 days', true, false, false, v_mentor1_uid)
    returning id into v_t6;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0007', 'End-to-End Test Suite with Vitest & Playwright', 'Write automated tests for login, task start, submit, review and permission restrictions.', 'Include RLS pgTAP tests.', 'High code coverage across critical user workflows.', 'Playwright test report HTML.', v_mentor1_id, 'high', now() + interval '6 days', true, false, false, v_mentor1_uid)
    returning id into v_t7;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0008', 'Design System & Tailwind Theme Tokens', 'Implement semantic color tokens, typography scales, and custom card components.', 'Follow modern SaaS minimalist standards.', 'Clean accessible contrast ratios; 8px grid.', 'Figma link and storybook deployment.', v_mentor2_id, 'high', now() + interval '3 days', false, true, true, v_mentor2_uid)
    returning id into v_t8;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0009', 'Mobile Responsive Drawer & Layout Navigation', 'Adapt fixed desktop sidebar into clean hamburger sheet drawer on mobile viewports.', 'Zero horizontal scroll on 375px screens.', 'Smooth transitions and touch friendly hit targets.', 'Responsive demo link.', v_mentor2_id, 'medium', now() + interval '8 days', true, true, false, v_mentor2_uid)
    returning id into v_t9;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0010', 'Performance Profiling & Bundle Size Optimization', 'Analyze chunk sizes, implement code splitting via lazy loading, and audit network waterfalls.', 'Ensure initial bundle < 250kb gzipped.', 'Lighthouse performance score 95+.', 'Lighthouse audit report PDF.', v_mentor2_id, 'urgent', now() - interval '1 day', true, true, false, v_mentor2_uid)
    returning id into v_t10;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0011', 'REST & RPC API Specification Document', 'Document all Supabase RPC functions, parameters, return types and error codes.', 'Generate OpenAPI / Swagger spec.', 'Complete matrix of errors and permissions.', 'Hosted API docs URL.', v_mentor2_id, 'medium', now() + interval '10 days', false, true, true, v_mentor2_uid)
    returning id into v_t11;

  insert into public.tasks (code, title, description, instructions, requirements, expected_output, mentor_id, priority, due_date, require_github, require_deployment, require_drive, created_by)
  values
    ('TSK-0012', 'Security Audit & Input Sanitization Review', 'Audit application against XSS, SQL injection, open redirect, and privilege escalation vulnerabilities.', 'Check all URLs with rel="noopener noreferrer".', 'Zero security findings report.', 'Audit report summary document.', v_mentor2_id, 'high', now() + interval '14 days', true, false, true, v_mentor2_uid)
    returning id into v_t12;

  -- 7. Task Assignments for David (Intern 1)
  -- T1: Approved
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, started_at, first_submitted_at, last_submitted_at, approved_at, current_version)
  values (v_t1, v_intern1_id, 'approved', now() - interval '6 days', now() - interval '5 days', now() - interval '4 days', now() - interval '4 days', now() - interval '3 days', 1)
  returning id into v_ta1;

  insert into public.task_submissions (task_assignment_id, version, github_url, deployment_url, note, started_at_snapshot, submitted_at, time_taken_seconds, submitted_by)
  values (v_ta1, 1, 'https://github.com/internship-demo/dev-setup', 'https://demo-setup.vercel.app', 'Completed initial setup and tested local migrations.', now() - interval '5 days', now() - interval '4 days', 86400, v_intern1_uid)
  returning id into v_sub1;

  insert into public.reviews (submission_id, mentor_id, reviewer_profile_id, result, feedback, reviewed_at)
  values (v_sub1, v_mentor1_id, v_mentor1_uid, 'approved', 'Great work setting up the development container and verifying tests!', now() - interval '3 days');

  -- T2: Multi-version history (v1 changes requested, v2 approved!)
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, started_at, first_submitted_at, last_submitted_at, approved_at, current_version)
  values (v_t2, v_intern1_id, 'approved', now() - interval '5 days', now() - interval '4 days', now() - interval '3 days', now() - interval '1 day', now() - interval '12 hours', 2)
  returning id into v_ta2;

  insert into public.task_submissions (task_assignment_id, version, github_url, deployment_url, note, started_at_snapshot, submitted_at, time_taken_seconds, submitted_by)
  values (v_ta2, 1, 'https://github.com/internship-demo/db-schema', 'https://db-preview.vercel.app', 'Drafted v1 schema migrations.', now() - interval '4 days', now() - interval '3 days', 86400, v_intern1_uid)
  returning id into v_sub2_v1;

  insert into public.reviews (submission_id, mentor_id, reviewer_profile_id, result, feedback, required_changes, reviewed_at)
  values (v_sub2_v1, v_mentor1_id, v_mentor1_uid, 'changes_requested', 'Indexes are missing on foreign key columns and timestamps need timestamptz.', 'Add btree indexes and change timestamp to timestamptz.', now() - interval '2 days');

  insert into public.task_submissions (task_assignment_id, version, github_url, deployment_url, note, started_at_snapshot, submitted_at, time_taken_seconds, submitted_by)
  values (v_ta2, 2, 'https://github.com/internship-demo/db-schema/tree/v2', 'https://db-preview-v2.vercel.app', 'Added missing composite indexes and timestamptz.', now() - interval '4 days', now() - interval '1 day', 259200, v_intern1_uid)
  returning id into v_sub2_v2;

  insert into public.reviews (submission_id, mentor_id, reviewer_profile_id, result, feedback, reviewed_at)
  values (v_sub2_v2, v_mentor1_id, v_mentor1_uid, 'approved', 'Excellent revisions! Migration scripts are idempotent and well-indexed.', now() - interval '12 hours');

  -- T3: Waiting for review (submitted)
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, started_at, first_submitted_at, last_submitted_at, current_version)
  values (v_t3, v_intern1_id, 'waiting_for_review', now() - interval '3 days', now() - interval '2 days', now() - interval '5 hours', now() - interval '5 hours', 1)
  returning id into v_ta3;

  insert into public.task_submissions (task_assignment_id, version, github_url, deployment_url, note, started_at_snapshot, submitted_at, time_taken_seconds, submitted_by)
  values (v_ta3, 1, 'https://github.com/internship-demo/auth-module', 'https://auth-preview.vercel.app', 'Implemented RoleGuard and idle timeout handling.', now() - interval '2 days', now() - interval '5 hours', 154800, v_intern1_uid)
  returning id into v_sub3;

  -- T4: Changes Requested (awaiting resubmission)
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, started_at, first_submitted_at, last_submitted_at, current_version)
  values (v_t4, v_intern1_id, 'changes_requested', now() - interval '3 days', now() - interval '2 days', now() - interval '1 day', now() - interval '1 day', 1)
  returning id into v_ta4;

  insert into public.task_submissions (task_assignment_id, version, github_url, drive_url, note, started_at_snapshot, submitted_at, time_taken_seconds, submitted_by)
  values (v_ta4, 1, 'https://github.com/internship-demo/task-portal', 'https://drive.google.com/file/d/demo-spec', 'Submitted initial version of task form dialog.', now() - interval '2 days', now() - interval '1 day', 86400, v_intern1_uid)
  returning id into v_sub4;

  insert into public.reviews (submission_id, mentor_id, reviewer_profile_id, result, feedback, required_changes, reviewed_at)
  values (v_sub4, v_mentor1_id, v_mentor1_uid, 'changes_requested', 'Please add server-side validation error toasts and prevent button double clicking.', 'Disable submit button during submission state and add error banner.', now() - interval '6 hours');

  -- T5: In Progress
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, started_at, current_version)
  values (v_t5, v_intern1_id, 'in_progress', now() - interval '2 days', now() - interval '18 hours', 0)
  returning id into v_ta5;

  -- T6: Pending (not started)
  insert into public.task_assignments (task_id, intern_id, status, assigned_at, current_version)
  values (v_t6, v_intern1_id, 'pending', now() - interval '1 day', 0)
  returning id into v_ta6;

  -- Assign remaining tasks across interns
  insert into public.task_assignments (task_id, intern_id, status, assigned_at)
  values
    (v_t7, v_intern2_id, 'pending', now()),
    (v_t8, v_intern4_id, 'approved', now() - interval '2 days'),
    (v_t9, v_intern4_id, 'in_progress', now() - interval '1 day'),
    (v_t10, v_intern5_id, 'pending', now() - interval '4 days'), -- Overdue!
    (v_t11, v_intern6_id, 'waiting_for_review', now() - interval '2 days'),
    (v_t12, v_intern3_id, 'pending', now());

  -- 8. Assignments (Coursework / Quizzes)
  insert into public.assignments (code, title, description, instructions, mentor_id, priority, due_date, created_by)
  values
    ('ASG-0001', 'Postgres Isolation Levels & Concurrency Analysis', 'Write a technical breakdown explaining Read Committed vs Serializable and how FOR UPDATE protects against race conditions.', 'Submit a written markdown analysis.', v_mentor1_id, 'high', now() + interval '3 days', v_mentor1_uid),
    ('ASG-0002', 'Web Accessibility (a11y) & WCAG 2.1 AA Audit', 'Inspect application components with axe-core and screen readers; document all compliance gaps.', 'Include screen reader keyboard navigation flows.', v_mentor2_id, 'medium', now() + interval '5 days', v_mentor2_uid),
    ('ASG-0003', 'State Management Architecture Comparison', 'Analyze trade-offs between Zustand and React Context in high-frequency realtime rendering applications.', 'Provide code snippets demonstrating selective subscription.', v_mentor1_id, 'medium', now() + interval '8 days', v_mentor1_uid),
    ('ASG-0004', 'Browser Performance & Web Vitals Deep-Dive', 'Measure and explain LCP, INP, and CLS; detail concrete optimization strategies.', 'Include Chrome DevTools profiling trace explanations.', v_mentor2_id, 'low', now() + interval '10 days', v_mentor2_uid);

  -- Assign recipients for ASG-0001
  insert into public.assignment_recipients (assignment_id, intern_id, status, assigned_at)
  select a.id, v_intern1_id, 'pending', now()
  from public.assignments a where a.code = 'ASG-0001';

  insert into public.assignment_recipients (assignment_id, intern_id, status, assigned_at)
  select a.id, v_intern1_id, 'in_progress', now() - interval '1 day'
  from public.assignments a where a.code = 'ASG-0002';

  -- 9. Sample Notifications
  insert into public.notifications (recipient_id, title, message, type, related_type, related_id, related_code, is_read)
  values
    (v_intern1_uid, 'Changes Requested on TSK-0004', 'Alex Rivera requested revisions on Task Submission Portal.', 'changes_requested', 'task', v_t4, 'TSK-0004', false),
    (v_intern1_uid, 'Deadline Approaching: TSK-0002', 'Task TSK-0002 is due within 48 hours.', 'deadline_approaching', 'task', v_t2, 'TSK-0002', true),
    (v_intern1_uid, 'Task Approved! TSK-0001', 'Your submission for TSK-0001 has been approved by Alex Rivera.', 'task_approved', 'task', v_t1, 'TSK-0001', true),
    (v_mentor1_uid, 'Submission Received: TSK-0003', 'David Kim submitted TSK-0003 (Implement Authentication) for review.', 'task_submitted', 'task', v_t3, 'TSK-0003', false);

  -- 10. Sample Activity Logs
  insert into public.activity_logs (user_id, role, action, entity_type, entity_id, new_value)
  values
    (v_admin_uid, 'admin', 'create_internship', 'internships', v_cohort1_id::text, '{"name": "Summer 2026 Engineering Cohort"}'::jsonb),
    (v_mentor1_uid, 'mentor', 'create_task', 'tasks', v_t1::text, '{"code": "TSK-0001", "title": "Setup Local Dev Environment"}'::jsonb),
    (v_intern1_uid, 'intern', 'start_task', 'task_assignments', v_ta1::text, '{"status": "in_progress"}'::jsonb),
    (v_intern1_uid, 'intern', 'submit_task', 'task_submissions', v_sub1::text, '{"version": 1}'::jsonb),
    (v_mentor1_uid, 'mentor', 'review_submission', 'reviews', v_sub1::text, '{"result": "approved"}'::jsonb);

end $$;
