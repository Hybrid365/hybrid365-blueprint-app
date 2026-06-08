import { computePaceGuidanceFromFiveKSeconds } from "@/app/lib/paceGuidance";
import { parseTimeToSeconds } from "@/app/lib/mapAssessmentToProgrammeInput";
import type { HyroxFreeWeekMeta } from "@/app/lib/freeWeekChallengeMode";
import type {
  HyroxFreeWeekAbility,
  HyroxFreeWeekInput,
  HyroxStationWeakness,
} from "@/app/lib/freeWeekHyroxTypes";
import type { DayKey, DayPlan, PlanJson } from "@/app/lib/sessionLibrary";

const HYROX_COMMUNITY_URL = "https://plan.hybrid-365.com/hyrox-community";
const HYROX_TEAM_URL = "https://plan.hybrid-365.com/hyrox-team";

type StationFocus = {
  key: HyroxStationWeakness;
  label: string;
  work: string;
  substitute?: string;
};

type Targets = {
  thresholdPace: string | null;
  easyPace: string | null;
  skiSplit: string | null;
  rowSplit: string | null;
  hrNote: string | null;
};

function hasEquipment(input: HyroxFreeWeekInput, ...needles: string[]): boolean {
  const blob = input.equipment.join(" ").toLowerCase();
  return needles.some((n) => blob.includes(n.toLowerCase()));
}

function limitedRecovery(input: HyroxFreeWeekInput): boolean {
  if (input.injuries?.trim() || input.running_niggles?.trim()) return true;
  if (input.sleep_quality != null && input.sleep_quality <= 4) return true;
  if (input.stress_level != null && input.stress_level >= 7) return true;
  if (input.recovery_confidence != null && input.recovery_confidence <= 4) return true;
  return false;
}

function resolveLimiter(input: HyroxFreeWeekInput): string {
  if (input.main_limiter && input.main_limiter !== "not_sure") {
    return input.main_limiter.replace(/_/g, " ");
  }
  if (input.running_limiter && input.running_limiter !== "not_sure") {
    return `running (${input.running_limiter})`;
  }
  if (input.weakest_stations?.length) {
    return `stations (${input.weakest_stations[0]!.replace(/_/g, " ")})`;
  }
  return "HYROX race readiness";
}

function pickStationFocus(input: HyroxFreeWeekInput): StationFocus {
  const w = input.weakest_stations?.[0] ?? input.station_improve_most;
  const hasSled = hasEquipment(input, "sled") || input.sled_access !== false;

  const map: Record<HyroxStationWeakness, StationFocus> = {
    wall_balls: {
      key: "wall_balls",
      label: "Wall balls",
      work: "40–60 wall balls (6–9 kg) or DB thrusters between runs",
      substitute: "DB thrusters or med ball if no wall ball",
    },
    sled_push: {
      key: "sled_push",
      label: "Sled push",
      work: hasSled
        ? "4 × 25–40m sled push @ controlled pace"
        : "Heavy leg press / walking lunges / prowler substitute",
      substitute: "Heavy leg press or walking lunges if no sled",
    },
    sled_pull: {
      key: "sled_pull",
      label: "Sled pull",
      work: hasSled
        ? "4 × 25–40m sled pull @ controlled pace"
        : "Rope pull / heavy row / banded pull substitute",
      substitute: "Heavy row or banded pull if no sled",
    },
    burpee_broad_jump: {
      key: "burpee_broad_jump",
      label: "Burpee broad jump",
      work: "8–12 burpee broad jumps or 40–60s burpee work between runs",
    },
    sandbag_lunges: {
      key: "sandbag_lunges",
      label: "Sandbag lunges",
      work: hasEquipment(input, "sandbag")
        ? "40–60m sandbag lunges"
        : "DB walking lunges or reverse lunges",
      substitute: "DB walking lunges if no sandbag",
    },
    farmers_carry: {
      key: "farmers_carry",
      label: "Farmers carry / grip",
      work: "4 × 40–60m farmers carry or heavy DB holds",
      substitute: "Heavy DB carries or suitcase holds",
    },
    skierg: {
      key: "skierg",
      label: "SkiErg",
      work: hasEquipment(input, "ski")
        ? "3–4 × 3 min SkiErg @ controlled hard"
        : "RowErg or bike substitute @ RPE 7–8",
      substitute: "RowErg or bike if no SkiErg",
    },
    rowerg: {
      key: "rowerg",
      label: "RowErg",
      work: hasEquipment(input, "row")
        ? "4 × 4 min RowErg @ controlled hard"
        : "SkiErg or bike substitute @ RPE 7–8",
      substitute: "SkiErg or bike if no RowErg",
    },
    running_between_stations: {
      key: "running_between_stations",
      label: "Running between stations",
      work: "Compromised run intervals with short station touch between efforts",
    },
  };

  if (w && w in map) return map[w as HyroxStationWeakness];
  return map.wall_balls;
}

