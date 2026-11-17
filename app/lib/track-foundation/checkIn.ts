/**
 * Periodic check-in. Daily readiness does not replace this.
 * Structured options only — the athlete is not asked for an essay.
 */

export type CheckInOption = { value: string; label: string };

export type WeeklyCheckInField = {
  id: string;
  prompt: string;
  options: CheckInOption[];
};

export const WEEKLY_CHECK_IN_FIELDS: WeeklyCheckInField[] = [
  {
    id: "recovery",
    prompt: "How has recovery felt this week?",
    options: [
      { value: "better", label: "Better than usual" },
      { value: "same", label: "About the same" },
      { value: "worse", label: "Worse than usual" },
    ],
  },
  {
    id: "motivation",
    prompt: "Motivation",
    options: [
      { value: "high", label: "High" },
      { value: "steady", label: "Steady" },
      { value: "low", label: "Low" },
    ],
  },
  {
    id: "life_stress",
    prompt: "Life stress",
    options: [
      { value: "low", label: "Low" },
      { value: "manageable", label: "Manageable" },
      { value: "high", label: "High" },
    ],
  },
  {
    id: "availability",
    prompt: "Availability next week",
    options: [
      { value: "same", label: "Same days" },
      { value: "fewer", label: "Fewer days" },
      { value: "more", label: "More days" },
    ],
  },
  {
    id: "travel",
    prompt: "Travel",
    options: [
      { value: "none", label: "None" },
      { value: "short", label: "A few days away" },
      { value: "disrupts", label: "Will disrupt training" },
    ],
  },
  {
    id: "event",
    prompt: "Event",
    options: [
      { value: "unchanged", label: "Unchanged" },
      { value: "date_moved", label: "Date moved" },
      { value: "new_event", label: "New event" },
    ],
  },
  {
    id: "soreness",
    prompt: "Soreness or pain",
    options: [
      { value: "none", label: "None" },
      { value: "settling", label: "Settling" },
      { value: "persistent", label: "Still there" },
    ],
  },
];

export type WeeklyCheckInResponse = {
  athleteId: string;
  weekOf: string;
  answers: Partial<Record<WeeklyCheckInField["id"], string>>;
};
