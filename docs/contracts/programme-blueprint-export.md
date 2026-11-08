# Programme blueprint export (coach-only)

Contract for exporting selected 1-1 programme weeks from Programme Builder as structured JSON compatible with the blueprint-import `CoachDraftWeek[]` shape.

## Invariants

1. Coach auth required (`requireHyroxCoachApi`). No client service-role.
2. Export is read-only — never mutates drafts, published weeks, or athlete rows.
3. Path athlete id is the only authorised subject; export never includes other athletes.
4. Workout payload stays full `CoachDraftWeek` (editConfig, StructuredWorkout, sessionFamily, notes).
5. Provenance (`export` envelope) is separate from workout weeks — do not invent a second programme format.
6. Published snapshots vs unpublished / edited working drafts are labelled explicitly per week; never silently mixed without provenance.
7. Minimise PII: opaque `athleteRef` + optional display label; no email, phone, or auth tokens.
8. Partial exports (1–3 weeks) are valid for analysis; full-block (4 weeks) is also valid as an import-compatible `ProgrammeBlueprintDocument` when unwrapped.

## Document shape

```ts
type ProgrammeBlueprintExportDocument = {
  format: "hybrid365.programme_blueprint_export";
  formatVersion: "1";
  id: string;
  name: string;
  version: string;
  weeks: CoachDraftWeek[]; // 1–4 selected weeks, full structure
  coachNote?: string;
  athleteFacingNote?: string;
  export: ProgrammeBlueprintExportProvenance;
  meta?: Record<string, unknown>;
};
```

## Endpoints

`POST /api/hyrox/athletes/[id]/programme-drafts/export-blueprint`

Body:

- `block` — programme block number
- `selection` — `current_week` | `selected_weeks` | `entire_block`
- `global_weeks` — required for `selected_weeks` / `current_week`
- `athlete_label` — optional display label (not email)

Response: `{ success, document, filename }` — no writes.
