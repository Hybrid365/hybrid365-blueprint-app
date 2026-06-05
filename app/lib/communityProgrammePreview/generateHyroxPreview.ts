import { stationWeaknessLabel } from "@/app/lib/communityHyroxDashboard";
import type { HyroxEquipmentAccess, HyroxStationWeakness } from "@/app/lib/communityHyroxAssessment";
import {
  baseBlockCompromisedScale,
  blockPhaseForNumber,
  blockPhaseLabel,
  nextBlockProgressionHint,
  weekFocusCopy,
  weekTitle,
  weekProgressionFocus,
} from "./blockPhases";
import { coachNoteForSession, COMMUNITY_SUPPORT_OVERVIEW } from "./coachSupport";
import {
  compromisedRunPaceGuidance,
  easyRunPaceGuidance,
  ergEasyGuidance,
  ergThresholdGuidance,
  thresholdPaceGuidance,
} from "./paceTargets";
import {
  hasRunningWeakness,
  hasBikeWallBallEquipment,
  shouldIncludeTuesdayBikeWallBall,
  tempoRunWindow,
  z2Window,
  Z2_SKIP_WHEN,
} from "./runningRules";
import type {
  BlockPhase,
  CommunityPreviewInput,
  CommunityProgrammePreview,
  HyroxPillar,
  PreviewAbilityLevel,
  PreviewOptionalAddon,
  PreviewSession,
  PreviewSessionMetadata,
  PreviewStress,
  PreviewWeek,
  PreviewWeekMetrics,
  SessionModality,
} from "./types";
import {
  bikeWallBallPrescription,
  compromisedPrescription,
  ergEasyFlowPrescription,
  ergThresholdPrescription,
  legsPrescription,
  longEasyPrescription,
  tempoSupportPrescription,
  thresholdRunPrescription,
  upperGripPrescription,
} from "./weekProgression";

type SlotKind =
  | "upper_easy_aerobic"
  | "threshold_run"
  | "erg_flow"
  | "hyrox_legs"
  | "easy_support"
  | "compromised"
  | "long_easy";

type SlotDef = { day: string; kind: SlotKind };

function equipmentSubstitutions(equipment: HyroxEquipmentAccess[]): string[] {
  const subs: string[] = [];
  const has = (k: HyroxEquipmentAccess) => equipment.includes(k);
  if (!has("skierg") && !has("rowerg") && !has("assault_bike")) {
    subs.push(
      "No Ski/Row/Bike — use run or bike erg substitutes for engine development. Post in the community if you're unsure how to scale this."
    );
  } else if (!has("skierg")) {
    subs.push("No SkiErg — bias RowErg or assault bike for ski-specific intervals.");
  }
  if (!has("sled")) {
    subs.push("No sled — sled push/pull → DB walking lunges, band resisted marches, or hill pushes.");
  }
  if (!has("wall_balls")) {
    subs.push(
      "No wall balls — sub DB thrusters, goblet squats or med-ball squat to target; specificity reduced."
    );
  }
  if (equipment.includes("no_hyrox_equipment") || equipment.includes("dumbbells_only")) {
    subs.push(
      "Limited HYROX kit — compromised sessions use run + DB/bodyweight station clusters; race specificity reduced. Message in the community with any questions."
    );
  }
  return subs;
}

function rpeFor(level: PreviewAbilityLevel, stress: PreviewStress, week: number): string {
  const bump = week >= 3 ? 0.5 : 0;
  const table: Record<PreviewAbilityLevel, Record<PreviewStress, [number, number]>> = {
    beginner: { easy: [4, 5], moderate: [5, 6], hard: [6, 7] },
    intermediate: { easy: [5, 6], moderate: [6, 7], hard: [7, 8] },
    advanced: { easy: [5, 6], moderate: [7, 8], hard: [8, 9] },
  };
  const [lo, hi] = table[level][stress];
  const adjLo = Math.min(10, lo + bump);
  const adjHi = Math.min(10, hi + bump);
  return adjLo === adjHi ? String(adjLo) : `${adjLo}–${adjHi}`;
}

