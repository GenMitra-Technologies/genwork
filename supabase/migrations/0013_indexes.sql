-- 0013_indexes.sql

-- Profiles
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- Internships & Mentors & Interns
create index if not exists idx_internships_status on public.internships(status);
create index if not exists idx_mentors_profile_id on public.mentors(profile_id);
create index if not exists idx_interns_profile_id on public.interns(profile_id);
create index if not exists idx_interns_mentor_id on public.interns(mentor_id);
create index if not exists idx_interns_internship_id on public.interns(internship_id);

-- Tasks & Task Assignments
create index if not exists idx_tasks_code on public.tasks(code);
create index if not exists idx_tasks_mentor_id on public.tasks(mentor_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);
create index if not exists idx_task_assignments_intern_id on public.task_assignments(intern_id);
create index if not exists idx_task_assignments_status on public.task_assignments(status);

-- Task Submissions, Reviews, Events
create index if not exists idx_task_submissions_assignment on public.task_submissions(task_assignment_id);
create index if not exists idx_reviews_submission on public.reviews(submission_id);
create index if not exists idx_task_events_assignment on public.task_events(task_assignment_id);

-- Assignments & Recipients
create index if not exists idx_assignments_code on public.assignments(code);
create index if not exists idx_assignments_mentor on public.assignments(mentor_id);
create index if not exists idx_asg_recipients_assignment on public.assignment_recipients(assignment_id);
create index if not exists idx_asg_recipients_intern on public.assignment_recipients(intern_id);
create index if not exists idx_asg_recipients_status on public.assignment_recipients(status);

-- Notifications
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_notifications_unread on public.notifications(recipient_id) where is_read = false;

-- Activity Logs
create index if not exists idx_activity_logs_user on public.activity_logs(user_id);
create index if not exists idx_activity_logs_action on public.activity_logs(action);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
