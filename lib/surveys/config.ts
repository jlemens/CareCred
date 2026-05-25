import { getQuestionsByIds } from "@/lib/surveys/question-bank";
import {
  getPremadeTemplateIds,
  getTemplateById,
  SURVEY_TEMPLATES,
} from "@/lib/surveys/templates";
import {
  CUSTOM_TEMPLATE_ID,
  DEFAULT_TEMPLATE_ID,
  MAX_CUSTOM_QUESTIONS,
  type ProviderSurveyConfig,
  type ResolvedSurvey,
} from "@/lib/surveys/types";

export function defaultSurveyConfig(): ProviderSurveyConfig {
  return {
    enabledTemplateIds: [DEFAULT_TEMPLATE_ID],
    custom: { enabled: false, questionIds: [] },
  };
}

export function parseSurveyConfig(raw: unknown): ProviderSurveyConfig {
  const base = defaultSurveyConfig();
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Record<string, unknown>;
  const premadeIds = new Set(getPremadeTemplateIds());

  let enabledTemplateIds: string[] = [];
  if (Array.isArray(obj.enabledTemplateIds)) {
    enabledTemplateIds = obj.enabledTemplateIds.filter(
      (id): id is string => typeof id === "string" && premadeIds.has(id),
    );
  }

  const customRaw =
    obj.custom && typeof obj.custom === "object"
      ? (obj.custom as Record<string, unknown>)
      : null;

  const customEnabled = customRaw?.enabled === true;
  let customQuestionIds: string[] = [];
  if (Array.isArray(customRaw?.questionIds)) {
    customQuestionIds = customRaw.questionIds
      .filter((id): id is string => typeof id === "string")
      .slice(0, MAX_CUSTOM_QUESTIONS);
  }

  if (enabledTemplateIds.length === 0 && !customEnabled) {
    enabledTemplateIds = [DEFAULT_TEMPLATE_ID];
  }

  return {
    enabledTemplateIds,
    custom: {
      enabled: customEnabled,
      questionIds: customQuestionIds,
    },
  };
}

export function resolveEnabledSurveys(config: ProviderSurveyConfig): ResolvedSurvey[] {
  const out: ResolvedSurvey[] = [];

  for (const templateId of config.enabledTemplateIds) {
    const template = getTemplateById(templateId);
    if (!template) continue;
    out.push({
      templateId: template.id,
      name: template.name,
      description: template.description,
      sourceLabel: template.sourceLabel,
      questionIds: template.questionIds,
    });
  }

  if (config.custom.enabled && config.custom.questionIds.length > 0) {
    const validIds = getQuestionsByIds(config.custom.questionIds).map((q) => q.id);
    if (validIds.length > 0) {
      out.push({
        templateId: CUSTOM_TEMPLATE_ID,
        name: "Custom review",
        description: "Questions you selected from the question bank.",
        sourceLabel: "Custom review",
        questionIds: validIds,
      });
    }
  }

  if (out.length === 0) {
    const fallback = getTemplateById(DEFAULT_TEMPLATE_ID)!;
    out.push({
      templateId: fallback.id,
      name: fallback.name,
      description: fallback.description,
      sourceLabel: fallback.sourceLabel,
      questionIds: fallback.questionIds,
    });
  }

  return out;
}

export function suggestedTemplateIdsForProfession(profession: string | null | undefined): string[] {
  const p = profession?.trim().toLowerCase() ?? "";
  if (!p) return [DEFAULT_TEMPLATE_ID];

  const matches = SURVEY_TEMPLATES.filter((t) =>
    t.suggestedProfessions.some((s) => {
      const needle = s.toLowerCase();
      return p.includes(needle) || needle.includes(p);
    }),
  ).map((t) => t.id);

  return matches.length > 0 ? matches : [DEFAULT_TEMPLATE_ID];
}

export function validateSurveyConfigPayload(
  config: ProviderSurveyConfig,
): { ok: true } | { ok: false; error: string } {
  if (config.enabledTemplateIds.length === 0 && !config.custom.enabled) {
    return { ok: false, error: "Enable at least one survey for your profile." };
  }

  if (config.custom.enabled) {
    if (config.custom.questionIds.length === 0) {
      return {
        ok: false,
        error: "Select at least one optional question for your custom survey.",
      };
    }
    if (config.custom.questionIds.length > MAX_CUSTOM_QUESTIONS) {
      return {
        ok: false,
        error: `Custom surveys can include up to ${MAX_CUSTOM_QUESTIONS} optional questions.`,
      };
    }
    const valid = getQuestionsByIds(config.custom.questionIds);
    if (valid.length !== config.custom.questionIds.length) {
      return { ok: false, error: "One or more custom questions are invalid." };
    }
  }

  return { ok: true };
}

export function isSurveyEnabledForProvider(
  config: ProviderSurveyConfig,
  templateId: string,
): boolean {
  if (templateId === CUSTOM_TEMPLATE_ID) {
    return config.custom.enabled && config.custom.questionIds.length > 0;
  }
  return config.enabledTemplateIds.includes(templateId);
}

export function resolveSurveyQuestions(templateId: string, config: ProviderSurveyConfig): string[] {
  if (templateId === CUSTOM_TEMPLATE_ID) {
    return getQuestionsByIds(config.custom.questionIds).map((q) => q.id);
  }
  return getTemplateById(templateId)?.questionIds ?? [];
}
