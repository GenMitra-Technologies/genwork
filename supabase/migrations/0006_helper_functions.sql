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