function scalingCopy(level: PreviewAbilityLevel, stress: PreviewStress): string {
  if (level === "beginner") {
    return stress === "hard"
      ? "Reduce intervals 20–30%; walk recoveries; cap total hard time."
      : "Stay conversational on easy work; leave 2–3 reps in reserve on strength.";
  }
  if (level === "advanced") {
    return stress === "hard"
      ? "Full prescription if recovered; add finisher only if RPE ≤ target."
      : "Extend aerobic blocks within the suggested window if HR stays Z2.";
  }
  return "Standard prescription; adjust load from RPE and prior-week response.";
}

function makeZ2Addon(
  level: PreviewAbilityLevel,
  kind: "bike" | "ski_row" | "mixed" | "mobility"
): PreviewOptionalAddon {
  const w = z2Window(level, kind);
  return {
    title: `${w.title} — ${w.range} easy`,
    duration_minutes: w.midMinutes,
    duration_range: w.range,
    rpe: "2–4",
    modality: kind === "ski_row" ? "mixed" : kind === "mixed" ? "mixed" : kind === "mobility" ? "mobility" : "bike",
    purpose: "Add aerobic volume without extra running impact.",
    skip_when: Z2_SKIP_WHEN,
    coach_support_note: coachNoteForSession("addon"),
  };
}

function hyroxLayouts(days: 3 | 4 | 5 | 6): SlotDef[] {
  const layouts: Record<number, SlotDef[]> = {
    3: [
      { day: "Tue", kind: "threshold_run" },
      { day: "Wed", kind: "upper_easy_aerobic" },
      { day: "Sat", kind: "compromised" },
    ],
    4: [
      { day: "Mon", kind: "upper_easy_aerobic" },
      { day: "Tue", kind: "threshold_run" },
      { day: "Thu", kind: "hyrox_legs" },
      { day: "Sat", kind: "compromised" },
    ],
    5: [
      { day: "Mon", kind: "upper_easy_aerobic" },
      { day: "Tue", kind: "threshold_run" },
      { day: "Wed", kind: "erg_flow" },
      { day: "Thu", kind: "hyrox_legs" },
      { day: "Sat", kind: "compromised" },
    ],
    6: [
      { day: "Mon", kind: "upper_easy_aerobic" },
      { day: "Tue", kind: "threshold_run" },
      { day: "Wed", kind: "erg_flow" },
      { day: "Thu", kind: "hyrox_legs" },
      { day: "Fri", kind: "easy_support" },
      { day: "Sat", kind: "compromised" },
    ],
  };
  const base = layouts[days] ?? layouts[5]!;
  if (days >= 6) {
    return [...base, { day: "Sun", kind: "long_easy" }];
  }
  return base;
}

function buildMetadata(args: {
  duration: number;
  aerobic: number;
  threshold: number;
  run: number;
  erg: number;
  strength: number;
  stress: PreviewStress;
  modality: SessionModality;
  pillar: HyroxPillar | null;
  optionalAddon: boolean;
  marker: string;
  runKm?: number | null;
  stationVolume?: number | null;
}): PreviewSessionMetadata {
  return {
    planned_duration_minutes: args.duration,
    planned_aerobic_minutes: args.aerobic,
    planned_threshold_minutes: args.threshold,
    planned_run_minutes: args.run,
    planned_run_distance_km: args.runKm ?? null,
    planned_erg_minutes: args.erg,
    planned_strength_minutes: args.strength,
    planned_station_volume: args.stationVolume ?? null,
    session_stress: args.stress,
    modality: args.modality,
    hyrox_pillar: args.pillar,
    optional_addon: args.optionalAddon,
    progression_marker: args.marker,
  };
}

