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
