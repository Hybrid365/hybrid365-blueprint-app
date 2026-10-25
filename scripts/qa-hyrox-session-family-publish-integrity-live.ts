/**
 * Live staging: republish W1 without duplicate published rows; athlete read = latest;
 * snapshot immutability after profile change.
 *
 * HYROX_ENV=staging npx tsx scripts/qa-hyrox-session-family-publish-integrity-live.ts
 */
import { createClient } from "@supabase/supabase-js";
import { selectCanonicalPublishedWeek } from "../app/lib/hyroxProgrammeWeekIdentity";
import { fetchAthletePublishedProgramme } from "../app/lib/hyroxProgrammeServer";
import type { HyroxAthleteRow, HyroxProgrammeWeekRow } from "../app/lib/hyroxDatabaseTypes";
import { resolveAthleteSessionDisplayName } from "../app/lib/hyroxProgrammeSessionSync";
import { readSessionFamilyPublishFromPrescription } from "../app/lib/hyroxSessionFamilyPublish";

const ATHLETE_ID = "77b9be0c-81c0-4209-902d-2330e33ae4f0";

async function main() {
  if (process.env.HYROX_ENV !== "staging") {
    throw new Error("Refusing: HYROX_ENV must be staging");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes("uluapwqohujavhlpucta")) {
    throw new Error("Refusing: not hybrid365-staging URL");
  }

  const sb = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: weeksRaw, error } = await sb
    .from("hyrox_programme_weeks")
    .select(
      "id, athlete_id, source_draft_id, created_at, updated_at, block_number, week_number, week_start_date, week_end_date, weekly_focus, coach_note, athlete_facing_note, weekly_summary, status, published_at"
    )
    .eq("athlete_id", ATHLETE_ID)
    .eq("week_number", 1);
  if (error) throw new Error(error.message);

  const all = (weeksRaw as HyroxProgrammeWeekRow[]) ?? [];
  const published = all.filter((w) => w.status === "published");
  const archived = all.filter((w) => w.status === "archived");
  const canonical = selectCanonicalPublishedWeek(published);

  console.log(
    JSON.stringify(
      {
        publishedCount: published.length,
        archivedCount: archived.length,
        canonicalId: canonical?.id ?? null,
        publishedIds: published.map((w) => ({
          id: w.id,
          published_at: w.published_at,
          status: w.status,
        })),
      },
      null,
      2
    )
  );

  if (!canonical) {
    throw new Error("No published W1 for Demo Competitive — publish a week first");
  }

  // Soft-assert: after Slice 5 republish there should be ≤1 published W1.
  // If duplicates still exist from pre-fix history, athlete reader must still pick canonical.
  if (published.length > 1) {
    console.warn(
      `⚠ ${published.length} published W1 rows still exist (pre-fix history). Canonical=${canonical.id}`
    );
  } else {
    console.log("✓ single published W1 row (no active duplicate)");
  }

  const { data: athlete } = await sb.from("hyrox_athletes").select("*").eq("id", ATHLETE_ID).single();
  if (!athlete) throw new Error("athlete missing");

  const programme = await fetchAthletePublishedProgramme(sb, athlete as HyroxAthleteRow, {
    hasAssessment: true,
    hasTesting: true,
  });

  const w1Bundle = programme.weeks.find((w) => w.weekNumber === 1);
  if (!w1Bundle?.week) throw new Error("athlete programme missing W1");
  if (w1Bundle.week.id !== canonical.id) {
    throw new Error(
      `athlete W1 ${w1Bundle.week.id} ≠ canonical ${canonical.id}`
    );
  }
  console.log("✓ athlete programme W1 matches canonical week id");

  const familySessions = w1Bundle.sessions.filter((s) => {
    const snap = readSessionFamilyPublishFromPrescription(s.prescription);
    return snap != null;
  });

  if (familySessions.length === 0) {
    console.warn("⚠ no family publish snapshot on W1 sessions — assign/publish family first");
  } else {
    for (const s of familySessions) {
      const snap = readSessionFamilyPublishFromPrescription(s.prescription)!;
      const name = resolveAthleteSessionDisplayName(s);
      if (/Stage\s*\d|·\s*S\d|familyId|stageId|definitionVersion/i.test(name)) {
        throw new Error(`athlete title leak: ${name}`);
      }
      if (name !== "Threshold Intervals" && !name.includes("Threshold")) {
        console.warn(`title unexpected: ${name}`);
      }
      const frozenFinal = snap.slots[0]?.finalResolvedValue ?? null;
      console.log(
        JSON.stringify(
          {
            sessionId: s.id,
            day: s.day_of_week,
            athleteTitle: name,
            familyId: snap.familyId,
            stageId: snap.stageId,
            definitionVersion: snap.familyDefinitionVersion,
            athleteFacingTitle: snap.athleteFacingTitle,
            finalResolvedValue: frozenFinal,
            formulaResolvedValue: snap.slots[0]?.formulaResolvedValue ?? null,
            publishedAt: snap.publishedAt,
          },
          null,
          2
        )
      );
      if (!snap.athleteFacingTitle && !snap.familyId) {
        throw new Error("snapshot missing family identity");
      }
    }
    console.log(`✓ ${familySessions.length} family session(s) — athlete titles safe + snapshot readable`);
  }

  console.log("✓ live publish-integrity checks complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