function buildTempoRunSession(
  day: string,
  slot: "am" | "single",
  input: CommunityPreviewInput,
  week: number,
  weekNote: string,
  reason: string
): PreviewSession {
  const level = input.ability_level;
  const rx = tempoSupportPrescription(week, level);
  const win = tempoRunWindow(level);
  const rpeMod = rpeFor(level, "moderate", week);

  return {
    day,
    slot,
    title: "Tempo-style support run",
    session_type: "Run",
    stress: "moderate",
    hyrox_pillar: "tempo_support",
    purpose: `${reason} Easier than Tuesday threshold — aerobic strength, running economy and durability without high threshold stress. Every run should help you run again under fatigue.`,
    progression_note: rx.progressionNote,
    block_week_progression_note: weekNote,
    rpe: win.rpe,
    duration_minutes: win.midMinutes + 15,
    warm_up: "8 min easy jog · drills · 3 × 15s strides",
    main_set: rx.mainSet,
    cool_down: "5 min easy jog + mobility",
    target_pace_guidance: `${easyRunPaceGuidance(input)} Easier than threshold — conversational to short phrases. Treadmill 1% incline unless calf/Achilles issues.`,
    target_erg_guidance: null,
    optional_addon: null,
    extra_round_rule: null,
    coach_support_note: coachNoteForSession("hard"),
    is_optional_session: false,
    what_to_record: "Duration · avg RPE · how controlled you felt finishing",
    scaling: scalingCopy(level, "moderate"),
    equipment_notes: null,
    weakness_focus: ["Running between stations"],
    metadata: buildMetadata({
      duration: win.midMinutes + 15,
      aerobic: win.midMinutes,
      threshold: 0,
      run: win.midMinutes,
      erg: 0,
      strength: 0,
      stress: "moderate",
      modality: "run",
      pillar: "tempo_support",
      optionalAddon: false,
      marker: rx.progressionMarker,
      runKm: 5,
    }),
  };
}

function buildTuesdayBikeWallBallSession(
  input: CommunityPreviewInput,
  week: number,
  phase: BlockPhase,
  weekNote: string,
  asOptional: boolean
): PreviewSession {
  const level = input.ability_level;
  const rx = bikeWallBallPrescription(week, level, phase);
  const hasAssault = input.hyrox_equipment.includes("assault_bike");
  const hasWall = input.hyrox_equipment.includes("wall_balls");
  const bikeLabel = hasAssault ? "Assault Bike" : "bike erg / row / ski";
  const wallNote = hasWall
    ? "25 wall balls"
    : "DB thrusters or goblet squats (specificity reduced)";

  const mainSet = rx.mainSet
    .replace("Assault Bike", bikeLabel)
    .replace("25 wall balls", wallNote);

  const stress: PreviewStress =
    asOptional && level === "intermediate" ? "moderate" : week === 4 ? "moderate" : "hard";

  return {
    day: "Tue",
    slot: "pm",
    title: "Threshold Bike + Wall Ball Durability",
    session_type: "Hybrid",
    stress,
    hyrox_pillar: "erg_threshold_station",
    purpose:
      "Build threshold engine and wall ball durability under breathing fatigue — move from aerobic stress into station work. Optional HYROX add-on if recovery is good and you have the equipment.",
    progression_note: rx.progressionNote,
    block_week_progression_note: weekNote,
    rpe: "Bike 7–8 · wall balls controlled quality",
    duration_minutes: week === 4 ? 35 : 45,
    warm_up: "10–20 min easy bike",
    main_set: mainSet,
    cool_down: "5 min easy spin + shoulder/hip stretch",
    target_pace_guidance: null,
    target_erg_guidance: ergThresholdGuidance(input, "mixed", "7–8"),
    optional_addon: null,
    extra_round_rule: null,
    coach_support_note: coachNoteForSession("hyrox"),
    is_optional_session: asOptional,
    what_to_record: "Bike watts/calories/RPE · wall ball breaks · total rounds · rest used · overall RPE",
    scaling:
      asOptional
        ? `${scalingCopy(level, stress)} Skip if: legs heavy from threshold run, sleep/recovery poor, wall ball form breaks down, or it would compromise Thursday legs or Saturday key session.`
        : scalingCopy(level, stress),
    equipment_notes: !hasAssault || !hasWall ? coachNoteForSession("equipment") : null,
    weakness_focus: ["Wall balls"],
    metadata: buildMetadata({
      duration: week === 4 ? 35 : 45,
      aerobic: 15,
      threshold: rx.thresholdMinutes,
      run: 0,
      erg: 20,
      strength: 10,
      stress,
      modality: "hybrid",
      pillar: "erg_threshold_station",
      optionalAddon: asOptional,
      marker: rx.progressionMarker,
      stationVolume: week === 1 ? 100 : week === 2 ? 125 : 150,
    }),
  };
}

