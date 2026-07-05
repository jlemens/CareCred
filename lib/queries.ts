import type { Profile, ProfileFollowStats, ProfileFollowSummary, ProviderReview, ProviderSearchResult } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfileBySlug(slug: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single<Profile>();

  return data;
}

export async function getProfileByUserId(userId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single<Profile>();

  return data;
}

export async function searchProviders(query: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProviderSearchResult[];

  const trimmedQuery = query.trim();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, slug, display_name, profession, practice_name, location, avatar_url, specialties, education, credentials",
    )
    .eq("profile_type", "provider")
    .order("display_name", { ascending: true })
    .limit(200)
    .returns<
      Array<
        ProviderSearchResult & {
          specialties: string | null;
          education: string | null;
          credentials: string | null;
        }
      >
    >();

  const providers = data ?? [];
  if (!trimmedQuery) {
    return providers.slice(0, 20).map((provider) => ({
      id: provider.id,
      slug: provider.slug,
      display_name: provider.display_name,
      profession: provider.profession,
      practice_name: provider.practice_name,
      location: provider.location,
      avatar_url: provider.avatar_url,
    }));
  }

  const tokens = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean);

  const ranked = providers
    .filter((provider) => {
      const haystack = [
        provider.display_name,
        provider.profession ?? "",
        provider.practice_name ?? "",
        provider.location ?? "",
        provider.specialties ?? "",
        provider.education ?? "",
        provider.credentials ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    })
    .map((provider) => {
      const name = provider.display_name.toLowerCase();
      const search = trimmedQuery.toLowerCase();
      const score =
        name === search
          ? 0
          : name.startsWith(search)
            ? 1
            : name.includes(search)
              ? 2
              : 3;
      return { provider, score };
    })
    .sort((a, b) => a.score - b.score || a.provider.display_name.localeCompare(b.provider.display_name))
    .slice(0, 20)
    .map(({ provider }) => ({
      id: provider.id,
      slug: provider.slug,
      display_name: provider.display_name,
      profession: provider.profession,
      practice_name: provider.practice_name,
      location: provider.location,
      avatar_url: provider.avatar_url,
    }));

  return ranked;
}

