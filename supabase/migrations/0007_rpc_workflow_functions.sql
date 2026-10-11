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
