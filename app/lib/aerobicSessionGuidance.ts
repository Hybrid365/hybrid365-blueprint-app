/**
 * Duration + effort guidance for bike / easy aerobic sessions (trailer + programme output).
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type { SessionTemplate } from "./sessionLibrary";

export const BIKE_Z2_SUBSTITUTE_NOTE =
  "Bike Z2 can replace or support easy run volume if legs feel heavy — keep it genuinely easy (RPE 2–4/10).";

export const GENERAL_LOW_IMPACT_NOTE =
  "Low-impact aerobic work helps build the engine without stealing recovery from your key runs or strength sessions.";

export function isBikeOrEasyAerobicSession(session: {
  type: string;
  category: string;
  name: string;
}): boolean {
  const blob = `${session.name} ${session.type} ${session.category}`.toLowerCase();
  return (
    session.type === "aerobic_support" ||
    /bike|spin|z2|flush|row|ski|erg/i.test(blob) ||
    (session.category === "aerobic" && session.type !== "threshold_run")
  );
}

export function bikeAerobicDurationGuidance(
  input: BlueprintInput,
  kind: "recovery" | "support" | "z2" | "optional_pm"
): { duration: string; rpe: string; note: string } {
  const advanced = input.ability_level === "advanced";
  const hyrox = Boolean(input.hyrox_track?.active);
  const highLoad =
    input.weekly_hours_band === "7-10" ||
    input.weekly_hours_band === "10+" ||
    input.current_run_volume_band === "50-70km/week" ||
    input.current_run_volume_band === "70km+/week";

  if (kind === "recovery") {
    return {
      duration: advanced ? "20–40 min" : "15–30 min",
      rpe: "RPE 2–3/10",
      note: "Recovery bike — conversational, should improve freshness not add fatigue.",
    };
  }
  if (kind === "optional_pm") {
    return {
      duration: "30–60 min",
      rpe: "RPE 2–4/10",
      note: "Optional support — skip if the AM session was demanding.",
    };
  }
  if (kind === "z2" && (advanced || hyrox) && highLoad) {
    return {
      duration: "45–75 min",
      rpe: "RPE 2–4/10",
      note: "Z2 aerobic bike — nose-breathe, full sentences. Protects legs for quality run sessions.",
    };
  }
  return {
    duration: advanced ? "30–60 min" : "20–45 min",
    rpe: "RPE 2–4/10",
    note: "Easy aerobic flush — conversational effort, should aid recovery between hard days.",
  };
}

export function enrichAerobicSessionNotes(
  session: SessionTemplate,
  input: BlueprintInput,
  extraNotes: string[]
): string[] {
  if (!isBikeOrEasyAerobicSession(session)) return extraNotes;

  const kind =
    session.name.toLowerCase().includes("recovery") || session.intensity === "low"
      ? "recovery"
      : "support";
  const g = bikeAerobicDurationGuidance(input, kind);
  const lines = [
    `${g.duration} easy bike / aerobic (guided duration window).`,
    g.rpe + " — conversational, HR controlled.",
    g.note,
  ];
  if (
    input.hyrox_track?.active &&
    input.ability_level !== "beginner" &&
    !input.has_injury
  ) {
    lines.push(BIKE_Z2_SUBSTITUTE_NOTE);
  } else if (
    !input.hyrox_track?.active &&
    (input.goal_focus === "hybrid" || input.goal_focus === "muscle" || input.has_injury)
  ) {
    lines.push(GENERAL_LOW_IMPACT_NOTE);
  }
  return [...lines, ...extraNotes.filter((n) => !lines.some((l) => l.includes(n.slice(0, 20))))];
}