function buildSessionForSlot(
  slot: SlotDef,
  input: CommunityPreviewInput,
  week: number,
  phase: BlockPhase,
  weaknessLabels: string[],
  equipNote: string | null
): PreviewSession[] {
  const level = input.ability_level;
  const rpeHard = rpeFor(level, "hard", week);
  const rpeMod = rpeFor(level, "moderate", week);
  const rpeEasy = rpeFor(level, "easy", week);
  const compScale = baseBlockCompromisedScale(phase, week, level);
  const sessions: PreviewSession[] = [];
  const weekNote = weekProgressionFocus(week);
  const doubles = input.double_session_availability;
  const tuesdayBikeWall = shouldIncludeTuesdayBikeWallBall(input);

  switch (slot.kind) {
    case "upper_easy_aerobic": {
      const rx = upperGripPrescription(week);
      const easyWin = z2Window(level, "mixed");
      sessions.push({
        day: slot.day,
        slot: "single",
        title: "Upper body + grip · easy aerobic support",
        session_type: "Strength + Aerobic",
        stress: "moderate",
        hyrox_pillar: "upper_grip",
        purpose:
          "Support day between hard sessions — upper/grip durability paired with easy aerobic to improve rhythm and avoid hard-to-hard stacking.",
        progression_note: rx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: `${rpeMod} strength · ${rpeEasy} aerobic`,
        duration_minutes: 45 + easyWin.midMinutes,
        warm_up: "8 min mobility · band pull-aparts · easy row 5 min",
        main_set: `${rx.mainSet} · then ${easyWin.range} easy bike or row @ Z2`,
        cool_down: "5 min walk + shoulder/grip stretch",
        target_pace_guidance: easyRunPaceGuidance(input),
        target_erg_guidance: ergEasyGuidance(),
        optional_addon: makeZ2Addon(level, "mobility"),
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("general"),
        is_optional_session: false,
        what_to_record: "Top sets · carry distance · easy aerobic RPE",
        scaling: scalingCopy(level, "moderate"),
        equipment_notes: equipNote,
        weakness_focus: weaknessLabels.filter((w) => /grip|carry|sled|wall/i.test(w)),
        metadata: buildMetadata({
          duration: 45 + easyWin.midMinutes,
          aerobic: easyWin.midMinutes,
          threshold: 0,
          run: 0,
          erg: easyWin.midMinutes,
          strength: 45,
          stress: "moderate",
          modality: "mixed",
          pillar: "upper_grip",
          optionalAddon: false,
          marker: rx.progressionMarker,
        }),
      });
      break;
    }
    case "threshold_run": {
      const rx = thresholdRunPrescription(week, level, phase);
      const duration = week === 4 ? 45 : level === "beginner" ? 48 : 55;

      let pmAddon: PreviewOptionalAddon | null = null;
      if (week !== 4 && !tuesdayBikeWall.asRequiredDouble) {
        pmAddon = makeZ2Addon(level, "bike");
      }

      sessions.push({
        day: slot.day,
        slot: doubles ? "am" : "single",
        title: week === 4 ? "Threshold deload / benchmark" : "Threshold run",
        session_type: "Run",
        stress: week === 4 ? "moderate" : "hard",
        hyrox_pillar: "threshold_run",
        purpose: "Controlled threshold development — build race-pace engine without sprinting.",
        progression_note: rx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: week === 4 ? rpeMod : rpeHard,
        duration_minutes: duration,
        warm_up: "10 min easy jog · drills · 4 × 20s strides",
        main_set: rx.mainSet,
        cool_down: "8 min easy jog + mobility",
        target_pace_guidance: thresholdPaceGuidance(input, week === 4 ? rpeMod : rpeHard),
        target_erg_guidance: null,
        optional_addon: pmAddon,
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("hard"),
        is_optional_session: false,
        what_to_record: "Interval paces · avg RPE · total threshold minutes",
        scaling: scalingCopy(level, week === 4 ? "moderate" : "hard"),
        equipment_notes: null,
        weakness_focus: weaknessLabels.filter((w) => /running/i.test(w)),
        metadata: buildMetadata({
          duration,
          aerobic: 18,
          threshold: rx.thresholdMinutes,
          run: duration - 10,
          erg: 0,
          strength: 0,
          stress: week === 4 ? "moderate" : "hard",
          modality: "run",
          pillar: "threshold_run",
          optionalAddon: Boolean(pmAddon),
          marker: rx.progressionMarker,
          runKm: week === 4 ? 6 : 8,
        }),
      });

      if (tuesdayBikeWall.include && week !== 4) {
        sessions.push(
          buildTuesdayBikeWallBallSession(
            input,
            week,
            phase,
            weekNote,
            tuesdayBikeWall.asOptional
          )
        );
      }
      break;
    }
    case "erg_flow": {
      const isThreshold = week <= 3 && phase !== "base";
      const ergRx =
        week === 4 ? ergThresholdPrescription(week, level, phase) : isThreshold
          ? ergThresholdPrescription(week, level, phase)
          : ergEasyFlowPrescription(week);
      const duration = week === 3 ? 55 : week === 4 ? 50 : 50;
      sessions.push({
        day: slot.day,
        slot: "single",
        title: week === 4 ? "Mixed Z2 aerobic flow" : "Easy aerobic / erg development",
        session_type: "Engine",
        stress: "easy",
        hyrox_pillar: "erg_aerobic",
        purpose: "Build the base — low-impact Ski/Row/Bike volume supporting threshold and HYROX work.",
        progression_note: ergRx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: isThreshold ? rpeFor(level, "moderate", week) : rpeEasy,
        duration_minutes: duration,
        warm_up: "5 min easy spin/row · hip/ankle mobility",
        main_set: ergRx.mainSet,
        cool_down: "5 min easy + breathing",
        target_pace_guidance: null,
        target_erg_guidance: ergThresholdGuidance(input, "mixed", isThreshold ? rpeMod : rpeEasy),
        optional_addon: makeZ2Addon(level, "mixed"),
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("general"),
        is_optional_session: false,
        what_to_record: "Total minutes · modality split · avg RPE",
        scaling: scalingCopy(level, "easy"),
        equipment_notes: equipNote,
        weakness_focus: weaknessLabels.filter((w) => /ski|row|erg/i.test(w)),
        metadata: buildMetadata({
          duration,
          aerobic: duration - 10,
          threshold: ergRx.thresholdMinutes,
          run: 0,
          erg: duration - 10,
          strength: 0,
          stress: "easy",
          modality: "mixed",
          pillar: "erg_aerobic",
          optionalAddon: true,
          marker: ergRx.progressionMarker,
        }),
      });
      break;
    }
    case "hyrox_legs": {
      const rx = legsPrescription(week, level, phase);

      if (doubles) {
        sessions.push(
          buildTempoRunSession(
            slot.day,
            "am",
            input,
            week,
            weekNote,
            "Thursday double day — AM controlled tempo before PM legs."
          )
        );
      }

      sessions.push({
        day: slot.day,
        slot: doubles ? "pm" : "single",
        title: week === 4 ? "HYROX legs deload" : "HYROX legs / lower strength endurance",
        session_type: "Strength",
        stress: week === 4 ? "moderate" : "hard",
        hyrox_pillar: "lower_strength_endurance",
        purpose: doubles
          ? "PM lower-body main stimulus — sled, lunge and leg endurance. Fuel well between sessions; keep AM tempo controlled so this stays quality."
          : "Sled, lunge and leg endurance — prepare quads/hamstrings for race stations.",
        progression_note: rx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: week === 4 ? rpeMod : rpeHard,
        duration_minutes: week === 4 ? 40 : 50,
        warm_up: "8 min bike · leg swings · 2 × 10 bodyweight squats",
        main_set: rx.mainSet,
        cool_down: "5 min walk · quad/hamstring stretch",
        target_pace_guidance: null,
        target_erg_guidance: null,
        optional_addon: week !== 4 ? makeZ2Addon(level, "bike") : null,
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("hard"),
        is_optional_session: false,
        what_to_record: "Loads · reps · leg RPE next morning",
        scaling: scalingCopy(level, week === 4 ? "moderate" : "hard"),
        equipment_notes: equipNote,
        weakness_focus: weaknessLabels.filter((w) => /lunge|sled|wall|leg/i.test(w)),
        metadata: buildMetadata({
          duration: week === 4 ? 40 : 50,
          aerobic: 8,
          threshold: 0,
          run: 0,
          erg: 8,
          strength: week === 4 ? 30 : 40,
          stress: week === 4 ? "moderate" : "hard",
          modality: "strength",
          pillar: "lower_strength_endurance",
          optionalAddon: week !== 4,
          marker: rx.progressionMarker,
        }),
      });
      break;
    }
    case "easy_support": {
      sessions.push({
        day: slot.day,
        slot: "single",
        title: "Easy support · mobility",
        session_type: "Recovery",
        stress: "easy",
        hyrox_pillar: "recovery",
        purpose: "Flush and mobility between hard legs and weekend compromised session.",
        progression_note: week === 4 ? "W4 extra recovery" : "Support day — stay fresh for Saturday",
        block_week_progression_note: weekNote,
        rpe: rpeEasy,
        duration_minutes: 40,
        warm_up: "5 min easy walk",
        main_set: `${z2Window(level, "bike").range} easy bike or walk · 10 min mobility (hips, ankles, T-spine)`,
        cool_down: "Breathing + light stretch",
        target_pace_guidance: easyRunPaceGuidance(input),
        target_erg_guidance: ergEasyGuidance(),
        optional_addon: makeZ2Addon(level, "bike"),
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("addon"),
        is_optional_session: false,
        what_to_record: "Duration · RPE · sleep/recovery note",
        scaling: scalingCopy(level, "easy"),
        equipment_notes: null,
        weakness_focus: [],
        metadata: buildMetadata({
          duration: 40,
          aerobic: 35,
          threshold: 0,
          run: 0,
          erg: 25,
          strength: 0,
          stress: "easy",
          modality: "mobility",
          pillar: "recovery",
          optionalAddon: true,
          marker: `support_w${week}`,
        }),
      });
      break;
    }
    case "compromised": {
      const rx = compromisedPrescription(week, level, phase, compScale);
      sessions.push({
        day: slot.day,
        slot: "single",
        title: week === 4 ? "HYROX compromised · mini benchmark" : "HYROX compromised key session",
        session_type: "Hybrid",
        stress: week === 4 ? "moderate" : "hard",
        hyrox_pillar: "compromised_hyrox",
        purpose:
          phase === "base" && week <= 2
            ? "Intro run/station exposure — controlled race-specific fatigue, not max effort. Helps you run again under fatigue."
            : "Station cluster + compromised running — race-specific fatigue management.",
        progression_note: rx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: week === 4 ? rpeMod : rpeHard,
        duration_minutes: week === 4 ? 45 : 55,
        warm_up: "10 min easy jog · station movement prep · 2 × 200m strides",
        main_set: rx.mainSet,
        cool_down: "8 min walk · breathing · light stretch",
        target_pace_guidance: compromisedRunPaceGuidance(input, week === 4 ? rpeMod : rpeHard),
        target_erg_guidance: null,
        optional_addon: null,
        extra_round_rule: rx.extraRoundRule,
        coach_support_note: coachNoteForSession("hyrox"),
        is_optional_session: false,
        what_to_record: "Split times · run pace after stations · RPE · station notes",
        scaling: scalingCopy(level, week === 4 ? "moderate" : "hard"),
        equipment_notes: equipNote,
        weakness_focus: weaknessLabels,
        metadata: buildMetadata({
          duration: week === 4 ? 45 : 55,
          aerobic: 10,
          threshold: 0,
          run: 20,
          erg: 0,
          strength: 15,
          stress: week === 4 ? "moderate" : "hard",
          modality: "hybrid",
          pillar: "compromised_hyrox",
          optionalAddon: false,
          marker: rx.progressionMarker,
          runKm: 4,
        }),
      });
      break;
    }
    case "long_easy": {
      const rx = longEasyPrescription(week);
      const duration = week === 3 ? 70 : week === 4 ? 50 : 60;
      sessions.push({
        day: slot.day,
        slot: "single",
        title: "Long easy aerobic",
        session_type: "Run / Aerobic",
        stress: "easy",
        hyrox_pillar: "long_easy_aerobic",
        purpose: "Long easy aerobic or mixed Z2 — volume without intensity debt.",
        progression_note: rx.progressionNote,
        block_week_progression_note: weekNote,
        rpe: rpeEasy,
        duration_minutes: duration,
        warm_up: "5 min walk → easy jog",
        main_set: rx.mainSet,
        cool_down: "5 min walk + stretch",
        target_pace_guidance: easyRunPaceGuidance(input),
        target_erg_guidance: ergEasyGuidance(),
        optional_addon: week !== 4 ? makeZ2Addon(level, "mobility") : null,
        extra_round_rule: null,
        coach_support_note: coachNoteForSession("general"),
        is_optional_session: false,
        what_to_record: "Duration · distance · avg HR/RPE",
        scaling: scalingCopy(level, "easy"),
        equipment_notes: null,
        weakness_focus: [],
        metadata: buildMetadata({
          duration,
          aerobic: duration,
          threshold: 0,
          run: duration,
          erg: 0,
          strength: 0,
          stress: "easy",
          modality: "run",
          pillar: "long_easy_aerobic",
          optionalAddon: week !== 4,
          marker: rx.progressionMarker,
          runKm: week === 3 ? 10 : 8,
        }),
      });
      break;
    }
  }

  return sessions;
}

