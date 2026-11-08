/**
 * QA: programme blueprint export (read-only).
 * Staging soft checks when env is staging; domain tests always.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  athleteRefFromId,
  buildProgrammeBlueprintExportDocument,
  exportDocumentToImportBlueprint,
  parseProgrammeBlueprintExportDocument,
  resolveExportGlobalWeeks,
  unwrapExportWeeks,
} from "@/app/lib/hyroxProgrammeBlueprintExport";
import { exportProgrammeBlueprint } from "@/app/lib/hyroxProgrammeBlueprintExportServer";
import { parseProgrammeBlueprintDocument } from "@/app/lib/hyroxProgrammeBlueprint";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnv();

let passed = 0;
function ok(msg: string) {
  console.log(`✓ ${msg}`);
  passed += 1;
}

function sampleWeek(athleteId: string, block: number, week: number) {
  return {
    athleteId,
    block,
    week,
    generatedAt: new Date().toISOString(),
    days: (["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((day) => ({
      day,
      focus: day === "Tue" ? "quality" : "easy",
      sessions:
        day === "Tue"
          ? [
              {
                draftId: `s-${week}-tue`,
                sessionId: "coach_custom",
                title: `Threshold quality W${week}`,
                timeOfDay: "Main" as const,
                duration: "50 min",
                isKeySession: true,
                badges: [],
                editConfig: {
                  kind: "generic" as const,
                  sessionName: `Threshold quality W${week}`,
                  structuredWorkout: {
                    sections: [
                      {
                        type: "intervals",
                        name: "Main",
                        steps: [{ type: "work", durationSec: 300, paceTarget: "T" }],
                      },
                    ],
                  },
                },
                sessionFamily: {
                  familyId: "threshold_5min_repeats",
                  stageKey: "s1",
                  structuredWorkout: {
                    sections: [
                      {
                        type: "intervals",
                        name: "Main",
                        steps: [{ type: "work", durationSec: 300 }],
                      },
                    ],
                  },
                },
              },
            ]
          : [],
    })),
  };
}

function fakeRow(
  athleteId: string,
  week: number,
  status: HyroxProgrammeDraftRow["status"],
  draft: unknown
): HyroxProgrammeDraftRow {
  return {
    id: `draft-${week}-${status}`,
    athlete_id: athleteId,
    mapped_profile_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    block_number: 1,
    week_number: week,
    draft_data: draft as HyroxProgrammeDraftRow["draft_data"],
    weekly_summary: null,
    validation_warnings: null,
    coach_note: "internal",
    athlete_facing_note: "face",
    status,
    published_at: status === "published" ? "2026-01-01T00:00:00.000Z" : null,
  };
}

async function main() {
  const athleteId = "11111111-1111-4111-8111-111111111111";
  const ref = athleteRefFromId(athleteId);
  assert.equal(ref.startsWith("ath_"), true);
  assert.notEqual(ref.includes(athleteId), true);
  ok("athleteRef is opaque and stable-shaped");

  const w1 = globalWeekForBlock(1, 1);
  const w2 = globalWeekForBlock(1, 2);
  assert.deepEqual(
    resolveExportGlobalWeeks({ block: 1, selection: "entire_block" }),
    [1, 2, 3, 4]
  );
  assert.deepEqual(
    resolveExportGlobalWeeks({
      block: 1,
      selection: "selected_weeks",
      globalWeeks: [w2, w1],
    }),
    [w1, w2]
  );
  ok("selection resolves block / selected weeks");

  const week1 = sampleWeek(athleteId, 1, w1);
  const week2 = sampleWeek(athleteId, 1, w2);
  const preferred = new Map<number, HyroxProgrammeDraftRow | null>([
    [w1, fakeRow(athleteId, w1, "edited", week1)],
    [w2, fakeRow(athleteId, w2, "draft_generated", week2)],
    [3, fakeRow(athleteId, 3, "published", sampleWeek(athleteId, 1, 3))],
    [4, null],
  ]);

  const doc = buildProgrammeBlueprintExportDocument({
    athleteId,
    athleteLabel: "Demo Athlete",
    block: 1,
    selection: "selected_weeks",
    selectedGlobalWeeks: [w1, w2],
    preferredByWeek: preferred,
    publishedWeekNumbers: new Set([3]),
  });

  assert.equal(doc.format, "hybrid365.programme_blueprint_export");
  assert.equal(doc.weeks.length, 2);
  assert.equal(doc.weeks[0]!.athleteId, ref);
  assert.equal(doc.weeks[0]!.days[1]!.sessions[0]!.editConfig.kind, "generic");
  assert.ok(doc.weeks[0]!.days[1]!.sessions[0]!.sessionFamily?.structuredWorkout);
  assert.equal(doc.export.weekProvenance[0]!.contentSource, "unpublished_working_draft");
  assert.equal(doc.export.weekProvenance[0]!.dbStatus, "edited");
  assert.equal(JSON.stringify(doc).includes("@"), false);
  assert.equal(JSON.stringify(doc).includes(athleteId), false);
  ok("export preserves StructuredWorkout / editConfig and strips real athlete id");

  const parsed = parseProgrammeBlueprintExportDocument(doc);
  assert.equal(parsed.ok, true);
  const unwrapped = unwrapExportWeeks(doc);
  assert.equal(unwrapped.ok, true);
  if (unwrapped.ok) assert.equal(unwrapped.weeks.length, 2);
  ok("export parser + unwrap work for partial weeks");

  // Full block → import-compatible
  const fullPreferred = new Map<number, HyroxProgrammeDraftRow | null>([
    [1, fakeRow(athleteId, 1, "edited", sampleWeek(athleteId, 1, 1))],
    [2, fakeRow(athleteId, 2, "edited", sampleWeek(athleteId, 1, 2))],
    [3, fakeRow(athleteId, 3, "edited", sampleWeek(athleteId, 1, 3))],
    [4, fakeRow(athleteId, 4, "edited", sampleWeek(athleteId, 1, 4))],
  ]);
  const full = buildProgrammeBlueprintExportDocument({
    athleteId,
    athleteLabel: "Demo Athlete",
    block: 1,
    selection: "entire_block",
    selectedGlobalWeeks: [1, 2, 3, 4],
    preferredByWeek: fullPreferred,
    publishedWeekNumbers: new Set(),
  });
  const asImport = exportDocumentToImportBlueprint(full);
  assert.equal(asImport.ok, true);
  if (asImport.ok) {
    const reparse = parseProgrammeBlueprintDocument(asImport.blueprint);
    assert.equal(reparse.ok, true);
  }
  const partialImport = exportDocumentToImportBlueprint(doc);
  assert.equal(partialImport.ok, false);
  ok("4-week export unwraps to import validator; partial does not silently import");

  // Staging soft read-only export
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stagingRef = process.env.HYROX_STAGING_SUPABASE_REF ?? "bfwboqaovirzjpxpwgty";
  if (url && key && url.includes(stagingRef) && process.env.HYROX_ENV === "staging") {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: athletes } = await sb
      .from("hyrox_athletes")
      .select("id, programme_length_weeks")
      .eq("email", "demo.developing@hybrid365.test")
      .limit(1);
    const row = athletes?.[0];
    if (!row) {
      console.log("⊘ staging demo.developing missing — skip live export");
    } else {
      const before = await sb
        .from("hyrox_programme_drafts")
        .select("id, updated_at")
        .eq("athlete_id", row.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      const { document } = await exportProgrammeBlueprint(sb, {
        athleteId: row.id,
        block: 1,
        selection: "entire_block",
        athleteLabel: "Demo Developing",
        programmeLengthWeeks: row.programme_length_weeks,
      });
      const after = await sb
        .from("hyrox_programme_drafts")
        .select("id, updated_at")
        .eq("athlete_id", row.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      assert.equal(document.export.sourceBlock, 1);
      assert.equal(document.export.weekProvenance.length, 4);
      assert.equal(JSON.stringify(document).includes(row.id), false);
      assert.deepEqual(
        (before.data ?? []).map((r) => `${r.id}:${r.updated_at}`),
        (after.data ?? []).map((r) => `${r.id}:${r.updated_at}`)
      );
      ok("staging export is read-only and omits real athlete UUID");
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
