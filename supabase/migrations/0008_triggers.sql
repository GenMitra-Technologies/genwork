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