function buildTargets(input: HyroxFreeWeekInput): Targets {
  const sec5k = parseTimeToSeconds(input.five_k_time);
  const sec10k = parseTimeToSeconds(input.ten_k_time);
  const pace5k = sec5k ? computePaceGuidanceFromFiveKSeconds(sec5k) : null;

  let thresholdPace: string | null = null;
  if (pace5k) {
    thresholdPace = pace5k.zones.threshold;
  } else if (sec10k) {
    const base = sec10k / 10;
    const fast = base;
    const slow = base + 15;
    const fmt = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.round(s % 60);
      return `${m}:${sec.toString().padStart(2, "0")}`;
    };
    thresholdPace = `${fmt(fast)}–${fmt(slow)}/km`;
  }

  const easyPace = pace5k
    ? pace5k.zones.easy
    : input.easy_run_pace?.trim() || null;

  let skiSplit: string | null = input.ski_threshold_split?.trim() || null;
  const ski1k = parseTimeToSeconds(input.ski_1k_time);
  if (!skiSplit && ski1k) {
    const per500 = (ski1k / 2) * 1.05;
    const m = Math.floor(per500 / 60);
    const s = Math.round(per500 % 60);
    skiSplit = `${m}:${s.toString().padStart(2, "0")}–${m}:${(s + 5).toString().padStart(2, "0")}/500m`;
  }

  let rowSplit: string | null = input.row_threshold_split?.trim() || null;
  const row1k = parseTimeToSeconds(input.row_1k_time);
  if (!rowSplit && row1k) {
    const per500 = (row1k / 2) * 1.05;
    const m = Math.floor(per500 / 60);
    const s = Math.round(per500 % 60);
    rowSplit = `${m}:${s.toString().padStart(2, "0")}–${m}:${(s + 5).toString().padStart(2, "0")}/500m`;
  }

  const hrNote =
    input.uses_hr_monitor && input.threshold_hr
      ? `Threshold HR ~${input.threshold_hr} bpm — RPE/HR overrides pace if drift is too high.`
      : input.max_hr
        ? `Use RPE 7–8; if HR exceeds ~${Math.round(input.max_hr * 0.88)} bpm on threshold work, slow down.`
        : null;

  return { thresholdPace, easyPace, skiSplit, rowSplit, hrNote };
}

function thresholdMainSet(level: HyroxFreeWeekAbility, limited: boolean): string[] {
  if (limited || level === "beginner") {
    return [
      "4 × 4 min controlled threshold",
      "90 sec easy jog/walk recovery between reps",
      "Finish feeling like you could do one more rep — not empty",
    ];
  }
  if (level === "advanced") {
    return [
      "6 × 5 min controlled threshold (or 5 × 6 min if experienced)",
      "60–90 sec easy jog recovery",
      "Even splits — do not blow up rep 1",
    ];
  }
  return [
    "5 × 5 min controlled threshold",
    "75–90 sec easy jog recovery",
    "RPE 7–8 — sustainable, not a time trial",
  ];
}

function compromisedMainSet(
  level: HyroxFreeWeekAbility,
  station: StationFocus,
  limited: boolean
): string[] {
  const stationBlock = station.work;
  if (level === "beginner" || limited) {
    return [
      "500m run @ RPE 7",
      `2 min ${station.label} work: ${stationBlock}`,
      "500m run @ RPE 7–8",
      "Rest 3–4 min, repeat ×1–2 rounds total",
    ];
  }
  if (level === "advanced") {
    return [
      "8 × 3 min @ 5k effort, 60–90 sec easy jog",
      "Rest 4–5 min",
      `750m run + 3 min ${station.label} + 750m run`,
      `Station: ${stationBlock}`,
      "Optional second compromised block if recovery is good",
    ];
  }
  return [
    "6 × 3 min strong run @ RPE 7–8, 75–90 sec easy jog",
    "Rest 4 min",
    `600–750m run + 2–3 min ${station.label} + 600–750m run ×2`,
    `Station: ${stationBlock}`,
  ];
}

