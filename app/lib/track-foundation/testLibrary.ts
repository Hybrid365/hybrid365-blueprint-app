import type { EquipmentId } from "./types";
import type { PolicyId } from "./policies";

export type TestDomain =
  | "running"
  | "erg"
  | "bike"
  | "strength"
  | "hyrox_station"
  | "hyrox_race"
  | "aerobic";

export type CanonicalTest = {
  id: string;
  name: string;
  domain: TestDomain;
  protocolVersion: "1";
  familyId: string;
  policyId: PolicyId;
  requiredEquipment: EquipmentId[];
  equipmentMode: "all" | "any" | "none";
  stress: "low" | "moderate" | "high";
  /** False when the test can be entered as evidence but is not scheduled in Assessment Week. */
  prescribable: boolean;
  resultUnit: string;
  why: string;
  setup: string[];
  warmup: string[];
  protocol: string[];
  pacing: string[];
  safety: string[];
  anchorOutputs: string[];
};

const TIME = "mm:ss";

export const TEST_LIBRARY: CanonicalTest[] = [
  {
    id: "run_5k",
    name: "5K",
    domain: "running",
    protocolVersion: "1",
    familyId: "running",
    policyId: "run_5k",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: true,
    resultUnit: TIME,
    why: "Sets easy, threshold and speed guidance from a single maximal run.",
    setup: ["Flat road, track or treadmill at 1% incline.", "Same route if you repeat it later."],
    warmup: ["10–15 min easy jog.", "4 strides of about 15 seconds. Full recovery."],
    protocol: ["Run 5.00 km as an even, hard effort.", "Record the finish time and the date."],
    pacing: ["Start at a pace you could hold for the full distance.", "Do not sprint the first kilometre."],
    safety: ["Stop for chest pain, dizziness or sharp pain.", "This is a maximal test. Do not run it the day after another maximal test."],
    anchorOutputs: ["easy", "threshold", "speed"],
  },
  {
    id: "run_10k",
    name: "10K",
    domain: "running",
    protocolVersion: "1",
    familyId: "running",
    policyId: "run_10k",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: TIME,
    why: "A recent 10K can set a threshold band without a separate 5K.",
    setup: ["Official race or a measured 10 km course."],
    warmup: ["Easy jog and strides before the start."],
    protocol: ["Record the official or tested 10K time."],
    pacing: ["Even effort. A race result is preferred to a watch prediction."],
    safety: ["Do not schedule this on top of another maximal day."],
    anchorOutputs: ["threshold"],
  },
  {
    id: "run_half",
    name: "Half marathon",
    domain: "running",
    protocolVersion: "1",
    familyId: "running",
    policyId: "run_half",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: TIME,
    why: "Shows aerobic durability. It is not precise enough to invent threshold or speed zones.",
    setup: ["Official half marathon result."],
    warmup: ["Your normal race warm-up."],
    protocol: ["Record the finish time, the date and whether it was an official race."],
    pacing: ["Race pace is an aerobic anchor, not a threshold pace."],
    safety: ["Not part of Assessment Week. Enter an existing result only."],
    anchorOutputs: ["easy"],
  },
  {
    id: "run_threshold",
    name: "Threshold test",
    domain: "running",
    protocolVersion: "1",
    familyId: "running",
    policyId: "run_threshold",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: "min/km",
    why: "A direct threshold session is more specific than a pace estimated from a race.",
    setup: ["Treadmill or flat measured loop.", "Record pace, not only heart rate."],
    warmup: ["15 min easy, then 3 minutes at the planned effort."],
    protocol: ["20–30 min continuous at the hardest pace you can hold with even splits.", "Record average pace."],
    pacing: ["You should finish the last minutes at the same pace as the first."],
    safety: ["This expires faster than a race result. Recheck within the threshold window."],
    anchorOutputs: ["threshold"],
  },
  {
    id: "run_lab_threshold",
    name: "Lab threshold",
    domain: "running",
    protocolVersion: "1",
    familyId: "running",
    policyId: "run_lab_threshold",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: "min/km",
    why: "A lab threshold outranks an estimated threshold when both are current.",
    setup: ["Use the pace the lab reported for threshold, not a watch estimate."],
    warmup: ["As directed by the lab."],
    protocol: ["Enter the reported threshold pace and the test date."],
    pacing: ["Use the reported pace. Do not tighten it."],
    safety: ["Not scheduled by Track. Enter the report you already have."],
    anchorOutputs: ["threshold", "lt1"],
  },
  {
    id: "ski_2k",
    name: "SkiErg 2K",
    domain: "erg",
    protocolVersion: "1",
    familyId: "ski",
    policyId: "ski_2k",
    requiredEquipment: ["skierg"],
    equipmentMode: "all",
    stress: "high",
    prescribable: true,
    resultUnit: TIME,
    why: "Ski and row are programmed separately. A 2K gives the ski training anchor.",
    setup: ["Damper 4–6 unless your coach has set another.", "Monitor set to 2,000 m."],
    warmup: ["5 min easy ski.", "2 × 20 seconds quicker, with easy recovery."],
    protocol: ["Ski 2,000 m.", "Record time and average /500m if shown."],
    pacing: ["Even split. The first 500 m should not be your fastest."],
    safety: ["Stop for dizziness or sharp pain. This is maximal."],
    anchorOutputs: ["ski_2k", "ski_threshold_guidance"],
  },
  {
    id: "row_2k",
    name: "RowErg 2K",
    domain: "erg",
    protocolVersion: "1",
    familyId: "row",
    policyId: "row_2k",
    requiredEquipment: ["rower"],
    equipmentMode: "all",
    stress: "high",
    prescribable: true,
    resultUnit: TIME,
    why: "Row capacity is its own anchor. It is not inferred from ski.",
    setup: ["Damper 4–5 unless set otherwise.", "Monitor set to 2,000 m."],
    warmup: ["5 min easy row.", "2 × 20 seconds quicker, with easy recovery."],
    protocol: ["Row 2,000 m.", "Record time and average /500m if shown."],
    pacing: ["Even split across the four 500s."],
    safety: ["Stop for dizziness or back pain. This is maximal."],
    anchorOutputs: ["row_2k", "row_threshold_guidance"],
  },
  {
    id: "bike_20min",
    name: "Bike 20-minute test",
    domain: "bike",
    protocolVersion: "1",
    familyId: "bike",
    policyId: "bike_20min",
    requiredEquipment: ["bike", "assault_bike"],
    equipmentMode: "any",
    stress: "high",
    prescribable: true,
    resultUnit: "W",
    why: "A 20-minute average becomes FTP at 95% when a direct FTP test is not on file.",
    setup: ["Power-meter bike or assault bike that shows watts.", "Same bike you will train on."],
    warmup: ["15 min easy with 3 × 1 min at the planned effort."],
    protocol: ["20 minutes at the hardest average power you can hold.", "Record average watts."],
    pacing: ["Aim for a flat power line. A huge first minute inflates the test."],
    safety: ["Maximal. Leave a recovery day before another hard test."],
    anchorOutputs: ["ftp"],
  },
  {
    id: "bike_ftp",
    name: "FTP",
    domain: "bike",
    protocolVersion: "1",
    familyId: "bike",
    policyId: "bike_ftp",
    requiredEquipment: ["bike", "assault_bike"],
    equipmentMode: "any",
    stress: "high",
    prescribable: false,
    resultUnit: "W",
    why: "A direct FTP result is used as entered. It is not re-estimated.",
    setup: ["Lab or field FTP you already have."],
    warmup: ["As used in the original test."],
    protocol: ["Enter FTP in watts and the test date."],
    pacing: ["Train from this value. Do not apply the 20-minute factor twice."],
    safety: ["Enter an existing result. Assessment Week uses the 20-minute test only when FTP is missing."],
    anchorOutputs: ["ftp"],
  },
  {
    id: "strength_lower",
    name: "Lower-body strength",
    domain: "strength",
    protocolVersion: "1",
    familyId: "strength",
    policyId: "strength_lower",
    requiredEquipment: ["gym", "dumbbells"],
    equipmentMode: "any",
    stress: "moderate",
    prescribable: true,
    resultUnit: "kg",
    why: "A controlled rep test shows what load the strength work can start from.",
    setup: ["Back squat, front squat or trap-bar deadlift. Pick one you can brace.", "Record the variation in the notes."],
    warmup: ["Empty-bar or light sets, then 2 build-up sets."],
    protocol: ["Work to a solid 5-rep set with 2 reps left in reserve.", "Record load and the variation."],
    pacing: ["Controlled down, strong up. This is not a max-out."],
    safety: ["Stop if pain is sharper than normal effort. Do not grind a failed rep."],
    anchorOutputs: ["strength_load"],
  },
  {
    id: "wall_ball",
    name: "Wall balls",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "wall_ball",
    policyId: "station",
    requiredEquipment: ["wall_ball"],
    equipmentMode: "all",
    stress: "high",
    prescribable: false,
    resultUnit: "reps",
    why: "Wall-ball capacity is stored in reps, which is how workload is tracked.",
    setup: ["Target: 9 ft / 2.74 m, or your division height if you know it.", "Ball: 6 kg or 4 kg to match your division."],
    warmup: ["2 easy sets of 10."],
    protocol: ["Largest unbroken set, or 60 reps for time.", "Record reps and the load."],
    pacing: ["Breath every rep. Do not sprint the first 15."],
    safety: ["Stop for shoulder or low-back pain."],
    anchorOutputs: ["wall_balls_reps"],
  },
  {
    id: "sled_push",
    name: "Sled push",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "sled_push",
    policyId: "station",
    requiredEquipment: ["sled"],
    equipmentMode: "all",
    stress: "high",
    prescribable: false,
    resultUnit: "m",
    why: "Sled push workload is tracked in metres.",
    setup: ["Record the load. Use the same surface when you repeat it."],
    warmup: ["2 light lengths."],
    protocol: ["4 × 12.5 m continuous. Record total metres and load."],
    pacing: ["Short steps. Keep the sled moving."],
    safety: ["Do not prescribe this without a sled."],
    anchorOutputs: ["sled_push_m"],
  },
  {
    id: "sled_pull",
    name: "Sled pull",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "sled_pull",
    policyId: "station",
    requiredEquipment: ["sled"],
    equipmentMode: "all",
    stress: "high",
    prescribable: false,
    resultUnit: "m",
    why: "Sled pull is tracked separately from the push.",
    setup: ["Rope or harness. Record the load."],
    warmup: ["2 light lengths."],
    protocol: ["4 × 12.5 m. Record total metres and load."],
    pacing: ["Long pulls. Do not hitch the rope."],
    safety: ["Skip when no sled is available."],
    anchorOutputs: ["sled_pull_m"],
  },
  {
    id: "farmers",
    name: "Farmers carry",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "farmers",
    policyId: "station",
    requiredEquipment: ["farmers", "dumbbells"],
    equipmentMode: "any",
    stress: "moderate",
    prescribable: false,
    resultUnit: "m",
    why: "Farmers workload is metres carried, plus the load in the notes.",
    setup: ["Farmers handles or heavy dumbbells. Record the load per hand."],
    warmup: ["One light length."],
    protocol: ["4 × 20 m. Record total metres."],
    pacing: ["Fast walk. Put the implements down cleanly if grip fails."],
    safety: ["Do not run with implements you cannot control."],
    anchorOutputs: ["farmers_m"],
  },
  {
    id: "lunges",
    name: "Sandbag lunges",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "lunges",
    policyId: "station",
    requiredEquipment: ["sandbag"],
    equipmentMode: "all",
    stress: "high",
    prescribable: false,
    resultUnit: "m",
    why: "Lunge volume is tracked in metres.",
    setup: ["Sandbag on the shoulder or bear-hug. Record the load."],
    warmup: ["20 m of bodyweight lunges."],
    protocol: ["4 × 20 m walking lunges. Record total metres."],
    pacing: ["Full knee bend. Shorter steps if balance goes."],
    safety: ["Stop for knee pain that changes your stride."],
    anchorOutputs: ["lunges_m"],
  },
  {
    id: "bbj",
    name: "Burpee broad jump",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "bbj",
    policyId: "station",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: "m",
    why: "Burpee broad jump volume is tracked in metres.",
    setup: ["Clear flat floor, about 20 m."],
    warmup: ["5 easy burpees and 3 small jumps."],
    protocol: ["40 m of burpee broad jumps. Record metres and time."],
    pacing: ["Jump for distance, then stand tall before the next burpee."],
    safety: ["Stop if you cannot land under control."],
    anchorOutputs: ["bbj_m"],
  },
  {
    id: "hyrox_race",
    name: "HYROX race",
    domain: "hyrox_race",
    protocolVersion: "1",
    familyId: "hyrox",
    policyId: "hyrox_race",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: false,
    resultUnit: TIME,
    why: "A race result is usable without every split. Splits improve limiter notes when you have them.",
    setup: ["Official result, or a full simulation you treat as a race."],
    warmup: ["Not scheduled inside Assessment Week."],
    protocol: ["Enter overall time, division, event and date.", "Add station and run splits if you have them."],
    pacing: ["Do not invent missing splits."],
    safety: ["A race is evidence. It is not automatically repeated in Assessment Week."],
    anchorOutputs: ["hyrox_overall"],
  },
  {
    id: "hyrox_station_battery",
    name: "Station assessment",
    domain: "hyrox_station",
    protocolVersion: "1",
    familyId: "stations",
    policyId: "station",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "high",
    prescribable: true,
    resultUnit: "mixed",
    why: "One station session covers the equipment you actually have. It does not invent a sled test.",
    setup: ["Set up only the stations listed for your equipment."],
    warmup: ["8 min easy row, bike or jog.", "One light pass of the first station."],
    protocol: ["Complete the stations in the session, resting 3 minutes between them.", "Record the number for each station before you leave."],
    pacing: ["Work continuously inside each station. Rest is between stations, not a race."],
    safety: ["One station session in the week. Not the day after a maximal run or erg."],
    anchorOutputs: ["station_capacity"],
  },
  {
    id: "easy_aerobic",
    name: "Easy aerobic",
    domain: "aerobic",
    protocolVersion: "1",
    familyId: "aerobic",
    policyId: "run_5k",
    requiredEquipment: [],
    equipmentMode: "none",
    stress: "low",
    prescribable: true,
    resultUnit: "min",
    why: "Opens the week and checks that training is tolerable before maximal tests.",
    setup: ["Run, bike or easy erg. Choose what is comfortable."],
    warmup: ["Start at a walk or very easy spin for 3 minutes."],
    protocol: ["20–40 minutes fully conversational."],
    pacing: ["Talk-test easy. Pace does not matter."],
    safety: ["This is not a test. Stop if pain is more than ordinary stiffness."],
    anchorOutputs: [],
  },
];