async function attachAuthorSlugs(reviews: ProviderReview[]) {
  const supabase = await getSupabaseServerClient();
  if (!supabase || reviews.length === 0) return reviews;

  const authorIds = [
    ...new Set(
      reviews
        .map((review) => review.author_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (authorIds.length === 0) return reviews;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, slug, display_name")
    .in("user_id", authorIds)
    .returns<Array<{ user_id: string; slug: string; display_name: string }>>();

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return reviews.map((review) => {
    if (!review.author_user_id) return review;
    const authorProfile = profileByUserId.get(review.author_user_id);
    if (!authorProfile) return review;
    return {
      ...review,
      author_slug: authorProfile.slug,
      author_display_name: authorProfile.display_name,
    };
  });
}

export async function getProviderReviews(providerProfileId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProviderReview[];

  const { data } = await supabase
    .from("provider_reviews")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .eq("is_visible", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ProviderReview[]>();

  return attachAuthorSlugs(data ?? []);
}

export async function getProviderHiddenReviews(providerProfileId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProviderReview[];

  const { data } = await supabase
    .from("provider_reviews")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .eq("is_visible", false)
    .order("created_at", { ascending: false })
    .returns<ProviderReview[]>();

  return attachAuthorSlugs(data ?? []);
}

/** Count of non-visible reviews; callable for any visitor (uses DB RPC, not row-level select). */
export async function getProviderHiddenReviewCount(providerProfileId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc("provider_hidden_review_count", {
    p_provider_profile_id: providerProfileId,
  });

  if (error) return 0;
  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}

export async function getGivenReviewsByUser(userId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProviderReview[];

  const { data } = await supabase
    .from("provider_reviews")
    .select("*")
    .eq("author_user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ProviderReview[]>();

  return data ?? [];
}

export type ProviderSummaryForReview = Pick<
  Profile,
  "id" | "slug" | "display_name" | "practice_name" | "user_id" | "profile_type"
>;

export async function getProfilesByIds(ids: string[]) {
  const supabase = await getSupabaseServerClient();
  if (!supabase || ids.length === 0) return [] as ProviderSummaryForReview[];

  const unique = [...new Set(ids)];
  const { data } = await supabase
    .from("profiles")
    .select("id, slug, display_name, practice_name, user_id, profile_type")
    .in("id", unique)
    .returns<ProviderSummaryForReview[]>();

  return data ?? [];
}

/** Reviews authored by the user, each paired with the provider profile that received it. */
export async function getGivenReviewsWithProviderSummaries(userId: string) {
  const reviews = await getGivenReviewsByUser(userId);
  if (reviews.length === 0) {
    return [] as Array<{ review: ProviderReview; provider: ProviderSummaryForReview }>;
  }

  const profiles = await getProfilesByIds(
    reviews.map((r) => r.provider_profile_id),
  );
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const out: Array<{ review: ProviderReview; provider: ProviderSummaryForReview }> = [];
  for (const review of reviews) {
    const provider = byId.get(review.provider_profile_id);
    if (provider) out.push({ review, provider });
  }
  return out;
}

export async function getProfileFollowerCount(profileId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc("profile_follower_count", {
    p_profile_id: profileId,
  });

  if (error) {
    const { count } = await supabase
      .from("profile_follows")
      .select("followed_profile_id", { head: true, count: "exact" })
      .eq("followed_profile_id", profileId);
    return count ?? 0;
  }

  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}

export async function getProfileFollowStats(
  profileId: string,
  viewerUserId: string | null,
  showFollowerCount = true,
): Promise<ProfileFollowStats> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { followerCount: 0, followedByMe: false, showFollowerCount };
  }

  const [followerCount, followedByMeResult] = await Promise.all([
    getProfileFollowerCount(profileId),
    viewerUserId
      ? supabase
          .from("profile_follows")
          .select("followed_profile_id")
          .eq("followed_profile_id", profileId)
          .eq("follower_user_id", viewerUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    followerCount,
    followedByMe: Boolean(followedByMeResult.data),
    showFollowerCount,
  };
}

export async function getProfileFollowers(profileId: string, limit = 50) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProfileFollowSummary[];

  const { data: follows } = await supabase
    .from("profile_follows")
    .select("follower_user_id, created_at")
    .eq("followed_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!follows?.length) return [] as ProfileFollowSummary[];

  const userIds = follows.map((row) => row.follower_user_id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, slug, avatar_url, profile_type")
    .in("user_id", userIds)
    .returns<
      Array<{
        user_id: string;
        display_name: string;
        slug: string;
        avatar_url: string | null;
        profile_type: Profile["profile_type"];
      }>
    >();

  const byUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const out: ProfileFollowSummary[] = [];

  for (const row of follows) {
    const profile = byUserId.get(row.follower_user_id as string);
    if (!profile) continue;
    out.push({
      display_name: profile.display_name,
      slug: profile.slug,
      avatar_url: profile.avatar_url,
      profile_type: profile.profile_type,
      followed_at: row.created_at as string,
    });
  }

  return out;
}

export async function getProfilesFollowedByUser(userId: string, limit = 50) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProfileFollowSummary[];

  const { data: follows } = await supabase
    .from("profile_follows")
    .select("followed_profile_id, created_at")
    .eq("follower_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!follows?.length) return [] as ProfileFollowSummary[];

  const profileIds = follows.map((row) => row.followed_profile_id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, slug, avatar_url, profile_type")
    .in("id", profileIds)
    .returns<
      Array<{
        id: string;
        display_name: string;
        slug: string;
        avatar_url: string | null;
        profile_type: Profile["profile_type"];
      }>
    >();

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const out: ProfileFollowSummary[] = [];

  for (const row of follows) {
    const profile = byId.get(row.followed_profile_id as string);
    if (!profile) continue;
    out.push({
      display_name: profile.display_name,
      slug: profile.slug,
      avatar_url: profile.avatar_url,
      profile_type: profile.profile_type,
      followed_at: row.created_at as string,
    });
  }

  return out;
}
