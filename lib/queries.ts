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
  if (!supabase || !query.trim()) return [] as ProviderSearchResult[];

  const q = `%${query.trim()}%`;
  const { data } = await supabase
    .from("profiles")
    .select("id, slug, display_name, practice_name, location, avatar_url")
    .eq("profile_type", "provider")
    .eq("is_complete", true)
    .or(`display_name.ilike.${q},practice_name.ilike.${q}`)
    .order("display_name", { ascending: true })
    .limit(20)
    .returns<ProviderSearchResult[]>();

  return data ?? [];
}

export async function getProviderReviews(providerProfileId: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [] as ProviderReview[];

  const { data } = await supabase
    .from("provider_reviews")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .eq("is_visible", true)
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
