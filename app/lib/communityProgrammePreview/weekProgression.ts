import type { BlockPhase, PreviewAbilityLevel } from "./types";

export type WeekPrescription = {
  mainSet: string;
  thresholdMinutes: number;
  progressionNote: string;
  progressionMarker: string;
  extraRoundRule: string | null;
};

export function thresholdRunPrescription(
  week: number,
  level: PreviewAbilityLevel,
  phase: BlockPhase
): WeekPrescription {
  const w4Deload = phase === "test_retest" || week === 4;

  if (w4Deload) {
    return {
      mainSet:
        phase === "test_retest"
          ? "Controlled benchmark: 3 × 5 min threshold · 2 min easy jog · note avg pace/RPE"
          : "Deload threshold: 3 × 5 min @ controlled effort · 2 min easy jog",
      thresholdMinutes: 15,
      progressionNote: "W4 deload / controlled benchmark — reduced volume, maintain quality",
      progressionMarker: "threshold_w4_deload",
      extraRoundRule: null,
    };
  }

  const sets: Record<number, string> = {
    1: "5 × 5 min @ threshold · 90s easy jog",
    2: "6 × 5 min @ threshold · 90s easy jog",
    3:
      level === "advanced"
        ? "6 × 6 min @ threshold · 90s easy jog"
        : "5 × 6 min @ threshold · 90s easy jog",
  };

  const mins: Record<number, number> = { 1: 25, 2: 30, 3: level === "advanced" ? 36 : 30 };

  return {
    mainSet: sets[week] ?? sets[1]!,
    thresholdMinutes: mins[week] ?? 25,
    progressionNote:
      week === 1
        ? "W1 baseline threshold exposure"
        : week === 2
          ? "W2 build threshold duration"
          : "W3 peak threshold week",
    progressionMarker: `threshold_w${week}`,
    extraRoundRule: null,
  };
}

export function ergThresholdPrescription(
  week: number,
  level: PreviewAbilityLevel,
  phase: BlockPhase
): WeekPrescription {
  if (week === 4 || phase === "test_retest") {
    return {
      mainSet:
        phase === "test_retest"
          ? "Controlled retest: 4 × 4 min mixed Ski/Row @ steady threshold · 2 min easy"
          : "Easy aerobic flow: 20 min bike + 15 min row + 15 min ski @ Z2",
      thresholdMinutes: week === 4 ? 0 : 16,
      progressionNote: "W4 reduced threshold / Z2 flow or controlled erg retest",
      progressionMarker: "erg_w4_deload",
      extraRoundRule: null,
    };
  }

  const sets: Record<number, string> = {
    1: "5–6 × 3–4 min Ski or Row @ threshold · 2 min easy",
    2: "6–8 × 4 min Ski or Row @ threshold · 90s easy",
    3:
      level === "advanced"
        ? "8 × 4 min or 5 × 5 min mixed erg @ threshold · 90s easy"
        : "8 × 4 min mixed erg @ threshold · 90s easy",
  };

  const mins: Record<number, number> = { 1: 18, 2: 28, 3: 32 };

  return {
    mainSet: sets[week] ?? sets[1]!,
    thresholdMinutes: mins[week] ?? 18,
    progressionNote:
      week === 1 ? "W1 erg threshold intro" : week === 2 ? "W2 build erg density" : "W3 peak erg week",
    progressionMarker: `erg_threshold_w${week}`,
    extraRoundRule: null,
  };
}

export function ergEasyFlowPrescription(week: number): WeekPrescription {
  const duration = week <= 2 ? 45 : week === 3 ? 55 : 40;
  return {
    mainSet:
      week === 4
        ? "30 min easy bike + 15 min easy row @ Z2 — flush volume"
        : "20 min bike + 15 min row + 15 min ski @ Z2 mixed aerobic flow",
    thresholdMinutes: 0,
    progressionNote:
      week === 4 ? "W4 reduced aerobic — recovery emphasis" : `W${week} aerobic base / engine support`,
    progressionMarker: `aerobic_flow_w${week}`,
    extraRoundRule: null,
  };
}

export function compromisedPrescription(
  week: number,
  level: PreviewAbilityLevel,
  phase: BlockPhase,
  scale: number
): WeekPrescription {
  const rounds =
    week === 1
      ? level === "beginner"
        ? 2
        : 2
      : week === 2
        ? level === "beginner"
          ? 2
          : 3
        : week === 3
          ? level === "beginner"
            ? 3
            : level === "intermediate"
              ? 3
              : 4
          : level === "beginner"
            ? 2
            : 3;

  const adjustedRounds = Math.max(1, Math.round(rounds * scale));

  if (week === 4) {
    return {
      mainSet: `Controlled mini benchmark: ${Math.max(2, adjustedRounds - 1)} rounds · 800m run + 2 stations · note splits`,
      thresholdMinutes: 0,
      progressionNote: "W4 compromised review — reduced volume, quality focus",
      progressionMarker: "compromised_w4_benchmark",
      extraRoundRule:
        level === "beginner"
          ? "Beginner: no extra round in benchmark week unless RPE ≤6 and form is perfect."
          : level === "intermediate"
            ? "If RPE is under 7/10 and form is still strong, add 1 extra round."
            : "If RPE is under 7/10 and form is still strong, add 1–2 rounds or reduce rest 15s.",
    };
  }

  const rest = week === 1 ? "2 min" : week === 2 ? "90s" : "75s";
  const intro =
    phase === "base" && week <= 2
      ? "Intro run/station exposure — "
      : week === 3
        ? "Peak compromised load — "
        : "Build compromised density — ";

  let extraRule: string | null = null;
  const baseExtra =
    "If RPE is below 7/10 and movement quality is still strong, add one extra round.";
  if (level === "beginner") {
    extraRule = `Beginner: usually no extra rounds; only add if very controlled and RPE ≤6. ${baseExtra} Never add if running mechanics break down, station form deteriorates, grip/wall ball quality collapses, or the session becomes sloppy survival work.`;
  } else if (level === "intermediate") {
    extraRule = `${baseExtra} Optional +1 round. Never add if running mechanics break down, station form deteriorates, or grip/wall ball quality collapses.`;
  } else {
    extraRule = `${baseExtra} Optional +1–2 rounds or reduced rest. Never add if running mechanics break down, station form deteriorates, grip/wall ball quality collapses, or the session becomes sloppy survival work.`;
  }

  return {
    mainSet: `${intro}${adjustedRounds} rounds: 1 km run + sled push + wall balls · ${rest} between rounds`,
    thresholdMinutes: 0,
    progressionNote:
      week === 1
        ? "W1 intro compromised exposure"
        : week === 2
          ? "W2 add round or reduce rest"
          : "W3 peak compromised load",
    progressionMarker: `compromised_w${week}`,
    extraRoundRule: extraRule,
  };
}

