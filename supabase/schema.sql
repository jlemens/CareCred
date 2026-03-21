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
  practice_name text,
  location text,
  bio text,
  specialties text,
  education text,
  years_experience integer,
  avatar_url text,
  active_survey_template text,
  is_complete boolean not null default false,
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
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_provider_search
  on public.profiles(profile_type, is_complete, display_name, practice_name);

-- Safe for existing databases (run in SQL Editor if table already existed)
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists credentials text;

alter table public.provider_reviews add column if not exists overall_rating integer;
alter table public.provider_reviews add column if not exists is_pinned boolean not null default false;
alter table public.provider_reviews alter column body_region drop not null;
alter table public.provider_reviews alter column condition_summary drop not null;

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
  using (is_visible = true);

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