function makeSession(args: {
  day: DayKey;
  title: string;
  objective: string;
  durationMin: number;
  rpe: string;
  paceGuide: string;
  warmUp: string[];
  mainSet: string[];
  coolDown: string[];
  coachNote: string;
  record: string[];
  tags: string[];
  key?: boolean;
}): DayPlan {
  return {
    day: args.day,
    title: args.title,
    intent: args.objective,
    time_cap_minutes: args.durationMin,
    tags: args.tags,
    session_stress: args.tags.includes("hyrox_easy")
      ? "low"
      : args.tags.includes("hyrox_threshold") || args.tags.includes("hyrox_compromised")
        ? "high"
        : "moderate",
    priority: args.key
      ? {
          rank: 1,
          label: "priority_1",
          display_label: "Priority 1",
          category_label: "Key Session",
          reason: "Anchor session for your free HYROX week.",
        }
      : undefined,
    session: {
      warm_up: args.warmUp,
      main: args.mainSet,
      cool_down: args.coolDown,
      notes: [
        `Objective: ${args.objective}`,
        `RPE target: ${args.rpe}`,
        args.paceGuide,
        `Coach note: ${args.coachNote}`,
        `What to record: ${args.record.join(" · ")}`,
      ],
    },
  };
}

function weekDaysForCount(days: number): DayKey[] {
  if (days <= 3) return ["Tue", "Thu", "Sat"];
  if (days === 4) return ["Tue", "Thu", "Sat", "Sun"];
  if (days === 5) return ["Mon", "Tue", "Wed", "Thu", "Sat"];
  if (days === 6) return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

function buildSessions(input: HyroxFreeWeekInput): DayPlan[] {
  const level = input.ability_level;
  const limited = limitedRecovery(input);
  const targets = buildTargets(input);
  const station = pickStationFocus(input);
  const days = weekDaysForCount(input.days_per_week);

  const thresholdGuide = targets.thresholdPace
    ? `Pace guide: ${targets.thresholdPace} — stay at RPE 7–8. HR/RPE overrides pace if needed.${targets.hrNote ? ` ${targets.hrNote}` : ""}`
    : `Pace guide: RPE 7–8 · controlled threshold — talk test 3–4 words between reps.${targets.hrNote ? ` ${targets.hrNote}` : ""}`;

  const skiErg = hasEquipment(input, "ski");
  const rowErg = hasEquipment(input, "row");
  const bike = hasEquipment(input, "bike");

  let ergLabel = "SkiErg";
  let ergGuide = targets.skiSplit
    ? `Target: ${targets.skiSplit} or RPE 7–8`
    : "RPE 7–8 · controlled hard but repeatable";
  let ergMain = skiErg
    ? ["5 × 3–4 min SkiErg @ controlled hard", "90 sec easy between", "Record average split"]
    : rowErg
      ? ["4 × 4–5 min RowErg @ controlled hard", "90 sec easy between"]
      : bike
        ? ["4 × 4 min bike @ RPE 7–8", "90 sec easy spin between"]
        : ["30–40 min mixed easy aerobic (walk/bike) @ RPE 2–4"];

  if (!skiErg && rowErg) {
    ergLabel = "RowErg";
    ergGuide = targets.rowSplit
      ? `Target: ${targets.rowSplit} or RPE 7–8`
      : "RPE 7–8 · controlled hard but repeatable";
  }

  const all: Record<DayKey, DayPlan> = {
    Mon: makeSession({
      day: "Mon",
      title: "Upper Strength + Grip Support",
      objective: "Build upper body and grip durability for HYROX stations.",
      durationMin: 50,
      rpe: "6–7",
      paceGuide: "Strength focus — controlled breathing, not max lifts.",
      warmUp: ["5–8 min easy bike or row", "Shoulder + scap activation", "2 × light row/press"],
      mainSet: [
        "10-min EMOM: min 1 pull-ups/lat pulldown · min 2 push-ups/press",
        "3 × 10–12 DB row",
        "3 × 8–10 DB press",
        "3 × 30–45 sec farmers hold",
        limited ? "" : "Optional: 10 min easy Ski/Row @ RPE 2–4",
      ].filter(Boolean),
      coolDown: ["5 min easy + shoulder mobility"],
      coachNote: "Grip and upper durability support sled, carry and station work.",
      record: ["RPE", "carry weight", "how grip felt on final set"],
      tags: ["hyrox_free", "hyrox_strength", "hyrox_upper"],
    }),
    Tue: makeSession({
      day: "Tue",
      title: "Threshold Run",
      objective: "Build sustainable threshold speed for HYROX running.",
      durationMin: limited ? 45 : 55,
      rpe: "7–8",
      paceGuide: thresholdGuide,
      warmUp: [
        "10–15 min easy jog",
        "Dynamic drills (leg swings, A-skips)",
        "3–4 × 20 sec strides @ smooth",
      ],
      mainSet: thresholdMainSet(level, limited),
      coolDown: ["10 min easy jog"],
      coachNote: "Do not race this. Controlled repeatability beats one heroic rep.",
      record: ["average pace", "RPE", "HR if available", "control on final rep"],
      tags: ["hyrox_free", "hyrox_threshold", "hyrox_run"],
      key: true,
    }),
    Wed: makeSession({
      day: "Wed",
      title: `${ergLabel} Aerobic Development`,
      objective: "Build aerobic fitness with low run impact.",
      durationMin: 45,
      rpe: "7–8 on work intervals",
      paceGuide: ergGuide,
      warmUp: ["5–8 min easy", "2 × 1 min build"],
      mainSet: ergMain,
      coolDown: ["5 min easy"],
      coachNote: "Use erg work to build the engine without unnecessary run load.",
      record: ["average split/watts", "RPE", "notes on repeatability"],
      tags: ["hyrox_free", "hyrox_erg", "hyrox_aerobic"],
    }),
    Thu: makeSession({
      day: "Thu",
      title: "HYROX Legs / Strength Endurance",
      objective: "Build leg endurance for sleds, lunges and station fatigue.",
      durationMin: 55,
      rpe: "6–8",
      paceGuide: "Tempo lifting — higher reps, controlled breathing.",
      warmUp: ["5–8 min bike", "Goblet squat + RDL prep", "2 × light lunge"],
      mainSet: [
        "3 × 10–12 tempo squat / leg press / hack squat",
        "3 × 10/leg reverse lunge",
        "3 × 10–12 RDL",
        "3 × 12–15 hamstring curl",
        "3 × 15 calf raise",
        station.key === "wall_balls"
          ? "Finisher: 3 × 15 wall balls or DB thrusters"
          : "Finisher: 3 × 40m walking lunges",
      ],
      coolDown: ["5 min easy + hip mobility"],
      coachNote: "Leg endurance over 1RM strength — this is HYROX durability.",
      record: ["loads", "RPE", "breathing quality on final set"],
      tags: ["hyrox_free", "hyrox_strength", "hyrox_legs"],
      key: true,
    }),
    Fri: makeSession({
      day: "Fri",
      title: "Easy Aerobic + Mobility",
      objective: "Support recovery and aerobic base without adding fatigue.",
      durationMin: 35,
      rpe: "2–4",
      paceGuide: targets.easyPace
        ? `Easy pace: ${targets.easyPace} or conversational RPE 2–4`
        : "Conversational RPE 2–4 · talk-test easy",
      warmUp: ["5 min easy"],
      mainSet: [
        "20–30 min easy bike, SkiErg, Row or jog",
        "10 min mobility (hips, ankles, T-spine)",
      ],
      coolDown: ["Optional light stretch"],
      coachNote: "Keep this truly easy — it supports the hard sessions.",
      record: ["duration", "RPE", "how recovered you feel"],
      tags: ["hyrox_free", "hyrox_easy", "hyrox_recovery"],
    }),
    Sat: makeSession({
      day: "Sat",
      title: `Compromised HYROX — ${station.label} Focus`,
      objective: "Practice running again under station fatigue — core HYROX skill.",
      durationMin: limited ? 40 : 60,
      rpe: "7–8",
      paceGuide:
        "Run segments @ RPE 7–8. Station work controlled — quality over chaos." +
        (station.substitute ? ` Substitute if needed: ${station.substitute}.` : ""),
      warmUp: ["10 min easy jog", "Dynamic prep", "2 × 200m build"],
      mainSet: compromisedMainSet(level, station, limited),
      coolDown: ["10 min very easy jog/walk"],
      coachNote: `Your Saturday compromised session uses ${station.label} because you selected it as a limiter.`,
      record: ["run paces", "station splits", "RPE", "how run felt after station"],
      tags: ["hyrox_free", "hyrox_compromised", "hyrox_key"],
      key: true,
    }),
    Sun: makeSession({
      day: "Sun",
      title: "Long Easy Aerobic / Recovery",
      objective: "Build aerobic base without excessive fatigue.",
      durationMin: 40,
      rpe: "2–4",
      paceGuide: targets.easyPace
        ? `Easy: ${targets.easyPace} or RPE 2–4`
        : "RPE 2–4 · conversational",
      warmUp: ["5 min easy"],
      mainSet: [
        "30–45 min easy run, bike, Ski or Row",
        "Stay conversational throughout",
      ],
      coolDown: ["Light stretch"],
      coachNote: "Optional if fatigued — skip or shorten to 20 min easy.",
      record: ["duration", "average HR/RPE"],
      tags: ["hyrox_free", "hyrox_easy", "hyrox_optional"],
    }),
  };

  return days.map((d) => all[d]).filter(Boolean);
}

function raceCountdownDays(raceDate: string | undefined): number | null {
  if (!raceDate?.trim()) return null;
  const t = Date.parse(raceDate);
  if (Number.isNaN(t)) return null;
  const days = Math.ceil((t - Date.now()) / 86400000);
  return days > 0 ? days : null;
}

function buildPersonalisationLines(
  input: HyroxFreeWeekInput,
  targets: Targets,
  station: StationFocus,
  limited: boolean
): string[] {
  const lines: string[] = [];
  const limiter = resolveLimiter(input);

  lines.push(
    `This week has been built around your current running level, available equipment, weekly training time and selected HYROX limiter: ${limiter}.`
  );

  if (targets.thresholdPace) {
    lines.push("Your threshold run target is based on your submitted 5k/10k data.");
  }
  if (targets.skiSplit || targets.rowSplit) {
    lines.push(
      "Your erg target uses your submitted Ski/Row benchmark. If the split feels too hard, cap it at RPE 7–8."
    );
  }
  lines.push(
    `Your Saturday compromised session uses ${station.label} because you selected it as a limiter.`
  );

  if (station.substitute && !hasEquipment(input, station.key.split("_")[0] ?? "")) {
    lines.push(`Because you do not have access to ideal equipment, we've substituted ${station.substitute}.`);
  }
  if (limited) {
    lines.push(
      "Because you reported limited recovery, we've kept hard sessions controlled and used low-impact aerobic work."
    );
  }

  lines.push(
    "This is a free Week 1 sample — no manual coach review. Full HYROX progression lives in the paid Hybrid365 HYROX Track."
  );

  return lines;
}

export function generateHyroxFreeWeekPlan(input: HyroxFreeWeekInput): PlanJson {
  const limited = limitedRecovery(input);
  const targets = buildTargets(input);
  const station = pickStationFocus(input);
  const limiter = resolveLimiter(input);
  const schedule = buildSessions(input);
  const personalisation = buildPersonalisationLines(input, targets, station, limited);

  const sec5k = parseTimeToSeconds(input.five_k_time);
  const paceGuidance = sec5k ? computePaceGuidanceFromFiveKSeconds(sec5k) : undefined;

  const hyroxMeta: HyroxFreeWeekMeta = {
    limiter,
    station_focus: station.label,
    station_weaknesses: (input.weakest_stations ?? []).map((s) => s.replace(/_/g, " ")),
    race_date: input.race_date?.trim() || null,
    race_countdown_days: raceCountdownDays(input.race_date),
    race_category: input.race_category?.trim() || null,
    race_target_time: input.race_target_time?.trim() || null,
    threshold_pace: targets.thresholdPace,
    easy_pace: targets.easyPace,
    ski_target: targets.skiSplit,
    row_target: targets.rowSplit,
    personalisation_lines: personalisation,
    methodology_notes: [
      "Controlled threshold running",
      "Aerobic / erg development",
      "HYROX leg strength endurance",
      "Station weakness exposure",
      "Compromised running",
      "Hard/easy rhythm where possible",
    ],
    upgrade_cta: {
      community_url: HYROX_COMMUNITY_URL,
      hyrox_team_url: HYROX_TEAM_URL,
    },
  };

  const hardCount = schedule.filter((s) =>
    (s.tags ?? []).some((t) => t.includes("threshold") || t.includes("compromised"))
  ).length;

  const plan: PlanJson = {
    challenge_mode: "hyrox",
    hyrox: hyroxMeta,
    intensity_split: {
      easy_percent: limited ? 55 : 45,
      hard_percent: Math.min(35, hardCount * 12),
    },
    profile: {
      goal: "HYROX",
      training_days: String(input.days_per_week),
      priority: "HYROX Week 1 Sample",
      level: input.ability_level,
      weekly_hours: input.weekly_hours_band,
      equipment: input.equipment.join(", "),
      ...(paceGuidance ? { pace_guidance: paceGuidance } : {}),
    },
    intro: personalisation,
    schedule,
    cta: {
      headline: "Want the full 12-week HYROX progression?",
      body: "Join the Hybrid365 HYROX Track for structured programming, dashboard access, check-ins and community accountability — or apply for HYROX Team 1-1 coaching.",
      button_url: HYROX_COMMUNITY_URL,
    },
  };

  return plan;
}
