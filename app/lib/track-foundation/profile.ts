import type { AnchorBundle } from "./anchors";
import { formatPacePer500, parseClockToSeconds } from "./dates";
import type { EvidenceBook } from "./evidence";
import { programmingReadinessFrom } from "./requirements";
import type {
  AssessmentRequirement,
  AthletePerformanceProfile,
  KnowledgeState,
  ProfileSection,
  TrackIntake,
} from "./types";

const SESSION_LENGTH_LABEL: Record<NonNullable<TrackIntake["availability"]["sessionLength"]>, string> = {
  under_45: "Under 45 min",
  "45_60": "45–60 min",
  "60_90": "60–90 min",
  "90_plus": "90+ min",
};

const EQUIPMENT_LABEL: Record<TrackIntake["equipment"][number], string> = {
  gym: "Gym",
  treadmill: "Treadmill",
  track: "Track",
  skierg: "SkiErg",
  rower: "RowErg",
  bike: "Bike",
  assault_bike: "Assault bike",
  sled: "Sled",
  wall_ball: "Wall ball",
  sandbag: "Sandbag",
  farmers: "Farmers",
  dumbbells: "Dumbbells",
};

function section(partial: ProfileSection): ProfileSection {
  return partial;
}

function sourceLine(statement: string | null | undefined): string | null {
  return statement ?? null;
}

