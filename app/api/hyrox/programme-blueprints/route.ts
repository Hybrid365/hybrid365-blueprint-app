import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { listProgrammeBlueprintCatalog } from "@/app/lib/programmeBlueprints/catalog";

/** Coach-only catalog of built-in validated programme blueprints. */
export async function GET() {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  return NextResponse.json({
    success: true,
    blueprints: listProgrammeBlueprintCatalog(),
  });
}
