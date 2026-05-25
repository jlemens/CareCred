import type { SurveyQuestion } from "@/lib/surveys/types";

export const BODY_REGION_OPTIONS = [
  "Neck",
  "Shoulder",
  "Elbow",
  "Wrist/Hand",
  "Upper Back",
  "Lower Back",
  "Hip",
  "Knee",
  "Ankle/Foot",
  "Pelvic Floor",
  "Other",
] as const;

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "rehab_experience",
    category: "Physical therapy",
    label: "How was your rehab experience?",
    type: "star",
  },
  {
    id: "communication",
    category: "Communication",
    label: "Rate provider's communication during your care",
    type: "star",
  },
  {
    id: "professionalism",
    category: "Communication",
    label: "Rate provider's professionalism during your care",
    type: "star",
  },
  {
    id: "felt_listened",
    category: "Communication",
    label: "Did you feel listened to?",
    type: "yes_no",
  },
  {
    id: "body_region",
    category: "Physical therapy",
    label: "Body region treated",
    type: "select",
    options: BODY_REGION_OPTIONS.map((value) => ({ value, label: value })),
  },
  {
    id: "condition_summary",
    category: "Physical therapy",
    label: "Condition or issue recovered/improved from",
    type: "text",
    maxLength: 240,
  },
  {
    id: "nursing_safety",
    category: "Nursing",
    label: "I felt safe and well monitored",
    type: "yes_no",
  },
  {
    id: "nursing_communication",
    category: "Nursing",
    label: "Clarity of explanations",
    type: "star",
  },
  {
    id: "nursing_compassion",
    category: "Nursing",
    label: "Bedside manner and compassion",
    type: "star",
  },
  {
    id: "nursing_coordination",
    category: "Nursing",
    label: "Care coordination and handoffs",
    type: "star",
  },
  {
    id: "care_setting",
    category: "Nursing",
    label: "Care setting",
    type: "select",
    options: [
      { value: "inpatient", label: "Inpatient" },
      { value: "outpatient", label: "Outpatient" },
      { value: "home_health", label: "Home health" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "diagnosis_clarity",
    category: "Physician",
    label: "Diagnosis clarity",
    type: "star",
  },
  {
    id: "treatment_plan",
    category: "Physician",
    label: "Treatment plan explained clearly",
    type: "star",
  },
  {
    id: "felt_heard_despite_wait",
    category: "Physician",
    label: "Despite wait time, I felt heard",
    type: "yes_no",
  },
  {
    id: "follow_up_access",
    category: "Physician",
    label: "Follow-up access and availability",
    type: "star",
  },
  {
    id: "specialty_relevance",
    category: "Physician",
    label: "Specialty relevance to your needs",
    type: "text",
    maxLength: 240,
  },
  {
    id: "goal_alignment",
    category: "Training",
    label: "Program matched your goals",
    type: "star",
  },
  {
    id: "instruction_clarity",
    category: "Training",
    label: "Instruction clarity (form cues, programming)",
    type: "star",
  },
  {
    id: "motivation_support",
    category: "Training",
    label: "Motivation and support",
    type: "star",
  },
  {
    id: "progress_tracking",
    category: "Training",
    label: "Progress tracking",
    type: "star",
  },
  {
    id: "safety_awareness",
    category: "Training",
    label: "Safety and injury awareness",
    type: "star",
  },
  {
    id: "training_context",
    category: "Training",
    label: "Training context",
    type: "select",
    options: [
      { value: "one_on_one", label: "1:1 training" },
      { value: "small_group", label: "Small group" },
      { value: "online", label: "Online / remote" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "written_feedback",
    category: "Written feedback",
    label: "Written feedback for others reading this profile",
    type: "textarea",
    maxLength: 2000,
    recommended: true,
  },
];

const questionById = new Map(SURVEY_QUESTIONS.map((q) => [q.id, q]));

export function getQuestionById(id: string): SurveyQuestion | undefined {
  return questionById.get(id);
}

export function getQuestionsByIds(ids: string[]): SurveyQuestion[] {
  return ids
    .map((id) => questionById.get(id))
    .filter((q): q is SurveyQuestion => Boolean(q));
}

export function questionBankByCategory(): Map<string, SurveyQuestion[]> {
  const map = new Map<string, SurveyQuestion[]>();
  for (const q of SURVEY_QUESTIONS) {
    const list = map.get(q.category) ?? [];
    list.push(q);
    map.set(q.category, list);
  }
  return map;
}
