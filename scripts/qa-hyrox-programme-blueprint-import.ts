/**
 * QA: programme blueprint import domain + staging soft cases.
 * Does not publish. Does not touch production Charlie.
 *
 * npx tsx scripts/qa-hyrox-programme-blueprint-import.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  buildBlueprintImportPreview,
  parseProgrammeBlueprintDocument,
  remapBlueprintWeekToAthleteBlock,
  sanitizeBlueprintWeekForImport,
} from "../app/lib/hyroxProgrammeBlueprint";
import { globalWeekForBlock } from "../app/lib/hyroxCoachProgrammeDraft";
import { loadProgrammeBlueprintById, listProgrammeBlueprintCatalog } from "../app/lib/programmeBlueprints/catalog";
import {
  applyProgrammeBlueprintImport,
  previewProgrammeBlueprintImport,
} from "../app/lib/hyroxProgrammeBlueprintImportServer";
import { buildCoachAthleteStubFromLiveRow } from "../app/lib/hyroxLiveCoachAthlete";
import type { HyroxAthleteRow, HyroxProgrammeDraftRow } from "../app/lib/hyroxDatabaseTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

function emptyExistingMap(block: number): Map<number, HyroxProgrammeDraftRow | null> {
  const m = new Map<number, HyroxProgrammeDraftRow | null>();
  for (const c of [1, 2, 3, 4] as const) {
    m.set(globalWeekForBlock(block, c), null);
  }
  return m;
}

function fakeDraft(partial: Partial<HyroxProgrammeDraftRow> & Pick<HyroxProgrammeDraftRow, "id" | "week_number" | "status">): HyroxProgrammeDraftRow {
  return {
    athlete_id: "a",
    mapped_profile_id: null,
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    block_number: 1,
    draft_data: {
      athleteId: "a",
      block: 1,
      week: partial.week_number,
      generatedAt: "2026-11-01T00:00:00.000Z",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        role: "rest",
        roleLabel: day,
        title: day,
        sessionType: "rest",
        intensity: "",
        duration: "",
        rpeHr: "",
        isKeySession: false,
        hardDay: false,
        hardEasyLabel: "Easy",
        thresholdMinutes: 0,
        qualityRunMinutes: 0,
        plannedMinutes: 0,
        rationale: "",
        sessions:
          day === "Tue"
            ? [
                {
                  draftId: "old",
                  timeOfDay: "Main",
                  badges: ["Main"],
                  title: "Old generator session",
                  sessionType: "run_development",
                  duration: "40 min",
                  intensity: "RPE 7",
                  rpeHr: "RPE 7",
                  isKeySession: true,
                  isOptional: false,
                  rationale: "old",
                  sessionId: null,
                  prescription: null,
                  sessionDetail: null,
                  coachNote: "",
                  editConfig: { kind: "generic", sessionName: "Old generator session" },
                },
              ]
            : [],
        optionalAddOn: null,
        emom: null,
        stationFocus: null,
        equipment: [],
        sessionId: null,
        prescription: null,
        sessionDetail: null,
      })),
    },
    weekly_summary: null,
    validation_warnings: null,
    coach_note: null,
    athlete_facing_note: null,
    published_at: partial.status === "published" ? "2026-11-01T00:00:00.000Z" : null,
    ...partial,
  } as HyroxProgrammeDraftRow;
}

async function main() {
  loadEnv();

  // Catalog
  const catalog = listProgrammeBlueprintCatalog();
  assert.ok(catalog.length >= 2);
  ok("catalog lists original + revised");

  const revised = loadProgrammeBlueprintById("charlie-smith-block1-revised-v1");
  assert.equal(revised.weeks.length, 4);
  assert.ok(revised.changeSummary && revised.changeSummary.length > 0);
  ok("revised blueprint loads with change summary");

  const original = loadProgrammeBlueprintById("charlie-smith-block1-original-v1");
  assert.equal(original.weeks.length, 4);
  ok("original catalog blueprint loads");

  // Invalid blueprint
  const bad = parseProgrammeBlueprintDocument({ id: "x", name: "x", version: "1", weeks: [] });
  assert.equal(bad.ok, false);
  ok("rejects incomplete four-week blueprint");

  const missingEdit = parseProgrammeBlueprintDocument({
    id: "x",
    name: "x",
    version: "1",
    weeks: revised.weeks.map((w, i) =>
      i === 0
        ? {
            ...w,
            days: w.days.map((d) =>
              d.day === "Tue"
                ? {
                    ...d,
                    sessions: d.sessions.map((s) => {
                      const { editConfig: _e, ...rest } = s as typeof s & { editConfig?: unknown };
                      return rest;
                    }),
                  }
                : d
            ),
          }
        : w
    ),
  });
  assert.equal(missingEdit.ok, false);
  ok("rejects sessions without editConfig");

  // Remap athlete/block
  const remapped = remapBlueprintWeekToAthleteBlock({
    week: revised.weeks[0]!,
    athleteId: "athlete-live-id",
    targetBlock: 2,
    cycle: 1,
  });
  assert.equal(remapped.athleteId, "athlete-live-id");
  assert.equal(remapped.block, 2);
  assert.equal(remapped.week, 5);
  ok("remaps athleteId/block/global week (Block 2 W1 → global 5)");

  // Sanitize: strip baked resolved paces unless coach_override
  const withBaked = structuredClone(revised.weeks[0]!);
  for (const day of withBaked.days) {
    for (const s of day.sessions) {
      if (!s.sessionFamily?.prescriptionPreview?.slots?.length) continue;
      s.sessionFamily.prescriptionPreview.slots[0] = {
        ...s.sessionFamily.prescriptionPreview.slots[0]!,
        resolvedValue: 999,
        missingAnchor: false,
        publishable: true,
        source: "formula",
      };
    }
  }
  const cleaned = sanitizeBlueprintWeekForImport(withBaked);
  let sawCleared = false;
  for (const day of cleaned.days) {
    for (const s of day.sessions) {
      for (const slot of s.sessionFamily?.prescriptionPreview?.slots ?? []) {
        if (slot.source === "formula") {
          assert.equal(slot.resolvedValue, null);
          assert.equal(slot.missingAnchor, true);
          sawCleared = true;
        }
      }
    }
  }
  assert.equal(sawCleared, true);
  ok("sanitize clears non-override resolved prescription values");

  // Charlie revised coaching checks
  const w3 = revised.weeks[2]!;
  const sun = w3.days.find((d) => d.day === "Sun")!;
  const fri = w3.days.find((d) => d.day === "Fri")!;
  const wed = w3.days.find((d) => d.day === "Wed")!;
  assert.ok(sun.sessions.some((s) => String(s.duration).includes("60")));
  assert.ok(fri.sessions.some((s) => /bike/i.test(s.title)));
  assert.ok(wed.sessions.some((s) => s.isOptional && /lower/i.test(s.title)));
  const tueProgression = revised.weeks.map(
    (w) => w.days.find((d) => d.day === "Tue")?.sessions.find((s) => s.isKeySession)?.sessionFamily?.stageKey
  );
  assert.deepEqual(tueProgression, ["stage_1", "stage_2", "stage_3", "consolidation"]);
  const satStations = revised.weeks.map((w) =>
    w.days.find((d) => d.day === "Sat")?.sessions.find((s) => s.isKeySession)?.title ?? ""
  );
  assert.ok(satStations[0]!.toLowerCase().includes("sled"));
  assert.ok(satStations[1]!.toLowerCase().includes("burpee"));
  assert.ok(satStations[2]!.toLowerCase().includes("lunge"));
  assert.ok(/mixed|consolidation|wb|sled/i.test(satStations[3]!));
  ok("revised Charlie blueprint retains quality progression + W3 volume caps");

  // Empty target preview
  const emptyPreview = buildBlueprintImportPreview({
    athleteId: "a",
    targetBlock: 2,
    blueprint: revised,
    existingByGlobalWeek: emptyExistingMap(2),
    publishedWeekNumbers: new Set(),
  });
  assert.equal(emptyPreview.canApplyWithoutReplace, true);
  assert.equal(emptyPreview.requiresReplaceConfirmation, false);
  assert.equal(emptyPreview.blockedByPublished, false);
  ok("empty target block can apply without replace");

  // Existing edited unpublished draft
  const editedMap = emptyExistingMap(1);
  editedMap.set(1, fakeDraft({ id: "d1", week_number: 1, status: "edited", block_number: 1 }));
  const editedPreview = buildBlueprintImportPreview({
    athleteId: "a",
    targetBlock: 1,
    blueprint: revised,
    existingByGlobalWeek: editedMap,
    publishedWeekNumbers: new Set(),
  });
  assert.equal(editedPreview.requiresReplaceConfirmation, true);
  assert.equal(editedPreview.canApplyWithoutReplace, false);
  assert.ok(editedPreview.weeks[0]!.removed.some((r) => r.title.includes("Old")));
  ok("existing edited draft requires replace confirmation + shows removals");

  // Published week blocks
  const pubMap = emptyExistingMap(1);
  pubMap.set(1, fakeDraft({ id: "p1", week_number: 1, status: "published", block_number: 1 }));
  const pubPreview = buildBlueprintImportPreview({
    athleteId: "a",
    targetBlock: 1,
    blueprint: revised,
    existingByGlobalWeek: pubMap,
    publishedWeekNumbers: new Set([1]),
  });
  assert.equal(pubPreview.blockedByPublished, true);
  ok("published week blocks import");

  // Staging soft apply on Demo Developing if available (empty-ish block prefer high block number)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stagingRef = process.env.HYROX_STAGING_SUPABASE_REF ?? "bfwboqaovirzjpxpwgty";
  if (url && key && url.includes(stagingRef)) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: athletes } = await sb
      .from("hyrox_athletes")
      .select("*")
      .eq("email", "demo.developing@hybrid365.test")
      .limit(1);
    const row = (athletes?.[0] ?? null) as HyroxAthleteRow | null;
    if (!row) {
      console.log("⊘ staging demo.developing not found — skipping live apply cases");
    } else {
      // Prefer an empty high block; skip used blocks from prior QA runs
      let targetBlock = 0;
      let preview: Awaited<ReturnType<typeof previewProgrammeBlueprintImport>>["preview"] | null =
        null;
      for (const candidate of [9, 10, 11, 12]) {
        const { preview: p } = await previewProgrammeBlueprintImport(sb, {
          athleteId: row.id,
          targetBlock: candidate,
          blueprintRaw: revised,
        });
        if (p.canApplyWithoutReplace) {
          targetBlock = candidate;
          preview = p;
          break;
        }
      }
      if (!preview || !targetBlock) {
        console.log("⊘ no empty high block available — skip live apply cases");
      } else {
      assert.equal(preview.athleteId, row.id);
      ok("staging preview binds path athlete id");

      // Wrong athlete substitution cannot happen — athleteId comes from path; blueprint athleteId ignored
      const bpAlien = {
        ...revised,
        weeks: revised.weeks.map((w) => ({ ...w, athleteId: "00000000-0000-4000-8000-wrongathlete01" })),
      };
      const { preview: p2 } = await previewProgrammeBlueprintImport(sb, {
        athleteId: row.id,
        targetBlock,
        blueprintRaw: bpAlien,
      });
      assert.equal(p2.athleteId, row.id);
      ok("blueprint athleteId cannot retarget another athlete");

      if (preview.canApplyWithoutReplace) {
        const stub = buildCoachAthleteStubFromLiveRow(row, {
          hasAssessment: true,
          hasTesting: true,
        });
        const result = await applyProgrammeBlueprintImport(sb, {
          athleteId: row.id,
          athlete: stub,
          athleteRow: row,
          mappedProfileId: null,
          targetBlock,
          blueprintRaw: revised,
          conflictStrategy: "abort",
          confirmApply: true,
        });
        assert.equal(result.weeks.length, 4);
        assert.equal(result.draftIds.length, 4);
        ok("staging apply inserts 4 unpublished drafts on empty block");

        // Repeated import without replace should fail
        let rejected = false;
        try {
          await applyProgrammeBlueprintImport(sb, {
            athleteId: row.id,
            athlete: stub,
            athleteRow: row,
            mappedProfileId: null,
            targetBlock,
            blueprintRaw: revised,
            conflictStrategy: "abort",
            confirmApply: true,
          });
        } catch {
          rejected = true;
        }
        assert.equal(rejected, true);
        ok("repeated import aborts without replace confirmation");

        // Replace confirmed
        const conflictWeeks = [5, 6, 7, 8].map((_, i) => globalWeekForBlock(targetBlock, (i + 1) as 1 | 2 | 3 | 4));
        // After first import weeks have content — get actual conflict weeks from preview
        const { preview: again } = await previewProgrammeBlueprintImport(sb, {
          athleteId: row.id,
          targetBlock,
          blueprintRaw: original,
        });
        const weeksToReplace = again.weeks
          .filter((w) => w.conflict === "unpublished_content")
          .map((w) => w.globalWeek);
        assert.ok(weeksToReplace.length > 0);
        const replaced = await applyProgrammeBlueprintImport(sb, {
          athleteId: row.id,
          athlete: stub,
          athleteRow: row,
          mappedProfileId: null,
          targetBlock,
          blueprintRaw: original,
          conflictStrategy: "replace_unpublished_confirmed",
          confirmReplaceGlobalWeeks: weeksToReplace,
          confirmApply: true,
        });
        assert.equal(replaced.weeks.length, 4);
        ok("confirmed replace archives prior unpublished and inserts new drafts");
        void conflictWeeks;
      } else {
        console.log("⊘ selected block not empty after race — skip apply/replace");
      }
      } // end empty-block found
    }
  } else {
    console.log("⊘ staging env not configured — domain tests only");
  }

  console.log(`\nPASS ${passed} assertions`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
