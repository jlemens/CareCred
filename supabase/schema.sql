create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  slug text unique not null,
  profile_type text not null check (profile_type in ('provider', 'patient')),
  display_name text not null,
  first_name text,
  last_name text,
  credentials text,
  profession text,
  practice_name text,
  location text,
  bio text,
  specialties text,
  education text,
  years_experience integer,
  avatar_url text,
  active_survey_template text,
  survey_config jsonb,
  home_state text,
  is_complete boolean not null default false,
  slug_change_count integer not null default 0,
  show_follower_count boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  overall_rating integer check (overall_rating is null or overall_rating between 1 and 5),
  recommend_provider boolean not null default true,
  rehab_experience_rating integer not null default 5 check (rehab_experience_rating between 1 and 5),
  communication_rating integer not null default 5 check (communication_rating between 1 and 5),
  professionalism_rating integer not null default 5 check (professionalism_rating between 1 and 5),
  felt_listened boolean not null default true,
  body_region text,
  reviewer_state text,
  condition_summary text,
  rehab_story text,
  standout_care text,
  source text not null default 'pt_survey' check (source in ('pt_survey', 'google_manual')),
  source_label text,
  source_url text,
  disclaimer_text text,
  attestation_accepted boolean,
  is_visible boolean not null default true,
  is_pinned boolean not null default false,
  survey_template_id text,
  survey_responses jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_provider_search
  on public.profiles(profile_type, is_complete, display_name, practice_name);

-- Safe for existing databases (run in SQL Editor if table already existed)
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists credentials text;
alter table public.profiles add column if not exists slug_change_count integer not null default 0;
alter table public.profiles add column if not exists home_state text;
alter table public.profiles add column if not exists profession text;

alter table public.provider_reviews add column if not exists overall_rating integer;
alter table public.provider_reviews add column if not exists is_pinned boolean not null default false;
alter table public.provider_reviews alter column body_region drop not null;
alter table public.provider_reviews alter column condition_summary drop not null;

alter table public.provider_reviews add column if not exists reviewer_state text;
alter table public.profiles add column if not exists survey_config jsonb;
alter table public.profiles add column if not exists show_follower_count boolean not null default true;
alter table public.provider_reviews add column if not exists survey_template_id text;
alter table public.provider_reviews add column if not exists survey_responses jsonb;

create index if not exists idx_reviews_provider on public.provider_reviews(provider_profile_id, created_at desc);
create index if not exists idx_reviews_author on public.provider_reviews(author_user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.provider_reviews enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_select_public" on public.provider_reviews;
create policy "reviews_select_public"
  on public.provider_reviews for select
  using (
    is_visible = true
    or author_user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = provider_profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "reviews_insert_any" on public.provider_reviews;
create policy "reviews_insert_any"
  on public.provider_reviews for insert
  with check (true);

drop policy if exists "reviews_update_provider_owner" on public.provider_reviews;
create policy "reviews_update_provider_owner"
  on public.provider_reviews for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = provider_profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "reviews_delete_provider_owner" on public.provider_reviews;
create policy "reviews_delete_provider_owner"
  on public.provider_reviews for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = provider_profile_id and p.user_id = auth.uid()
    )
  );

