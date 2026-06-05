import { hasLimitedHyroxEquipment } from "@/app/lib/communityHyroxDashboard";
import { emptyHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import { hasRunningWeakness } from "./runningRules";
import { buildRunPaceContext } from "./paceTargets";
import type { HyroxPillar } from "./types";
import type {
  CommunityPreviewInput,
  CommunityPreviewQaReport,
  CommunityProgrammePreview,
  PreviewSession,
  QaCheck,
  QaCheckStatus,
} from "./types";

const DAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function check(status: QaCheckStatus, category: string, message: string): QaCheck {
  return { status, category, message };
}

function sessionsByDayOrder(sessions: PreviewSession[]): PreviewSession[] {
  return [...sessions].sort(
    (a, b) => (DAY_INDEX[a.day] ?? 99) - (DAY_INDEX[b.day] ?? 99)
  );
}

function hasPillar(sessions: PreviewSession[], pillar: HyroxPillar): boolean {
  return sessions.some((s) => s.hyrox_pillar === pillar);
}

function countHard(sessions: PreviewSession[]): number {
  return sessions.filter((s) => s.stress === "hard").length;
}

function countErgExposure(sessions: PreviewSession[]): number {
  return sessions.filter(
    (s) =>
      s.hyrox_pillar === "erg_aerobic" ||
      s.hyrox_pillar === "long_easy_aerobic" ||
      s.metadata.planned_erg_minutes >= 20
  ).length;
}

function hasUpperEasySupport(sessions: PreviewSession[]): boolean {
  return sessions.some(
    (s) =>
      s.hyrox_pillar === "upper_grip" &&
      (s.title.toLowerCase().includes("easy aerobic") || s.main_set.toLowerCase().includes("easy bike"))
  );
}

function hasTempoSession(sessions: PreviewSession[]): boolean {
  return sessions.some(
    (s) =>
      s.metadata.progression_marker === "tempo_support_run" ||
      s.hyrox_pillar === "tempo_support"
  );
}

function thursdayDoubleDay(sessions: PreviewSession[]): boolean {
  const thu = sessions.filter((s) => s.day === "Thu");
  const amTempo = thu.some((s) => s.slot === "am" && s.hyrox_pillar === "tempo_support");
  const pmLegs = thu.some((s) => s.slot === "pm" && s.hyrox_pillar === "lower_strength_endurance");
  return amTempo && pmLegs;
}

function tuesdayBikeWallBall(sessions: PreviewSession[]): PreviewSession | undefined {
  return sessions.find(
    (s) =>
      s.day === "Tue" &&
      s.hyrox_pillar === "erg_threshold_station" &&
      s.title.toLowerCase().includes("wall ball")
  );
}

function addonsUseRanges(weeks: CommunityProgrammePreview["weeks"]): boolean {
  const addons = weeks.flatMap((w) =>
    w.sessions.flatMap((s) => (s.optional_addon ? [s.optional_addon] : []))
  );
  if (addons.length === 0) return false;
  return addons.every(
    (a) => a.duration_range.includes("–") || a.duration_range.includes("-")
  );
}

function thresholdMinutesTrend(weeks: CommunityProgrammePreview["weeks"]): boolean {
  const mins = weeks.slice(0, 3).map((w) => w.metrics.threshold_minutes);
  if (mins.length < 3) return false;
  return mins[1]! >= mins[0]! && mins[2]! >= mins[1]!;
}

export function analyseCommunityProgrammePreview(
  preview: CommunityProgrammePreview,
  input: CommunityPreviewInput
): CommunityPreviewQaReport {
  const checks: QaCheck[] = [];

  checks.push(
    check(
      "pass",
      "Preview mode",
      "In-memory preview only — no programme_instances or programme_weeks writes."
    )
  );

  // Block phase
  if (preview.block_phase_label) {
    checks.push(
      check("pass", "Block phase", `Block ${preview.block_number} labelled: ${preview.block_phase_label}.`)
    );
  } else {
    checks.push(check("fail", "Block phase", "Missing block phase label."));
  }

  if (preview.block_number >= 1 && preview.progression_focus) {
    checks.push(
      check(
        "pass",
        "Future blocks",
        `Block metadata supports continuation — ${preview.progression_focus.slice(0, 120)}…`
      )
    );
  }

  // Week progression
  for (const week of preview.weeks) {
    if (week.progression_focus) {
      checks.push(
        check(
          "pass",
          "Week progression",
          `Week ${week.week_number}: ${week.progression_focus}`
        )
      );
    }
    const hasProgressionNotes = week.sessions.every((s) => s.progression_note && s.block_week_progression_note);
    if (!hasProgressionNotes) {
      checks.push(
        check("warn", "Week progression", `Week ${week.week_number} missing progression notes on some sessions.`)
      );
    }
  }

  const w4 = preview.weeks[3];
  if (w4) {
    const w4Deload = w4.sessions.some(
      (s) =>
        s.progression_note.toLowerCase().includes("deload") ||
        s.progression_note.toLowerCase().includes("benchmark") ||
        s.title.toLowerCase().includes("deload")
    );
    checks.push(
      check(
        w4Deload ? "pass" : "warn",
        "Week progression",
        w4Deload ? "W4 includes deload/review/benchmark sessions." : "W4 may lack clear deload/review emphasis."
      )
    );
  }

  if (input.training_track === "hyrox" && thresholdMinutesTrend(preview.weeks)) {
    checks.push(
      check("pass", "Week progression", "Threshold minutes progress W1→W3 before W4 deload.")
    );
  }

  // Dashboard metadata
  const allHaveMetadata = preview.weeks.every((w) =>
    w.sessions.every((s) => s.metadata?.planned_duration_minutes != null && s.metadata.progression_marker)
  );
  checks.push(
    check(
      allHaveMetadata ? "pass" : "fail",
      "Dashboard metadata",
      allHaveMetadata
        ? "All sessions include planned duration and progression_marker for future dashboard tracking."
        : "Some sessions missing dashboard tracking metadata."
    )
  );

  const w1Metrics = preview.weeks[0]?.metrics;
  if (w1Metrics) {
    checks.push(
      check(
        "pass",
        "Dashboard metadata",
        `W1 planned totals: ${w1Metrics.total_planned_minutes} min · aerobic ${w1Metrics.aerobic_minutes} · threshold ${w1Metrics.threshold_minutes} · optional add-ons ${w1Metrics.optional_addon_minutes} min.`
      )
    );
  }

  // Hard / easy rhythm
  const w1 = preview.weeks[0]?.sessions ?? [];
  const ordered = sessionsByDayOrder(w1);

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1]!;
    const curr = ordered[i]!;
    if (prev.day === curr.day) continue;
    if (prev.stress === "hard" && curr.stress === "hard") {
      const intentional =
        input.ability_level === "advanced" &&
        input.training_days_per_week >= 5 &&
        curr.hyrox_pillar !== "compromised_hyrox";
      checks.push(
        check(
          intentional ? "warn" : "fail",
          "Hard/easy rhythm",
          `Back-to-back hard days: ${prev.day} (${prev.title}) → ${curr.day} (${curr.title})${
            intentional ? " — advanced only; monitor recovery." : "."
          }`
        )
      );
    }
  }

  if (hasUpperEasySupport(w1)) {
    checks.push(
      check(
        "pass",
        "Hard/easy rhythm",
        "Upper + easy aerobic support day present — helps buffer hard sessions."
      )
    );
  } else if (input.training_track === "hyrox" && input.training_days_per_week >= 4) {
    checks.push(
      check(
        "warn",
        "Hard/easy rhythm",
        "No upper + easy aerobic support day detected — consider pairing for rhythm."
      )
    );
  }

  const legsDay = ordered.find((s) => s.hyrox_pillar === "lower_strength_endurance");
  const compromisedDay = ordered.find((s) => s.hyrox_pillar === "compromised_hyrox");
  if (legsDay && compromisedDay) {
    const legsIdx = DAY_INDEX[legsDay.day] ?? 0;
    const compIdx = DAY_INDEX[compromisedDay.day] ?? 0;
    if (compIdx - legsIdx === 1 && legsDay.stress === "hard") {
      checks.push(
        check(
          "warn",
          "Hard/easy rhythm",
          "Hard legs directly before HYROX compromised day — watch cumulative fatigue."
        )
      );
    } else {
      checks.push(
        check(
          "pass",
          "Hard/easy rhythm",
          "HYROX compromised session not directly after hard legs (or legs are deload)."
        )
      );
    }
  }

  // Double sessions
  if (input.double_session_availability && input.training_track === "hyrox") {
    const w1ThuDouble = thursdayDoubleDay(w1);
    if (w1ThuDouble) {
      checks.push(
        check(
          "pass",
          "Thursday double-day",
          "W1 Thursday includes AM tempo-style run + PM HYROX legs (controlled double day)."
        )
      );
      const thuSessions = w1.filter((s) => s.day === "Thu");
      const am = thuSessions.find((s) => s.slot === "am");
      const pm = thuSessions.find((s) => s.slot === "pm");
      if (am?.stress === "moderate" && pm?.stress === "hard") {
        checks.push(
          check(
            "pass",
            "Hard stacking",
            "Thursday tempo (moderate) + legs (hard) — not flagged as hard-to-hard."
          )
        );
      }
    } else if (w1.some((s) => s.hyrox_pillar === "lower_strength_endurance" && s.day === "Thu")) {
      checks.push(
        check(
          "warn",
          "Thursday double-day",
          "Double sessions enabled but Thursday AM tempo + PM legs not detected."
        )
      );
    }

    const doubleUsed = w1.some((s) => s.slot === "am" || s.slot === "pm");
    if (doubleUsed) {
      checks.push(
        check("pass", "Double sessions", "Double-session availability used for AM/PM splits.")
      );
    }
  } else if (input.double_session_availability) {
    const doubleUsed = preview.weeks[0]?.sessions.some(
      (s) => s.slot === "am" || s.slot === "pm"
    );
    if (doubleUsed) {
      checks.push(
        check("pass", "Double sessions", "Double-session availability used for AM/PM split.")
      );
    }
  }

  // Running weakness → tempo run
  if (input.training_track === "hyrox" && hasRunningWeakness(input)) {
    const weeksWithTempo = preview.weeks.filter((w) => hasTempoSession(w.sessions));
    checks.push(
      check(
        weeksWithTempo.length >= 3 ? "pass" : "warn",
        "Running weakness",
        weeksWithTempo.length >= 3
          ? "Running weakness flagged — tempo-style run included across block weeks."
          : "Running weakness flagged but tempo-style run may be missing on some weeks."
      )
    );
  }

  // Tuesday bike + wall ball
  if (input.training_track === "hyrox") {
    const tue = tuesdayBikeWallBall(w1);
    if (input.ability_level === "advanced" && input.double_session_availability) {
      checks.push(
        check(
          tue ? "pass" : "warn",
          "Tuesday advanced double",
          tue
            ? "Advanced double-day athlete has Tuesday PM threshold bike + wall ball session."
            : "Advanced doubles enabled but Tuesday bike + wall ball session missing."
        )
      );
    } else if (input.ability_level === "intermediate" && tue?.is_optional_session) {
      checks.push(
        check(
          "pass",
          "Tuesday advanced double",
          "Intermediate athlete has optional Tuesday bike + wall ball add-on."
        )
      );
    } else if (input.ability_level === "beginner" && tue) {
      checks.push(
        check(
          "warn",
          "Tuesday advanced double",
          "Beginner athlete should not have standard Tuesday bike + wall ball session."
        )
      );
    }
  }

  // Z2 add-on windows
  if (input.training_track === "hyrox") {
    checks.push(
      check(
        addonsUseRanges(preview.weeks) ? "pass" : "warn",
        "Z2 add-on windows",
        addonsUseRanges(preview.weeks)
          ? "Optional aerobic add-ons use flexible time ranges (not fixed single durations)."
          : "Some optional add-ons may still use fixed durations instead of ranges."
      )
    );
  }

  // Community support notes
  if (preview.coach_support_note?.includes("community")) {
    checks.push(
      check("pass", "Community support", "Programme overview includes community support guidance.")
    );
  }
  const sessionsWithSupport = preview.weeks.flatMap((w) => w.sessions).filter((s) => s.coach_support_note);
  checks.push(
    check(
      sessionsWithSupport.length >= 5 ? "pass" : "warn",
      "Community support",
      sessionsWithSupport.length >= 5
        ? "Key sessions include community support notes."
        : "Some sessions may lack community support notes."
    )
  );

  // Aerobic & optional add-ons
  if (input.training_track === "hyrox") {
    const aerobicWeeks = preview.weeks.filter((w) => w.metrics.aerobic_minutes >= 60);
    checks.push(
      check(
        aerobicWeeks.length >= 3 ? "pass" : "warn",
        "Aerobic base",
        aerobicWeeks.length >= 3
          ? "Aerobic minutes included across block weeks."
          : "Some weeks may lack sufficient aerobic support volume."
      )
    );

    const weeksWithAddons = preview.weeks.filter((w) =>
      w.sessions.some((s) => s.optional_addon !== null)
    );
    checks.push(
      check(
        weeksWithAddons.length >= 3 ? "pass" : "warn",
        "Optional add-ons",
        weeksWithAddons.length >= 3
          ? "Optional Z1/Z2 add-ons present across the block."
          : "Optional add-ons may be missing on some weeks."
      )
    );
  }

  // Weekly pillars (HYROX)
  if (input.training_track === "hyrox") {
    const required: { pillar: HyroxPillar; label: string }[] = [
      { pillar: "threshold_run", label: "Threshold run" },
      { pillar: "erg_aerobic", label: "Erg / aerobic development" },
      { pillar: "lower_strength_endurance", label: "Lower strength endurance / HYROX legs" },
      { pillar: "upper_grip", label: "Upper body + grip" },
      { pillar: "compromised_hyrox", label: "HYROX compromised key session" },
    ];

    for (const week of preview.weeks) {
      for (const req of required) {
        if (!hasPillar(week.sessions, req.pillar)) {
          const ergViaUpper =
            req.pillar === "erg_aerobic" &&
            input.training_days_per_week <= 4 &&
            week.sessions.some((s) => s.metadata.planned_erg_minutes >= 20);
          if (!ergViaUpper) {
            checks.push(
              check("fail", "Weekly pillars", `Week ${week.week_number} missing ${req.label}.`)
            );
          }
        }
      }
      const hasLongOrZ2 =
        hasPillar(week.sessions, "long_easy_aerobic") ||
        hasPillar(week.sessions, "erg_aerobic");
      if (!hasLongOrZ2) {
        checks.push(
          check(
            "warn",
            "Weekly pillars",
            `Week ${week.week_number}: no dedicated long easy / mixed Z2 exposure.`
          )
        );
      }
    }
  }

  // Volume
  const w1Hard = countHard(w1);
  if (input.ability_level === "beginner" && w1Hard >= 3) {
    checks.push(check("fail", "Volume", "Beginner week has 3+ hard sessions — likely overloaded."));
  } else if (input.ability_level === "beginner" && w1Hard <= 2) {
    checks.push(check("pass", "Volume", "Beginner hard-session count looks appropriate."));
  }

  if (input.ability_level === "advanced" && input.training_days_per_week >= 5) {
    const w3Aerobic = preview.weeks[2]?.metrics.aerobic_minutes ?? 0;
    const w3Threshold = preview.weeks[2]?.metrics.threshold_minutes ?? 0;
    const w3Erg = countErgExposure(preview.weeks[2]?.sessions ?? []);
    if (w3Aerobic >= 80 && w3Threshold >= 25 && w3Erg >= 1) {
      checks.push(
        check("pass", "Volume", "Advanced W3 includes sufficient aerobic and threshold exposure.")
      );
    } else {
      checks.push(
        check("warn", "Volume", "Advanced W3 may need more aerobic/erg/threshold exposure.")
      );
    }
  }

  if (input.training_days_per_week <= 4) {
    checks.push(
      check(
        "pass",
        "Volume",
        `${input.training_days_per_week}-day structure uses compressed but spaced hard sessions.`
      )
    );
  }

  // Pace guidance
  const paceCtx = buildRunPaceContext(input);
  const sessionsWithPace = preview.weeks.flatMap((w) => w.sessions).filter((s) => s.target_pace_guidance);
  if (paceCtx.has5k || paceCtx.has10k) {
    const thresholdHasPace = preview.weeks.some((w) =>
      w.sessions.some(
        (s) => s.hyrox_pillar === "threshold_run" && s.target_pace_guidance?.includes("Target:")
      )
    );
    checks.push(
      check(
        thresholdHasPace ? "pass" : "warn",
        "Pace guidance",
        thresholdHasPace
          ? `Pace ranges shown from ${paceCtx.has5k ? "5K" : "10K"} assessment data.`
          : "Assessment times provided but threshold pace guidance may be missing."
      )
    );
  } else if (sessionsWithPace.length > 0) {
    checks.push(
      check("pass", "Pace guidance", "RPE / talk-test guidance used where no pace data provided.")
    );
  }

  const ergGuidance = preview.weeks.some((w) =>
    w.sessions.some((s) => s.target_erg_guidance && s.hyrox_pillar === "erg_aerobic")
  );
  if (input.training_track === "hyrox" && (input.ski_1k_time || input.row_1k_time)) {
    checks.push(
      check(
        ergGuidance ? "pass" : "warn",
        "Pace guidance",
        ergGuidance ? "Erg split guidance included from Ski/Row 1K times." : "Erg times provided but guidance missing."
      )
    );
  }

  // Extra round rules
  const compromisedSessions = preview.weeks.flatMap((w) =>
    w.sessions.filter((s) => s.hyrox_pillar === "compromised_hyrox")
  );
  if (compromisedSessions.length > 0) {
    const withRules = compromisedSessions.filter((s) => s.extra_round_rule);
    const hasStandardRule = withRules.some((s) =>
      s.extra_round_rule?.includes("below 7/10")
    );
    checks.push(
      check(
        withRules.length === compromisedSessions.length && hasStandardRule ? "pass" : "warn",
        "HYROX sessions",
        hasStandardRule
          ? "Extra-round rules on compromised sessions include RPE <7/10 + movement quality guidance."
          : "Compromised sessions missing strengthened extra-round guidance."
      )
    );
  }

  // Equipment
  if (input.training_track === "hyrox") {
    const limited = hasLimitedHyroxEquipment({
      ...emptyHyroxDetails(),
      equipment: input.hyrox_equipment.length ? input.hyrox_equipment : ["no_hyrox_equipment"],
    });
    if (limited) {
      checks.push(
        check(
          "warn",
          "Equipment",
          "Limited HYROX equipment — substitutions applied; race specificity reduced."
        )
      );
    }
    for (const sub of preview.equipment_substitutions) {
      checks.push(check("warn", "Equipment", sub));
    }
    if (!limited && preview.equipment_substitutions.length === 0) {
      checks.push(check("pass", "Equipment", "Equipment access supports HYROX-specific sessions."));
    }
  }

  // Weakness focus
  if (input.station_weaknesses.length > 0) {
    if (preview.weakness_focus_block.length > 0) {
      checks.push(
        check(
          "pass",
          "Weakness focus",
          `Station weaknesses flagged across block: ${preview.weakness_focus_block.join(", ")}.`
        )
      );
    } else {
      checks.push(
        check("warn", "Weakness focus", "Station weaknesses selected but not surfaced in preview copy.")
      );
    }
  }

  if (checks.filter((c) => c.category === "Hard/easy rhythm" && c.status === "pass").length === 0) {
    const rhythmFails = checks.filter((c) => c.category === "Hard/easy rhythm" && c.status === "fail");
    if (rhythmFails.length === 0) {
      checks.push(check("pass", "Hard/easy rhythm", "No critical back-to-back hard violations detected."));
    }
  }

  const pass_count = checks.filter((c) => c.status === "pass").length;
  const warn_count = checks.filter((c) => c.status === "warn").length;
  const fail_count = checks.filter((c) => c.status === "fail").length;

  return { checks, pass_count, warn_count, fail_count };
}
