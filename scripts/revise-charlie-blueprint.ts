/**
 * Build a proposed revised Charlie blueprint from the original offline artifact.
 * Does not modify the original file. Writes revised JSON + change summary.
 *
 * npx tsx scripts/revise-charlie-blueprint.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { CoachDraftSession, CoachDraftWeek } from "../app/lib/hyroxCoachProgrammeDraft";
import { createBlankCoachDraftSession } from "../app/lib/hyroxCoachProgrammeDraft";
import { parseProgrammeBlueprintDocument } from "../app/lib/hyroxProgrammeBlueprint";

const ROOT = process.cwd();
const ORIGINAL = join(ROOT, "docs/blueprints/charlie-block1-unpublished-blueprint.original.json");
const OUT_JSON = join(ROOT, "docs/blueprints/charlie-block1-unpublished-blueprint.revised.json");
const OUT_SUMMARY = join(ROOT, "docs/blueprints/charlie-block1-CHANGE_SUMMARY.md");

function patchSundayMinutes(week: CoachDraftWeek, minutes: number): void {
  const sun = week.days.find((d) => d.day === "Sun");
  if (!sun) return;
  for (const s of sun.sessions) {
    if (!/long/i.test(s.title) && !s.sessionFamily?.familyId?.includes("easy_long")) continue;
    s.title = minutes >= 70 ? "Long aerobic run" : "Long easy run";
    s.duration = `${minutes} min`;
    if (s.volumeMeta) {
      s.volumeMeta.durationMinutes = minutes;
      s.volumeMeta.runDistanceKm = Math.round((minutes / 6) * 10) / 10;
    }
    if (s.sessionFamily?.structuredWorkout) {
      s.sessionFamily.structuredWorkout = {
        ...s.sessionFamily.structuredWorkout,
        blocks: [{ type: "continuous", work: { kind: "time", value: minutes * 60, unit: "sec" } }],
      };
    }
    if (s.editConfig) {
      s.editConfig = {
        ...s.editConfig,
        sessionName: s.title,
        durationMinutes: minutes,
        structuredWorkout: s.sessionFamily?.structuredWorkout,
      };
    }
  }
}

function makeFridayBikeOnly(week: CoachDraftWeek): void {
  const fri = week.days.find((d) => d.day === "Fri");
  if (!fri || !fri.sessions[0]) return;
  const s = fri.sessions[0]!;
  s.title = "Easy recovery bike (preferred)";
  s.duration = "35 min";
  if (s.volumeMeta) {
    s.volumeMeta.runDistanceKm = 0;
    s.volumeMeta.bikeMinutes = 35;
    s.volumeMeta.durationMinutes = 35;
    s.volumeMeta.impactType = "bike";
  }
  s.coachNote =
    "Prefer easy bike to cap weekly run km. Conversational only — optional skip if fatigued.";
  if (s.editConfig) {
    s.editConfig = {
      ...s.editConfig,
      sessionName: s.title,
      durationMinutes: 35,
      coachNote: s.coachNote,
      mainSetLines: ["35 min easy bike / Assault Bike Z2 — talk test"],
    };
  }
}

function addOptionalLowerMaintenance(week: CoachDraftWeek, weekNum: number): void {
  const wed = week.days.find((d) => d.day === "Wed");
  if (!wed) return;
  const already = wed.sessions.some((s) => /lower|lunge|squat/i.test(s.title));
  if (already) return;

  const lower: CoachDraftSession = createBlankCoachDraftSession({
    sessionName: "Optional lower maintenance",
    libraryCategory: "strength_endurance",
    timeOfDay: "Optional",
    duration: "25 min",
    objective: "Light lower maintenance — not strength endurance overload.",
    rpeTarget: "RPE 5–6",
    coachNote:
      "Optional. Leave 3+ reps spare. No sled SE. Skip if legs heavy before Thursday quality.",
    warmUpLines: ["5 min easy bike or walk", "Hip / ankle openers"],
    coolDownLines: ["Easy walk"],
    customParts: [
      {
        id: `wed-lower-opt-w${weekNum}`,
        type: "strength",
        title: "Lower maintenance",
        instructions: "Squat pattern 3×5 easy · Split squat 2×6/side · Hip hinge 2×8 — coach loads",
        sets: "3",
        reps: "5–8",
        rpe: "5–6",
        notes: "Maintenance only",
      },
    ],
  });
  lower.isOptional = true;
  lower.isKeySession = false;
  lower.volumeMeta = {
    durationMinutes: 25,
    thresholdMinutes: 0,
    qualityRunMinutes: 0,
    runDistanceKm: 0,
    ergMinutes: 0,
    bikeMinutes: 0,
    strengthMinutes: 25,
    stationVolume: 0,
    hardDay: false,
    impactType: "mixed",
    muscularStress: "low",
    stationStress: "none",
    isOptionalAddOn: true,
  };
  wed.sessions.push(lower);
}

function main() {
  const raw = JSON.parse(readFileSync(ORIGINAL, "utf8"));
  const weeks = structuredClone(raw.weeks) as CoachDraftWeek[];
  if (weeks.length !== 4) throw new Error("Expected 4 weeks");

  // Week 3 (index 2): cap run volume ~35–36 km
  patchSundayMinutes(weeks[2]!, 60);
  makeFridayBikeOnly(weeks[2]!);

  // Optional lower maintenance on Wed weeks 1–3 (not week 4 consolidate)
  for (const w of [1, 2, 3]) {
    addOptionalLowerMaintenance(weeks[w - 1]!, w);
  }

  const changeSummary = [
    "Week 3 Sunday long run reduced 70 → 60 min to cap planned run volume nearer 35–36 km.",
    "Week 3 Friday converted to easy bike-preferred (0 planned run km) while staying optional/easy.",
    "Added optional Wed lower-body maintenance (RPE 5–6, 25 min) on Weeks 1–3 — skip if legs heavy.",
    "Preserved Tue/Thu/Sat hard quality days and Week 4 consolidation structure.",
    "Wednesday/Friday Z2 add-ons remain optional — not additional hard days.",
    "Original blueprint file left unchanged.",
  ];

  const document = {
    id: "charlie-smith-block1-revised-v1",
    name: "Charlie Smith — Block 1 (revised proposal)",
    version: "1.1.0",
    revisesId: "charlie-smith-block1-original-v1",
    changeSummary,
    coachNote: raw.coachNote,
    athleteFacingNote: raw.athleteFacingNote,
    meta: {
      ...(raw.meta ?? {}),
      blueprintId: "charlie-smith-block1-revised-v1",
      version: "1.1.0",
      revises: "charlie-block1-unpublished-blueprint.original.json",
      coachingAdjustmentsApplied: true,
      unpublished: true,
    },
    weeks,
  };

  const parsed = parseProgrammeBlueprintDocument(document);
  if (!parsed.ok) throw new Error(parsed.error);

  mkdirSync(join(ROOT, "docs/blueprints"), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(document, null, 2));
  writeFileSync(
    OUT_SUMMARY,
    [
      "# Charlie Block 1 — proposed coaching revisions",
      "",
      "Original file preserved: `charlie-block1-unpublished-blueprint.original.json`",
      "",
      "Revised file: `charlie-block1-unpublished-blueprint.revised.json`",
      "",
      "## Changes",
      "",
      ...changeSummary.map((c) => `- ${c}`),
      "",
      "## Not changed",
      "",
      "- Tuesday threshold family progression (S1→S2→S3→consolidation)",
      "- Thursday non-impact rotation (bike → ski → kieran-bike-wb → bike deload)",
      "- Saturday compromised station rotation (sled pull → BBJ → lunges → hold)",
      "- Monday rest / three hard days",
      "- Missing anchors remain unresolved (no invented paces/FTP)",
      "",
    ].join("\n")
  );

  // Also stamp original with stable id for catalog if missing
  if (!raw.id) {
    const stamped = {
      id: "charlie-smith-block1-original-v1",
      name: "Charlie Smith — Block 1 (original validated)",
      version: "1.0.0",
      revisesId: null,
      changeSummary: ["Original offline-validated blueprint — no coaching volume caps applied."],
      coachNote: raw.coachNote,
      athleteFacingNote: raw.athleteFacingNote,
      meta: { ...(raw.meta ?? {}), blueprintId: "charlie-smith-block1-original-v1", version: "1.0.0" },
      weeks: raw.weeks,
    };
    writeFileSync(
      join(ROOT, "docs/blueprints/charlie-block1-unpublished-blueprint.original.catalog.json"),
      JSON.stringify(stamped, null, 2)
    );
  }

  console.log(JSON.stringify({ ok: true, out: OUT_JSON, summary: OUT_SUMMARY, changeSummary }, null, 2));
}

main();
