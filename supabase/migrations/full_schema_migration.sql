-- FULL SCHEMA MIGRATION FOR INTERNSHIP MANAGEMENT PLATFORM
-- Generated for Supabase Project jgjiakofetyiimtobhey


-- ==========================================
-- FILE: 0001_enums_and_extensions.sql
-- ==========================================

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


-- ==========================================
-- FILE: 0002_core_tables.sql
-- ==========================================

-- 0002_core_tables.sql

create sequence if not exists internship_code_seq start with 1 increment by 1;

-- 1. profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  avatar_url text,
  role public.user_role not null,
  status public.account_status not null default 'active',
  must_change_password boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. internships
create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('INT-' || lpad(nextval('internship_code_seq')::text, 3, '0')),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'completed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. mentors
create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  department text not null,
  bio text,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. interns
create table if not exists public.interns (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  internship_id uuid references public.internships(id) on delete set null,
  mentor_id uuid references public.mentors(id) on delete set null,
  role_title text not null,
  company_name text not null,
  start_date date not null,
  end_date date not null,
  status public.account_status not null default 'active',
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_active_days int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. mentor_assignment_history
create table if not exists public.mentor_assignment_history (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.interns(id) on delete cascade,
  from_mentor_id uuid references public.mentors(id) on delete set null,
  to_mentor_id uuid references public.mentors(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);


-- ==========================================
-- FILE: 0003_task_tables.sql
-- ==========================================

-- 0003_task_tables.sql

create sequence if not exists task_code_seq start with 1 increment by 1;

-- 1. tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('TSK-' || lpad(nextval('task_code_seq')::text, 4, '0')),
  title text not null,
  description text not null,
  instructions text,
  requirements text,
  expected_output text,
  mentor_id uuid references public.mentors(id) on delete set null,
  priority public.priority_level not null default 'medium',
  due_date timestamptz not null,
  require_github boolean not null default false,
  require_deployment boolean not null default false,
  require_drive boolean not null default false,
  extra_requirements text,
  archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. task_attachments
create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. task_assignments (workflow state lives here)
create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  intern_id uuid not null references public.interns(id) on delete cascade,
  status public.task_status not null default 'pending',
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  first_submitted_at timestamptz,
  last_submitted_at timestamptz,
  approved_at timestamptz,
  current_version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(task_id, intern_id)
);

-- 4. task_events (append-only timeline)
create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  event_type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  from_status public.task_status,
  to_status public.task_status not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. task_submissions (append-only)
create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  version int not null,
  github_url text,
  deployment_url text,
  drive_url text,
  note text,
  started_at_snapshot timestamptz,
  submitted_at timestamptz not null default now(),
  time_taken_seconds bigint,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  unique(task_assignment_id, version)
);

-- 6. reviews (append-only)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid unique not null references public.task_submissions(id) on delete cascade,
  mentor_id uuid references public.mentors(id) on delete set null,
  reviewer_profile_id uuid not null references public.profiles(id) on delete cascade,
  result public.review_result not null,
  feedback text not null,
  required_changes text,
  attachment_path text,
  reviewed_at timestamptz not null default now()
);


-- ==========================================
-- FILE: 0004_assignment_tables.sql
-- ==========================================

-- 0004_assignment_tables.sql

create sequence if not exists assignment_code_seq start with 1 increment by 1;

-- 1. assignments
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('ASG-' || lpad(nextval('assignment_code_seq')::text, 4, '0')),
  title text not null,
  description text not null,
  instructions text,
  mentor_id uuid references public.mentors(id) on delete set null,
  priority public.priority_level not null default 'medium',
  due_date timestamptz not null,
  archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. assignment_attachments
create table if not exists public.assignment_attachments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. assignment_recipients
create table if not exists public.assignment_recipients (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  intern_id uuid not null references public.interns(id) on delete cascade,
  status public.assignment_status not null default 'pending',
  submission_text text,
  submission_file_path text,
  submission_url text,
  submitted_at timestamptz,
  mentor_feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id, intern_id)
);


-- ==========================================
-- FILE: 0005_notifications_activity.sql
-- ==========================================

-- 0005_notifications_activity.sql

-- 1. notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  related_type text check (related_type in ('task', 'assignment', 'intern', 'system')),
  related_id uuid,
  related_code text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. activity_logs (immutable audit log)
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  role public.user_role,
  action text not null,
  entity_type text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- 3. intern_daily_activity (for streaks)
create table if not exists public.intern_daily_activity (
  intern_id uuid not null references public.interns(id) on delete cascade,
  activity_date date not null,
  actions_count int not null default 1,
  primary key(intern_id, activity_date)
);

