import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  providerProfileId: z.string().uuid(),
  guestName: z.string().min(2).max(80),
  reviewText: z.string().min(5).max(2000),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  accepted: z.literal(true),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid imported review payload." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, profile_type")
    .eq("id", parsed.data.providerProfileId)
    .eq("user_id", user.id)
    .single<{ id: string; profile_type: "provider" | "patient" }>();

  if (profileError || !profile || profile.profile_type !== "provider") {
    return NextResponse.json(
      { error: "Only the provider owner can add imported reviews." },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("provider_reviews").insert({
    provider_profile_id: parsed.data.providerProfileId,
    author_user_id: user.id,
    guest_name: parsed.data.guestName.trim(),
    recommend_provider: true,
    rehab_experience_rating: 5,
    communication_rating: 5,
    professionalism_rating: 5,
    felt_listened: true,
    body_region: "Imported",
    condition_summary: "Imported from public source",
    rehab_story: null,
    standout_care: parsed.data.reviewText.trim(),
    source: "google_manual",
    source_label: "From Google Reviews",
    source_url: parsed.data.sourceUrl?.trim() || null,
    disclaimer_text:
      "Quoted or reproduced from Google Reviews. Provider attested source accuracy.",
    attestation_accepted: true,
    is_visible: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
