/**
 * Morning questions. The UI reads this config.
 * A later sport can supply another list. Pain stays conditional.
 */

export type ReadinessField = "sleep" | "energy" | "recovery" | "soreness" | "trainingReadiness" | "pain";

export type ReadinessQuestion = {
  field: ReadinessField;
  label: string;
  kind: "scale" | "yesno";
  required: boolean;
  higherIs: "better" | "worse" | "none";
};

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  { field: "sleep", label: "How well did you sleep?", kind: "scale", required: true, higherIs: "better" },
  { field: "energy", label: "How is your energy today?", kind: "scale", required: true, higherIs: "better" },
  { field: "recovery", label: "How recovered do you feel?", kind: "scale", required: true, higherIs: "better" },
  { field: "soreness", label: "How sore do you feel?", kind: "scale", required: true, higherIs: "worse" },
  { field: "trainingReadiness", label: "How ready do you feel to train?", kind: "scale", required: true, higherIs: "better" },
  { field: "pain", label: "Any pain or injury concern?", kind: "yesno", required: true, higherIs: "none" },
];

export const PAIN_AREAS = ["Knee", "Ankle", "Hip", "Back", "Shoulder", "Other"] as const;
export const PAIN_COURSES = ["better", "same", "worse"] as const;

export type PainCourse = (typeof PAIN_COURSES)[number];
