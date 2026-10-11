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