function hasTempoSession(sessions: PreviewSession[]): boolean {
  return sessions.some(
    (s) =>
      s.metadata.progression_marker === "tempo_support_run" ||
      s.hyrox_pillar === "tempo_support"
  );
}

/** Place tempo run for running weakness when Thursday double is not used. */
function ensureTempoRunForWeakness(
  sessions: PreviewSession[],
  input: CommunityPreviewInput,
  week: number,
  slots: SlotDef[]
): PreviewSession[] {
  if (!hasRunningWeakness(input) || hasTempoSession(sessions)) {
    return sessions;
  }
  if (input.double_session_availability && slots.some((s) => s.kind === "hyrox_legs" && s.day === "Thu")) {
    return sessions;
  }

  const weekNote = weekProgressionFocus(week);
  const level = input.ability_level;

  if (slots.some((s) => s.kind === "erg_flow" && s.day === "Wed")) {
    return sessions.map((s) => {
      if (s.day === "Wed" && s.hyrox_pillar === "erg_aerobic" && week !== 4) {
        const rx = tempoSupportPrescription(week, level);
        const win = tempoRunWindow(level);
        return {
          ...s,
          title: "Easy-steady run · aerobic support",
          session_type: "Run",
          stress: "moderate" as PreviewStress,
          hyrox_pillar: "tempo_support" as HyroxPillar,
          purpose:
            "Running weakness focus — controlled steady run replacing generic erg support. Easier than Tuesday threshold.",
          main_set: rx.mainSet,
          target_pace_guidance: easyRunPaceGuidance(input),
          target_erg_guidance: null,
          metadata: {
            ...s.metadata,
            progression_marker: rx.progressionMarker,
            modality: "run",
            planned_run_minutes: win.midMinutes,
            planned_aerobic_minutes: win.midMinutes,
            planned_erg_minutes: 0,
            session_stress: "moderate",
            hyrox_pillar: "tempo_support",
          },
        };
      }
      return s;
    });
  }

  if (slots.some((s) => s.kind === "easy_support")) {
    return [
      ...sessions,
      buildTempoRunSession(
        "Fri",
        "single",
        input,
        week,
        weekNote,
        "Running weakness focus — Friday easy-steady run before weekend key session."
      ),
    ];
  }

  return [
    ...sessions,
    buildTempoRunSession(
      "Wed",
      "single",
      input,
      week,
      weekNote,
      "Running weakness focus — mid-week controlled tempo/steady run."
    ),
  ];
}

