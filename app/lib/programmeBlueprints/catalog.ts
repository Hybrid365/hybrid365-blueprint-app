/**
 * Built-in coach blueprint catalog (server + client list metadata).
 * Full JSON lives under docs/blueprints/ and is loaded server-side only.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BlueprintCatalogEntry } from "@/app/lib/hyroxProgrammeBlueprintTypes";
import { parseProgrammeBlueprintDocument } from "@/app/lib/hyroxProgrammeBlueprint";
import type { ProgrammeBlueprintDocument } from "@/app/lib/hyroxProgrammeBlueprintTypes";

export const PROGRAMME_BLUEPRINT_CATALOG: BlueprintCatalogEntry[] = [
  {
    id: "charlie-smith-block1-revised-v1",
    name: "Charlie Smith — Block 1 (revised proposal)",
    version: "1.1.0",
    description:
      "Run-first HYROX block with volume cap on week 3 and optional lower maintenance. Recommended import candidate.",
    revisesId: "charlie-smith-block1-original-v1",
    changeSummary: [
      "Week 3 Sunday 70→60 min; Friday bike-preferred to cap ~35–36 km run.",
      "Optional Wed lower maintenance W1–3.",
      "Tue/Thu/Sat quality + Week 4 consolidation preserved.",
    ],
  },
  {
    id: "charlie-smith-block1-original-v1",
    name: "Charlie Smith — Block 1 (original validated)",
    version: "1.0.0",
    description: "Original offline-validated blueprint without volume-cap revisions.",
    revisesId: null,
    changeSummary: ["Original validated structure — no coaching volume adjustments."],
  },
];

const FILE_BY_ID: Record<string, string> = {
  "charlie-smith-block1-revised-v1":
    "docs/blueprints/charlie-block1-unpublished-blueprint.revised.json",
  "charlie-smith-block1-original-v1":
    "docs/blueprints/charlie-block1-unpublished-blueprint.original.catalog.json",
};

export function listProgrammeBlueprintCatalog(): BlueprintCatalogEntry[] {
  return PROGRAMME_BLUEPRINT_CATALOG;
}

export function loadProgrammeBlueprintById(id: string): ProgrammeBlueprintDocument {
  const rel = FILE_BY_ID[id];
  if (!rel) throw new Error(`Unknown blueprint catalog id: ${id}`);
  const path = join(process.cwd(), rel);
  if (!existsSync(path)) {
    // Fallback: original uncatalogued file
    const fallback =
      id === "charlie-smith-block1-original-v1"
        ? join(process.cwd(), "docs/blueprints/charlie-block1-unpublished-blueprint.original.json")
        : null;
    if (!fallback || !existsSync(fallback)) {
      throw new Error(`Blueprint file missing for ${id}`);
    }
    const raw = JSON.parse(readFileSync(fallback, "utf8"));
    const parsed = parseProgrammeBlueprintDocument({
      id: "charlie-smith-block1-original-v1",
      name: "Charlie Smith — Block 1 (original validated)",
      version: "1.0.0",
      weeks: raw.weeks,
      coachNote: raw.coachNote,
      athleteFacingNote: raw.athleteFacingNote,
      meta: raw.meta,
    });
    if (!parsed.ok) throw new Error(parsed.error);
    return parsed.blueprint;
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = parseProgrammeBlueprintDocument(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.blueprint;
}