-- 4. announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role text not null default 'all' check (target_role in ('all', 'mentor', 'intern')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. platform_settings
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Insert initial platform settings
insert into public.platform_settings (key, value)
values 
  ('session_timeout_minutes', '30'::jsonb),
  ('timezone', '"Asia/Kolkata"'::jsonb),
  ('reminder_window_hours', '24'::jsonb),
  ('streak_rules', '{"require_task_activity": true}'::jsonb)
on conflict (key) do nothing;


-- ==========================================
-- FILE: 0006_helper_functions.sql
-- ==========================================

-- 0006_helper_functions.sql

-- Helper functions for RLS & RPC (SECURITY DEFINER, search_path = public)

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.current_mentor_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.mentors where profile_id = auth.uid();
$$;

create or replace function public.current_intern_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.interns where profile_id = auth.uid();
$$;

create or replace function public.mentor_owns_intern(p_intern_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.interns
    where id = p_intern_id and mentor_id = public.current_mentor_id()
  );
$$;

create or replace function public.mentor_owns_task(p_task_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tasks
    where id = p_task_id and (mentor_id = public.current_mentor_id() or created_by = auth.uid())
  );
$$;

create or replace function public.intern_owns_assignment(p_task_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.task_assignments
    where id = p_task_assignment_id and intern_id = public.current_intern_id()
  );
$$;


-- ==========================================
-- FILE: 0007_rpc_workflow_functions.sql
-- ==========================================

-- 0007_rpc_workflow_functions.sql

-- Streak helper
create or replace function public.record_intern_activity(p_intern_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_intern record;
begin
  v_today := (now() at time zone 'Asia/Kolkata')::date;

  -- Upsert daily activity
  insert into public.intern_daily_activity (intern_id, activity_date, actions_count)
  values (p_intern_id, v_today, 1)
  on conflict (intern_id, activity_date)
  do update set actions_count = public.intern_daily_activity.actions_count + 1;

  select current_streak, longest_streak, total_active_days, last_active_date
  into v_intern
  from public.interns
  where id = p_intern_id;

  if not found then
    return;
  end if;

  if v_intern.last_active_date is null then
    update public.interns
    set current_streak = 1,
        longest_streak = greatest(v_intern.longest_streak, 1),
        total_active_days = v_intern.total_active_days + 1,
        last_active_date = v_today,
        updated_at = now()
    where id = p_intern_id;
  elsif v_intern.last_active_date = v_today then
    -- Already counted today
    return;
  elsif v_intern.last_active_date = (v_today - interval '1 day')::date then
    -- Consecutive day
    update public.interns
    set current_streak = v_intern.current_streak + 1,
        longest_streak = greatest(v_intern.longest_streak, v_intern.current_streak + 1),
        total_active_days = v_intern.total_active_days + 1,
        last_active_date = v_today,
        updated_at = now()
    where id = p_intern_id;
  else
    -- Streak reset
    update public.interns
    set current_streak = 1,
        longest_streak = greatest(v_intern.longest_streak, 1),
        total_active_days = v_intern.total_active_days + 1,
        last_active_date = v_today,
        updated_at = now()
    where id = p_intern_id;
  end if;
end;
$$;

-- 1. create_task
create or replace function public.create_task(
  payload jsonb,
  intern_ids uuid[] default null,
  assign_all boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_mentor_id uuid;
  v_task_id uuid;
  v_task_code text;
  v_intern_id uuid;
  v_target_interns uuid[] := '{}';
  v_rec record;
begin
  v_role := public.current_user_role();
  if v_role not in ('admin', 'mentor') then
    raise exception 'FORBIDDEN: Only admin or mentor can create tasks';
  end if;

  if v_role = 'mentor' then
    v_mentor_id := public.current_mentor_id();
    if v_mentor_id is null then
      raise exception 'MENTOR_PROFILE_NOT_FOUND';
    end if;
  else
    v_mentor_id := (payload->>'mentor_id')::uuid;
  end if;

  -- Insert task
  insert into public.tasks (
    title,
    description,
    instructions,
    requirements,
    expected_output,
    mentor_id,
    priority,
    due_date,
    require_github,
    require_deployment,
    require_drive,
    extra_requirements,
    created_by
  ) values (
    payload->>'title',
    payload->>'description',
    payload->>'instructions',
    payload->>'requirements',
    payload->>'expected_output',
    v_mentor_id,
    coalesce((payload->>'priority')::public.priority_level, 'medium'),
    (payload->>'due_date')::timestamptz,
    coalesce((payload->>'require_github')::boolean, false),
    coalesce((payload->>'require_deployment')::boolean, false),
    coalesce((payload->>'require_drive')::boolean, false),
    payload->>'extra_requirements',
    auth.uid()
  )
  returning id, code into v_task_id, v_task_code;

  -- Determine interns to assign
  if assign_all then
    if v_role = 'mentor' then
      select array_agg(id) into v_target_interns
      from public.interns
      where mentor_id = v_mentor_id and status = 'active';
    else
      select array_agg(id) into v_target_interns
      from public.interns
      where status = 'active';
    end if;
  else
    if intern_ids is not null and array_length(intern_ids, 1) > 0 then
      if v_role = 'mentor' then
        select array_agg(id) into v_target_interns
        from public.interns
        where id = any(intern_ids) and mentor_id = v_mentor_id and status = 'active';
      else
        v_target_interns := intern_ids;
      end if;
    end if;
  end if;

  -- Create task_assignments & notifications
  if v_target_interns is not null then
    foreach v_intern_id in array v_target_interns loop
      insert into public.task_assignments (task_id, intern_id, status)
      values (v_task_id, v_intern_id, 'pending')
      returning id into v_rec;

      -- Event
      insert into public.task_events (
        task_assignment_id,
        event_type,
        actor_id,
        from_status,
        to_status,
        metadata
      ) values (
        v_rec.id,
        'assigned',
        auth.uid(),
        null,
        'pending',
        jsonb_build_object('task_code', v_task_code)
      );

      -- Notify intern
      insert into public.notifications (
        recipient_id,
        title,
        message,
        type,
        related_type,
        related_id,
        related_code
      )
      select 
        i.profile_id,
        'New Task Assigned: ' || (payload->>'title'),
        'You have been assigned task ' || v_task_code || '. Due date: ' || to_char((payload->>'due_date')::timestamptz, 'YYYY-MM-DD HH24:MI'),
        'task_assigned',
        'task',
        v_task_id,
        v_task_code
      from public.interns i
      where i.id = v_intern_id;
    end loop;
  end if;

  -- Audit log
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    new_value
  ) values (
    auth.uid(),
    v_role,
    'create_task',
    'tasks',
    v_task_id::text,
    jsonb_build_object('task_id', v_task_id, 'code', v_task_code, 'title', payload->>'title')
  );

  return v_task_id;
end;
$$;

-- 2. start_task
create or replace function public.start_task(p_task_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment record;
  v_intern_id uuid;
  v_intern_name text;
  v_mentor_profile_id uuid;
  v_task record;
begin
  v_intern_id := public.current_intern_id();
  if v_intern_id is null then
    raise exception 'FORBIDDEN: Only interns can start tasks';
  end if;

  select * into v_assignment
  from public.task_assignments
  where id = p_task_assignment_id
  for update;

  if not found then
    raise exception 'ASSIGNMENT_NOT_FOUND';
  end if;

  if v_assignment.intern_id != v_intern_id then
    raise exception 'FORBIDDEN: You do not own this task assignment';
  end if;

  if v_assignment.status = 'in_progress' or v_assignment.started_at is not null then
    raise exception 'ALREADY_STARTED';
  end if;

  if v_assignment.status != 'pending' then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  -- Update assignment
  update public.task_assignments
  set status = 'in_progress',
      started_at = now(),
      updated_at = now()
  where id = p_task_assignment_id;

  -- Insert event
  insert into public.task_events (
    task_assignment_id,
    event_type,
    actor_id,
    from_status,
    to_status,
    metadata
  ) values (
    p_task_assignment_id,
    'started',
    auth.uid(),
    'pending',
    'in_progress',
    jsonb_build_object('started_at', now())
  );

  -- Fetch intern name and mentor profile to notify
  select p.full_name into v_intern_name
  from public.profiles p
  where p.id = auth.uid();

  select t.title, t.code, m.profile_id as mentor_profile_id
  into v_task
  from public.tasks t
  left join public.mentors m on m.id = t.mentor_id
  where t.id = v_assignment.task_id;

  if v_task.mentor_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_task.mentor_profile_id,
      'Task Started by ' || coalesce(v_intern_name, 'Intern'),
      coalesce(v_intern_name, 'Intern') || ' started ' || v_task.code || ' (' || v_task.title || ').',
      'task_started',
      'task',
      v_assignment.task_id,
      v_task.code
    );
  end if;

  -- Streak tracking
  perform public.record_intern_activity(v_intern_id);

  -- Audit log
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value
  ) values (
    auth.uid(),
    'intern',
    'start_task',
    'task_assignments',
    p_task_assignment_id::text,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'in_progress', 'started_at', now())
  );
end;
$$;

