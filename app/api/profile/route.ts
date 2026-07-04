import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { REVIEWER_STATE_ENUM } from "@/lib/us-states";

const reviewerStateSchema = z.enum(REVIEWER_STATE_ENUM);

const schema = z.object({
  profileType: z.enum(["provider", "patient"]),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  practiceName: z.string().max(120).optional(),
  specialties: z.string().max(240).optional(),
  education: z.string().max(240).optional(),
  credentials: z.string().max(160).optional(),
  profession: z.string().max(100).optional(),
  yearsExperience: z.string().optional(),
  location: z.string().max(120).optional(),
  bio: z.string().max(1200).optional(),
  homeState: z.string().optional(),
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

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
  }

  const data = parsed.data;
  const newSlug = data.slug.trim();

  const { data: existing } = await supabase
    .from("profiles")
    .select("slug, slug_change_count, active_survey_template")
    .eq("user_id", user.id)
    .maybeSingle<{
      slug: string;
      slug_change_count: number | null;
      active_survey_template: string | null;
    }>();

  if (existing && existing.slug !== newSlug) {
    return NextResponse.json(
      {
        error:
          "Your public slug can't be changed after your profile is created.",
      },
      { status: 400 },
    );
  }

  const slugChangeCount = existing?.slug_change_count ?? 0;

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const bioTrimmed = data.bio?.trim() || null;
  const years = data.yearsExperience ? Number(data.yearsExperience) : null;
  const avatarUrl = data.avatarUrl?.trim() || null;

  if (data.profileType === "provider") {
    if (!lastName) {
      return NextResponse.json(
        { error: "Last name is required for provider accounts." },
        { status: 400 },
      );
    }
    if (!avatarUrl) {
      return NextResponse.json(
        { error: "A profile photo is required for provider accounts." },
        { status: 400 },
      );
    }
    if (!bioTrimmed) {
      return NextResponse.json(
        { error: "About you is required for provider accounts." },
        { status: 400 },
      );
    }
    if (!data.profession?.trim()) {
      return NextResponse.json(
        { error: "Profession is required for provider accounts." },
        { status: 400 },
      );
    }
  }

  let homeState: string | null = null;
  if (data.profileType === "patient") {
    const hs = reviewerStateSchema.safeParse(data.homeState);
    if (!hs.success) {
      return NextResponse.json(
        { error: "Select your state (same options as the review survey)." },
        { status: 400 },
      );
    }
    homeState = hs.data;
  }

  const displayName =
    data.profileType === "patient"
      ? [firstName, lastName].filter(Boolean).join(" ").trim() || firstName
      : `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  if (displayName.length < 2 || displayName.length > 80) {
    return NextResponse.json(
      {
        error:
          "Your public display name must be between 2 and 80 characters (use a longer first name or add a last name).",
      },
      { status: 400 },
    );
  }

  const providerRequiredReady =
    Boolean(avatarUrl) && Boolean(bioTrimmed);

  const patientRequiredReady =
    Boolean(firstName) &&
    Boolean(newSlug) &&
    Boolean(homeState);

  const credentialsTrimmed =
    data.profileType === "provider" ? data.credentials?.trim() || null : null;
  const professionTrimmed =
    data.profileType === "provider" ? data.profession?.trim() || null : null;

  const payload = {
    user_id: user.id,
    profile_type: data.profileType,
    display_name: displayName,
    first_name: firstName,
    last_name: lastName || null,
    slug: newSlug,
    slug_change_count: slugChangeCount,
    avatar_url: avatarUrl,
    home_state: homeState,
    practice_name: data.profileType === "provider" ? data.practiceName?.trim() || null : null,
    specialties: data.profileType === "provider" ? data.specialties?.trim() || null : null,
    education: data.profileType === "provider" ? data.education?.trim() || null : null,
    credentials: credentialsTrimmed,
    profession: professionTrimmed,
    years_experience: data.profileType === "provider" && Number.isFinite(years) ? years : null,
    location: data.location?.trim() || null,
    bio: bioTrimmed,
    active_survey_template:
      data.profileType === "provider"
        ? existing?.active_survey_template ?? "pt_standard"
        : null,
    is_complete:
      data.profileType === "provider" ? providerRequiredReady : patientRequiredReady,
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
