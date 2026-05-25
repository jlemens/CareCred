import { getQuestionById } from "@/lib/surveys/question-bank";
import { getTemplateById } from "@/lib/surveys/templates";
import { formatResponseValue } from "@/lib/surveys/validate-responses";
import { DEFAULT_TEMPLATE_ID, type SurveyResponses } from "@/lib/surveys/types";
import type { ProviderReview } from "@/lib/types";

export type ReviewDetailRow = {
  label: string;
  value: string;
};

export function effectiveSurveyTemplateId(review: ProviderReview): string {
  return review.survey_template_id ?? DEFAULT_TEMPLATE_ID;
}

export function surveyLabelForReview(review: ProviderReview): string {
  if (review.source === "google_manual") {
    return review.source_label ?? "From Google Reviews";
  }
  if (review.source_label?.trim()) return review.source_label.trim();
  const template = getTemplateById(effectiveSurveyTemplateId(review));
  return template?.name ?? "Standard review";
}

export function parseSurveyResponses(review: ProviderReview): SurveyResponses {
  if (review.survey_responses && typeof review.survey_responses === "object") {
    return review.survey_responses as SurveyResponses;
  }
  return {};
}

export function writtenFeedbackFromReview(review: ProviderReview): string {
  const responses = parseSurveyResponses(review);
  const fromResponses = responses.written_feedback;
  if (typeof fromResponses === "string" && fromResponses.trim()) {
    return fromResponses.trim();
  }
  return [review.standout_care, review.rehab_story]
    .filter((s): s is string => Boolean(s?.trim()))
    .join("\n\n")
    .trim();
}

export function reviewDetailRows(review: ProviderReview): ReviewDetailRow[] {
  if (review.source !== "pt_survey") return [];

  const rows: ReviewDetailRow[] = [];
  const responses = parseSurveyResponses(review);
  const templateId = effectiveSurveyTemplateId(review);

  if (Object.keys(responses).length > 0) {
    const template = getTemplateById(templateId);
    const order = template?.questionIds ?? Object.keys(responses);

    for (const id of order) {
      if (id === "written_feedback") continue;
      const value = responses[id];
      if (value === undefined || value === null || value === "") continue;
      const q = getQuestionById(id);
      rows.push({
        label: q?.label ?? id,
        value: formatResponseValue(id, value),
      });
    }
  } else if (templateId === DEFAULT_TEMPLATE_ID) {
    if (review.body_region?.trim()) {
      rows.push({ label: "Body region", value: review.body_region.trim() });
    }
    if (review.condition_summary?.trim()) {
      rows.push({
        label: "Condition / recovery",
        value: review.condition_summary.trim(),
      });
    }
  }

  return rows;
}
