export type SurveyQuestionType = "star" | "yes_no" | "select" | "text" | "textarea";

export type SurveyQuestionOption = {
  value: string;
  label: string;
};

export type SurveyQuestion = {
  id: string;
  category: string;
  label: string;
  type: SurveyQuestionType;
  options?: SurveyQuestionOption[];
  placeholder?: string;
  maxLength?: number;
  recommended?: boolean;
};

export type SurveyTemplate = {
  id: string;
  name: string;
  description: string;
  sourceLabel: string;
  suggestedProfessions: string[];
  questionIds: string[];
};

export type ProviderSurveyConfig = {
  enabledTemplateIds: string[];
  custom: {
    enabled: boolean;
    questionIds: string[];
  };
};

export type ResolvedSurvey = {
  templateId: string;
  name: string;
  description: string;
  sourceLabel: string;
  questionIds: string[];
};

export type SurveyResponses = Record<string, string | number | boolean>;

export const CUSTOM_TEMPLATE_ID = "custom";
export const MAX_CUSTOM_QUESTIONS = 8;
export const DEFAULT_TEMPLATE_ID = "pt_standard";
