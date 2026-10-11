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
