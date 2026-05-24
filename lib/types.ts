export type ProfileType = "provider" | "patient";

export type Profile = {
  id: string;
  user_id: string;
  slug: string;
  profile_type: ProfileType;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  credentials: string | null;
  profession: string | null;
  practice_name: string | null;
  location: string | null;
  /** USPS-style code or OTHER; patient home state (same values as review survey). */
  home_state?: string | null;
  bio: string | null;
  specialties: string | null;
  education: string | null;
  years_experience: number | null;
  avatar_url: string | null;
  active_survey_template: string | null;
  is_complete: boolean;
  /** How many times the public slug has been changed after creation (max 1 allowed). */
  slug_change_count?: number;
};

export type ProviderReview = {
  id: string;
  provider_profile_id: string;
  author_user_id: string | null;
  guest_name: string | null;
  /** Single overall 1–5 for quick survey (preferred for stats). */
  overall_rating: number | null;
  recommend_provider: boolean;
  rehab_experience_rating: number;
  communication_rating: number;
  professionalism_rating: number;
  felt_listened: boolean;
  body_region: string | null;
  /** USPS-style code or OTHER; where the reviewer is located. */
  reviewer_state: string | null;
  condition_summary: string | null;
  rehab_story: string | null;
  standout_care: string | null;
  source: "pt_survey" | "google_manual";
  source_label: string | null;
  source_url: string | null;
  disclaimer_text: string | null;
  attestation_accepted: boolean | null;
  is_visible: boolean;
  is_pinned?: boolean | null;
  created_at: string;
};

export type ProviderSearchResult = Pick<
  Profile,
  "id" | "slug" | "display_name" | "profession" | "practice_name" | "location" | "avatar_url"
>;

export type ReviewComment = {
  id: string;
  review_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  author_display_name?: string;
  author_slug?: string | null;
};

export type NotificationType = "new_review" | "review_comment" | "review_like";

export type AppNotification = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  type: NotificationType;
  review_id: string | null;
  comment_id: string | null;
  message: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

export type ReviewEngagementSummary = {
  likeCount: number;
  likedByMe: boolean;
  comments: ReviewComment[];
};