-- 3. submit_task
create or replace function public.submit_task(
  p_task_assignment_id uuid,
  p_github text default null,
  p_deploy text default null,
  p_drive text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment record;
  v_task record;
  v_intern_id uuid;
  v_intern_name text;
  v_mentor_profile_id uuid;
  v_new_version int;
  v_time_taken bigint;
  v_submission_id uuid;
  v_is_resubmit boolean := false;
  v_notify_type public.notification_type;
  v_notify_title text;
begin
  v_intern_id := public.current_intern_id();
  if v_intern_id is null then
    raise exception 'FORBIDDEN: Only interns can submit tasks';
  end if;

  select * into v_assignment
  from public.task_assignments
  where id = p_task_assignment_id
  for update;

  if not found then
    raise exception 'ASSIGNMENT_NOT_FOUND';
  end if;

  if v_assignment.intern_id != v_intern_id then
    raise exception 'FORBIDDEN: You do not own this task assignment';
  end if;

  if v_assignment.status not in ('in_progress', 'changes_requested') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  select * into v_task from public.tasks where id = v_assignment.task_id;

  -- Server-side validation of URLs & requirements
  if v_task.require_github then
    if p_github is null or trim(p_github) = '' then
      raise exception 'VALIDATION_ERROR: GitHub URL is required for this task';
    end if;
  end if;

  if p_github is not null and trim(p_github) <> '' then
    if p_github not ilike 'https://github.com/%' then
      raise exception 'VALIDATION_ERROR: GitHub URL must start with https://github.com/';
    end if;
  end if;

  if v_task.require_deployment then
    if p_deploy is null or trim(p_deploy) = '' then
      raise exception 'VALIDATION_ERROR: Deployment URL is required for this task';
    end if;
  end if;

  if p_deploy is not null and trim(p_deploy) <> '' then
    if p_deploy not ilike 'https://%' or p_deploy ilike 'javascript:%' then
      raise exception 'VALIDATION_ERROR: Deployment URL must be a valid https:// URL';
    end if;
  end if;

  if v_task.require_drive then
    if p_drive is null or trim(p_drive) = '' then
      raise exception 'VALIDATION_ERROR: Drive URL is required for this task';
    end if;
  end if;

  if p_drive is not null and trim(p_drive) <> '' then
    if (p_drive not ilike 'https://drive.google.com/%' and p_drive not ilike 'https://docs.google.com/%') or p_drive ilike 'javascript:%' then
      raise exception 'VALIDATION_ERROR: Google Drive URL must start with https://drive.google.com/ or https://docs.google.com/';
    end if;
  end if;

  -- Compute version and time taken
  v_new_version := v_assignment.current_version + 1;
  if v_assignment.started_at is not null then
    v_time_taken := extract(epoch from (now() - v_assignment.started_at))::bigint;
  else
    v_time_taken := 0;
  end if;

  -- Insert submission
  insert into public.task_submissions (
    task_assignment_id,
    version,
    github_url,
    deployment_url,
    drive_url,
    note,
    started_at_snapshot,
    submitted_at,
    time_taken_seconds,
    submitted_by
  ) values (
    p_task_assignment_id,
    v_new_version,
    nullif(trim(p_github), ''),
    nullif(trim(p_deploy), ''),
    nullif(trim(p_drive), ''),
    nullif(trim(p_note), ''),
    v_assignment.started_at,
    now(),
    v_time_taken,
    auth.uid()
  )
  returning id into v_submission_id;

  if v_assignment.status = 'changes_requested' then
    v_is_resubmit := true;
    -- Event: resubmitted
    insert into public.task_events (
      task_assignment_id,
      event_type,
      actor_id,
      from_status,
      to_status,
      metadata
    ) values (
      p_task_assignment_id,
      'resubmitted',
      auth.uid(),
      'changes_requested',
      'resubmitted',
      jsonb_build_object('version', v_new_version, 'submission_id', v_submission_id)
    );
    -- Event: waiting_for_review
    insert into public.task_events (
      task_assignment_id,
      event_type,
      actor_id,
      from_status,
      to_status,
      metadata
    ) values (
      p_task_assignment_id,
      'waiting_for_review',
      auth.uid(),
      'resubmitted',
      'waiting_for_review',
      jsonb_build_object('version', v_new_version)
    );
    v_notify_type := 'task_resubmitted';
    v_notify_title := 'Task Resubmitted (v' || v_new_version || ')';
  else
    -- Event: submitted
    insert into public.task_events (
      task_assignment_id,
      event_type,
      actor_id,
      from_status,
      to_status,
      metadata
    ) values (
      p_task_assignment_id,
      'submitted',
      auth.uid(),
      'in_progress',
      'submitted',
      jsonb_build_object('version', v_new_version, 'submission_id', v_submission_id)
    );
    -- Event: waiting_for_review
    insert into public.task_events (
      task_assignment_id,
      event_type,
      actor_id,
      from_status,
      to_status,
      metadata
    ) values (
      p_task_assignment_id,
      'waiting_for_review',
      auth.uid(),
      'submitted',
      'waiting_for_review',
      jsonb_build_object('version', v_new_version)
    );
    v_notify_type := 'task_submitted';
    v_notify_title := 'Task Submitted: ' || v_task.code;
  end if;

  -- Update assignment status to waiting_for_review
  update public.task_assignments
  set status = 'waiting_for_review',
      current_version = v_new_version,
      last_submitted_at = now(),
      first_submitted_at = coalesce(v_assignment.first_submitted_at, now()),
      updated_at = now()
  where id = p_task_assignment_id;

  -- Fetch intern name and mentor profile to notify
  select full_name into v_intern_name from public.profiles where id = auth.uid();
  select m.profile_id into v_mentor_profile_id from public.mentors m where m.id = v_task.mentor_id;

  if v_mentor_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_mentor_profile_id,
      v_notify_title,
      coalesce(v_intern_name, 'Intern') || ' submitted ' || v_task.code || ' (v' || v_new_version || ') for review.',
      v_notify_type,
      'task',
      v_task.id,
      v_task.code
    );
  end if;

  -- Streak tracking
  perform public.record_intern_activity(v_intern_id);

  -- Audit log
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    new_value
  ) values (
    auth.uid(),
    'intern',
    case when v_is_resubmit then 'resubmit_task' else 'submit_task' end,
    'task_submissions',
    v_submission_id::text,
    jsonb_build_object('version', v_new_version, 'task_code', v_task.code, 'time_taken_seconds', v_time_taken)
  );

  return v_submission_id;
end;
$$;

-- 4. review_submission
create or replace function public.review_submission(
  p_submission_id uuid,
  p_result public.review_result,
  p_feedback text,
  p_required_changes text default null,
  p_attachment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_mentor_id uuid;
  v_submission record;
  v_assignment record;
  v_task record;
  v_intern_profile_id uuid;
  v_review_id uuid;
  v_target_status public.task_status;
begin
  v_role := public.current_user_role();
  if v_role not in ('mentor', 'admin') then
    raise exception 'FORBIDDEN: Only mentors or admins can review submissions';
  end if;

  select * into v_submission
  from public.task_submissions
  where id = p_submission_id;

  if not found then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;

  select * into v_assignment
  from public.task_assignments
  where id = v_submission.task_assignment_id
  for update;

  if v_assignment.status != 'waiting_for_review' then
    raise exception 'INVALID_STATUS_TRANSITION: Task assignment is not waiting for review';
  end if;

  -- Ensure reviewing latest submission
  if v_submission.version != v_assignment.current_version then
    raise exception 'INVALID_SUBMISSION: Can only review the latest submission';
  end if;

  select * into v_task from public.tasks where id = v_assignment.task_id;

  if v_role = 'mentor' then
    v_mentor_id := public.current_mentor_id();
    if v_mentor_id is null or (v_task.mentor_id is not null and v_task.mentor_id != v_mentor_id) then
      raise exception 'FORBIDDEN: You can only review your own interns tasks';
    end if;
  else
    v_mentor_id := v_task.mentor_id;
  end if;

  if p_result = 'changes_requested' and (p_feedback is null or trim(p_feedback) = '') then
    raise exception 'VALIDATION_ERROR: Feedback is required when requesting changes';
  end if;

  -- Insert review
  insert into public.reviews (
    submission_id,
    mentor_id,
    reviewer_profile_id,
    result,
    feedback,
    required_changes,
    attachment_path,
    reviewed_at
  ) values (
    p_submission_id,
    v_mentor_id,
    auth.uid(),
    p_result,
    coalesce(trim(p_feedback), ''),
    nullif(trim(p_required_changes), ''),
    p_attachment,
    now()
  )
  returning id into v_review_id;

  if p_result = 'approved' then
    v_target_status := 'approved';
    update public.task_assignments
    set status = 'approved',
        approved_at = now(),
        updated_at = now()
    where id = v_assignment.id;
  else
    v_target_status := 'changes_requested';
    update public.task_assignments
    set status = 'changes_requested',
        updated_at = now()
    where id = v_assignment.id;
  end if;

  -- Event
  insert into public.task_events (
    task_assignment_id,
    event_type,
    actor_id,
    from_status,
    to_status,
    metadata
  ) values (
    v_assignment.id,
    case when p_result = 'approved' then 'approved' else 'changes_requested' end,
    auth.uid(),
    'waiting_for_review',
    v_target_status,
    jsonb_build_object(
      'review_id', v_review_id,
      'result', p_result,
      'submission_version', v_submission.version
    )
  );

  -- Fetch intern's profile id
  select profile_id into v_intern_profile_id
  from public.interns
  where id = v_assignment.intern_id;

  if v_intern_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_intern_profile_id,
      case when p_result = 'approved' then 'Task Approved! ' || v_task.code else 'Changes Requested: ' || v_task.code end,
      case when p_result = 'approved' 
        then 'Your submission for ' || v_task.code || ' (' || v_task.title || ') has been approved.'
        else 'Your mentor requested changes on ' || v_task.code || ': ' || substring(p_feedback from 1 for 100)
      end,
      case when p_result = 'approved' then 'task_approved' else 'changes_requested' end,
      'task',
      v_task.id,
      v_task.code
    );
  end if;

  -- Audit log
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    new_value
  ) values (
    auth.uid(),
    v_role,
    'review_submission',
    'reviews',
    v_review_id::text,
    jsonb_build_object('result', p_result, 'task_code', v_task.code, 'version', v_submission.version)
  );

  return v_review_id;