export function legsPrescription(
  week: number,
  level: PreviewAbilityLevel,
  phase: BlockPhase
): WeekPrescription {
  if (week === 4) {
    return {
      mainSet: "Deload: 3 × 12 sled push (light) · 3 × 12 walking lunges · technique focus",
      thresholdMinutes: 0,
      progressionNote: "W4 lighter legs — technique and deload",
      progressionMarker: "legs_w4_deload",
      extraRoundRule: null,
    };
  }

  const density =
    week === 1
      ? "3 × 10 sled push · 3 × 12 lunges · 3 × 15 wall balls"
      : week === 2
        ? "4 × 10 sled push · 4 × 12 lunges · 4 × 15 wall balls"
        : level === "advanced"
          ? "4 × 12 sled push · 4 × 15 lunges · 5 × 15 wall balls · 90s rest"
          : "4 × 10 sled push · 4 × 12 lunges · 4 × 15 wall balls · 90s rest";

  return {
    mainSet: density,
    thresholdMinutes: 0,
    progressionNote:
      week === 1
        ? "W1 controlled legs baseline"
        : week === 2
          ? "W2 add reps/load/density"
          : "W3 peak leg density",
    progressionMarker: `legs_w${week}`,
    extraRoundRule: null,
  };
}

export function upperGripPrescription(week: number): WeekPrescription {
  return {
    mainSet:
      week === 4
        ? "3 × 10 pull · 3 × 12 press · 2 × 40m farmers carry (moderate) — deload"
        : "4 × 8–10 pull · 4 × 8–10 press · 3 × 40m farmers carry · grip finisher",
    thresholdMinutes: 0,
    progressionNote: week === 4 ? "W4 upper deload" : `W${week} upper + grip durability`,
    progressionMarker: `upper_w${week}`,
    extraRoundRule: null,
  };
}

export function longEasyPrescription(week: number): WeekPrescription {
  const mins = week === 3 ? 70 : week === 4 ? 50 : 60;
  return {
    mainSet: `${mins} min easy run or mixed Z2 (run/bike) — conversational`,
    thresholdMinutes: 0,
    progressionNote: week === 4 ? "W4 reduced long aerobic" : `W${week} long easy aerobic volume`,
    progressionMarker: `long_easy_w${week}`,
    extraRoundRule: null,
  };
}

export function tempoSupportPrescription(
  week: number,
  level: PreviewAbilityLevel
): WeekPrescription {
  const w =
    level === "beginner"
      ? "20–30 min easy-steady run"
      : level === "intermediate"
        ? "30–40 min steady aerobic / tempo feel"
        : "35–50 min controlled tempo / steady progression";

  return {
    mainSet: `${w} · conversational to short phrases · not racing · finish controlled`,
    thresholdMinutes: 0,
    progressionNote:
      week === 4
        ? "W4 reduced tempo support — easier than Tuesday threshold"
        : `W${week} tempo-style support run — easier than threshold`,
    progressionMarker: "tempo_support_run",
    extraRoundRule: null,
  };
}

export function bikeWallBallPrescription(
  week: number,
  level: PreviewAbilityLevel,
  phase: BlockPhase
): WeekPrescription {
  if (week === 4 || phase === "test_retest") {
    return {
      mainSet: "Deload: 3–4 rounds · 3 min bike @ moderate · 20 wall balls · 90s rest",
      thresholdMinutes: 9,
      progressionNote: "W4 controlled bike + wall ball — reduced load",
      progressionMarker: "bike_wall_ball_w4_deload",
      extraRoundRule: null,
    };
  }

  const rounds =
    week === 1 ? "4 rounds, 90 sec rest" : week === 2 ? "5 rounds, 90 sec rest" : "5–6 rounds, 75–60 sec rest";

  return {
    mainSet: `3 min Assault Bike @ threshold / strong sustainable · straight into 25 wall balls · rest · repeat × ${rounds}`,
    thresholdMinutes: week === 1 ? 12 : week === 2 ? 15 : 18,
    progressionNote:
      week === 1
        ? "W1 intro bike + wall ball durability"
        : week === 2
          ? "W2 build rounds / reduce rest"
          : "W3 peak bike + wall ball density",
    progressionMarker: `bike_wall_ball_w${week}`,
    extraRoundRule: null,
  };
}