function computeWeekMetrics(sessions: PreviewSession[], weekInBlock: number): PreviewWeekMetrics {
  let total = 0;
  let aerobic = 0;
  let threshold = 0;
  let strength = 0;
  let runSessions = 0;
  let ergSessions = 0;
  let hard = 0;
  let optionalAddon = 0;

  for (const s of sessions) {
    if (s.is_optional_session) continue;
    total += s.metadata.planned_duration_minutes;
    aerobic += s.metadata.planned_aerobic_minutes;
    threshold += s.metadata.planned_threshold_minutes;
    strength += s.metadata.planned_strength_minutes;
    if (s.metadata.planned_run_minutes > 0) runSessions++;
    if (s.metadata.planned_erg_minutes > 0) ergSessions++;
    if (s.stress === "hard") hard++;
    if (s.optional_addon) optionalAddon += s.optional_addon.duration_minutes;
  }

  return {
    week_in_block: weekInBlock,
    progression_focus: weekProgressionFocus(weekInBlock),
    total_planned_minutes: total,
    aerobic_minutes: aerobic,
    threshold_minutes: threshold,
    strength_minutes: strength,
    run_sessions: runSessions,
    erg_sessions: ergSessions,
    hard_sessions: hard,
    optional_addon_minutes: optionalAddon,
  };
}