end;
$$;

-- 5. admin_override_task_status
create or replace function public.admin_override_task_status(
  p_task_assignment_id uuid,
  p_new_status public.task_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment record;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN: Only admin can override task status';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'VALIDATION_ERROR: Reason is required for admin status override';
  end if;

  select * into v_assignment
  from public.task_assignments
  where id = p_task_assignment_id
  for update;

  if not found then
    raise exception 'ASSIGNMENT_NOT_FOUND';
  end if;

  update public.task_assignments
  set status = p_new_status,
      updated_at = now(),
      approved_at = case when p_new_status = 'approved' then coalesce(approved_at, now()) else approved_at end
  where id = p_task_assignment_id;

  -- Event
  insert into public.task_events (
    task_assignment_id,
    event_type,
    actor_id,
    from_status,
    to_status,
    metadata
  ) values (
    p_task_assignment_id,
    'status_override',
    auth.uid(),
    v_assignment.status,
    p_new_status,
    jsonb_build_object('reason', p_reason)
  );

  -- Audit log
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value
  ) values (
    auth.uid(),
    'admin',
    'admin_override_task_status',
    'task_assignments',
    p_task_assignment_id::text,
    jsonb_build_object('status', v_assignment.status),
    jsonb_build_object('status', p_new_status, 'reason', p_reason)
  );
end;
$$;

