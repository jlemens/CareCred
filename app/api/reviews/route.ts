import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const surveySchema = z.object({
  providerProfileId: z.string().uuid(),
  /** Optional; shown as Anonymous if empty. */
  guestName: z.string().max(80).optional(),
  overallRating: z.number().int().min(1).max(5),
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
      .select("user_id")
      .eq("id", parsed.data.providerProfileId)
      .eq("profile_type", "provider")
      .single<{ user_id: string }>();

    if (providerLookupError || !providerProfile) {
      return NextResponse.json(
        { error: "Provider profile could not be found." },
        { status: 404 },
      );
    }

    if (providerProfile.user_id === user.id) {
      return NextResponse.json(
        { error: "Providers cannot submit PT surveys for themselves." },
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
    recommend_provider: true,
    rehab_experience_rating: stars,
    communication_rating: stars,
    professionalism_rating: stars,
    felt_listened: true,
    body_region: null,
    condition_summary: null,
    rehab_story: null,
    standout_care: null,
    source: "pt_survey",
    source_label: "Quick survey",
    disclaimer_text: null,
    source_url: null,
    attestation_accepted: null,
    is_visible: true,
    is_pinned: false,
  };

  const { error } = await supabase.from("provider_reviews").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
