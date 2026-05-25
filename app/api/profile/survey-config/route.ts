import { NextResponse } from "next/server";
import { z } from "zod";
import {
  parseSurveyConfig,
  validateSurveyConfigPayload,
} from "@/lib/surveys/config";
import { getPremadeTemplateIds } from "@/lib/surveys/templates";
import { MAX_CUSTOM_QUESTIONS } from "@/lib/surveys/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const premadeIdSet = new Set(getPremadeTemplateIds());

const schema = z.object({
  enabledTemplateIds: z.array(z.string()).default([]),
  custom: z
    .object({
      enabled: z.boolean(),
      questionIds: z.array(z.string()).max(MAX_CUSTOM_QUESTIONS),
    })
    .default({ enabled: false, questionIds: [] }),
});

export async function PATCH(request: Request) {
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
    return NextResponse.json({ error: "Invalid survey configuration." }, { status: 400 });
  }

  const config = parseSurveyConfig({
    enabledTemplateIds: parsed.data.enabledTemplateIds.filter((id) =>
      premadeIdSet.has(id),
    ),
    custom: parsed.data.custom,
  });
  const validation = validateSurveyConfigPayload(config);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, profile_type")
    .eq("user_id", user.id)
    .single<{ id: string; profile_type: string }>();

  if (lookupError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.profile_type !== "provider") {
    return NextResponse.json(
      { error: "Survey settings are only available for provider accounts." },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      survey_config: config,
      active_survey_template: config.enabledTemplateIds[0] ?? "pt_standard",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, config });
}