-- 6. reassign_task
create or replace function public.reassign_task(
  p_task_assignment_id uuid,
  p_new_intern_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_assignment record;
  v_task record;
  v_old_intern_id uuid;
begin
  v_role := public.current_user_role();
  if v_role not in ('admin', 'mentor') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_assignment from public.task_assignments where id = p_task_assignment_id for update;
  if not found then
    raise exception 'ASSIGNMENT_NOT_FOUND';
  end if;

  select * into v_task from public.tasks where id = v_assignment.task_id;
  if v_role = 'mentor' and v_task.mentor_id != public.current_mentor_id() then
    raise exception 'FORBIDDEN';
  end if;

  v_old_intern_id := v_assignment.intern_id;

  update public.task_assignments
  set intern_id = p_new_intern_id,
      status = 'pending',
      started_at = null,
      updated_at = now()
  where id = p_task_assignment_id;

  insert into public.task_events (
    task_assignment_id,
    event_type,
    actor_id,
    from_status,
    to_status,
    metadata
  ) values (
    p_task_assignment_id,
    'reassigned',
    auth.uid(),
    v_assignment.status,
    'pending',
    jsonb_build_object('old_intern_id', v_old_intern_id, 'new_intern_id', p_new_intern_id)
  );
end;
$$;

-- 7. change_task_deadline
create or replace function public.change_task_deadline(
  p_task_id uuid,
  p_new_due_date timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_task record;
begin
  v_role := public.current_user_role();
  if v_role not in ('admin', 'mentor') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'TASK_NOT_FOUND';
  end if;

  if v_role = 'mentor' and v_task.mentor_id != public.current_mentor_id() then
    raise exception 'FORBIDDEN';
  end if;

  update public.tasks
  set due_date = p_new_due_date,
      updated_at = now()
  where id = p_task_id;

  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value
  ) values (
    auth.uid(),
    v_role,
    'change_task_deadline',
    'tasks',
    p_task_id::text,
    jsonb_build_object('due_date', v_task.due_date),
    jsonb_build_object('due_date', p_new_due_date)
  );
end;
$$;

-- 8. archive_task
create or replace function public.archive_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_task record;
begin
  v_role := public.current_user_role();
  if v_role not in ('admin', 'mentor') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'TASK_NOT_FOUND';
  end if;

  if v_role = 'mentor' and v_task.mentor_id != public.current_mentor_id() then
    raise exception 'FORBIDDEN';
  end if;

  update public.tasks
  set archived = true,
      updated_at = now()
  where id = p_task_id;

  update public.task_assignments
  set status = 'archived',
      updated_at = now()
  where task_id = p_task_id;
end;
$$;

-- 9. Assignments workflow
create or replace function public.create_assignment(
  payload jsonb,
  intern_ids uuid[] default null,
  assign_all boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_mentor_id uuid;
  v_assignment_id uuid;
  v_assignment_code text;
  v_intern_id uuid;
  v_target_interns uuid[] := '{}';
begin
  v_role := public.current_user_role();
  if v_role not in ('admin', 'mentor') then
    raise exception 'FORBIDDEN';
  end if;

  if v_role = 'mentor' then
    v_mentor_id := public.current_mentor_id();
  else
    v_mentor_id := (payload->>'mentor_id')::uuid;
  end if;

  insert into public.assignments (
    title,
    description,
    instructions,
    mentor_id,
    priority,
    due_date,
    created_by
  ) values (
    payload->>'title',
    payload->>'description',
    payload->>'instructions',
    v_mentor_id,
    coalesce((payload->>'priority')::public.priority_level, 'medium'),
    (payload->>'due_date')::timestamptz,
    auth.uid()
  )
  returning id, code into v_assignment_id, v_assignment_code;

  if assign_all then
    if v_role = 'mentor' then
      select array_agg(id) into v_target_interns
      from public.interns where mentor_id = v_mentor_id and status = 'active';
    else
      select array_agg(id) into v_target_interns
      from public.interns where status = 'active';
    end if;
  else
    if intern_ids is not null then
      if v_role = 'mentor' then
        select array_agg(id) into v_target_interns
        from public.interns where id = any(intern_ids) and mentor_id = v_mentor_id and status = 'active';
      else
        v_target_interns := intern_ids;
      end if;
    end if;
  end if;

  if v_target_interns is not null then
    foreach v_intern_id in array v_target_interns loop
      insert into public.assignment_recipients (assignment_id, intern_id, status)
      values (v_assignment_id, v_intern_id, 'pending');

      insert into public.notifications (
        recipient_id,
        title,
        message,
        type,
        related_type,
        related_id,
        related_code
      )
      select
        i.profile_id,
        'New Assignment: ' || (payload->>'title'),
        'You received assignment ' || v_assignment_code || '. Due date: ' || to_char((payload->>'due_date')::timestamptz, 'YYYY-MM-DD HH24:MI'),
        'assignment_assigned',
        'assignment',
        v_assignment_id,
        v_assignment_code
      from public.interns i
      where i.id = v_intern_id;
    end loop;
  end if;

  return v_assignment_id;
end;
$$;

create or replace function public.start_assignment(p_assignment_recipient_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_intern_id uuid;
begin
  v_intern_id := public.current_intern_id();
  select * into v_rec from public.assignment_recipients where id = p_assignment_recipient_id for update;
  if not found or v_rec.intern_id != v_intern_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_rec.status != 'pending' then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  update public.assignment_recipients
  set status = 'in_progress',
      updated_at = now()
  where id = p_assignment_recipient_id;

  perform public.record_intern_activity(v_intern_id);
end;
$$;

create or replace function public.submit_assignment(
  p_assignment_recipient_id uuid,
  p_text text default null,
  p_file_path text default null,
  p_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_asg record;
  v_intern_id uuid;
  v_intern_name text;
  v_mentor_profile_id uuid;
begin
  v_intern_id := public.current_intern_id();
  select * into v_rec from public.assignment_recipients where id = p_assignment_recipient_id for update;
  if not found or v_rec.intern_id != v_intern_id then
    raise exception 'FORBIDDEN';
  end if;
  if v_rec.status not in ('pending', 'in_progress', 'changes_requested') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  update public.assignment_recipients
  set status = 'submitted',
      submission_text = p_text,
      submission_file_path = p_file_path,
      submission_url = p_url,
      submitted_at = now(),
      updated_at = now()
  where id = p_assignment_recipient_id;

  perform public.record_intern_activity(v_intern_id);

  select a.*, m.profile_id as mentor_profile_id
  into v_asg
  from public.assignments a
  left join public.mentors m on m.id = a.mentor_id
  where a.id = v_rec.assignment_id;

  select full_name into v_intern_name from public.profiles where id = auth.uid();

  if v_asg.mentor_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_asg.mentor_profile_id,
      'Assignment Submitted: ' || v_asg.code,
      coalesce(v_intern_name, 'Intern') || ' submitted assignment ' || v_asg.code || '.',
      'assignment_submitted',
      'assignment',
      v_asg.id,
      v_asg.code
    );
  end if;
end;
$$;

create or replace function public.review_assignment(
  p_assignment_recipient_id uuid,
  p_status public.assignment_status,
  p_feedback text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rec record;
  v_asg record;
  v_intern_profile_id uuid;
begin
  v_role := public.current_user_role();
  if v_role not in ('mentor', 'admin') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_rec from public.assignment_recipients where id = p_assignment_recipient_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  select * into v_asg from public.assignments where id = v_rec.assignment_id;
  if v_role = 'mentor' and v_asg.mentor_id != public.current_mentor_id() then
    raise exception 'FORBIDDEN';
  end if;

  update public.assignment_recipients
  set status = p_status,
      mentor_feedback = p_feedback,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = p_assignment_recipient_id;

  select profile_id into v_intern_profile_id from public.interns where id = v_rec.intern_id;
  if v_intern_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_intern_profile_id,
      'Assignment Review: ' || v_asg.code,
      'Your assignment was reviewed: ' || p_feedback,
      'mentor_feedback',
      'assignment',
      v_asg.id,
      v_asg.code
    );
  end if;
end;
$$;

-- 10. Notification RPCs
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set is_read = true,
      read_at = now()
  where id = p_notification_id and recipient_id = auth.uid();
$$;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set is_read = true,
      read_at = now()
  where recipient_id = auth.uid() and is_read = false;
$$;

-- 11. move_intern_to_mentor
create or replace function public.move_intern_to_mentor(
  p_intern_id uuid,
  p_new_mentor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_mentor_id uuid;
  v_intern_profile_id uuid;
  v_old_mentor_profile_id uuid;
  v_new_mentor_profile_id uuid;
  v_intern_name text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN: Only admin can move interns';
  end if;

  select mentor_id, profile_id into v_old_mentor_id, v_intern_profile_id
  from public.interns
  where id = p_intern_id;

  if not found then
    raise exception 'INTERN_NOT_FOUND';
  end if;

  update public.interns
  set mentor_id = p_new_mentor_id,
      updated_at = now()
  where id = p_intern_id;

  insert into public.mentor_assignment_history (
    intern_id,
    from_mentor_id,
    to_mentor_id,
    changed_by
  ) values (
    p_intern_id,
    v_old_mentor_id,
    p_new_mentor_id,
    auth.uid()
  );

  select full_name into v_intern_name from public.profiles where id = v_intern_profile_id;
  select profile_id into v_old_mentor_profile_id from public.mentors where id = v_old_mentor_id;
  select profile_id into v_new_mentor_profile_id from public.mentors where id = p_new_mentor_id;

  -- Notify old mentor
  if v_old_mentor_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id
    ) values (
      v_old_mentor_profile_id,
      'Intern Reassigned',
      v_intern_name || ' was moved to another mentor.',
      'announcement',
      'intern',
      p_intern_id
    );
  end if;

  -- Notify new mentor
  if v_new_mentor_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id
    ) values (
      v_new_mentor_profile_id,
      'New Intern Assigned',
      v_intern_name || ' has been assigned to you.',
      'intern_assigned',
      'intern',
      p_intern_id
    );
  end if;

  -- Notify intern
  if v_intern_profile_id is not null then
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id
    ) values (
      v_intern_profile_id,
      'Mentor Updated',
      'You have been reassigned to a new mentor.',
      'announcement',
      'intern',
      p_intern_id
    );
  end if;
end;
$$;

-- 12. get_dashboard_stats
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role public.user_role;
  v_intern_id uuid;
  v_mentor_id uuid;
  v_res jsonb;
begin
  v_role := public.current_user_role();

  if v_role = 'intern' then
    v_intern_id := public.current_intern_id();
    select jsonb_build_object(
      'total_tasks', coalesce(count(ta.id), 0),
      'pending_tasks', coalesce(count(ta.id) filter (where ta.status = 'pending'), 0),
      'in_progress_tasks', coalesce(count(ta.id) filter (where ta.status = 'in_progress'), 0),
      'waiting_review_tasks', coalesce(count(ta.id) filter (where ta.status = 'waiting_for_review'), 0),
      'approved_tasks', coalesce(count(ta.id) filter (where ta.status = 'approved'), 0),
      'changes_requested_tasks', coalesce(count(ta.id) filter (where ta.status = 'changes_requested'), 0),
      'overdue_tasks', coalesce(count(ta.id) filter (where t.due_date < now() and ta.status not in ('approved', 'archived')), 0),
      'total_assignments', (select count(id) from public.assignment_recipients where intern_id = v_intern_id),
      'pending_assignments', (select count(id) from public.assignment_recipients where intern_id = v_intern_id and status in ('pending', 'in_progress'))
    ) into v_res
    from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    where ta.intern_id = v_intern_id and t.archived = false;
    return v_res;

  elsif v_role = 'mentor' then
    v_mentor_id := public.current_mentor_id();
    select jsonb_build_object(
      'my_interns_count', (select count(id) from public.interns where mentor_id = v_mentor_id and status = 'active'),
      'waiting_review_count', (
        select count(ta.id) 
        from public.task_assignments ta
        join public.interns i on i.id = ta.intern_id
        where i.mentor_id = v_mentor_id and ta.status = 'waiting_for_review'
      ),
      'approved_count', (
        select count(ta.id)
        from public.task_assignments ta
        join public.interns i on i.id = ta.intern_id
        where i.mentor_id = v_mentor_id and ta.status = 'approved'
      ),
      'changes_requested_count', (
        select count(ta.id)
        from public.task_assignments ta
        join public.interns i on i.id = ta.intern_id
        where i.mentor_id = v_mentor_id and ta.status = 'changes_requested'
      ),
      'overdue_count', (
        select count(ta.id)
        from public.task_assignments ta
        join public.interns i on i.id = ta.intern_id
        join public.tasks t on t.id = ta.task_id
        where i.mentor_id = v_mentor_id and t.due_date < now() and ta.status not in ('approved', 'archived')
      ),
      'total_tasks_created', (select count(id) from public.tasks where mentor_id = v_mentor_id and archived = false)
    ) into v_res;
    return v_res;

  elsif v_role = 'admin' then
    select jsonb_build_object(
      'total_internships', (select count(id) from public.internships),
      'active_internships', (select count(id) from public.internships where status = 'active'),
      'total_interns', (select count(id) from public.interns),
      'active_interns', (select count(id) from public.interns where status = 'active'),
      'total_mentors', (select count(id) from public.mentors),
      'active_mentors', (select count(id) from public.mentors where status = 'active'),
      'total_tasks', (select count(id) from public.tasks where archived = false),
      'total_submissions', (select count(id) from public.task_submissions),
      'waiting_reviews', (select count(id) from public.task_assignments where status = 'waiting_for_review'),
      'completed_tasks', (select count(id) from public.task_assignments where status = 'approved')
    ) into v_res;
    return v_res;
  end if;

  return '{}'::jsonb;
end;
$$;

-- 13. Audit logger RPC from client
create or replace function public.log_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_previous_value jsonb default null,
  p_new_value jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_user_agent text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.activity_logs (
    user_id,
    role,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    metadata,
    user_agent
  ) values (
    auth.uid(),
    public.current_user_role(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_previous_value,
    p_new_value,
    p_metadata,
    p_user_agent
  );
$$;


-- ==========================================
-- FILE: 0008_triggers.sql
-- ==========================================

-- 0008_triggers.sql

-- 1. updated_at touch function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger touch_internships_updated_at before update on public.internships
for each row execute function public.handle_updated_at();

create trigger touch_mentors_updated_at before update on public.mentors
for each row execute function public.handle_updated_at();

create trigger touch_interns_updated_at before update on public.interns
for each row execute function public.handle_updated_at();

create trigger touch_tasks_updated_at before update on public.tasks
for each row execute function public.handle_updated_at();

create trigger touch_task_assignments_updated_at before update on public.task_assignments
for each row execute function public.handle_updated_at();

create trigger touch_assignments_updated_at before update on public.assignments
for each row execute function public.handle_updated_at();

create trigger touch_assignment_recipients_updated_at before update on public.assignment_recipients
for each row execute function public.handle_updated_at();

-- 2. Status transition matrix enforcement
create or replace function public.enforce_task_status_transition()
returns trigger
language plpgsql
as $$
declare
  v_is_valid boolean := false;
begin
  -- If status didn't change, allow
  if old.status = new.status then
    return new;
  end if;

  -- Admin override or archive allowed
  if new.status = 'archived' then
    return new;
  end if;

  -- Allowed transition rules
  if old.status = 'assigned' and new.status = 'pending' then
    v_is_valid := true;
  elsif old.status = 'pending' and new.status = 'in_progress' then
    v_is_valid := true;
  elsif old.status = 'in_progress' and new.status = 'submitted' then
    v_is_valid := true;
  elsif old.status = 'submitted' and new.status = 'waiting_for_review' then
    v_is_valid := true;
  elsif old.status = 'in_progress' and new.status = 'waiting_for_review' then
    -- Shortcut when client sets waiting_for_review directly in submit RPC
    v_is_valid := true;
  elsif old.status = 'waiting_for_review' and new.status in ('approved', 'changes_requested') then
    v_is_valid := true;
  elsif old.status = 'changes_requested' and new.status in ('resubmitted', 'waiting_for_review') then
    v_is_valid := true;
  elsif old.status = 'resubmitted' and new.status = 'waiting_for_review' then
    v_is_valid := true;
  end if;

  -- Allow if admin is executing
  if not v_is_valid and public.is_admin() then
    v_is_valid := true;
  end if;

  if not v_is_valid then
    raise exception 'INVALID_STATUS_TRANSITION: Cannot transition task status from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger tr_enforce_task_status_transition
before update of status on public.task_assignments
for each row execute function public.enforce_task_status_transition();

-- 3. Immutability triggers (Block UPDATE / DELETE on append-only tables)
create or replace function public.enforce_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'IMMUTABLE_RECORD: Records in % cannot be updated or deleted', tg_table_name;
end;
$$;

create trigger tr_immutable_task_submissions
before update or delete on public.task_submissions
for each row execute function public.enforce_append_only();

create trigger tr_immutable_reviews
before update or delete on public.reviews
for each row execute function public.enforce_append_only();

create trigger tr_immutable_task_events
before update or delete on public.task_events
for each row execute function public.enforce_append_only();

create trigger tr_immutable_activity_logs
before update or delete on public.activity_logs
for each row execute function public.enforce_append_only();


-- ==========================================
-- FILE: 0009_rls_policies.sql
-- ==========================================

-- 0009_rls_policies.sql

-- Enable RLS on ALL public tables
alter table public.profiles enable row level security;
alter table public.internships enable row level security;
alter table public.mentors enable row level security;
alter table public.interns enable row level security;
alter table public.mentor_assignment_history enable row level security;
alter table public.tasks enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_events enable row level security;
alter table public.task_submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_attachments enable row level security;
alter table public.assignment_recipients enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.intern_daily_activity enable row level security;
alter table public.announcements enable row level security;
alter table public.platform_settings enable row level security;

-- Revoke direct UPDATE privilege on task_assignments status column from authenticated users
revoke update (status) on public.task_assignments from authenticated;

--------------------------------------------------------------------------------
-- 1. PROFILES
--------------------------------------------------------------------------------
create policy "profiles_select_policy" on public.profiles
for select using (
  public.is_admin()
  or id = auth.uid()
  or exists (
    select 1 from public.interns i
    where i.profile_id = public.profiles.id
      and i.mentor_id = public.current_mentor_id()
  )
  or exists (
    select 1 from public.mentors m
    join public.interns i on i.mentor_id = m.id
    where m.profile_id = public.profiles.id
      and i.profile_id = auth.uid()
  )
);

create policy "profiles_update_policy" on public.profiles
for update using (
  public.is_admin() or id = auth.uid()
) with check (
  public.is_admin() or id = auth.uid()
);

--------------------------------------------------------------------------------
-- 2. INTERNSHIPS
--------------------------------------------------------------------------------
create policy "internships_admin_all" on public.internships
for all using (public.is_admin());

create policy "internships_select_intern" on public.internships
for select using (
  id = (select internship_id from public.interns where profile_id = auth.uid())
);

create policy "internships_select_mentor" on public.internships
for select using (
  exists (
    select 1 from public.interns
    where internship_id = public.internships.id
      and mentor_id = public.current_mentor_id()
  )
);

--------------------------------------------------------------------------------
-- 3. MENTORS
--------------------------------------------------------------------------------
create policy "mentors_admin_all" on public.mentors
for all using (public.is_admin());

create policy "mentors_select_mentor" on public.mentors
for select using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.interns
    where mentor_id = public.mentors.id
      and profile_id = auth.uid()
  )
);