export function buildPerformanceProfile(args: {
  intake: TrackIntake;
  book: EvidenceBook;
  anchors: AnchorBundle;
  requirements: AssessmentRequirement[];
}): AthletePerformanceProfile {
  const { intake, book, anchors, requirements } = args;
  const readiness = programmingReadinessFrom(intake, requirements);
  const blocked = requirements.filter((req) => req.status === "equipment_blocked");
  if (blocked.length > 0 && readiness.state !== "NOT_READY") {
    readiness.reasons.push(...blocked.map((req) => req.reason));
  }

  const runKnown = [anchors.running.easy, anchors.running.threshold, anchors.running.speed]
    .filter((anchor) => anchor)
    .map((anchor) => `${anchor!.label}: ${anchor!.display}`);
  const runMissing: string[] = [];
  if (!anchors.running.threshold) runMissing.push("Threshold pace");
  if (!anchors.running.speed) runMissing.push("Speed anchor");
  if (!anchors.running.lt1) runMissing.push("LT1 is not on file and is not estimated");

  const limiters: string[] = [];
  const skiSeconds = anchors.ski ? parseClockToSeconds(anchors.ski.provenance?.result ?? "") : null;
  const rowSeconds = anchors.row ? parseClockToSeconds(anchors.row.provenance?.result ?? "") : null;
  if (skiSeconds != null && rowSeconds != null) {
    const skiSplit = skiSeconds / 4;
    const rowSplit = rowSeconds / 4;
    if (skiSplit >= rowSplit + 8) {
      limiters.push(
        `Ski 2K split is slower than row (${formatPacePer500(skiSeconds, 2000)} vs ${formatPacePer500(rowSeconds, 2000)}).`
      );
    } else if (rowSplit >= skiSplit + 8) {
      limiters.push(
        `Row 2K split is slower than ski (${formatPacePer500(rowSeconds, 2000)} vs ${formatPacePer500(skiSeconds, 2000)}).`
      );
    }
  }

  const ergKnown = [anchors.ski, anchors.row].filter(Boolean).map((anchor) => `${anchor!.label}: ${anchor!.display}`);
  const ergMissing: string[] = [];
  if (!anchors.ski) ergMissing.push("SkiErg anchor");
  if (!anchors.row) ergMissing.push("RowErg anchor");

  const stationKnown = anchors.stations.map((anchor) => `${anchor.label}: ${anchor.display}`);
  const hyroxKnown = anchors.hyrox.overall
    ? [
        `Overall ${anchors.hyrox.overall}`,
        anchors.hyrox.division ? `Division ${anchors.hyrox.division}` : null,
        anchors.hyrox.eventDate ? `Date ${anchors.hyrox.eventDate}` : null,
        ...Object.entries(anchors.hyrox.splits).map(([key, value]) => `${key.replaceAll("_", " ")} ${value}`),
      ].filter((line): line is string => Boolean(line))
    : [];

  const runKnowledge: KnowledgeState = anchors.running.threshold
    ? anchors.running.threshold.reassessmentDue
      ? "TEST_REQUIRED"
      : "VALID_RECENT_RESULT"
    : book.running.knowledge;

  const sections: ProfileSection[] = [
    section({
      id: "running",
      title: "Running",
      knowledge: runKnowledge,
      known: runKnown,
      missing: runMissing,
      strengths: anchors.running.speed ? [`5K pace ${anchors.running.speed.display} is on file.`] : [],
      limiters: [],
      anchorSource: sourceLine(anchors.running.threshold?.provenance?.statement ?? anchors.running.easy?.provenance?.statement),
    }),
    section({
      id: "aerobic",
      title: "Aerobic",
      knowledge: anchors.running.easy ? (anchors.running.easy.reassessmentDue ? "TEST_REQUIRED" : "VALID_RECENT_RESULT") : "MISSING",
      known: anchors.running.easy ? [`Easy: ${anchors.running.easy.display}`] : [],
      missing: anchors.running.easy ? [] : ["Easy anchor"],
      strengths: [],
      limiters: [],
      anchorSource: sourceLine(anchors.running.easy?.provenance?.statement),
    }),
    section({
      id: "erg",
      title: "Erg",
      knowledge: ergKnown.length > 0 ? "VALID_RECENT_RESULT" : book.ski.knowledge === "MISSING" && book.row.knowledge === "MISSING" ? "MISSING" : book.ski.knowledge,
      known: ergKnown,
      missing: ergMissing,
      strengths: [],
      limiters: limiters.filter((line) => /Ski|Row/.test(line)),
      anchorSource: sourceLine(anchors.ski?.provenance?.statement ?? anchors.row?.provenance?.statement),
    }),
    section({
      id: "strength",
      title: "Strength",
      knowledge: anchors.strength ? "VALID_RECENT_RESULT" : intake.equipment.includes("gym") || intake.equipment.includes("dumbbells") ? "TEST_REQUIRED" : "MISSING",
      known: anchors.strength ? [anchors.strength.display] : [],
      missing: anchors.strength ? [] : ["Lower-body benchmark"],
      strengths: [],
      limiters: [],
      anchorSource: sourceLine(anchors.strength?.provenance?.statement),
    }),
    section({
      id: "hyrox",
      title: "HYROX",
      knowledge: anchors.hyrox.anchor
        ? anchors.hyrox.anchor.reassessmentDue
          ? "TEST_REQUIRED"
          : "VALID_RECENT_RESULT"
        : intake.goal === "hyrox"
          ? "MISSING"
          : "KNOWN",
      known: hyroxKnown,
      missing: anchors.hyrox.overall ? (Object.keys(anchors.hyrox.splits).length === 0 ? ["Station splits"] : []) : intake.goal === "hyrox" ? ["Race result"] : [],
      strengths: anchors.hyrox.overall ? ["A race result is on file."] : [],
      limiters: anchors.hyrox.observation ? [anchors.hyrox.observation] : [],
      anchorSource: sourceLine(anchors.hyrox.anchor?.provenance?.statement),
    }),
    section({
      id: "stations",
      title: "Stations",
      knowledge: stationKnown.length > 0 ? "VALID_RECENT_RESULT" : anchors.hyrox.overall ? "KNOWN" : "MISSING",
      known: stationKnown.length > 0 ? stationKnown : anchors.hyrox.overall ? ["Race result used without separate station tests."] : [],
      missing: stationKnown.length > 0 ? [] : ["Individual station benchmarks"],
      strengths: [],
      limiters: [],
      anchorSource: anchors.stations[0]?.provenance?.statement ?? null,
    }),
    section({
      id: "work_capacity",
      title: "Work capacity",
      knowledge: "MISSING",
      known: [],
      missing: ["Completed training weeks are not part of onboarding. Capacity is not guessed from a label."],
      strengths: [],
      limiters: [],
      anchorSource: null,
    }),
    section({
      id: "availability",
      title: "Training availability",
      knowledge: intake.availability.sessionLength && (intake.availability.availableDays.length > 0 || (intake.availability.daysPerWeek ?? 0) > 0) ? "KNOWN" : "MISSING",
      known: [
        intake.availability.daysPerWeek != null ? `${intake.availability.daysPerWeek} days / week` : null,
        intake.availability.availableDays.length > 0 ? intake.availability.availableDays.join(", ") : null,
        intake.availability.sessionLength ? SESSION_LENGTH_LABEL[intake.availability.sessionLength] : null,
        intake.availability.doublesPossible ? "Doubles possible" : "No doubles",
      ].filter((line): line is string => Boolean(line)),
      missing: [],
      strengths: [],
      limiters: [],
      anchorSource: null,
    }),
    section({
      id: "equipment",
      title: "Equipment",
      knowledge: intake.equipmentConfirmed ? "KNOWN" : "MISSING",
      known: intake.equipmentConfirmed
        ? [intake.equipment.length > 0 ? intake.equipment.map((item) => EQUIPMENT_LABEL[item]).join(", ") : "No listed equipment"]
        : [],
      missing: intake.equipmentConfirmed ? [] : ["Equipment confirmation"],
      strengths: [],
      limiters: [],
      anchorSource: null,
    }),
  ];

  if (intake.pain.severity === "meaningful_unresolved") {
    sections.push(
      section({
        id: "pain",
        title: "Pain",
        knowledge: "MANUAL_REVIEW_REQUIRED",
        known: intake.pain.areas,
        missing: [],
        strengths: [],
        limiters: ["Unresolved pain is a review flag, not a diagnosis."],
        anchorSource: intake.pain.note,
      })
    );
  }

  if (intake.background.trainingAge) {
    readiness.reasons.push(
      `Training age is self-reported (${intake.background.trainingAge}) and is not used as an ability anchor.`
    );
  }

  return {
    athleteId: intake.athleteId,
    displayName: intake.displayName,
    goal: intake.goal,
    sections,
    programmingReadiness: readiness.state,
    readinessReasons: readiness.reasons,
    reassessmentDue: anchors.reassessmentDue,
  };
}
