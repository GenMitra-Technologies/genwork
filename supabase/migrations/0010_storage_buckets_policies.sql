-- 0010_storage_buckets_policies.sql

-- Insert storage buckets if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('task-attachments', 'task-attachments', false, 10485760, null),
  ('assignment-attachments', 'assignment-attachments', false, 10485760, null),
  ('assignment-submissions', 'assignment-submissions', false, 10485760, null),
  ('review-attachments', 'review-attachments', false, 10485760, null)
on conflict (id) do nothing;

-- 1. Avatars policy
create policy "avatars_select" on storage.objects
for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
for insert with check (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own" on storage.objects
for update using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Task attachments policy
create policy "task_attachments_select" on storage.objects
for select using (
  bucket_id = 'task-attachments'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or public.current_user_role() = 'intern'
  )
);

create policy "task_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'task-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);

-- 3. Assignment attachments policy
create policy "assignment_attachments_select" on storage.objects
for select using (
  bucket_id = 'assignment-attachments'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or public.current_user_role() = 'intern'
  )
);

create policy "assignment_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'assignment-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);

-- 4. Assignment submissions policy
create policy "assignment_submissions_select" on storage.objects
for select using (
  bucket_id = 'assignment-submissions'
  and (
    public.is_admin()
    or public.current_user_role() = 'mentor'
    or (storage.foldername(name))[1] = (select id::text from public.interns where profile_id = auth.uid())
  )
);

create policy "assignment_submissions_insert" on storage.objects
for insert with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = (select id::text from public.interns where profile_id = auth.uid())
);

-- 5. Review attachments policy
create policy "review_attachments_select" on storage.objects
for select using (
  bucket_id = 'review-attachments'
  and (public.is_admin() or auth.uid() is not null)
);

create policy "review_attachments_write" on storage.objects
for insert with check (
  bucket_id = 'review-attachments'
  and (public.is_admin() or public.current_user_role() = 'mentor')
);
