import type { Profile, ProviderReview, ProviderSearchResult } from "@/lib/types";
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

  return data ?? [];
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

  return data ?? [];
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