-- Public hidden count (RLS blocks reading hidden rows for non-owners; summary still needs this).
create or replace function public.provider_hidden_review_count(p_provider_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.provider_reviews
  where provider_profile_id = p_provider_profile_id
    and is_visible = false;
$$;

revoke all on function public.provider_hidden_review_count(uuid) from public;
grant execute on function public.provider_hidden_review_count(uuid) to anon;
grant execute on function public.provider_hidden_review_count(uuid) to authenticated;
grant execute on function public.provider_hidden_review_count(uuid) to service_role;

-- Testimonial comments (signed-in members only)
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.provider_reviews(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 1 and char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_review_comments_review
  on public.review_comments(review_id, created_at asc);

-- Testimonial likes (one per user per review)
create table if not exists public.review_likes (
  review_id uuid not null references public.provider_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists idx_review_likes_user
  on public.review_likes(user_id, created_at desc);

-- Profile follows (one-way; any member can follow another profile)
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

-- In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('new_review', 'review_comment', 'review_like')),
  review_id uuid references public.provider_reviews(id) on delete cascade,
  comment_id uuid references public.review_comments(id) on delete set null,
  message text not null,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
  on public.notifications(recipient_user_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications(recipient_user_id, read_at)
  where read_at is null;

alter table public.review_comments enable row level security;
alter table public.review_likes enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "review_comments_select" on public.review_comments;
create policy "review_comments_select"
  on public.review_comments for select
  using (
    exists (
      select 1 from public.provider_reviews r
      where r.id = review_id
        and (
          r.is_visible = true
          or r.author_user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = r.provider_profile_id and p.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "review_comments_insert_own" on public.review_comments;
create policy "review_comments_insert_own"
  on public.review_comments for insert
  with check (auth.uid() = author_user_id);

drop policy if exists "review_comments_delete_own" on public.review_comments;
create policy "review_comments_delete_own"
  on public.review_comments for delete
  using (auth.uid() = author_user_id);

drop policy if exists "review_likes_select" on public.review_likes;
create policy "review_likes_select"
  on public.review_likes for select
  using (
    exists (
      select 1 from public.provider_reviews r
      where r.id = review_id
        and (
          r.is_visible = true
          or r.author_user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = r.provider_profile_id and p.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "review_likes_insert_own" on public.review_likes;
create policy "review_likes_insert_own"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "review_likes_delete_own" on public.review_likes;
create policy "review_likes_delete_own"
  on public.review_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = recipient_user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

create or replace function public.mark_notifications_read(
  p_notification_id uuid default null,
  p_mark_all boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_mark_all then
    update public.notifications
    set read_at = now()
    where recipient_user_id = auth.uid()
      and read_at is null;
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  if p_notification_id is null then
    raise exception 'notification id required';
  end if;

  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and recipient_user_id = auth.uid()
    and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_notifications_read(uuid, boolean) from public;
grant execute on function public.mark_notifications_read(uuid, boolean) to authenticated;
grant execute on function public.mark_notifications_read(uuid, boolean) to service_role;

create or replace function public.create_app_notification(
  p_recipient_user_id uuid,
  p_actor_user_id uuid,
  p_type text,
  p_review_id uuid,
  p_comment_id uuid,
  p_message text,
  p_href text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_recipient_user_id is null then
    return null;
  end if;
  if p_recipient_user_id is not null
    and p_actor_user_id is not null
    and p_recipient_user_id = p_actor_user_id then
    return null;
  end if;

  if p_actor_user_id is not null and auth.uid() is distinct from p_actor_user_id then
    return null;
  end if;

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    review_id,
    comment_id,
    message,
    href
  )
  values (
    p_recipient_user_id,
    p_actor_user_id,
    p_type,
    p_review_id,
    p_comment_id,
    p_message,
    p_href
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_app_notification(uuid, uuid, text, uuid, uuid, text, text) from public;
grant execute on function public.create_app_notification(uuid, uuid, text, uuid, uuid, text, text) to authenticated;
grant execute on function public.create_app_notification(uuid, uuid, text, uuid, uuid, text, text) to service_role;

create or replace function public.notify_provider_on_new_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_user_id uuid;
  v_slug text;
  v_actor_name text;
begin
  select p.user_id, p.slug
  into v_provider_user_id, v_slug
  from public.profiles p
  where p.id = new.provider_profile_id;

  if v_provider_user_id is null then
    return new;
  end if;

  if new.author_user_id is not null and new.author_user_id = v_provider_user_id then
    return new;
  end if;

  v_actor_name := coalesce(
    (select display_name from public.profiles where user_id = new.author_user_id),
    nullif(trim(new.guest_name), ''),
    'Someone'
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    review_id,
    comment_id,
    message,
    href
  )
  values (
    v_provider_user_id,
    new.author_user_id,
    'new_review',
    new.id,
    null,
    v_actor_name || ' left a new testimonial on your profile.',
    '/u/' || v_slug || '/testimonials#testimonial-' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_provider_on_new_review on public.provider_reviews;
create trigger trg_notify_provider_on_new_review
  after insert on public.provider_reviews
  for each row
  execute function public.notify_provider_on_new_review();
