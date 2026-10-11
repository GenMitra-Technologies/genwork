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
