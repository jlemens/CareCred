export type ProfileType = "provider" | "patient";

export type Profile = {
  id: string;
  user_id: string;
  slug: string;
  profile_type: ProfileType;
  display_name: string;
  practice_name: string | null;
  location: string | null;
  bio: string | null;
  specialties: string | null;
  education: string | null;
  years_experience: number | null;
  avatar_url: string | null;
  active_survey_template: string | null;
  is_complete: boolean;
};

export type ProviderReview = {
  id: string;
  provider_profile_id: string;
  author_user_id: string | null;
  guest_name: string | null;
  recommend_provider: boolean;
  rehab_experience_rating: number;
  communication_rating: number;
  professionalism_rating: number;
  felt_listened: boolean;
  body_region: string;
  condition_summary: string;
  rehab_story: string | null;
  standout_care: string | null;
  source: "pt_survey" | "google_manual";
  source_label: string | null;
  source_url: string | null;
  disclaimer_text: string | null;
  attestation_accepted: boolean | null;
  is_visible: boolean;
  created_at: string;
};

export type ProviderSearchResult = Pick<
  Profile,
  "id" | "slug" | "display_name" | "practice_name" | "location" | "avatar_url"
>;
