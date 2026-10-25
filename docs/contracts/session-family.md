# Contract: Session family (progressive programming)

Status: Slice 1 — code-first domain model + Threshold 5-minute pilot.  
**Not** wired to the live programme builder. **No** DB tables. **No** migrations.

Owner: Progressive programming (on `integrate/hyrox-batch-1`).

Depends on: `docs/contracts/prescription-engine.md`, `HyroxAthletePerformanceProfile`, `docs/research/PROGRESSIVE_PROGRAMMING_ARCHITECTURE.md` (decided constraints).

## Purpose

Represent reusable coaching progressions as **SessionFamily** graphs whose **stages** hold structured workouts and `PrescriptionRule`s. Stages are independent of programme calendar weeks. Athlete targets resolve through the existing Dynamic Prescription Engine.

## Non-goals (slice 1)

- Programme builder UI / draft placement
- Admin family authoring UI
- DB migrations or `hyrox_session_library` rewrites
- Auto-advance on session completion (1-1 forbids this)
- Track automated progression writers
- Retiring `thresholdBlockProgression.ts`, coach library cards, or `runPrescription.ts`

## Core objects

### SessionFamily

| Field | Meaning |
| --- | --- |
| `id` | Stable code id (e.g. `threshold_5min_repeats`) |
| `name` | Coach-facing name |
| `modality` | `run` \| `ski` \| `row` \| `bike` \| `strength` \| `hyrox` \| `mixed` \| `recovery` |
| `objective` | Training purpose (not a calendar label) |
| `defaultEntryStageId` | Single default entry |
| `consolidationStageId` / `deloadStageId` | Optional named special stages |
| `stages` | Ordered list of stages (order is display; transitions define graph) |
| `transitions` | Hybrid graph edges |
| `eligibility.requiresAnchors` | Prescription bases that should exist for clean publish |

### SessionFamilyStage

| Field | Meaning |
| --- | --- |
| `id` | **Stable**. Must **not** be `weekN` / calendar-derived |
| `key` | `stage_1`, `consolidation`, `deload_a`, … |
| `intents` | One or more `ProgressionDimension` values |
| `structuredWorkout` | Canonical AST |
| `prescriptionSlots` | `{ slot, rule: PrescriptionRule }[]` |

**Stage ≠ programme week.** The same stage may appear in week 1 or week 5; week 3 may REPEAT a stage.

### SessionFamilyTransition

```ts
{
  fromStageId: string
  action: "PROGRESS" | "REPEAT" | "REDUCE" | "DELOAD" | "SKIP_TO"
  toStageId: string
  when?: "coach_default_block" | "feedback_suggest" | "manual_only"
}
```

Default block generators may follow `when: "coach_default_block"` PROGRESS edges. Coach may always choose any legal edge. No automatic decision-making in slice 1.

### Progression dimensions

`VOLUME` · `DENSITY` · `INTENSITY` · `SPECIFICITY` · `COMPLEXITY` · `RECOVERY_QUALITY` · `CONSOLIDATION` · `DELOAD`

Do not reduce progression to `difficulty: 3`.

### Structured workout (minimal AST)

- `warmup` / `cooldown` / `guidance`: short prose lines (display OK)
- `blocks`: structured `repeat` | `continuous` | `station_round` | `strength`
- Work: time (`sec`) or distance (`m` \| `km`)
- Recovery: `{ durationSeconds, type }` with type ∈ `walk` \| `jog` \| `easy_move` \| `passive`
- Compound recovery = ordered recovery array (e.g. 60s walk + 60s jog)

Display strings are **derived** (`hyroxSessionFamilyFormat.ts`). Free text is not the source of truth for progression structure.

### Prescription slots

```ts
{ slot: "run" | "ski" | "row" | "bike" | "strength" | "other", rule: PrescriptionRule }
```

Reuses `PrescriptionRule` from the prescription-engine contract. **Do not invent a second rule type.**

Pilot: `run` slot only with `@THRESHOLD +5s/km`  
(`basis: threshold_pace`, `adjustment: { type: "seconds_per_km", value: 5 }`).

Clarification vs architecture draft: slot id `primary_run` → canonicalized to `run`.

## Resolution

`resolveSessionFamilyStage({ family, stageId, profile, resolvedAt, overrides? })`

- Calls `resolveHyroxPrescription` per slot
- Returns structured stage copy, slot snapshots, `missingAnchors`, `publishable`, human summary, provenance
- **Pure**: does not mutate family/profile; does not publish; does not write athlete data

### Missing anchors

If the athlete has no active threshold anchor:

- `missingAnchor: true`
- `resolvedValue: null` on formula path
- `publishable: false` with an explicit reason
- **Do not estimate**

Coach override (existing engine): may set `resolvedValue` with `source: "coach_override"` while retaining `missingAnchor` provenance when the profile still lacks the anchor.

### Publishability (future builder)

Formula path publishable only when every slot has a resolved value. Override path publishable when override value present. Slice 1 reports status only — no publish.

## Coach authority

Coach may: pick entry stage, SKIP_TO, REPEAT, REDUCE, DELOAD, override prescription, unlink later, insert custom sessions. Completion never auto-advances stage in 1-1.

## Track

Same SessionFamily / Stage / PrescriptionRule objects later. No automated progression writers until Track gates exist.

## Pilot family

`threshold_5min_repeats` — **Threshold — 5 Minute Repeats**

| Stage | Structure | Primary intents |
| --- | --- | --- |
| Stage 1 | 5 × 5 min · 120s walk | VOLUME |
| Stage 2 | 6 × 5 min · 120s walk | VOLUME |
| Stage 3 | 6 × 5 min · 60s walk + 60s jog | RECOVERY_QUALITY, DENSITY |
| Stage 4 | 6 × 5 min · 90s jog | RECOVERY_QUALITY, DENSITY (modest; no volume jump) |
| Consolidation | Same structure as Stage 3 | CONSOLIDATION |
| Deload | 4 × 5 min · 120s walk | DELOAD (not tied to week 4) |

## Legacy mapping

Read-only prototype in `hyroxSessionFamilyLegacyMap.ts`. Alias/map only; never rewrite published or completed history.

## File ownership

- `docs/contracts/session-family.md`
- `app/lib/hyroxSessionFamilyTypes.ts`
- `app/lib/hyroxSessionFamilyFormat.ts`
- `app/lib/hyroxSessionFamilyValidate.ts`
- `app/lib/hyroxSessionFamilyResolve.ts`
- `app/lib/hyroxSessionFamilyRegistry.ts`
- `app/lib/hyroxSessionFamilyLegacyMap.ts`
- `app/lib/families/threshold5MinRepeats.ts`
- `scripts/qa-hyrox-session-family.ts`

## Divergence from existing builder / library

| Existing | Relationship |
| --- | --- |
| `CoachSessionEditConfig` (reps, recovery string) | Future adapter can project `StructuredWorkout` → editConfig; not done in slice 1 |
| Coach library free-text `mainSet` | Remains; legacy map is advisory |
| `thresholdBlockProgression.ts` | Remains; week-indexed ladders must not become stage ids |
| Community `runPrescription.ts` / `progressionFamilies.ts` | Stay outside 1-1 path |

## Ready for builder wiring?

**Not yet** — see slice return report. Domain + pilot + QA must stay green; then add draft refs (`familyId` / `stageId`), editConfig projection, and publish snapshot fields in a later slice.
