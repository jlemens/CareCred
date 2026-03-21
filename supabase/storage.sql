-- Run this in Supabase SQL Editor after creating the project.
-- Creates a public bucket for profile photos; users may only upload under their own user id folder.

-- 15 MB bucket cap; JPG/PNG/WebP are compressed in the app before upload.
-- GIFs are uploaded as-is (animation preserved) within this limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (profile pages are public)
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users upload only to avatars/<their-user-id>/...
drop policy if exists "Users upload own avatar folder" on storage.objects;
create policy "Users upload own avatar folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own avatar folder" on storage.objects;
create policy "Users update own avatar folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own avatar folder" on storage.objects;
create policy "Users delete own avatar folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
