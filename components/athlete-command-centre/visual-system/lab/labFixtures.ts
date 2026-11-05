/**
 * LAB / FIXTURE data for the v0 visual-system gallery only.
 *
 * NEVER import this module from production resolvers, Home D, programme APIs,
 * or coach tooling. See visual-system/README.md.
 */

import type { StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";
import { buildWorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import type { WeekDateNavDay } from "../navigation/WeekDateNav";
import type { AthleteSessionCardViewModel } from "../sessions/sessionCardTypes";
import type { SessionStatusKey } from "../tokens";

export const LAB_FIXTURE_MARK = "LAB / FIXTURE" as const;

/** Threshold-style repeat — high-confidence Batch 0 path. */
export const LAB_REPEAT_WORKOUT: StructuredWorkout = {
  warmup: ["10 min easy jog", "Drills"],
  blocks: [
    {
      type: "repeat",
      reps: 5,
      work: { kind: "time", value: 300, unit: "sec" },
      recoveries: [{ durationSeconds: 90, type: "jog", note: "Easy jog between reps" }],
    },
  ],
  cooldown: ["10 min easy"],
  guidance: ["Hold threshold — do not chase the first rep."],
};

/** Steady continuous block. */
export const LAB_CONTINUOUS_WORKOUT: StructuredWorkout = {
  warmup: ["8 min easy"],
  blocks: [
    {
      type: "continuous",
      work: { kind: "time", value: 2400, unit: "sec" },
    },
  ],
  cooldown: ["5 min walk"],
  guidance: [],
};

/** Distance work without inventing pace — duration null → equal-width fallback. */
export const LAB_DISTANCE_REPEAT_WORKOUT: StructuredWorkout = {
  warmup: [],
  blocks: [
    {
      type: "repeat",
      reps: 4,
      work: { kind: "distance", value: 1000, unit: "m" },
      recoveries: [{ durationSeconds: 120, type: "walk" }],
    },
  ],
  cooldown: [],
  guidance: [],
};

/** Explicit unsupported path — must not fabricate segments. */
export const LAB_STATION_ROUND_WORKOUT: StructuredWorkout = {
  warmup: ["5 min easy"],
  blocks: [
    {
      type: "station_round",
      rounds: 4,
      run: { kind: "distance", value: 1000, unit: "m" },
      station: { name: "Sled push" },
    },
  ],
  cooldown: [],
  guidance: [],
};

export const LAB_MIXED_UNSUPPORTED_WORKOUT: StructuredWorkout = {
  warmup: [],
  blocks: [
    {
      type: "repeat",
      reps: 3,
      work: { kind: "time", value: 180, unit: "sec" },
      recoveries: [{ durationSeconds: 60, type: "walk" }],
    },
    {
      type: "strength",
      exercises: [{ name: "Back squat", sets: 3, reps: 5 }],
    },
  ],
  cooldown: [],
  guidance: [],
};

export function labRepeatTimeline() {
  return buildWorkoutTimelineViewModel(LAB_REPEAT_WORKOUT, {
    workTarget: { pace: "3:55 /km" },
    cuesBySegmentId: {
      "b0-w1": "Settle into rhythm — first rep is a feeler.",
      "b0-w2": "Same effort as R01. Do not push.",
      "b0-r1": "Easy jog. Shake the arms.",
    },
  });
}

export function labContinuousTimeline() {
  return buildWorkoutTimelineViewModel(LAB_CONTINUOUS_WORKOUT, {
    workTarget: { pace: "4:20 /km" },
  });
}

export function labWeekDays(): WeekDateNavDay[] {
  const statuses: SessionStatusKey[][] = [
    ["completed", "completed"],
    ["completed"],
    ["partial"],
    [],
    ["upcoming"],
    ["upcoming", "upcoming"],
    ["unresolved"],
  ];
  const dows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return dows.map((dow, i) => ({
    id: `lab-day-${i}`,
    dow,
    dateNumber: 3 + i,
    isToday: i === 4,
    sessionStatuses: statuses[i],
  }));
}

export function labPrimarySession(): AthleteSessionCardViewModel {
  const timeline = labRepeatTimeline();
  return {
    id: "lab-primary-threshold",
    title: "Threshold 5s",
    categoryLabel: "Run",
    focusLabel: "Threshold",
    status: "upcoming",
    prescriptionLine: "5 × 5:00 @ 3:55 /km · 1:30 jog",
    objective: "Accumulate quality threshold work without chasing the first rep.",
    primaryTarget: "3:55 /km",
    durationLabel: "~45 min",
    coachNote:
      "Treat the first rep as a feeler. Match effort on the rest — do not race the clock.",
    timeline,
  };
}

export function labSecondarySession(): AthleteSessionCardViewModel {
  return {
    id: "lab-secondary-strength",
    title: "Lower strength",
    categoryLabel: "Strength",
    focusLabel: "Posterior",
    status: "upcoming",
    prescriptionLine: "Squat · hinge · carry",
    objective: "Keep loads conservative — quality over load.",
    primaryTarget: null,
    durationLabel: "40 min",
    coachNote: null,
    timeline: null,
  };
}

export function labSecondaryCompleted(): AthleteSessionCardViewModel {
  return {
    id: "lab-secondary-easy",
    title: "Easy aerobic",
    categoryLabel: "Run",
    focusLabel: "Aerobic",
    status: "completed",
    prescriptionLine: "40 min easy",
    objective: null,
    primaryTarget: "Conversational",
    durationLabel: "40 min",
    coachNote: null,
    timeline: labContinuousTimeline(),
  };
}
