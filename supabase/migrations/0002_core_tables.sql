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
