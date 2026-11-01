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

Published weeks and athlete-history weeks: **blocked**.

Unpublished target draft with programming — coach chooses:

- Cancel
- Replace target draft (archive prior unpublished draft shell, write fresh duplicate)
- Merge into empty slots only (keep occupied AM/Main/PM/Optional)

## Identity

Reuse an empty target draft shell when present. Archive superseded unpublished drafts on replace. Never rewrite published week rows via this action.

## API

`GET/POST /api/hyrox/athletes/[id]/programme-drafts/copy-week`

POST body: `source_week`, `target_week`, optional `conflict_mode: "replace" | "merge_empty_slots"` (legacy `replace: true` still maps to replace).
