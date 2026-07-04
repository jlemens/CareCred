-- Run in Supabase Dashboard → SQL Editor to enable profile follows.

alter table public.profiles
  add column if not exists show_follower_count boolean not null default true;

create table if not exists public.profile_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, followed_profile_id)
);

create index if not exists idx_profile_follows_followed
  on public.profile_follows(followed_profile_id, created_at desc);

create index if not exists idx_profile_follows_follower
  on public.profile_follows(follower_user_id, created_at desc);

alter table public.profile_follows enable row level security;

drop policy if exists "profile_follows_select" on public.profile_follows;
create policy "profile_follows_select"
  on public.profile_follows for select
  using (true);

drop policy if exists "profile_follows_insert_own" on public.profile_follows;
create policy "profile_follows_insert_own"
  on public.profile_follows for insert
  with check (auth.uid() = follower_user_id);

drop policy if exists "profile_follows_delete_own" on public.profile_follows;
create policy "profile_follows_delete_own"
  on public.profile_follows for delete
  using (auth.uid() = follower_user_id);

create or replace function public.profile_follower_count(p_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profile_follows
  where followed_profile_id = p_profile_id;
$$;

revoke all on function public.profile_follower_count(uuid) from public;
grant execute on function public.profile_follower_count(uuid) to anon;
grant execute on function public.profile_follower_count(uuid) to authenticated;
grant execute on function public.profile_follower_count(uuid) to service_role;
