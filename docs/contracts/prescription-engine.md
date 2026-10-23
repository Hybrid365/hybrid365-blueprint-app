# Contract: Prescription engine

Status: Batch 1 Workstream A. Structured rules are the stored input. Free-text is a display label, not the resolver.

Owner: Prescription engine agent (`feature/hyrox-prescription-engine`).

Consumers: Session library, programme publish, athlete session detail, Track automation.

Depends on: `getHyroxAthletePerformanceProfile` / `HyroxAthletePerformanceProfile` in `app/lib/hyroxBenchmarkProfile.ts`. Do not fork a second profile shape.

## Purpose

Turn a coach-authored **structured rule** plus the active Performance Profile into a numeric target, then freeze that number on publish.

## Stored rule (canonical)

Do not parse arbitrary free text as the source of truth.

```ts
type PrescriptionBasis =
  | "run_5k_pace"
  | "threshold_pace"
  | "hyrox_run_pace"
  | "ski_2k_split"
  | "row_2k_split"
  | "ftp_watts";

type PrescriptionAdjustment =
  | { type: "seconds_per_km"; value: number }
  | { type: "seconds_per_500m"; value: number }
  | { type: "percent"; value: number }
  | { type: "identity" };

type PrescriptionRule = {
  basis: PrescriptionBasis;
  adjustment: PrescriptionAdjustment;
};
```

`value` is signed where an offset applies. `+20` seconds/km is slower than the anchor. `percent` is 0–100 of FTP watts (`85` means 85%). `identity` uses the anchor with no offset (`@HYROX`).

### Display labels (derived, not parsed)

| Rule | Label |
|---|---|
| `{ basis: "run_5k_pace", adjustment: { type: "seconds_per_km", value: 20 } }` | `@5K +20s/km` |
| `{ basis: "threshold_pace", adjustment: { type: "seconds_per_km", value: 5 } }` | `@THRESHOLD +5s/km` |
| `{ basis: "hyrox_run_pace", adjustment: { type: "identity" } }` | `@HYROX` |
| `{ basis: "ski_2k_split", adjustment: { type: "seconds_per_500m", value: 8 } }` | `@2K_SKIERG +8s/500m` |
| `{ basis: "row_2k_split", adjustment: { type: "seconds_per_500m", value: 5 } }` | `@2K_ROW +5s/500m` |
| `{ basis: "ftp_watts", adjustment: { type: "percent", value: 85 } }` | `@FTP 85%` |

A later session-library UI may show these labels. The engine formats them from the rule. It does not reverse-parse coach typing in Phase A.

Illegal combinations (engine rejects, does not guess):

- `seconds_per_km` only with `run_5k_pace`, `threshold_pace`, `hyrox_run_pace`
- `seconds_per_500m` only with `ski_2k_split`, `row_2k_split`
- `percent` only with `ftp_watts`
- `identity` allowed on any Phase A basis; intended for `@HYROX`

## Profile field map

Read **active** anchors only. Missing stays missing.

| Basis | Profile field | Anchor unit |
|---|---|---|
| `run_5k_pace` | `profile.run5k.paceSecondsPerKm` | s/km |
| `threshold_pace` | `profile.threshold.paceSecondsPerKm` | s/km |
| `hyrox_run_pace` | `profile.hyroxRun.paceSecondsPerKm` | s/km |
| `ski_2k_split` | `profile.ski2k.splitSecondsPer500` | s/500m |
| `row_2k_split` | `profile.row2k.splitSecondsPer500` | s/500m |
| `ftp_watts` | `profile.ftp.watts` | W |

Do not read lifetime bests, pending rows, `ski_1k`, `run_10k`, `run_30min`, `hyroxRace`, or strength 1RMs in Phase A. Do not estimate threshold, HYROX pace, or FTP.

## Input

- `PrescriptionRule`
- `HyroxAthletePerformanceProfile` (or the relevant active slice)
- Optional coach override `{ value: number; unit: string }`
- Resolution time (`resolvedAt`)

## Output snapshot

```ts
{
  rule: PrescriptionRule
  expression: string
  anchorType: string
  anchorValue: number | null
  anchorUnit: string | null
  offset: number | null
  resolvedValue: number | null
  resolvedUnit: string | null
  resolvedAt: string
  source: "formula" | "coach_override"
  missingAnchor: boolean
}
```

## Arithmetic

- Pace offset: `resolved = anchor + adjustment.value` (seconds per km or per 500m).
- FTP percent: `resolved = round(anchor * (value / 100))` watts, integer watts.
- Identity: `resolved = anchor`.
- Coach override: `source: "coach_override"`, `resolvedValue` is the typed number, `rule` and `expression` remain as context. Do not re-run the formula. An override is valid when the anchor is missing: `missingAnchor` stays true and `resolvedValue` is still the typed number. Publish uses `source === "coach_override"`, not the formula.

## Invariants

- Formula path: if the mapped anchor is null, `missingAnchor` is true and `resolvedValue` is null. Do not substitute a lifetime best or a population average.
- Override path: `missingAnchor` reports whether the profile had the anchor; it does not clear the typed `resolvedValue`.
- The same rule and the same anchor always produce the same number.
- The explanation is the derived expression plus the anchor value. No hidden curve.
- Publish copies this snapshot onto the session. Changing the active anchor later does not update that snapshot.
- Unpublishing is a product decision. Recalculation is not an automatic side effect of approval.
- Track calls this resolver. It does not reimplement the arithmetic.

## File ownership (Workstream A)

Owns:

- `docs/contracts/prescription-engine.md`
- `app/lib/hyroxPrescriptionTypes.ts`
- `app/lib/hyroxPrescriptionEngine.ts`
- `scripts/qa-hyrox-prescription-engine.ts`

Must not:

- Redesign athlete UI
- Add session-library formula fields or programme-builder UI
- Edit `app/lib/runPrescription.ts` (community/plan 5km estimates; not the 1-1 engine)
- Change Performance Profile types or migration 021
- Apply SQL, enable flags, backfill, merge, or push to main

## Out of scope until a later workstream

Session-library formula fields, draft resolution in the programme builder, athlete-facing "why this pace" copy, Copy Week snapshot behaviour, and Track automation callers. Those consume this snapshot; they do not invent a second shape.
