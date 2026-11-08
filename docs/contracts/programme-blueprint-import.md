# Programme blueprint import (coach-only)

Contract for importing a validated `CoachDraftWeek[]` blueprint into unpublished 1-1 programme drafts via Programme Builder.

## Invariants

1. Coach auth required (`requireHyroxCoachApi`). No client service-role.
2. Target athlete is the URL/path athlete id only — blueprint `athleteId` is remapped, never trusted for authz.
3. Never mutate published draft rows or `hyrox_programme_weeks` published snapshots.
4. Default conflict policy: **abort** if any target week has existing unpublished content.
5. Replace of unpublished weeks requires explicit `conflictStrategy: "replace_unpublished_confirmed"` plus the exact week numbers listed in the preview.
6. Multi-week import is all-or-nothing at the application layer: validate all weeks first; on mid-apply failure, archive any newly created import rows and report partial rollback.
7. Does not call the frozen deterministic generator.
8. After import, drafts are editable via existing Programme Builder PATCH save path.

## Blueprint shape

```ts
type ProgrammeBlueprintDocument = {
  id: string;
  name: string;
  version: string;
  weeks: CoachDraftWeek[]; // length 4 for a block import
  coachNote?: string;
  athleteFacingNote?: string;
  meta?: Record<string, unknown>;
};
```

## Endpoints

`POST /api/hyrox/athletes/[id]/programme-drafts/import-blueprint`

- `action: "preview"` — returns week diffs + conflicts; no writes
- `action: "apply"` — persists unpublished drafts when confirmed
