import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  profileType: z.enum(["provider", "patient"]),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
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
  yearsExperience: z.string().optional(),
  location: z.string().max(120).optional(),
  bio: z.string().max(1200).optional(),
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
  const years = data.yearsExperience ? Number(data.yearsExperience) : null;
  const avatarUrl = data.avatarUrl?.trim() || null;
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const displayName = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  if (displayName.length < 2 || displayName.length > 80) {
    return NextResponse.json(
      { error: "First and last name must form a valid public name (2–80 characters)." },
      { status: 400 },
    );
  }

  // Provider "complete" = searchable / fully published: photo + bio only.
  const providerRequiredReady =
    Boolean(avatarUrl) && Boolean(data.bio?.trim());

  const patientRequiredReady =
    Boolean(displayName.length) && Boolean(data.bio?.trim());

  const credentialsTrimmed =
    data.profileType === "provider" ? data.credentials?.trim() || null : null;

  const payload = {
    user_id: user.id,
    profile_type: data.profileType,
    display_name: displayName,
    first_name: firstName,
    last_name: lastName,
    slug: data.slug.trim(),
    avatar_url: data.profileType === "provider" ? avatarUrl : null,
    practice_name: data.profileType === "provider" ? data.practiceName?.trim() || null : null,
    specialties: data.profileType === "provider" ? data.specialties?.trim() || null : null,
    education: data.profileType === "provider" ? data.education?.trim() || null : null,
    credentials: credentialsTrimmed,
    years_experience: data.profileType === "provider" && Number.isFinite(years) ? years : null,
    location: data.location?.trim() || null,
    bio: data.bio?.trim() || null,
    active_survey_template: data.profileType === "provider" ? "pt" : null,
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