create policy "mentors_update_self" on public.mentors
for update using (profile_id = auth.uid());

--------------------------------------------------------------------------------
-- 4. INTERNS
--------------------------------------------------------------------------------
create policy "interns_admin_all" on public.interns
for all using (public.is_admin());

create policy "interns_select_intern" on public.interns
for select using (profile_id = auth.uid());

create policy "interns_select_mentor" on public.interns
for select using (mentor_id = public.current_mentor_id());

--------------------------------------------------------------------------------
-- 5. MENTOR ASSIGNMENT HISTORY
--------------------------------------------------------------------------------
create policy "mentor_history_admin" on public.mentor_assignment_history
for all using (public.is_admin());

create policy "mentor_history_select" on public.mentor_assignment_history
for select using (
  intern_id = public.current_intern_id()
  or from_mentor_id = public.current_mentor_id()
  or to_mentor_id = public.current_mentor_id()
);

--------------------------------------------------------------------------------
-- 6. TASKS
--------------------------------------------------------------------------------
create policy "tasks_admin_all" on public.tasks
for all using (public.is_admin());

create policy "tasks_select_intern" on public.tasks
for select using (
  exists (
    select 1 from public.task_assignments
    where task_id = public.tasks.id
      and intern_id = public.current_intern_id()
  )
);

create policy "tasks_mentor_all" on public.tasks
for all using (
  mentor_id = public.current_mentor_id()
  or created_by = auth.uid()
);

--------------------------------------------------------------------------------
-- 7. TASK ATTACHMENTS
--------------------------------------------------------------------------------
create policy "task_attachments_admin_all" on public.task_attachments
for all using (public.is_admin());

create policy "task_attachments_select" on public.task_attachments
for select using (
  exists (
    select 1 from public.task_assignments
    where task_id = public.task_attachments.task_id
      and intern_id = public.current_intern_id()
  )
  or exists (
    select 1 from public.tasks
    where id = public.task_attachments.task_id
      and (mentor_id = public.current_mentor_id() or created_by = auth.uid())
  )
);

create policy "task_attachments_mentor_insert" on public.task_attachments
for insert with check (
  exists (
    select 1 from public.tasks
    where id = public.task_attachments.task_id
      and (mentor_id = public.current_mentor_id() or created_by = auth.uid())
  )
);

--------------------------------------------------------------------------------
-- 8. TASK ASSIGNMENTS
--------------------------------------------------------------------------------
create policy "task_assignments_admin_all" on public.task_assignments
for all using (public.is_admin());

