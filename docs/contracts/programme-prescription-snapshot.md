# Contract: Programme prescription snapshot (SessionFamily)

Status: Slice 2 — domain publish/copy semantics. **Not** wired to live publish/Copy Week yet.  
Depends on: `docs/contracts/prescription-engine.md`, `docs/contracts/session-family.md`.

## Purpose

Define how family-linked programme sessions carry **live draft previews** vs **immutable published history**, without requiring new SQL columns.

## Persistence (no migration required)

`hyrox_programme_sessions.prescription` is already JSONB and already embeds `editConfig`.

Additive nest key:

```ts
prescription.sessionFamily: SessionFamilyPublishSnapshot
```

Legacy rows omit the key. Readers must tolerate absence.

Draft weeks (client/local JSON) may carry `CoachDraftSession.sessionFamily` the same way.

## Draft vs publish

| Concern | Draft | Published |
| --- | --- | --- |
| familyId / stageId | Yes (attachment) | Yes (frozen in snapshot) |
| structuredWorkout | Generation snapshot | Frozen copy |
| PrescriptionRule(s) | Yes | Frozen |
| Resolved numbers | **Live preview** (may refresh) | **Frozen** PrescriptionSnapshot(s) |
| Coach override | Optional on preview | Frozen with provenance |
| Family definition later changes | Draft may warn on version skew | Published unchanged |
| Benchmark later changes | Draft preview may update | Published unchanged |

## Multi-slot shape

```ts
slots: Array<{
  slot: "run" | "ski" | "row" | "bike" | "strength" | "other"
  rule: PrescriptionRule
  snapshot: PrescriptionSnapshot   // final (formula or override)
  formulaResolvedValue: number | null
  formulaResolvedUnit: string | null
  finalResolvedValue: number | null
  finalResolvedUnit: string | null
}>
```

Pilot uses `run` only. Additional slots require no model redesign.

## Publishability

`getSessionPublishability` / `getSessionFamilyPublishability` returns:

| Status | Meaning |
| --- | --- |
| `PUBLISHABLE` | All slots resolved from anchors (or no family attachment — legacy path) |
| `PUBLISHABLE_WITH_COACH_OVERRIDE` | Publish allowed; one or more slots use coach override (missing anchor OK if override present) |
| `BLOCKED` | Missing anchor without override, invalid structure/family/stage, or invalid override |

Reasons are explicit strings. No opaque scores. Do not estimate missing anchors.

## Coach override provenance

When coach sets 3:27/km and formula would be 3:30/km:

- `snapshot.source === "coach_override"`
- `snapshot.expression` remains `@THRESHOLD +5s/km`
- `formulaResolvedValue === 210` (3:30)
- `finalResolvedValue === 207` (3:27)
- `missingAnchor` reflects profile truth

Do not pretend the formula produced the override.

## Copy Week (future wiring)

Pure helper: `copyFamilyLinkedDraftSession`.

| Preserve | Drop / re-resolve | Never |
| --- | --- | --- |
| familyId, stageId, definitionVersion, structuredWorkout, rules | Old prescriptionPreview; display targetPace from prior resolve | Auto-progress stage |

Stage 2 copied → Stage 2. Re-resolve against **current** Performance Profile when available.

Live `copyProgrammeWeekDraft` is **unchanged** in slice 2.

## Auto-Carry (future wiring)

Same as Copy: `autoCarryFamilyLinkedDraftSession` — preserve stage, never silently progress.

Live `autoCarryForwardProgrammeWeek` is **unchanged** in slice 2.

## Legacy compatibility

- Drafts without `sessionFamily` remain valid
- Published rows without `prescription.sessionFamily` remain valid
- Custom / library sessions unaffected
- No draft or published session **requires** SessionFamily

## Versioning decision

Use `familyDefinitionVersion` **plus** full structured + prescription snapshots on publish.  
Snapshots alone protect history; version enables draft drift warnings later.

## Schema / migrations

**None required for slice 2–3 persistence** if JSONB continues to carry nested objects.  
Propose SQL only if indexed queries on `familyId`/`stageId` become product-critical.

## Ownership

- `app/lib/hyroxSessionFamilyPublish.ts`
- `app/lib/hyroxSessionFamilyCopyCarry.ts`
- `app/lib/hyroxSessionFamilyDraftTypes.ts`
- `scripts/qa-hyrox-session-family-builder.ts`
