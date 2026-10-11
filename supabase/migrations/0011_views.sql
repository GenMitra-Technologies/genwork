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
