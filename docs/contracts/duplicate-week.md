# Duplicate week

Status: coach Programme Builder week action on top of existing Copy Week / Auto-Carry engine.

## Product

`Duplicate week` copies an existing coach programme week into another week as an **unpublished draft** so the coach can make small progressions instead of rebuilding.

Not Track automation. Not auto-publish.

## Behaviour

| Copy | Do not copy |
| --- | --- |
| Day structure, ordering, AM/Main/PM/Optional slots | Completion / completed_at |
| Library refs + custom sessions | Athlete feedback / actuals |
| StructuredWorkout + Session Family family/stage | Published_at / historical adaptation decisions |
| Prescription **rules** + coach notes | Silent stage progress |

## Prescription

1. Preserve rule / provenance (including Session Family prescription slots).
2. Clear live `prescriptionPreview`.
3. Re-resolve against **current** active Programming Anchors.
4. Preserve explicit `coach_override` values as coach-authoritative.
5. Missing anchors stay missing — do not invent.

## Session Family

Default: **same stage** (Stage 2 → Stage 2). Coach may change stage / build progression / Composer / edit after.

`Duplicate + progress` is **not** the default and is not shipped in this slice.

## Target conflicts

### Unpublished target draft with programming

Coach chooses:

- Cancel
- Replace target draft (archive prior unpublished draft shell, write fresh duplicate)
- Merge into empty slots only (keep occupied AM/Main/PM/Optional)

### Already-published target week (future or otherwise)

**Not a hard block.** Offer draft-revision choices instead:

- Cancel
- Replace draft with duplicated source week (preferred)
- Create draft from current published target week (`seed_from_published`)
- Merge duplicated source into empty slots of a seeded draft

Published `hyrox_programme_weeks` (+ published draft snapshot) stay immutable and athlete-visible until explicit republish.

Normal Programme Builder Edit of a published future week uses the same model: fork/open an unpublished working draft revision (`ensureUnpublishedWorkingDraft`); never mutate the live published row in place.

## Identity

Canonical week identity remains `athlete_id + week_number`.

Multiple draft revision rows may exist; only one canonical published `programme_weeks` row is athlete-visible. Prefer unpublished working drafts for coach edit. Archive superseded unpublished drafts on replace. On publish, use existing `publishProgrammeDraft` + `archiveSupersededPublishedWeeks` — no competing week identity system.

## API

`GET/POST /api/hyrox/athletes/[id]/programme-drafts/copy-week`

POST body: `source_week`, `target_week`, optional `conflict_mode: "replace" | "merge_empty_slots" | "seed_from_published"` (legacy `replace: true` still maps to replace).
