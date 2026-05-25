import {
  CUSTOM_TEMPLATE_ID,
  DEFAULT_TEMPLATE_ID,
  type SurveyTemplate,
} from "@/lib/surveys/types";

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: "Physical therapy review",
    description:
      "Overall rating plus rehab, communication, and professionalism—ideal for PT and rehab providers.",
    sourceLabel: "Physical therapy review",
    suggestedProfessions: [
      "Physical Therapist",
      "Physical Therapy",
      "Occupational Therapist",
      "Rehab",
    ],
    questionIds: [
      "rehab_experience",
      "communication",
      "professionalism",
      "felt_listened",
      "body_region",
      "condition_summary",
      "written_feedback",
    ],
  },
  {
    id: "nursing",
    name: "Nursing care review",
    description:
      "Safety, communication, compassion, and coordination for nurses and clinical nursing staff.",
    sourceLabel: "Nursing care review",
    suggestedProfessions: ["Nurse", "Nursing", "RN", "LPN", "NP"],
    questionIds: [
      "nursing_safety",
      "nursing_communication",
      "nursing_compassion",
      "nursing_coordination",
      "care_setting",
      "written_feedback",
    ],
  },
  {
    id: "physician",
    name: "Physician review",
    description:
      "Diagnosis clarity, treatment planning, follow-up access, and specialty fit for MD/DO providers.",
    sourceLabel: "Physician review",
    suggestedProfessions: ["Physician", "Doctor", "MD", "DO", "Medical"],
    questionIds: [
      "diagnosis_clarity",
      "treatment_plan",
      "felt_heard_despite_wait",
      "follow_up_access",
      "specialty_relevance",
      "written_feedback",
    ],
  },
  {
    id: "trainer",
    name: "Personal training review",
    description:
      "Goals, instruction, motivation, progress tracking, and safety for trainers and coaches.",
    sourceLabel: "Personal training review",
    suggestedProfessions: [
      "Personal Trainer",
      "Trainer",
      "Strength Coach",
      "Fitness Coach",
      "Coach",
    ],
    questionIds: [
      "goal_alignment",
      "instruction_clarity",
      "motivation_support",
      "progress_tracking",
      "safety_awareness",
      "training_context",
      "written_feedback",
    ],
  },
];

const templateById = new Map(SURVEY_TEMPLATES.map((t) => [t.id, t]));

export function getTemplateById(id: string): SurveyTemplate | undefined {
  if (id === CUSTOM_TEMPLATE_ID) return undefined;
  return templateById.get(id);
}

export function getPremadeTemplateIds(): string[] {
  return SURVEY_TEMPLATES.map((t) => t.id);
}

export function isPremadeTemplateId(id: string): boolean {
  return templateById.has(id);
}
