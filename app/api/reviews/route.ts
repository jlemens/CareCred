import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const surveySchema = z.object({
  providerProfileId: z.string().uuid(),
  guestName: z.string().min(2).max(80),
  recommendProvider: z.boolean(),
  rehabExperienceRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  professionalismRating: z.number().min(1).max(5),
  feltListened: z.boolean(),
  bodyRegion: z.string().min(2).max(80),
  conditionSummary: z.string().min(2).max(240),
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

  const payload = {
    provider_profile_id: parsed.data.providerProfileId,
    author_user_id: user?.id ?? null,
    guest_name: parsed.data.guestName.trim(),
    recommend_provider: parsed.data.recommendProvider,
    rehab_experience_rating: parsed.data.rehabExperienceRating,
    communication_rating: parsed.data.communicationRating,
    professionalism_rating: parsed.data.professionalismRating,
    felt_listened: parsed.data.feltListened,
    body_region: parsed.data.bodyRegion.trim(),
    condition_summary: parsed.data.conditionSummary.trim(),
    rehab_story: parsed.data.rehabStory?.trim() || null,
    standout_care: parsed.data.standoutCare?.trim() || null,
    source: "pt_survey",
    source_label: "PT Survey",
    disclaimer_text: null,
    source_url: null,
    attestation_accepted: null,
    is_visible: true,
  };

  const { error } = await supabase.from("provider_reviews").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