/**
 * In-memory HYROX preview — no database writes.
 */
export function generateHyroxProgrammePreview(
  input: CommunityPreviewInput
): CommunityProgrammePreview {
  const blockNumber = input.block_number || 1;
  const phase = blockPhaseForNumber(blockNumber);
  const weaknessLabels = input.station_weaknesses.map((w: HyroxStationWeakness) =>
    stationWeaknessLabel(w)
  );
  const subs = equipmentSubstitutions(input.hyrox_equipment);
  const equipNote = subs.length ? subs.join(" ") : null;
  const slots = hyroxLayouts(input.training_days_per_week);

  const weeks: PreviewWeek[] = [1, 2, 3, 4].map((weekNum) => {
    let allSessions = slots.flatMap((slot) =>
      buildSessionForSlot(slot, input, weekNum, phase, weaknessLabels, equipNote)
    );
    allSessions = ensureTempoRunForWeakness(allSessions, input, weekNum, slots);
    return {
      week_number: weekNum,
      title: weekTitle(weekNum, phase),
      focus: weekFocusCopy(weekNum, phase),
      progression_focus: weekProgressionFocus(weekNum),
      sessions: allSessions,
      metrics: computeWeekMetrics(allSessions, weekNum),
    };
  });

  return {
    track: "hyrox",
    block_number: blockNumber,
    block_phase: phase,
    block_phase_label: blockPhaseLabel(phase),
    block_label: `Block ${blockNumber} · ${blockPhaseLabel(phase)} · 4-week HYROX preview`,
    progression_focus: `${blockPhaseLabel(phase)} — ${nextBlockProgressionHint(blockNumber)}`,
    coach_support_note: COMMUNITY_SUPPORT_OVERVIEW,
    weeks,
    weakness_focus_block: weaknessLabels,
    equipment_substitutions: subs,
    generated_at: new Date().toISOString(),
  };
}

/** Exported for QA tests */
export { hasTempoSession, hasRunningWeakness, hasBikeWallBallEquipment };