const BY_ID = new Map(TEST_LIBRARY.map((test) => [test.id, test]));

export function getTest(testId: string): CanonicalTest | null {
  return BY_ID.get(testId) ?? null;
}

export function athleteHasEquipment(owned: EquipmentId[], test: CanonicalTest): boolean {
  if (test.equipmentMode === "none" || test.requiredEquipment.length === 0) return true;
  if (test.equipmentMode === "any") return test.requiredEquipment.some((item) => owned.includes(item));
  return test.requiredEquipment.every((item) => owned.includes(item));
}

export function stationBatteryProtocol(equipment: EquipmentId[]): string[] {
  const steps: string[] = [];
  if (equipment.includes("sled")) {
    steps.push("Sled push: 4 × 12.5 m. Record load and metres.");
    steps.push("Sled pull: 4 × 12.5 m. Record load and metres.");
  }
  if (equipment.includes("wall_ball")) {
    steps.push("Wall balls: largest unbroken set, or 60 reps. Record reps and ball weight.");
  }
  if (equipment.includes("farmers") || equipment.includes("dumbbells")) {
    steps.push("Farmers carry: 4 × 20 m. Record load and metres.");
  }
  if (equipment.includes("sandbag")) {
    steps.push("Sandbag lunges: 4 × 20 m. Record load and metres.");
  }
  steps.push("Burpee broad jumps: 40 m. Record metres and time.");
  return steps;
}

export function protocolForAthlete(testId: string, equipment: EquipmentId[]): string[] {
  const test = getTest(testId);
  if (!test) return [];
  if (testId === "hyrox_station_battery") return stationBatteryProtocol(equipment);
  return test.protocol;
}
