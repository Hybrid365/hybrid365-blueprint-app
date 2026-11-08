import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { mergeProfileIntoCoachAthlete } from "@/app/lib/hyroxAssessmentMapping";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { fetchLatestMappedProfile } from "@/app/lib/hyroxProgrammeServer";
import {
  applyProgrammeBlueprintImport,
  BLUEPRINT_JSON_MAX_CHARS,
  previewProgrammeBlueprintImport,
} from "@/app/lib/hyroxProgrammeBlueprintImportServer";
import type { BlueprintConflictStrategy } from "@/app/lib/hyroxProgrammeBlueprintTypes";
import { loadProgrammeBlueprintById } from "@/app/lib/programmeBlueprints/catalog";

type RouteContext = { params: Promise<{ id: string }> };

type Body = {
  action?: "preview" | "apply";
  target_block?: number;
  /** Built-in catalog id XOR inline blueprint document */
  blueprint_id?: string;
  blueprint?: unknown;
  conflict_strategy?: BlueprintConflictStrategy;
  confirm_replace_global_weeks?: number[];
  confirm_apply?: boolean;
  effective_profile?: HyroxAthleteProfile;
};

function resolveBlueprintRaw(body: Body): unknown {
  if (body.blueprint_id && body.blueprint) {
    throw new Error("Provide blueprint_id or blueprint, not both.");
  }
  if (body.blueprint_id) {
    return loadProgrammeBlueprintById(body.blueprint_id);
  }
  if (body.blueprint != null) {
    const serialized = JSON.stringify(body.blueprint);
    if (serialized.length > BLUEPRINT_JSON_MAX_CHARS) {
      throw new Error(
        `Blueprint JSON exceeds ${BLUEPRINT_JSON_MAX_CHARS} characters (${serialized.length}).`
      );
    }
    return body.blueprint;
  }
  throw new Error("blueprint_id or blueprint is required.");
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Body;
  const action = body.action ?? "preview";
  const targetBlock = body.target_block;

  if (!Number.isInteger(targetBlock) || (targetBlock as number) < 1) {
    return NextResponse.json(
      { success: false, error: "target_block must be an integer >= 1." },
      { status: 400 }
    );
  }

  let blueprintRaw: unknown;
  try {
    blueprintRaw = resolveBlueprintRaw(body);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Invalid blueprint." },
      { status: 400 }
    );
  }

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, athleteId);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  // Path athlete id is authoritative — reject body attempts to retarget via blueprint.athleteId
  const row = athlete as HyroxAthleteRow;

  try {
    if (action === "preview") {
      const { preview, blueprint } = await previewProgrammeBlueprintImport(supabase, {
        athleteId,
        targetBlock: targetBlock as number,
        blueprintRaw,
        programmeLengthWeeks: row.programme_length_weeks,
      });
      const metaName =
        typeof blueprint.meta?.athleteName === "string" ? blueprint.meta.athleteName : null;
      const athleteNameWarning =
        metaName && row.name && metaName.toLowerCase() !== row.name.toLowerCase()
          ? `Blueprint meta athleteName "${metaName}" differs from target athlete "${row.name}". Review coach/athlete notes before publish.`
          : null;
      return NextResponse.json({
        success: true,
        preview,
        ...(athleteNameWarning ? { athleteNameWarning } : {}),
      });
    }

    if (action === "apply") {
      if (!body.effective_profile) {
        return NextResponse.json(
          { success: false, error: "effective_profile is required for apply." },
          { status: 400 }
        );
      }
      const flags = await fetchAthleteProgressFlags(supabase, athleteId);
      const stub = buildCoachAthleteStubFromLiveRow(row, flags);
      // Same pattern as copy-week / ensure-weeks: coach effective_profile for validation summaries.
      // Prescription numbers are re-resolved from the destination athlete's performance profile
      // inside applyProgrammeBlueprintImport (not from blueprint-baked values).
      const coachAthlete = mergeProfileIntoCoachAthlete(stub, body.effective_profile);
      const mapped = await fetchLatestMappedProfile(supabase, athleteId);

      const result = await applyProgrammeBlueprintImport(supabase, {
        athleteId,
        athlete: coachAthlete,
        athleteRow: row,
        mappedProfileId: mapped?.id ?? null,
        targetBlock: targetBlock as number,
        blueprintRaw,
        conflictStrategy: body.conflict_strategy ?? "abort",
        confirmReplaceGlobalWeeks: body.confirm_replace_global_weeks,
        confirmApply: body.confirm_apply === true,
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { success: false, error: "action must be preview or apply." },
      { status: 400 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Blueprint import failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
