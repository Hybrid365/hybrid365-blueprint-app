# Contract: Programme week identity

Status: Slice 5 — publish integrity. Application-layer canonical selection.  
**No** new DB unique constraint / migration in this slice (document-only recommendation).

Owner: Progressive programming / programme publish.

## Logical identity

A programme week is identified by:

```
athlete_id + week_number   (global week, 1…programme length)
```

`block_number` is denormalised from the global week calendar and must stay consistent with it. It is **not** an independent identity key.

## Schema reality

`hyrox_programme_weeks` allows status `draft | published | archived`.  
There is **no** unique constraint on `(athlete_id, week_number)` or `(athlete_id, block_number, week_number)`.

Historically, `publishProgrammeDraft` always **INSERTed** a new published row. Multiple `status = 'published'` rows for the same athlete + week_number could coexist. Athlete/coach readers that used `.find` / `.maybeSingle` without ordering were non-deterministic and often showed the **oldest** week (stale sessions).

This predates Session Families; family publish merely made the bug visible.

## Canonical active row

Among `status = 'published'` rows for the same athlete + `week_number`, the **canonical** row is the latest by:

1. `published_at` desc  
2. then `updated_at` desc  
3. then `created_at` desc  
4. then `id` desc  

Helpers: `app/lib/hyroxProgrammeWeekIdentity.ts`  
(`selectCanonicalPublishedWeek`, `collapseToCanonicalPublishedWeeks`).

## Publish behaviour (Slice 5)

On publish / republish of a logical week:

1. Locate canonical existing published row for `athlete_id + week_number` (prefer matching `block_number` when present).
2. If found: **update** that row (metadata + bump `published_at`), **sync** sessions via `syncPublishedWeekSessionsFromDraft` (preserves `status` / `completed_at` / `athlete_feedback` on matched sessions; does not hard-delete orphan published sessions).
3. Mark other published siblings for that logical week `status = 'archived'` (no hard delete; sessions remain attached to archived week ids).
4. If none found: insert a new published week + sessions (first publish).

## Historical safety

| Concern | Behaviour |
| --- | --- |
| Completed sessions | Stay on their `programme_week_id`; sync updates matched slots in place |
| Athlete feedback | Preserved on matched session rows |
| Old published prescriptions | Remain on archived week rows / prior session versions not overwritten beyond sync match |
| Block reviews | Continue to reference week ids that still exist |

Do **not** destructive-delete historical week or session rows for republish.

## Reader requirements

All athlete/coach programme readers that load published weeks **must** collapse to canonical rows. Do not rely on unordered Supabase results, oldest row, or `.maybeSingle()` when duplicates may exist.

Covered paths (Slice 5):

- `fetchAthletePublishedProgramme`
- `fetchPublishedWeekForAthlete` (block publish sync)
- today-snapshot week resolve
- command-centre week load
- published-view summaries (week number lists)

## Recommended future schema (not applied)

```sql
-- Document only — do not apply in Slice 5
-- Unique among active published weeks:
-- CREATE UNIQUE INDEX … ON hyrox_programme_weeks (athlete_id, week_number)
--   WHERE status = 'published';
```

## Athlete-safe titles

Published `session_name` and athlete UI titles for family sessions use `athleteFacingTitle` (e.g. `Threshold Intervals`). Coach builder retains stage context (`Threshold 5 Minute Repeats · Stage 2`). Family internal coach notes do not surface on athlete UI.
