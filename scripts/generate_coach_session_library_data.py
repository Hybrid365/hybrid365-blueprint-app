#!/usr/bin/env python3
"""Generate app/lib/hyroxCoachSessionLibraryData.ts with 75 coach library sessions."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app/lib/hyroxCoachSessionLibraryData.ts"


def rx(
    objective: str,
    warmup: list[str],
    main_set: list[str],
    cooldown: list[str],
    what_to_record: list[str],
    coach_note: str,
    **kw: str | list[str] | None,
) -> str:
    p: dict = {
        "objective": objective,
        "warmup": warmup,
        "mainSet": main_set,
        "cooldown": cooldown,
        "targetPace": kw.get("targetPace"),
        "targetLoad": kw.get("targetLoad"),
        "targetHR": kw.get("targetHR"),
        "targetRPE": kw.get("targetRPE"),
        "whatToRecord": what_to_record,
        "coachNote": coach_note,
    }
    for k in ("safetyNote", "progression", "regression"):
        if k in kw and kw[k]:
            p[k] = kw[k]
    return json.dumps(p, ensure_ascii=False)


def emit_entry(s: dict) -> str:
    lines = [
        "  buildCoachEntry({",
        f'    id: {json.dumps(s["id"])},',
        f'    sessionLibraryId: {json.dumps(s["sessionLibraryId"])},',
        f'    name: {json.dumps(s["name"])},',
        f'    category: {json.dumps(s["category"])},',
        f'    subcategory: {json.dumps(s["subcategory"])},',
        f'    level: {json.dumps(s["level"])},',
        f"    durationMinutes: {s['durationMinutes']},",
    ]
    for num_key in (
        "thresholdMinutes",
        "qualityRunMinutes",
        "runDistanceKm",
        "ergMinutes",
        "bikeMinutes",
        "strengthMinutes",
        "stationVolume",
    ):
        if num_key in s:
            lines.append(f"    {num_key}: {s[num_key]},")
    lines += [
        f"    hardDay: {'true' if s['hardDay'] else 'false'},",
    ]
    if s.get("hardDayReason"):
        lines.append(f'    hardDayReason: {json.dumps(s["hardDayReason"])},')
    lines += [
        f'    intensityType: {json.dumps(s["intensityType"])},',
        f'    impactType: {json.dumps(s["impactType"])},',
        f'    muscularStress: {json.dumps(s["muscularStress"])},',
        f'    stationStress: {json.dumps(s["stationStress"])},',
        f'    equipmentRequired: {json.dumps(s["equipmentRequired"])},',
        f'    bestFor: {json.dumps(s["bestFor"])},',
        f'    avoidIf: {json.dumps(s["avoidIf"])},',
        f'    tags: {json.dumps(s["tags"])},',
    ]
    for opt in (
        "isStaple",
        "isOptionalAddOn",
        "preferredDay",
        "avoidDayBefore",
        "avoidDayAfter",
        "similarSessions",
        "progressionOptions",
        "regressionOptions",
    ):
        if opt in s:
            lines.append(f"    {opt}: {json.dumps(s[opt])},")
    lines += [
        f'    editableVariables: {json.dumps(s["editableVariables"])},',
        f"    prescription: {s['prescription']},",
        "  })",
    ]
    return "\n".join(lines)


def S(
    id: str,
    lib: str,
    name: str,
    cat: str,
    sub: str,
    level: str,
    dur: int,
    hard: bool,
    intensity: str,
    impact: str,
    m_stress: str,
    s_stress: str,
    equip: list[str],
    best: list[str],
    avoid: list[str],
    tags: list[str],
    edit: list[str],
    rx_json: str,
    **kw,
) -> dict:
    d = {
        "id": id,
        "sessionLibraryId": lib,
        "name": name,
        "category": cat,
        "subcategory": sub,
        "level": level,
        "durationMinutes": dur,
        "hardDay": hard,
        "intensityType": intensity,
        "impactType": impact,
        "muscularStress": m_stress,
        "stationStress": s_stress,
        "equipmentRequired": equip,
        "bestFor": best,
        "avoidIf": avoid,
        "tags": tags,
        "editableVariables": edit,
        "prescription": rx_json,
    }
    d.update(kw)
    return d


W = ["10 min easy", "Strides / mobility"]
WE = ["8 min easy"]
WR = ["Rep paces", "RPE", "HR if used"]

SESSIONS: list[dict] = [
    # 1–10 threshold_runs
    S("th-5x5", "hyrox_run_threshold_6x6", "Threshold Run — 5 x 5 Minutes", "threshold_runs", "threshold_intervals", "intermediate", 60, True, "threshold", "run", "moderate", "none", ["Track / treadmill"], ["block_1", "threshold_intro"], ["consecutive_hard_days", "calf_pain"], ["threshold", "run"], ["reps", "repDurationMinutes", "recoverySeconds", "targetPace", "targetRPE", "coachNote"], rx("Controlled threshold — finish with one rep spare.", W, ["5×5 min @ threshold", "90s easy jog between"], WE, WR, "Key progression: 5×5 → 6×5 → 6×6.", targetRPE="7–8", progression="Progress reps before pace."), thresholdMinutes=25, runDistanceKm=9, hardDayReason="Threshold run intervals", preferredDay="Tue", similarSessions=["th-6x5", "th-6x6", "th-3x10", "cruise-1k"], progressionOptions=["5×5 → 6×5 → 6×6"], regressionOptions=["4×4 min @ threshold"]),
    S("th-6x5", "coach_th-6x5", "Threshold Run — 6 x 5 Minutes", "threshold_runs", "threshold_intervals", "intermediate", 65, True, "threshold", "run", "moderate", "none", ["Track / treadmill"], ["week_2_progression"], ["poor_recovery"], ["threshold"], ["reps", "recoverySeconds", "targetPace"], rx("Week-2 threshold progression.", W, ["6×5 min @ threshold", "75–90s easy recovery"], WE, WR, "Reduce recovery before increasing pace.", targetRPE="7–8"), thresholdMinutes=30, runDistanceKm=10, hardDayReason="Threshold run intervals", preferredDay="Tue", similarSessions=["th-5x5", "th-6x6"]),
    S("th-6x6", "hyrox_run_threshold_6x6", "Threshold Run — 6 x 6 Minutes", "threshold_runs", "threshold_intervals", "advanced", 70, True, "threshold", "run", "moderate", "none", ["Track / treadmill"], ["staple_threshold"], ["beginner"], ["threshold", "staple"], ["reps", "recoverySeconds", "targetPace"], rx("Staple threshold — even splits all reps.", W, ["6×6 min @ threshold", "60–75s easy between"], WE, WR, "Intermediate/advanced staple.", targetRPE="7–8"), thresholdMinutes=36, runDistanceKm=11, hardDayReason="Threshold run intervals", isStaple=True, preferredDay="Tue", similarSessions=["th-5x5", "th-6x5"]),
    S("th-3x10", "hyrox_run_threshold_3x10", "Threshold Run — 3 x 10 Minutes", "threshold_runs", "threshold_blocks", "intermediate", 70, True, "threshold", "run", "moderate", "none", ["Track"], ["block_2"], ["heavy_legs_day_before"], ["threshold"], ["reps", "recoverySeconds", "targetPace"], rx("Longer threshold blocks for durability.", ["12 min easy", "Strides"], ["3×10 min @ threshold", "90–120s easy between"], ["10 min easy"], ["Split times", "RPE"], "Stay controlled early.", targetRPE="7–8"), thresholdMinutes=30, runDistanceKm=10, hardDayReason="Long threshold blocks", similarSessions=["th-2x15", "continuous-th"]),
    S("th-2x15", "coach_th-2x15", "Threshold Run — 2 x 15 Minutes", "threshold_runs", "threshold_blocks", "advanced", 75, True, "threshold", "run", "high", "none", ["Track"], ["advanced"], ["beginner", "high_threshold_week"], ["threshold", "advanced"], ["recoverySeconds", "targetPace"], rx("Advanced sustained threshold.", ["12 min easy"], ["2×15 min @ threshold", "90–120s easy"], ["10 min easy"], ["Block paces", "RPE"], "Do not start rep 1 too fast.", targetRPE="7–8"), thresholdMinutes=30, runDistanceKm=11, hardDayReason="Sustained threshold"),
    S("cruise-1k", "coach_cruise-1k", "Cruise Intervals — 5–8 x 1km", "threshold_runs", "distance_threshold", "intermediate", 65, True, "threshold", "run", "moderate", "none", ["Measured 1km loop"], ["distance_based_athletes"], [], ["threshold", "cruise"], ["reps", "targetPace"], rx("Distance-based threshold reps.", W, ["5–8×1km @ threshold/10km effort", "60–90s easy"], WE, ["Km splits", "RPE"], "TH minutes estimated from pace.", targetPace="Threshold / 10km", targetRPE="7–8"), thresholdMinutes=28, runDistanceKm=10, hardDayReason="Distance threshold", similarSessions=["th-5x5", "mile-repeats"]),
    S("mile-repeats", "coach_mile-repeats", "Mile Repeats — 3–5 x 1 Mile", "threshold_runs", "distance_threshold", "advanced", 70, True, "threshold", "run", "moderate", "none", ["Track"], ["strong_runners"], ["beginner"], ["threshold", "mile"], ["reps", "targetPace"], rx("Longer threshold mile reps.", ["12 min easy"], ["3–5×1 mile @ threshold", "1–2 min easy"], ["10 min easy"], ["Mile splits"], "Calculated TH from pace.", targetRPE="7–8"), thresholdMinutes=27, runDistanceKm=12, hardDayReason="Mile threshold"),
    S("continuous-th", "coach_continuous-th", "Continuous Threshold — 20–30 Minutes", "threshold_runs", "continuous_threshold", "advanced", 60, True, "threshold", "run", "moderate", "none", ["Running surface"], ["advanced"], ["races_threshold", "hr_drift"], ["threshold", "continuous"], ["repDurationMinutes", "targetPace"], rx("Continuous threshold block.", W, ["20–30 min continuous @ threshold"], WE, ["Avg pace", "HR", "RPE"], "Avoid if athlete races threshold.", targetRPE="7–8", safetyNote="Stop if pace drops >5%."), thresholdMinutes=25, runDistanceKm=9, hardDayReason="Continuous threshold"),
    S("threshold-hills", "coach_threshold-hills", "Threshold Hills — 10 x 2 Minutes", "threshold_runs", "hill_threshold", "intermediate", 55, True, "threshold", "run", "moderate", "none", ["Hill 2–4%"], ["lower_mileage"], ["calf_flare"], ["threshold", "hills"], ["reps", "recoverySeconds"], rx("Effort-based hill threshold.", ["10 min easy", "Hill strides"], ["10×2 min uphill @ TH effort", "Jog down recovery"], ["8 min easy flat"], ["Effort", "RPE"], "Not pace-based.", targetRPE="7–8 effort"), thresholdMinutes=20, runDistanceKm=7, hardDayReason="Hill threshold"),
    S("double-th-intro", "coach_double-th-intro", "Double Threshold Intro — Run + Erg", "threshold_runs", "double_threshold", "advanced", 90, True, "threshold", "mixed", "high", "none", ["Track", "SkiErg or RowErg"], ["double_ready"], ["beginner", "not_ready_single_th"], ["double", "threshold"], ["reps", "ergModality", "recoverySeconds"], rx("Double threshold — advanced only.", ["10 min easy run", "5 min easy erg"], ["AM: 5–6×3 min TH run · 60s rest", "PM: 8–12×1 min Ski/Row TH · 30s rest"], ["5 min easy each"], ["Run paces", "Erg splits", "RPE AM/PM"], "Only after single TH established.", targetRPE="7–8", safetyNote="Skip PM if AM RPE >8."), thresholdMinutes=26, qualityRunMinutes=15, ergMinutes=10, runDistanceKm=6, hardDayReason="Double threshold"),
    # 11–14 tempo_aerobic
    S("hm-tempo-3x10", "hyrox_run_tempo_hm", "HM Pace Tempo — 3 x 10 Minutes", "tempo_aerobic", "hm_tempo", "intermediate", 55, True, "tempo", "run", "moderate", "none", ["Track"], ["aerobic_quality", "double_ready_thursday_am"], ["already_high_threshold_week"], ["tempo", "hm"], ["reps", "recoverySeconds", "targetPace", "targetRPE"], rx("HM tempo — below threshold unless HR drifts.", W, ["3×10 min @ HM pace / upper steady", "2 min easy between"], WE, ["Rep pace", "HR", "RPE"], "Optional secondary quality — not replacement for Tue TH.", targetRPE="6–7"), qualityRunMinutes=30, runDistanceKm=9, hardDayReason="Tempo / aerobic quality"),
    S("alternating-tempo", "coach_alternating-tempo", "Alternating Tempo — 5 x 6 Minutes", "tempo_aerobic", "alternating_tempo", "intermediate", 55, True, "tempo", "run", "moderate", "none", ["Track"], ["overcook_tempo"], [], ["tempo"], ["reps", "targetRPE"], rx("Alternating steady/tempo blocks.", W, ["5×6 min: 3 min steady / 3 min tempo"], WE, ["Block RPE", "Pace"], "Best for athletes who overcook tempo.", targetRPE="6–7"), qualityRunMinutes=30, runDistanceKm=8, hardDayReason="Tempo quality"),
    S("progressive-tempo", "coach_progressive-tempo", "Progressive Tempo Run", "tempo_aerobic", "progression_tempo", "all", 50, True, "tempo", "run", "moderate", "none", ["Running surface"], ["aerobic_quality"], ["poor_recovery"], ["tempo", "progression"], ["repDurationMinutes", "targetRPE"], rx("Progression easy → steady → tempo.", ["10 min easy"], ["30–45 min progression run"], WE, ["Avg pace", "RPE", "HR"], "Aerobic quality without sharp intervals.", targetRPE="6–7 building"), qualityRunMinutes=25, runDistanceKm=8, hardDayReason="Progressive tempo"),
    S("tempo-strides", "coach_tempo-strides", "Tempo + Strides", "tempo_aerobic", "tempo_strides", "intermediate", 50, True, "tempo", "run", "low", "none", ["Track"], ["running_economy"], [], ["tempo", "strides"], ["repDurationMinutes", "targetRPE"], rx("Controlled tempo plus strides.", W, ["20–30 min controlled tempo", "4–6×20s strides"], WE, ["Tempo pace", "Stride quality"], "Economy and controlled quality.", targetRPE="6–7"), qualityRunMinutes=25, runDistanceKm=7, hardDayReason="Tempo + strides"),
    # 15–17 run_development (5k pace)
    S("5k-8x3", "hyrox_run_5k_pace_8x3", "8 x 3 Minutes @ 5km Pace", "run_development", "5k_pace_intervals", "advanced", 60, True, "quality", "run", "moderate", "none", ["Track"], ["block_3", "sharpening"], ["poor_recovery"], ["5k_pace", "intervals"], ["reps", "recoverySeconds", "targetPace"], rx("5k pace intervals — stop if pace drops.", ["12 min easy", "Strides"], ["8×3 min @ 5k pace", "90s easy"], ["10 min easy"], ["Rep paces", "RPE", "Form breakdown Y/N"], "Progress 8→10 reps; rest 90→45s.", targetRPE="8–9", progression="8 reps → 10 reps."), qualityRunMinutes=24, runDistanceKm=9, hardDayReason="5k pace intervals", progressionOptions=["8→10 reps", "90s→45s rest"]),
    S("10x400-fast", "coach_10x400-fast", "10 x 400m Controlled Fast", "run_development", "speed_endurance", "intermediate", 50, True, "quality", "run", "moderate", "none", ["Track"], ["speed_economy"], ["beginner"], ["400m", "speed"], ["reps", "targetPace"], rx("Controlled fast 400s without huge volume.", W, ["10×400m @ 5k/3k controlled", "60s easy"], WE, ["400 splits", "RPE"], "Faster economy work.", targetRPE="8"), qualityRunMinutes=18, runDistanceKm=7, hardDayReason="Speed intervals"),
    S("5x1km-10k", "coach_5x1km-10k", "5 x 1km @ 10km Pace", "run_development", "10k_pace", "intermediate", 55, True, "quality", "run", "moderate", "none", ["Track"], ["bridge_tempo_speed"], [], ["10k_pace"], ["reps", "targetPace"], rx("Bridge tempo and faster work.", W, ["5×1km @ 10km pace", "90s easy"], WE, ["Km splits"], "Controlled — not all-out.", targetRPE="7–8"), qualityRunMinutes=20, runDistanceKm=8, hardDayReason="10k pace reps"),
    # 18–21 erg_intervals
    S("ski-th", "hyrox_erg_ski_threshold_8x4", "SkiErg Threshold — 8 x 4 Minutes", "erg_intervals", "ski_threshold", "intermediate", 50, True, "threshold", "erg", "moderate", "none", ["SkiErg"], ["running_limited", "ski_weakness"], ["shoulder_niggle"], ["ski", "threshold"], ["reps", "repDurationMinutes", "recoverySeconds", "targetSplit"], rx("Ski threshold — low run impact.", ["5 min easy ski", "Shoulder prep"], ["8×4 min @ ski threshold", "60–90s easy"], ["5 min easy ski"], ["Avg split", "Watts", "RPE"], "~5s/500m faster than race if HR supports.", targetRPE="7–8"), thresholdMinutes=32, ergMinutes=45),
    S("row-th", "hyrox_erg_row_threshold_8x4", "RowErg Threshold — 8 x 4 Minutes", "erg_intervals", "row_threshold", "intermediate", 50, True, "threshold", "erg", "moderate", "none", ["RowErg"], ["row_weakness", "pm_threshold_option"], ["low_back_flare"], ["row", "threshold"], ["reps", "targetSplit"], rx("Row threshold for station durability.", ["5 min easy row"], ["8×4 min @ row threshold", "60–90s easy"], ["5 min easy row"], ["500m splits", "RPE"], "PM option for advanced if spaced.", targetRPE="7–8"), thresholdMinutes=32, ergMinutes=45),
    S("mixed-erg-th", "coach_mixed-erg-th", "Ski/Row Mixed Threshold", "erg_intervals", "mixed_threshold", "intermediate", 50, True, "threshold", "erg", "moderate", "none", ["SkiErg", "RowErg"], ["engine_no_run_impact"], [], ["ski", "row", "threshold"], ["reps", "ergModality"], rx("Mixed erg threshold.", ["5 min each easy"], ["4×4 min Ski + 4×4 min Row", "60s recovery"], ["5 min easy"], ["Splits each modality"], "Engine without run damage.", targetRPE="7–8"), thresholdMinutes=32, ergMinutes=45),
    S("bike-th", "coach_bike-th", "Bike Threshold — 5 x 5 Minutes", "erg_intervals", "bike_threshold", "intermediate", 45, True, "threshold", "bike", "moderate", "none", ["Bike"], ["injured", "low_impact_threshold"], [], ["bike", "threshold"], ["reps", "recoverySeconds"], rx("Bike threshold without impact.", ["5 min easy spin"], ["5×5 min bike threshold", "2 min easy"], ["5 min easy"], ["Power/HR", "RPE"], "For athletes needing TH without run.", targetRPE="7–8"), thresholdMinutes=25, bikeMinutes=40),
    # 22–27 easy_erg
    S("mixed-erg-easy", "hyrox_erg_mixed_aerobic", "Mixed Erg Aerobic", "easy_erg", "mixed_z2", "all", 90, False, "easy", "erg", "low", "none", ["SkiErg", "RowErg", "Bike"], ["high_volume_aerobic"], ["needs_run_skill"], ["z2", "mixed_erg"], ["durationMinutes", "targetRPE"], rx("High-volume Z1/low Z2 mixed erg.", ["3 min each easy"], ["3 rounds: 15 min bike · 10 min row · 5 min ski @ easy"], ["5 min easy"], ["Duration", "RPE"], "True easy — not sneaky threshold.", targetRPE="2–4"), ergMinutes=90, bikeMinutes=45),
    S("gym-aerobic-upper", "hyrox_gym_aerobic_upper_grip", "Easy Gym Aerobic + Upper/Grip", "easy_erg", "gym_aerobic_upper", "all", 75, False, "easy", "mixed", "low", "low", ["Bike", "SkiErg", "DBs", "Pull-up bar"], ["monday_friday_support"], [], ["z2", "upper", "grip"], ["durationMinutes", "upperAddOn"], rx("Easy aerobic + upper/grip support.", ["5 min easy"], ["45–75 min easy bike/ski/row", "10 min upper EMOM: pull-ups / push-ups", "DB grip holds"], ["Stretch"], ["Duration", "RPE", "Grip hold time"], "Monday/Friday support — optional add-on OK.", targetRPE="2–4"), ergMinutes=50, bikeMinutes=45, strengthMinutes=10, isOptionalAddOn=True),
    S("easy-bike", "hyrox_erg_bike_z2", "Easy Bike Z2", "easy_erg", "bike_z2", "all", 60, False, "easy", "bike", "low", "none", ["Bike"], ["recovery_support", "doubles"], [], ["bike", "z2"], ["durationMinutes", "targetRPE"], rx("Easy bike aerobic.", ["5 min easy spin"], ["45–90 min Z1/low Z2 cycling"], ["5 min easy"], ["Duration", "HR", "RPE"], "Scale Z1 vs Z2 to weekly hours.", targetRPE="2–4"), bikeMinutes=60),
    S("easy-ski-row", "coach_easy-ski-row", "Easy Ski/Row Aerobic", "easy_erg", "easy_ski_row", "all", 55, False, "easy", "erg", "low", "none", ["SkiErg", "RowErg"], ["easy_day"], [], ["z2", "ski", "row"], ["durationMinutes", "targetRPE"], rx("Easy ski/row aerobic.", ["3 min each easy"], ["40–75 min easy ski/row split"], ["5 min easy"], ["Duration", "Splits", "RPE"], "Conversational effort.", targetRPE="2–4"), ergMinutes=55),
    S("long-bike", "coach_long-bike", "Long Bike Z2", "easy_erg", "long_bike", "advanced", 120, False, "easy", "bike", "low", "none", ["Bike"], ["high_volume_support"], ["fatigued_legs"], ["bike", "long"], ["durationMinutes"], rx("Long low-impact aerobic.", ["5 min easy"], ["90–150 min bike Z1/low Z2"], ["5 min easy"], ["Duration", "Fuel", "RPE"], "Fueling practice for pros.", targetRPE="2–4"), bikeMinutes=120),
    S("recovery-flush", "coach_recovery-flush", "Recovery Flush", "easy_erg", "recovery", "all", 35, False, "easy", "erg", "low", "none", ["Bike", "SkiErg", "RowErg"], ["recovery_days"], ["complete_rest_prescribed"], ["recovery"], ["durationMinutes"], rx("Very easy flush — feel better after.", ["Mobility 5 min"], ["25–45 min very easy rotating erg"], ["Stretch"], ["RPE", "Leg feel after"], "RPE 1–2 only.", targetRPE="1–2"), ergMinutes=30, bikeMinutes=15),
    # 28–32 upper_grip
    S("pull-push-emom", "coach_pull-push-emom", "Pull-Up + Push-Up EMOM", "upper_grip", "upper_emom", "all", 15, False, "steady", "strength", "low", "low", ["Pull-up bar"], ["upper_support"], ["shoulder_injury"], ["emom", "upper"], ["reps", "load"], rx("Quick upper density add-on.", ["Band shoulders"], ["10 min EMOM: min1 6–8 pull-ups · min2 15–20 push-ups"], ["Stretch"], ["Reps completed"], "Scale assisted pull-ups / incline push-ups.", targetRPE="6"), strengthMinutes=10, stationVolume=10, isOptionalAddOn=True),
    S("grip-holds", "hyrox_gym_aerobic_upper_grip", "Heavy DB Grip Holds", "upper_grip", "grip", "all", 20, False, "steady", "strength", "moderate", "low", ["Heavy DBs"], ["grip_carry_weakness"], ["grip_injury"], ["grip"], ["sets", "holdSeconds", "load"], rx("Grip capacity above race weight where safe.", ["Wrist warm-up"], ["4–5×45–60s heavy DB holds", "Rest 60–90s"], ["Stretch forearms"], ["Load", "Hold time", "RPE"], "Heavier than farmer race weight if possible.", targetLoad="Above race farmer weight"), strengthMinutes=15, stationVolume=5),
    S("carry-grip", "coach_carry-grip", "Carry + Grip Builder", "upper_grip", "carry_grip", "intermediate", 35, False, "steady", "strength", "moderate", "moderate", ["Farmer handles", "DBs"], ["carry_weakness"], [], ["carry", "grip"], ["rounds", "load", "distanceM"], rx("Carry and grip combined.", ["Light carries"], ["4 rounds: 40–60m farmer carry · 45s DB hold · 90s rest"], ["Stretch"], ["Load", "Distance", "Grip failure"], "Record grip failure point.", targetRPE="7"), strengthMinutes=30, stationVolume=4, runDistanceKm=0),
    S("sled-pull-upper", "coach_sled-pull-upper", "Sled Pull Upper Support", "upper_grip", "sled_pull_support", "intermediate", 45, False, "steady", "strength", "moderate", "low", ["Cable", "DBs", "Rope"], ["sled_pull_limiter"], [], ["sled_pull", "upper"], ["sets", "reps", "load"], rx("Upper support for sled pull.", ["Band shoulders"], ["Lat pulldown 4×10", "Seated row 4×10", "Rope pulls 5×20–30s", "DB holds 3×max"], ["Stretch"], ["Loads", "Hold times"], "Sled pull / grip-limited athletes.", targetRPE="6–7"), strengthMinutes=40),
    S("upper-support", "coach_upper-support", "Upper Strength Support", "upper_grip", "upper_support", "all", 45, False, "steady", "strength", "moderate", "none", ["Gym"], ["general_upper"], ["day_before_wb_max"], ["upper"], ["exercises", "sets", "reps"], rx("Moderate upper — don't compromise WB/sled.", ["Band prep"], ["Pull · push · shoulder accessory · core/bracing — higher reps"], ["Stretch"], ["Loads", "RPE"], "Should not compromise wall ball sessions.", targetRPE="6–7"), strengthMinutes=40),
    # 33–39 strength_endurance
    S("legs", "hyrox_strength_heavy_legs", "Lower Strength Endurance — Hyrox Legs", "strength_endurance", "lower_strength_endurance", "all", 65, True, "steady", "strength", "high", "moderate", ["Gym", "Sandbag", "Sled optional"], ["sled_lunge_wb_durability"], ["day_before_threshold"], ["legs", "staple"], ["sets", "reps", "tempo", "load", "coachNote"], rx("Hyrox leg endurance — tempo reps not max strength.", ["Activation", "Light squat pattern"], ["A: Tempo hack/squat 4×8–10 · 3s lower", "B: RDL 4×8", "C: Sandbag lunges 3×20–30m", "D: Quad extension 3×15–20", "E: Calf iso 3–4×30–45s"], ["Stretch quads/calves"], ["Loads", "RPE", "Lunge breaks"], "Thursday staple — hard due to local fatigue.", targetRPE="7", safetyNote="Avoid DOMS before key runs."), strengthMinutes=55, stationVolume=12, isStaple=True, preferredDay="Thu", hardDayReason="Lower-body strength endurance"),
    S("hack-squat-focus", "coach_hack-squat-focus", "Tempo Hack Squat Focus", "strength_endurance", "hack_squat", "intermediate", 50, True, "steady", "strength", "high", "moderate", ["Hack squat", "Calf machine"], ["sled_lunge_wb"], [], ["hack_squat"], ["sets", "reps", "tempo"], rx("Hack squat eccentric focus.", ["Light sets"], ["5×8 hack squat @ 3s eccentric", "Superset calf raises", "3×20 quad extensions"], ["Stretch"], ["Load", "RPE"], "Sled/lunge/WB leg endurance.", targetRPE="7"), strengthMinutes=45, stationVolume=8, hardDayReason="Leg strength endurance"),
    S("lunge-durability", "coach_lunge-durability", "Lunge Durability Session", "strength_endurance", "lunge_durability", "intermediate", 50, True, "steady", "strength", "high", "high", ["Sandbag"], ["lunge_weakness"], ["knee_pain"], ["lunge"], ["sets", "distanceM", "load"], rx("Lunge-specific durability.", ["Lunge pattern prep"], ["4–6×20–30m sandbag lunges · 90s rest", "Reverse lunges 3×10/side", "Calf iso 3×45s"], ["Hip stretch"], ["Breaks", "Load", "RPE"], "Walk lunges if form breaks.", targetRPE="7–8"), strengthMinutes=45, stationVolume=6, hardDayReason="Lunge volume"),
    S("sled-support-strength", "coach_sled-support-strength", "Sled Support Strength", "strength_endurance", "sled_strength", "intermediate", 55, True, "steady", "strength", "high", "high", ["Sled", "Leg press"], ["sled_weakness"], ["low_back_acute"], ["sled"], ["rounds", "load"], rx("Sled-specific strength volume.", ["Empty sled pushes"], ["Heavy sled push 6×12.5m", "Sled pull 6×12.5m", "Leg press 3×15", "Calf/quad finisher"], ["Walk"], ["Load", "Times", "RPE"], "Frequent sled exposure.", targetRPE="7–8"), strengthMinutes=50, stationVolume=12, hardDayReason="Sled strength"),
    S("quad-calf", "coach_quad-calf", "Quad + Calf Durability", "strength_endurance", "quad_calf", "all", 45, True, "steady", "strength", "moderate", "low", ["Gym"], ["quad_calf_breakdown"], [], ["quad", "calf"], ["sets", "reps"], rx("Quad and calf durability.", ["Light bike 5 min"], ["Spanish squat 4×45s", "Quad extension 4×20", "Seated calf 4×15–20", "Calf iso 3×45s"], ["Calf stretch"], ["RPE", "Hold times"], "Late-race leg support.", targetRPE="6–7"), strengthMinutes=40),
    S("posterior-chain", "coach_posterior-chain", "Posterior Chain Support", "strength_endurance", "posterior", "intermediate", 50, True, "steady", "strength", "moderate", "none", ["Gym"], ["posterior_chain"], [], ["hinge"], ["sets", "reps", "load"], rx("Posterior chain support.", ["Hinge prep"], ["RDL/hinge 4×8", "Ham curl 3×12–15", "Back extension 3×12", "Calf accessory"], ["Stretch"], ["Loads", "RPE"], "Moderate hard session.", targetRPE="6–7"), strengthMinutes=45, hardDayReason="Posterior chain work"),
    S("full-body-se", "coach_full-body-se", "Full-Body Strength Endurance", "strength_endurance", "full_body", "all", 55, True, "steady", "strength", "moderate", "low", ["Gym"], ["limited_days"], [], ["full_body"], ["exercises", "sets", "reps"], rx("Full-body strength endurance circuit.", ["Movement prep"], ["Squat/lunge · hinge · push/pull · core/grip — higher reps, controlled rest"], ["Mobility"], ["Loads", "RPE"], "Good when time-limited.", targetRPE="6–7"), strengthMinutes=50),
    # 40–48 station_emom
    S("wb-emom", "hyrox_compromised_run_wallballs", "Wall Ball EMOM", "station_emom", "wall_ball_emom", "all", 15, True, "race_pace", "mixed", "moderate", "high", ["Wall ball"], ["wall_ball_weakness"], ["shoulder_pain"], ["emom", "wall_ball"], ["reps", "durationMinutes"], rx("Wall ball density EMOM.", ["WB technique"], ["10 min EMOM × 10–15 wall balls"], ["Shoulder mobility"], ["Reps per min", "Breaks"], "Progress 10×10 → 10×12 → 12×12.", progression="10×10 → 12×12 → deload 8×10"), stationVolume=120, stationStress="high", isOptionalAddOn=True),
    S("wb-density", "coach_wb-density", "Wall Ball Density Builder", "station_emom", "wall_ball_density", "intermediate", 25, True, "race_pace", "strength", "moderate", "high", ["Wall ball"], ["wb_strategy"], [], ["wall_ball", "density"], ["rounds", "reps", "restSeconds"], rx("Wall ball density rounds.", ["WB warm-up"], ["5 rounds: 20 wall balls · 60s rest"], ["Stretch"], ["Reps", "Rest used"], "Reduce rest / increase reps over block.", targetRPE="7–8"), stationVolume=100, stationStress="high"),
    S("wb-under-fatigue", "coach_wb-under-fatigue", "Wall Balls Under Fatigue", "station_emom", "wall_ball_fatigue", "intermediate", 35, True, "race_pace", "mixed", "high", "high", ["Wall ball", "RowErg"], ["wb_breathing_limiter"], [], ["wall_ball", "row"], ["rounds", "reps"], rx("WB when breathing is limiter.", ["Easy row"], ["3–4 rounds: 500m row · 25 wall balls · 90s rest"], ["Easy bike"], ["WB breaks", "Row split"], "Breathing control on WB.", targetRPE="7–8"), stationVolume=100, ergMinutes=15, stationStress="high"),
    S("bbj-emom", "hyrox_compromised_sled_burpee", "Burpee Broad Jump EMOM", "station_emom", "bbj_emom", "intermediate", 15, True, "race_pace", "mixed", "moderate", "moderate", ["Floor space"], ["bbj_weakness"], ["low_back_acute"], ["burpee", "emom"], ["reps", "durationMinutes"], rx("BBJ rhythm EMOM.", ["Hip hinge prep"], ["10–12 min EMOM: min1 6–10 BBJ · min2 walk/reset"], ["Stretch"], ["Reps", "Rhythm"], "Confidence and rhythm.", targetRPE="7"), stationVolume=80, stationStress="moderate", isOptionalAddOn=True),
    S("burpee-volume", "coach_burpee-volume", "Burpee Volume Builder", "station_emom", "burpee_volume", "intermediate", 25, True, "race_pace", "mixed", "high", "moderate", ["Floor space"], ["burpee_weakness"], [], ["burpee"], ["rounds", "distanceM"], rx("BBJ volume progression.", ["Movement prep"], ["5×20m BBJ · 60–90s rest"], ["Walk"], ["Times", "RPE"], "Progress 20m → 30m → 40m.", progression="20m → 30m → 40m"), stationVolume=100, stationStress="moderate"),
    S("lunge-emom", "coach_lunge-emom", "Sandbag Lunge EMOM", "station_emom", "lunge_emom", "intermediate", 15, False, "steady", "strength", "moderate", "moderate", ["Sandbag"], ["lunge_tolerance"], ["knee_pain"], ["lunge", "emom"], ["durationSeconds", "load"], rx("Lunge EMOM without chaos.", ["Lunge pattern"], ["10 min EMOM: 20–30s sandbag lunges each minute"], ["Hip stretch"], ["Reps", "Load"], "Controlled technique.", targetRPE="6–7"), stationVolume=10, stationStress="moderate", isOptionalAddOn=True),
    S("sled-density", "hyrox_strength_lower_sled", "Sled Density Repeats", "station_emom", "sled_density", "intermediate", 30, True, "steady", "strength", "high", "high", ["Sled"], ["sled_exposure"], ["low_back_acute"], ["sled", "density"], ["rounds", "load"], rx("Frequent sled exposure.", ["Empty sled"], ["Every 2 min × 5–8: 12.5m sled push or pull"], ["Walk"], ["Load", "Times"], "Technique and density.", targetRPE="7–8"), stationVolume=8, stationStress="high"),
    S("mixed-station-emom", "coach_mixed-station-emom", "Mixed Station EMOM", "station_emom", "mixed_emom", "intermediate", 20, True, "race_pace", "mixed", "moderate", "moderate", ["Wall ball", "Floor", "DBs", "SkiErg"], ["mixed_station"], [], ["emom", "mixed"], ["durationMinutes"], rx("Mixed station exposure.", ["Movement prep"], ["16 min EMOM: WB · burpees · farmer hold · easy ski"], ["Stretch"], ["Reps per station"], "Attach to hard days.", targetRPE="7"), stationVolume=16, stationStress="moderate", isOptionalAddOn=True),
    S("carry-wb-density", "coach_carry-wb-density", "Carry + Wall Ball Density", "station_emom", "carry_wb", "intermediate", 30, True, "race_pace", "mixed", "high", "high", ["Farmers", "Wall ball"], ["grip_wb_fatigue"], [], ["carry", "wall_ball"], ["rounds", "load"], rx("Grip plus wall ball fatigue.", ["Light carry"], ["4 rounds: 100m farmer carry · 20 wall balls · 90s rest"], ["Grip stretch"], ["Load", "WB breaks"], "Record grip failure.", targetRPE="7–8"), stationVolume=80, stationStress="high"),
    # 49–60 hyrox_compromised
    S("overload", "hyrox_compromised_threshold_run_station_overload", "Threshold Run Into Station Overload", "hyrox_compromised", "saturday_key", "advanced", 65, True, "threshold", "mixed", "high", "high", ["Track", "Stations"], ["saturday_key", "intermediate_ready"], ["beginner", "poor_recovery", "race_week"], ["threshold", "compromised", "staple"], ["reps", "runDistanceM", "station", "stationMinutes", "restSeconds"], rx("Hybrid365 Saturday staple — TH run into station overload.", W, ["Part 1: 8×3 min @ 5k pace · 90s rest", "Part 2: 750m run + 3 min station + 750m run ×2 · 120s between blocks"], ["10 min easy"], ["Run pace drop-off %", "Station reps", "RPE", "Film final 750m"], "Station from athlete weakness.", targetRPE="8–9", progression="8→10 reps; rest 90→45s."), qualityRunMinutes=27, thresholdMinutes=27, runDistanceKm=5, stationVolume=6, isStaple=True, preferredDay="Sat", hardDayReason="Saturday key — threshold into station overload", similarSessions=["run-wb", "run-mixed-stations", "mini-test"], progressionOptions=["8→10×3 min", "90s→45s rest", "750m run blocks"]),
    S("run-wb", "hyrox_compromised_run_wallballs", "Run + Wall Balls Builder", "hyrox_compromised", "run_wall_ball", "intermediate", 55, True, "race_pace", "mixed", "high", "high", ["Track", "Wall ball"], ["wall_ball_weakness"], ["shoulder_pain"], ["compromised", "wall_ball"], ["rounds", "runDistanceM", "stationReps"], rx("Run after wall ball fatigue.", ["Easy jog", "WB prep"], ["4 rounds: 800m run · 25 wall balls · 90s rest"], ["8 min easy"], ["Run splits", "WB breaks"], "Progress reps/rest/run distance.", targetRPE="7–8", progression="More reps · less rest · 1km runs."), runDistanceKm=4, stationVolume=100, hardDayReason="Compromised running", similarSessions=["wb-under-fatigue", "overload", "run-mixed-stations"]),
    S("run-sled-push", "coach_run-sled-push", "Run + Sled Push Builder", "hyrox_compromised", "run_sled_push", "intermediate", 55, True, "race_pace", "mixed", "high", "high", ["Track", "Sled"], ["sled_push"], ["low_back_acute"], ["sled", "compromised"], ["rounds", "load"], rx("Run after sled push.", ["Jog", "Empty sled"], ["4 rounds: 600–800m run · 12.5–25m sled push · 90s rest"], ["Easy jog"], ["Run splits", "Sled feel"], "Progress race load and run distance.", targetRPE="7–8"), runDistanceKm=3.5, stationVolume=4),
    S("run-sled-pull", "coach_run-sled-pull", "Run + Sled Pull Builder", "hyrox_compromised", "run_sled_pull", "intermediate", 55, True, "race_pace", "mixed", "high", "high", ["Track", "Sled"], ["sled_pull"], [], ["sled_pull", "compromised"], ["rounds", "load"], rx("Sled pull then run rhythm.", ["Jog", "Sled prep"], ["4 rounds: 600–800m run · 12.5–25m sled pull · 90s rest"], ["Easy jog"], ["Run splits", "Pull time"], "Race-load progression.", targetRPE="7–8"), runDistanceKm=3.5, stationVolume=4),
    S("run-burpee", "coach_run-burpee", "Run + Burpee Builder", "hyrox_compromised", "run_burpee", "intermediate", 50, True, "race_pace", "mixed", "high", "moderate", ["Track", "Floor"], ["burpee_weakness"], [], ["burpee", "compromised"], ["rounds", "distanceM"], rx("BBJ then run.", ["Jog"], ["4 rounds: 600m run · 20–30m BBJ · 90s rest"], ["Easy jog"], ["Run splits", "BBJ pace"], "Progress to 800m / 40m BBJ.", progression="600m/20m → 800m/40m"), runDistanceKm=3, stationVolume=120),
    S("run-lunges", "hyrox_compromised_run_lunges", "Run + Lunges Builder", "hyrox_compromised", "run_lunges", "intermediate", 55, True, "race_pace", "mixed", "high", "high", ["Track", "Sandbag"], ["lunge_weakness"], ["knee_pain"], ["lunges", "compromised"], ["rounds", "distanceM", "load"], rx("Sandbag lunges then run.", ["Jog", "Lunge prep"], ["3–4 rounds: 800m run · 30–40m sandbag lunges · 2 min rest"], ["Easy jog"], ["Lunge breaks", "Run pace"], "Late-race legs focus.", targetRPE="7–8"), runDistanceKm=3.5, stationVolume=4),
    S("run-carry", "coach_run-carry", "Run + Farmer Carry Builder", "hyrox_compromised", "run_carry", "intermediate", 50, True, "race_pace", "mixed", "high", "moderate", ["Track", "Farmers"], ["carry_weakness"], ["grip_injury"], ["carry", "compromised"], ["rounds", "load"], rx("Carry then run — grip and pace drop-off.", ["Light carry"], ["4 rounds: 600m run · 100m carry · 90s rest"], ["Stretch grip"], ["Grip failure", "Run splits"], "Record pace drop-off.", targetRPE="7–8"), runDistanceKm=3, stationVolume=4),
    S("run-ski-row", "coach_run-ski-row", "Run + Ski/Row Builder", "hyrox_compromised", "run_erg", "intermediate", 55, True, "race_pace", "mixed", "high", "moderate", ["Track", "SkiErg", "RowErg"], ["erg_fatigue"], [], ["ski", "row", "compromised"], ["rounds", "ergModality"], rx("Erg fatigue into run rhythm.", ["Easy jog"], ["4 rounds: 800m run · 500m Ski/Row · 90s rest"], ["Easy jog"], ["Erg splits", "Run splits"], "Erg fatigue into running.", targetRPE="7–8"), runDistanceKm=4, ergMinutes=20),
    S("mini-test", "hyrox_compromised_mini_test", "Mini Hyrox Compromised Test", "hyrox_compromised", "mini_test", "intermediate", 50, True, "race_pace", "mixed", "high", "high", ["Track", "Sandbag", "Wall ball"], ["testing", "benchmark"], ["taper", "injury"], ["test", "compromised"], ["stationReps", "runDistanceM"], rx("Standardised compromised benchmark.", ["10 min easy", "Station prep"], ["1km run · 40m lunges · 40m BBJ · 1km run"], ["10 min easy"], ["Total time", "Run splits", "Drop-off %", "RPE"], "Film final 1km split.", targetRPE="8–9"), runDistanceKm=2.4, stationVolume=80, hardDayReason="Benchmark test"),
    S("half-hyrox", "coach_half-hyrox", "Half Hyrox Simulation", "hyrox_compromised", "simulation", "advanced", 90, True, "race_pace", "mixed", "high", "high", ["Full station kit"], ["race_phase"], ["early_beginner"], ["simulation"], ["rounds", "stations"], rx("Half race simulation.", ["Full warm-up"], ["4×1km run + 4 stations by weakness/phase"], ["Easy flush"], ["Splits", "Station times", "RPE"], "Specific block — not early beginners.", targetRPE="8–9"), runDistanceKm=4, stationVolume=4),
    S("late-race-legs", "coach_late-race-legs", "Late-Race Legs Builder", "hyrox_compromised", "late_race", "advanced", 65, True, "race_pace", "mixed", "high", "high", ["Track", "Sandbag", "Wall ball"], ["late_race_fatigue"], [], ["late_race"], ["rounds"], rx("Late-race leg and WB fatigue.", ["Jog"], ["3 rounds: 1km run · 40m lunges · 30 wall balls · 2–3 min rest"], ["Easy jog"], ["Run splits", "WB breaks"], "Lunge/WB fatigue tolerance.", targetRPE="8"), runDistanceKm=3, stationVolume=90),
    S("run-mixed-stations", "coach_run-mixed-stations", "Run + Mixed Stations Builder", "hyrox_compromised", "mixed_stations", "intermediate", 60, True, "race_pace", "mixed", "high", "high", ["Track", "Stations"], ["flexible_compromised"], [], ["compromised", "template"], ["rounds", "stations", "runDistanceM"], rx("Flexible compromised template.", ["Jog", "Station prep"], ["3–5 rounds: 600–800m run · 2 weakness stations · 90–120s rest"], ["Easy jog"], ["Run splits", "Station times"], "Select stations by weakness.", targetRPE="7–8"), runDistanceKm=4, stationVolume=10, similarSessions=["run-wb", "overload"]),
    # 61–70 testing
    S("parkrun-5k", "hyrox_test_5k_tt", "5km Time Trial", "testing", "run_benchmark", "all", 50, True, "test", "run", "moderate", "none", ["5km route"], ["pace_calculator", "progress"], ["taper", "injury"], ["test", "5k"], ["targetPace"], rx("Primary run benchmark for pace prescription.", ["15 min easy", "Strides"], ["5km time trial — even effort"], ["10 min easy"], ["Total time", "Splits", "Conditions", "RPE"], "Update pace zones after — not every week.", targetRPE="9–10"), runDistanceKm=5, hardDayReason="Benchmark test"),
    S("tt-10k", "coach_tt-10k", "10km Time Trial", "testing", "run_benchmark", "advanced", 70, True, "test", "run", "moderate", "none", ["10km route"], ["threshold_tempo_accuracy"], ["taper"], ["test", "10k"], ["targetPace"], rx("10km benchmark for TH/tempo accuracy.", ["15 min easy"], ["10km TT — even or slight negative split"], ["10 min easy"], ["Time", "Splits", "HR"], "Race pace projection marker.", targetRPE="9"), runDistanceKm=10, hardDayReason="Benchmark test"),
    S("ski-1km-test", "hyrox_test_1k_ski", "1km SkiErg Test", "testing", "erg_benchmark", "all", 35, True, "test", "erg", "moderate", "none", ["SkiErg"], ["ski_threshold_targets"], ["shoulder_injury"], ["test", "ski"], ["targetSplit"], rx("Ski benchmark for erg pacing.", ["5 min easy ski"], ["1000m SkiErg max effort"], ["5 min easy"], ["Time", "Avg split", "Stroke rate"], "Same damper each retest.", targetRPE="9–10"), ergMinutes=15, hardDayReason="Erg benchmark"),
    S("row-1km-test", "hyrox_test_1k_row", "1km RowErg Test", "testing", "erg_benchmark", "all", 35, True, "test", "erg", "moderate", "none", ["RowErg"], ["row_threshold_targets"], ["low_back_acute"], ["test", "row"], ["targetSplit"], rx("Row benchmark for erg pacing.", ["5 min easy row"], ["1000m row max effort"], ["5 min easy"], ["Time", "500m splits", "Drag factor"], "Record drag factor.", targetRPE="9–10"), ergMinutes=15, hardDayReason="Erg benchmark"),
    S("wb-benchmark", "hyrox_test_wallball", "Wall Ball Benchmark", "testing", "station_benchmark", "all", 30, True, "test", "strength", "moderate", "high", ["Wall ball"], ["wall_ball_limiter"], ["shoulder_pain"], ["test", "wall_ball"], ["reps", "load"], rx("Wall ball benchmark.", ["WB technique"], ["100 wall balls for time OR max unbroken at race load"], ["Shoulder mobility"], ["Time", "Reps", "Breaks", "Ball weight"], "Same target height each test.", targetRPE="9"), stationVolume=100, stationStress="high", hardDayReason="Station benchmark"),
    S("sled-benchmark", "hyrox_test_sled", "Sled Push/Pull Benchmark", "testing", "station_benchmark", "all", 40, True, "test", "strength", "high", "high", ["Sled"], ["sled_limiter"], ["low_back_acute"], ["test", "sled"], ["load"], rx("Sled benchmark at race load.", ["Empty sled"], ["50m push + 50m pull @ race load — timed", "2–3 attempts full rest"], ["Walk"], ["Push time", "Pull time", "Surface", "RPE"], "Same surface each test.", targetRPE="9"), stationVolume=2, stationStress="high"),
    S("lunge-benchmark", "hyrox_test_lunge", "Sandbag Lunge Benchmark", "testing", "station_benchmark", "all", 35, True, "test", "strength", "high", "high", ["Sandbag"], ["lunge_limiter"], ["knee_pain"], ["test", "lunge"], ["load", "distanceM"], rx("Lunge benchmark.", ["Lunge pattern"], ["100m timed lunges OR 4×25m repeatability"], ["Hip stretch"], ["Time", "Breaks", "Load"], "Walk steps — no hopping.", targetRPE="8–9"), stationVolume=100, stationStress="high"),
    S("carry-benchmark", "hyrox_test_farmer", "Farmer Carry Benchmark", "testing", "station_benchmark", "all", 30, True, "test", "strength", "moderate", "moderate", ["Farmer handles"], ["carry_limiter"], ["grip_injury"], ["test", "farmer"], ["load", "distanceM"], rx("Farmer carry benchmark.", ["Light carries"], ["200m @ race load for time OR max hold"], ["Grip stretch"], ["Time", "Load", "Grip breaks"], "Upright posture — quick feet.", targetRPE="8–9"), stationVolume=200, stationStress="moderate"),
    S("bbj-benchmark", "coach_bbj-benchmark", "Burpee Broad Jump Benchmark", "testing", "station_benchmark", "intermediate", 30, True, "test", "mixed", "moderate", "moderate", ["Floor space"], ["bbj_limiter"], [], ["test", "bbj"], ["distanceM"], rx("BBJ benchmark.", ["Movement prep"], ["80m for time OR 4×20m repeatability"], ["Stretch"], ["Time", "RPE"], "Rhythm and repeatability marker.", targetRPE="8–9"), stationVolume=80),
    S("mini-compromised-test", "hyrox_compromised_mini_test", "Mini Compromised Test", "testing", "compromised_benchmark", "intermediate", 50, True, "test", "mixed", "high", "high", ["Track", "Stations"], ["repeatable_marker"], ["taper"], ["test", "compromised"], ["runDistanceM", "stationReps"], rx("Same as Mini Hyrox Compromised Test — repeatable marker.", ["10 min easy"], ["1km run · 40m lunges · 40m BBJ · 1km run"], ["10 min easy"], ["Total time", "Run drop-off", "RPE"], "Use every 4–6 weeks.", targetRPE="8–9"), runDistanceKm=2.4, stationVolume=80, hardDayReason="Compromised benchmark"),
    # 71–75 race_week
    S("race-primer", "coach_race-primer", "Race Week Primer", "race_week", "primer", "all", 45, False, "moderate", "mixed", "low", "low", ["Track", "Light stations"], ["race_week"], ["fatigue"], ["race_week"], ["pickupReps"], rx("Race week sharpness — not fatigue.", ["15 min easy"], ["Short easy run", "3–4 race-pace pickups", "Light station touches"], ["Easy walk"], ["RPE", "How legs feel"], "Sharp, not tired.", targetRPE="5–6"), qualityRunMinutes=9, runDistanceKm=5),
    S("short-th-touch", "coach_short-th-touch", "Short Threshold Touch", "race_week", "threshold_touch", "advanced", 40, False, "threshold", "run", "low", "none", ["Track"], ["early_race_week"], ["late_race_week", "fatigued"], ["race_week", "threshold"], ["reps", "targetPace"], rx("Short controlled threshold touch.", ["10 min easy"], ["3×3 min controlled threshold · 90s easy"], ["5 min easy"], ["Paces", "RPE"], "Early race week only if appropriate.", targetRPE="6–7"), thresholdMinutes=9, runDistanceKm=5),
    S("station-technique", "coach_station-technique", "Station Technique Touch", "race_week", "technique", "all", 30, False, "easy", "mixed", "low", "low", ["Stations"], ["race_week"], [], ["race_week", "technique"], ["station", "reps"], rx("Light technique — no fatigue.", ["Easy movement"], ["Light wall balls, sled feel, burpee rhythm, carries"], ["Mobility"], ["Feel", "RPE"], "No fatigue — confidence only.", targetRPE="3–4"), stationVolume=20, stationStress="low"),
    S("easy-shakeout", "hyrox_run_easy", "Easy Shakeout Run", "race_week", "shakeout", "all", 35, False, "easy", "run", "low", "none", ["Running surface"], ["race_week"], [], ["race_week", "easy"], ["durationMinutes"], rx("Easy shakeout with strides.", ["5 min easy"], ["20–30 min easy + 4 strides"], ["Walk"], ["Pace", "RPE"], "Keep nerves calm.", targetRPE="3–4"), runDistanceKm=5, qualityRunMinutes=0),
    S("mobility-recovery", "coach_mobility-recovery", "Mobility / Recovery", "race_week", "mobility", "all", 40, False, "easy", "mixed", "low", "none", ["Mat", "Bike optional"], ["race_week", "recovery"], [], ["mobility", "recovery"], ["durationMinutes"], rx("Mobility and recovery — race week or rest day.", ["Breathing"], ["20–40 min mobility, easy spin, soft tissue"], ["Relaxation"], ["How body feels"], "Parasympathetic recovery.", targetRPE="1–2"), bikeMinutes=15, ergMinutes=10),
]

assert len(SESSIONS) == 75, f"Expected 75 sessions, got {len(SESSIONS)}"

entries = ",\n".join(emit_entry(s) for s in SESSIONS)
content = f"""/**
 * Coach programme-builder session library — 75 curated Hybrid365 sessions.
 * @see docs/hybrid365-hyrox-methodology.md
 */

import {{ buildCoachEntry, type CoachLibraryEntry }} from "./hyroxCoachSessionLibraryTypes";

export const COACH_SESSION_LIBRARY_DATA: CoachLibraryEntry[] = [
{entries},
];
"""

OUT.write_text(content, encoding="utf-8")
print(f"Wrote {len(SESSIONS)} sessions to {OUT}")