create policy "task_assignments_select_intern" on public.task_assignments
for select using (intern_id = public.current_intern_id());

create policy "task_assignments_select_mentor" on public.task_assignments
for select using (public.mentor_owns_intern(intern_id));

--------------------------------------------------------------------------------
-- 9. TASK EVENTS
--------------------------------------------------------------------------------
create policy "task_events_admin_all" on public.task_events
for all using (public.is_admin());

create policy "task_events_select" on public.task_events
for select using (
  exists (
    select 1 from public.task_assignments ta
    where ta.id = public.task_events.task_assignment_id
      and (ta.intern_id = public.current_intern_id() or public.mentor_owns_intern(ta.intern_id))
  )
);

--------------------------------------------------------------------------------
-- 10. TASK SUBMISSIONS & REVIEWS
--------------------------------------------------------------------------------
create policy "task_submissions_admin_all" on public.task_submissions
for all using (public.is_admin());

create policy "task_submissions_select" on public.task_submissions
for select using (
  exists (
    select 1 from public.task_assignments ta
    where ta.id = public.task_submissions.task_assignment_id
      and (ta.intern_id = public.current_intern_id() or public.mentor_owns_intern(ta.intern_id))
  )
);

create policy "reviews_admin_all" on public.reviews
for all using (public.is_admin());

create policy "reviews_select" on public.reviews
for select using (
  exists (
    select 1 from public.task_submissions s
    join public.task_assignments ta on ta.id = s.task_assignment_id
    where s.id = public.reviews.submission_id
      and (ta.intern_id = public.current_intern_id() or public.mentor_owns_intern(ta.intern_id))
  )
);

--------------------------------------------------------------------------------
-- 11. ASSIGNMENTS & RECIPIENTS
--------------------------------------------------------------------------------
create policy "assignments_admin_all" on public.assignments
for all using (public.is_admin());

create policy "assignments_mentor_all" on public.assignments
for all using (mentor_id = public.current_mentor_id() or created_by = auth.uid());

create policy "assignments_intern_select" on public.assignments
for select using (
  exists (
    select 1 from public.assignment_recipients
    where assignment_id = public.assignments.id
      and intern_id = public.current_intern_id()
  )
);

create policy "recipients_admin_all" on public.assignment_recipients
for all using (public.is_admin());

create policy "recipients_intern_select" on public.assignment_recipients
for select using (intern_id = public.current_intern_id());

create policy "recipients_mentor_select" on public.assignment_recipients
for select using (public.mentor_owns_intern(intern_id));

--------------------------------------------------------------------------------
-- 12. NOTIFICATIONS
--------------------------------------------------------------------------------
create policy "notifications_own" on public.notifications
for all using (recipient_id = auth.uid())
with check (recipient_id = auth.uid() or public.is_admin());

--------------------------------------------------------------------------------
-- 13. ACTIVITY LOGS
--------------------------------------------------------------------------------
create policy "activity_logs_admin_all" on public.activity_logs
for select using (public.is_admin());

create policy "activity_logs_mentor_select" on public.activity_logs
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.interns i
    where i.profile_id = public.activity_logs.user_id
      and i.mentor_id = public.current_mentor_id()
  )
);

--------------------------------------------------------------------------------
-- 14. STREAKS & SETTINGS
--------------------------------------------------------------------------------
create policy "streaks_select" on public.intern_daily_activity
for select using (
  public.is_admin()
  or intern_id = public.current_intern_id()
  or public.mentor_owns_intern(intern_id)
);

create policy "platform_settings_admin" on public.platform_settings
for all using (public.is_admin());

create policy "announcements_select" on public.announcements
for select using (auth.uid() is not null);

create policy "announcements_admin" on public.announcements
for all using (public.is_admin());


-- ==========================================
-- FILE: 0010_storage_buckets_policies.sql
-- ==========================================

-- 0010_storage_buckets_policies.sql

-- Insert storage buckets if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('task-attachments', 'task-attachments', false, 10485760, null),
  ('assignment-attachments', 'assignment-attachments', false, 10485760, null),
  ('assignment-submissions', 'assignment-submissions', false, 10485760, null),
  ('review-attachments', 'review-attachments', false, 10485760, null)
on conflict (id) do nothing;

-- 1. Avatars policy
create policy "avatars_select" on storage.objects
for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
for insert with check (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own" on storage.objects
for update using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Task attachments policy
create policy "task_attachments_select" on storage.objects
for select using (
  bucket_id = 'task-attachments'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or public.current_user_role() = 'intern'
  )
);

create policy "task_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'task-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);

-- 3. Assignment attachments policy
create policy "assignment_attachments_select" on storage.objects
for select using (
  bucket_id = 'assignment-attachments'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or public.current_user_role() = 'intern'
  )
);

create policy "assignment_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'assignment-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);

-- 4. Assignment submissions policy
create policy "assignment_submissions_select" on storage.objects
for select using (
  bucket_id = 'assignment-submissions'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or (storage.foldername(name))[1] = (select id::text from public.interns where profile_id = auth.uid())
  )
);

create policy "assignment_submissions_insert" on storage.objects
for insert with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select id::text from public.interns where profile_id = auth.uid())
);

-- 5. Review attachments policy
create policy "review_attachments_select" on storage.objects
for select using (
  bucket_id = 'review-attachments'
  and (public.is_admin() or auth.uid() is not null)
);

create policy "review_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'review-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);


-- ==========================================
-- FILE: 0011_views.sql
-- ==========================================

-- 0011_views.sql

-- 1. v_task_cards
-- (task + assignment + mentor name + computed is_overdue, time_remaining)
create or replace view public.v_task_cards
with (security_invoker = true)
as
select
  ta.id as task_assignment_id,
  ta.task_id,
  ta.intern_id,
  ta.status,
  ta.assigned_at,
  ta.started_at,
  ta.first_submitted_at,
  ta.last_submitted_at,
  ta.approved_at,
  ta.current_version,
  t.code as task_code,
  t.title as task_title,
  t.description as task_description,
  t.priority,
  t.due_date,
  t.require_github,
  t.require_deployment,
  t.require_drive,
  t.archived,
  m.id as mentor_id,
  mp.full_name as mentor_name,
  mp.avatar_url as mentor_avatar,
  ip.full_name as intern_name,
  ip.avatar_url as intern_avatar,
  case 
    when t.due_date < now() and ta.status not in ('approved', 'archived') then true 
    else false 
  end as is_overdue,
  case
    when t.due_date < now() then interval '0'
    else t.due_date - now()
  end as time_remaining
from public.task_assignments ta
join public.tasks t on t.id = ta.task_id
join public.interns i on i.id = ta.intern_id
join public.profiles ip on ip.id = i.profile_id
left join public.mentors m on m.id = t.mentor_id
left join public.profiles mp on mp.id = m.profile_id;

-- 2. v_mentor_intern_summary
-- (pending/completed/waiting counts, streak, approval rate)
create or replace view public.v_mentor_intern_summary
with (security_invoker = true)
as
select
  i.id as intern_id,
  i.profile_id,
  ip.full_name,
  ip.email,
  ip.avatar_url,
  i.role_title,
  i.company_name,
  i.status as intern_status,
  i.mentor_id,
  i.current_streak,
  i.longest_streak,
  i.total_active_days,
  i.last_active_date,
  coalesce(count(ta.id) filter (where ta.status = 'pending'), 0) as pending_tasks_count,
  coalesce(count(ta.id) filter (where ta.status = 'in_progress'), 0) as in_progress_tasks_count,
  coalesce(count(ta.id) filter (where ta.status = 'waiting_for_review'), 0) as waiting_review_count,
  coalesce(count(ta.id) filter (where ta.status = 'approved'), 0) as approved_tasks_count,
  coalesce(count(ta.id) filter (where ta.status = 'changes_requested'), 0) as changes_requested_count,
  coalesce(count(ta.id), 0) as total_assigned_tasks,
  case
    when count(ta.id) filter (where ta.status in ('approved', 'changes_requested')) > 0 then
      round(
        (count(ta.id) filter (where ta.status = 'approved')::numeric / 
         count(ta.id) filter (where ta.status in ('approved', 'changes_requested'))::numeric) * 100, 1
      )
    else 0
  end as approval_rate_percentage
