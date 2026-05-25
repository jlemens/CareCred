import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSurveyEnabledForProvider,
  parseSurveyConfig,
  resolveSurveyQuestions,
} from "@/lib/surveys/config";
import { getTemplateById } from "@/lib/surveys/templates";
import { CUSTOM_TEMPLATE_ID } from "@/lib/surveys/types";
import {
  mapResponsesToLegacyColumns,
  validateSurveySubmission,
} from "@/lib/surveys/validate-responses";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { REVIEWER_STATE_ENUM } from "@/lib/us-states";

const reviewerStateSchema = z.enum(REVIEWER_STATE_ENUM);

const surveySchema = z.object({
  providerProfileId: z.string().uuid(),
  surveyTemplateId: z.string().min(1).max(40),
  guestName: z.string().max(80).optional(),
  overallRating: z.number().int().min(1).max(5),
  recommendProvider: z.boolean(),
  reviewerState: reviewerStateSchema,
  responses: z.record(z.string(), z.unknown()).optional(),
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

  const { data: providerProfile, error: providerLookupError } = await supabase
    .from("profiles")
    .select("user_id, slug, display_name, survey_config")
    .eq("id", parsed.data.providerProfileId)
    .eq("profile_type", "provider")
    .single<{
      user_id: string;
      slug: string;
      display_name: string;
      survey_config: unknown;
    }>();

  if (providerLookupError || !providerProfile) {
    return NextResponse.json(
      { error: "Provider profile could not be found." },
      { status: 404 },
    );
  }

  if (user && providerProfile.user_id === user.id) {
    return NextResponse.json(
      { error: "Providers cannot submit standard reviews for themselves." },
      { status: 403 },
    );
  }

  const surveyConfig = parseSurveyConfig(providerProfile.survey_config);
  const { surveyTemplateId } = parsed.data;

  if (!isSurveyEnabledForProvider(surveyConfig, surveyTemplateId)) {
    return NextResponse.json(
      { error: "This survey type is not offered on this profile." },
      { status: 400 },
    );
  }

  const allowedQuestionIds = new Set(
    resolveSurveyQuestions(surveyTemplateId, surveyConfig),
  );
  if (allowedQuestionIds.size === 0) {
    return NextResponse.json({ error: "Survey is not configured." }, { status: 400 });
  }

  const responseValidation = validateSurveySubmission({
    templateId: surveyTemplateId,
    config: surveyConfig,
    responses: parsed.data.responses ?? {},
    overallRating: parsed.data.overallRating,
  });

  if (!responseValidation.ok) {
    return NextResponse.json({ error: responseValidation.error }, { status: 400 });
  }

  const stars = parsed.data.overallRating;
  const guest = parsed.data.guestName?.trim();
  const guestName = guest && guest.length >= 1 ? guest : null;
  const responses = responseValidation.responses;

  const legacy = mapResponsesToLegacyColumns(surveyTemplateId, responses, stars);

  const templateMeta =
    surveyTemplateId === CUSTOM_TEMPLATE_ID
      ? { name: "Custom review", sourceLabel: "Custom review" }
      : getTemplateById(surveyTemplateId);

  const payload = {
    provider_profile_id: parsed.data.providerProfileId,
    author_user_id: user?.id ?? null,
    guest_name: guestName,
    overall_rating: stars,
    recommend_provider: parsed.data.recommendProvider,
    rehab_experience_rating: legacy.rehab_experience_rating,
    communication_rating: legacy.communication_rating,
    professionalism_rating: legacy.professionalism_rating,
    felt_listened: legacy.felt_listened,
    reviewer_state: parsed.data.reviewerState,
    body_region: legacy.body_region,
    condition_summary: legacy.condition_summary,
    rehab_story: null,
    standout_care: legacy.standout_care,
    survey_template_id: surveyTemplateId,
    survey_responses: responses,
    source: "pt_survey",
    source_label: templateMeta?.sourceLabel ?? "Standard review",
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
