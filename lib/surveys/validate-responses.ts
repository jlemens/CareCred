import { getQuestionById } from "@/lib/surveys/question-bank";
import {
  isSurveyEnabledForProvider,
  resolveSurveyQuestions,
} from "@/lib/surveys/config";
import type { ProviderSurveyConfig, SurveyResponses } from "@/lib/surveys/types";

function formatSelectLabel(
  questionId: string,
  value: string,
): string {
  const q = getQuestionById(questionId);
  const opt = q?.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

export function formatResponseValue(
  questionId: string,
  value: string | number | boolean,
): string {
  const q = getQuestionById(questionId);
  if (!q) return String(value);

  switch (q.type) {
    case "star":
      return `${value} / 5`;
    case "yes_no":
      return value === true || value === "yes" ? "Yes" : "No";
    case "select":
      return typeof value === "string" ? formatSelectLabel(questionId, value) : String(value);
    default:
      return String(value);
  }
}

export function validateSurveySubmission(input: {
  templateId: string;
  config: ProviderSurveyConfig;
  responses: unknown;
  overallRating: number;
}): { ok: true; responses: SurveyResponses } | { ok: false; error: string } {
  const { templateId, config, overallRating } = input;

  if (!isSurveyEnabledForProvider(config, templateId)) {
    return { ok: false, error: "This survey is not enabled for this provider." };
  }

  const allowedIds = new Set(resolveSurveyQuestions(templateId, config));
  if (allowedIds.size === 0) {
    return { ok: false, error: "Survey has no questions configured." };
  }

  if (!input.responses || typeof input.responses !== "object") {
    return { ok: true, responses: {} };
  }

  const raw = input.responses as Record<string, unknown>;
  const cleaned: SurveyResponses = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!allowedIds.has(key)) continue;
    const q = getQuestionById(key);
    if (!q) continue;

    if (value === null || value === undefined || value === "") continue;

    switch (q.type) {
      case "star": {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 5) {
          return { ok: false, error: `Invalid rating for "${q.label}".` };
        }
        cleaned[key] = n;
        break;
      }
      case "yes_no": {
        if (typeof value === "boolean") {
          cleaned[key] = value;
        } else if (value === "yes" || value === "no") {
          cleaned[key] = value === "yes";
        } else {
          return { ok: false, error: `Invalid answer for "${q.label}".` };
        }
        break;
      }
      case "select": {
        if (typeof value !== "string") {
          return { ok: false, error: `Invalid selection for "${q.label}".` };
        }
        const valid = q.options?.some((o) => o.value === value);
        if (!valid) {
          return { ok: false, error: `Invalid option for "${q.label}".` };
        }
        cleaned[key] = value;
        break;
      }
      case "text":
      case "textarea": {
        if (typeof value !== "string") {
          return { ok: false, error: `Invalid text for "${q.label}".` };
        }
        const trimmed = value.trim();
        if (!trimmed) break;
        const max = q.maxLength ?? (q.type === "textarea" ? 2000 : 240);
        if (trimmed.length > max) {
          return { ok: false, error: `"${q.label}" is too long (max ${max} characters).` };
        }
        cleaned[key] = trimmed;
        break;
      }
    }
  }

  // Default optional star ratings to overall when omitted (PT legacy behavior)
  for (const id of allowedIds) {
    const q = getQuestionById(id);
    if (q?.type === "star" && cleaned[id] === undefined) {
      // leave unset — API layer may default legacy columns
    }
  }

  void overallRating;
  return { ok: true, responses: cleaned };
}

export function mapResponsesToLegacyColumns(
  templateId: string,
  responses: SurveyResponses,
  overallRating: number,
): {
  rehab_experience_rating: number;
  communication_rating: number;
  professionalism_rating: number;
  felt_listened: boolean;
  body_region: string | null;
  condition_summary: string | null;
  standout_care: string | null;
} {
  const star = (id: string) => {
    const v = responses[id];
    return typeof v === "number" && v >= 1 && v <= 5 ? v : overallRating;
  };

  const yesNo = (id: string, fallback = true) => {
    const v = responses[id];
    return typeof v === "boolean" ? v : fallback;
  };

  const text = (id: string) => {
    const v = responses[id];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  if (templateId === "pt_standard") {
    return {
      rehab_experience_rating: star("rehab_experience"),
      communication_rating: star("communication"),
      professionalism_rating: star("professionalism"),
      felt_listened: yesNo("felt_listened"),
      body_region: text("body_region"),
      condition_summary: text("condition_summary"),
      standout_care: text("written_feedback"),
    };
  }

  return {
    rehab_experience_rating: overallRating,
    communication_rating: overallRating,
    professionalism_rating: overallRating,
    felt_listened: yesNo("felt_listened", true),
    body_region: text("body_region"),
    condition_summary: text("condition_summary"),
    standout_care: text("written_feedback"),
  };
}
