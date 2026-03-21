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
      "id, slug, display_name, practice_name, location, avatar_url, specialties, education, credentials",
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
