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
