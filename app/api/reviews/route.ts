import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { REVIEWER_STATE_ENUM } from "@/lib/us-states";

const reviewerStateSchema = z.enum(REVIEWER_STATE_ENUM);

const surveySchema = z.object({
  providerProfileId: z.string().uuid(),
  guestName: z.string().max(80).optional(),
  overallRating: z.number().int().min(1).max(5),
  recommendProvider: z.boolean(),
  rehabExperienceRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  feltListened: z.boolean().optional(),
  reviewerState: reviewerStateSchema,
  bodyRegion: z.string().max(80).optional(),
  conditionSummary: z.string().max(240).optional(),
  rehabStory: z.string().max(2000).optional(),
  standoutCare: z.string().max(2000).optional(),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const parsed = surveySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid survey payload." }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: providerProfile, error: providerLookupError } = await supabase
      .from("profiles")
      .select("user_id, slug, display_name")
      .eq("id", parsed.data.providerProfileId)
      .eq("profile_type", "provider")
      .single<{ user_id: string; slug: string; display_name: string }>();

    if (providerLookupError || !providerProfile) {
      return NextResponse.json(
        { error: "Provider profile could not be found." },
        { status: 404 },
      );
    }

    if (providerProfile.user_id === user.id) {
      return NextResponse.json(
        { error: "Providers cannot submit standard reviews for themselves." },
        { status: 403 },
      );
    }
  }

  const stars = parsed.data.overallRating;
  const guest = parsed.data.guestName?.trim();
  const guestName = guest && guest.length >= 1 ? guest : null;

  const payload = {
    provider_profile_id: parsed.data.providerProfileId,
    author_user_id: user?.id ?? null,
    guest_name: guestName,
    overall_rating: stars,
    recommend_provider: parsed.data.recommendProvider,
    rehab_experience_rating: parsed.data.rehabExperienceRating ?? stars,
    communication_rating: parsed.data.communicationRating ?? stars,
    professionalism_rating: parsed.data.professionalismRating ?? stars,
    reviewer_state: parsed.data.reviewerState,
    body_region: parsed.data.bodyRegion?.trim() || null,
    condition_summary: parsed.data.conditionSummary?.trim() || null,
    rehab_story: parsed.data.rehabStory?.trim() || null,
    standout_care: parsed.data.standoutCare?.trim() || null,
    source: "pt_survey",
    source_label: "Standard review",
    disclaimer_text: null,
    source_url: null,
    attestation_accepted: null,
    is_visible: true,
    ...(parsed.data.feltListened !== undefined
      ? { felt_listened: parsed.data.feltListened }
      : {}),
  };

  const { error } = await supabase.from("provider_reviews").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