from public.interns i
join public.profiles ip on ip.id = i.profile_id
left join public.task_assignments ta on ta.intern_id = i.id
group by i.id, i.profile_id, ip.full_name, ip.email, ip.avatar_url, i.role_title, i.company_name, i.status, i.mentor_id, i.current_streak, i.longest_streak, i.total_active_days, i.last_active_date;

-- 3. v_internship_progress
create or replace view public.v_internship_progress
with (security_invoker = true)
as
select
  shp.id as internship_id,
  shp.code as internship_code,
  shp.name as internship_name,
  shp.start_date,
  shp.end_date,
  shp.status,
  count(distinct i.id) as total_interns,
  count(distinct ta.id) as total_tasks_assigned,
  count(distinct ta.id) filter (where ta.status = 'approved') as total_tasks_completed,
  case
    when count(distinct ta.id) > 0 then
      round((count(distinct ta.id) filter (where ta.status = 'approved')::numeric / count(distinct ta.id)::numeric) * 100, 1)
    else 0
  end as completion_rate_percentage
from public.internships shp
left join public.interns i on i.internship_id = shp.id
left join public.task_assignments ta on ta.intern_id = i.id
group by shp.id, shp.code, shp.name, shp.start_date, shp.end_date, shp.status;

-- 4. v_review_queue
create or replace view public.v_review_queue
with (security_invoker = true)
as
select
  s.id as submission_id,
  s.task_assignment_id,
  s.version,
  s.github_url,
  s.deployment_url,
  s.drive_url,
  s.note,
  s.submitted_at,
  s.time_taken_seconds,
  ta.task_id,
  ta.intern_id,
  ta.status as assignment_status,
  t.code as task_code,
  t.title as task_title,
  t.priority as task_priority,
  t.due_date as task_due_date,
  t.mentor_id,
  ip.full_name as intern_name,
  ip.email as intern_email,
  ip.avatar_url as intern_avatar
from public.task_submissions s
join public.task_assignments ta on ta.id = s.task_assignment_id
join public.tasks t on t.id = ta.task_id
join public.interns i on i.id = ta.intern_id
join public.profiles ip on ip.id = i.profile_id
where ta.status = 'waiting_for_review'
  and s.version = ta.current_version;


-- ==========================================
-- FILE: 0012_cron_jobs.sql
-- ==========================================

-- 0012_cron_jobs.sql

-- 1. Helper function for deadline approaching & overdue checks
create or replace function public.process_deadline_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
begin
  -- 24 hours before task due date: notify intern
  for v_rec in
    select 
      ta.id as assignment_id,
      ta.intern_id,
      i.profile_id as intern_profile_id,
      t.id as task_id,
      t.code as task_code,
      t.title as task_title,
      t.due_date
    from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    join public.interns i on i.id = ta.intern_id
    where ta.status in ('pending', 'in_progress', 'changes_requested')
      and t.due_date > now()
      and t.due_date <= (now() + interval '24 hours')
      and not exists (
        select 1 from public.notifications n
        where n.recipient_id = i.profile_id
          and n.type = 'deadline_approaching'
          and n.related_id = t.id
          and n.created_at >= (now() - interval '24 hours')
      )
  loop
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_rec.intern_profile_id,
      'Deadline Approaching: ' || v_rec.task_code,
      'Task ' || v_rec.task_code || ' (' || v_rec.task_title || ') is due within 24 hours!',
      'deadline_approaching',
      'task',
      v_rec.task_id,
      v_rec.task_code
    );
  end loop;

  -- Overdue tasks: notify intern & mentor once per assignment
  for v_rec in
    select 
      ta.id as assignment_id,
      ta.intern_id,
      i.profile_id as intern_profile_id,
      m.profile_id as mentor_profile_id,
      t.id as task_id,
      t.code as task_code,
      t.title as task_title
    from public.task_assignments ta
    join public.tasks t on t.id = ta.task_id
    join public.interns i on i.id = ta.intern_id
    left join public.mentors m on m.id = t.mentor_id
    where ta.status not in ('approved', 'archived')
      and t.due_date < now()
      and not exists (
        select 1 from public.notifications n
        where n.recipient_id = i.profile_id
          and n.type = 'task_overdue'
          and n.related_id = t.id
      )
  loop
    -- Intern notification
    insert into public.notifications (
      recipient_id,
      title,
      message,
      type,
      related_type,
      related_id,
      related_code
    ) values (
      v_rec.intern_profile_id,
      'Task Overdue: ' || v_rec.task_code,
      'Task ' || v_rec.task_code || ' (' || v_rec.task_title || ') has passed its deadline.',
      'task_overdue',
      'task',
      v_rec.task_id,
      v_rec.task_code
    );

    -- Mentor notification
    if v_rec.mentor_profile_id is not null then
      insert into public.notifications (
        recipient_id,
        title,
        message,
        type,
        related_type,
        related_id,
        related_code
      ) values (
        v_rec.mentor_profile_id,
        'Intern Task Overdue: ' || v_rec.task_code,
        'Task ' || v_rec.task_code || ' is overdue for an assigned intern.',
        'task_overdue',
        'task',
        v_rec.task_id,
        v_rec.task_code
      );
    end if;
  end loop;
end;
$$;

-- 2. Nightly streak reset function
create or replace function public.reset_inactive_streaks()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
begin
  v_today := (now() at time zone 'Asia/Kolkata')::date;

  update public.interns
  set current_streak = 0,
      updated_at = now()
  where (last_active_date is null or last_active_date < (v_today - interval '1 day')::date)
    and current_streak > 0;
end;
$$;

-- 3. Register cron jobs if pg_cron extension exists
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('hourly_deadline_check', '0 * * * *', 'select public.process_deadline_notifications()');
    perform cron.schedule('nightly_streak_reset', '0 0 * * *', 'select public.reset_inactive_streaks()');
  end if;
exception when others then
  -- Ignore if cron schema is unavailable in this environment
  null;
end;
$$;


-- ==========================================
-- FILE: 0013_indexes.sql
-- ==========================================

-- 0013_indexes.sql

-- Profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- Internships & Mentors & Interns
create index if not exists idx_internships_status on public.internships(status);
create index if not exists idx_mentors_profile_id on public.mentors(profile_id);
create index if not exists idx_interns_profile_id on public.interns(profile_id);
create index if not exists idx_interns_mentor_id on public.interns(mentor_id);
create index if not exists idx_interns_internship_id on public.interns(internship_id);

-- Tasks & Task Assignments
create index if not exists idx_tasks_code on public.tasks(code);
create index if not exists idx_tasks_mentor_id on public.tasks(mentor_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);
create index if not exists idx_task_assignments_intern_id on public.task_assignments(intern_id);
create index if not exists idx_task_assignments_status on public.task_assignments(status);

-- Task Submissions, Reviews, Events
create index if not exists idx_task_submissions_assignment on public.task_submissions(task_assignment_id);
create index if not exists idx_reviews_submission on public.reviews(submission_id);
create index if not exists idx_task_events_assignment on public.task_events(task_assignment_id);

-- Assignments & Recipients
create index if not exists idx_assignments_code on public.assignments(code);
create index if not exists idx_assignments_mentor on public.assignments(mentor_id);
create index if not exists idx_asg_recipients_assignment on public.assignment_recipients(assignment_id);
create index if not exists idx_asg_recipients_intern on public.assignment_recipients(intern_id);
create index if not exists idx_asg_recipients_status on public.assignment_recipients(status);

-- Notifications
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_notifications_unread on public.notifications(recipient_id) where is_read = false;

-- Activity Logs
create index if not exists idx_activity_logs_user on public.activity_logs(user_id);
create index if not exists idx_activity_logs_action on public.activity_logs(action);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

