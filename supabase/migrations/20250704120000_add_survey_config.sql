-- Run in Supabase Dashboard → SQL Editor if profile save or survey settings fail
-- with: "Could not find the 'survey_config' column of 'profiles' in the schema cache"

alter table public.profiles add column if not exists survey_config jsonb;
alter table public.profiles add column if not exists active_survey_template text;

alter table public.provider_reviews add column if not exists survey_template_id text;
alter table public.provider_reviews add column if not exists survey_responses jsonb;

-- Backfill default survey config for existing provider profiles
update public.profiles
set
  survey_config = coalesce(
    survey_config,
    jsonb_build_object(
      'enabledTemplateIds', jsonb_build_array(coalesce(active_survey_template, 'pt_standard')),
      'custom', jsonb_build_object('enabled', false, 'questionIds', jsonb_build_array())
    )
  ),
  active_survey_template = coalesce(active_survey_template, 'pt_standard')
where profile_type = 'provider'
  and survey_config is null;
