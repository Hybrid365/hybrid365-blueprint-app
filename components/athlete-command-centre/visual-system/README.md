# Athlete visual system (v0 Batch 0)

Presentation-only building blocks ported from the v0 Hybrid365 prototype.

## Isolation rules

1. **LAB / FIXTURE content** lives only under `visual-system/lab/`.
2. Fixture modules must **never** be imported by production resolvers, Home D, programme APIs, or coach tooling.
3. Visual components accept **athlete-safe view models** only — never raw drafts, family IDs, Stage N, or internal coach notes.
4. Domain source of truth remains `StructuredWorkout` and published programme data. Timeline `Segment` shapes are **display** only.

## Production-safe modules

- `tokens.ts`, `motion.ts`, `primitives/*`, `navigation/*`, `sessions/*`, `workout/*`
- `app/lib/visual-system/workoutTimelineViewModel.ts`

## Lab-only modules

- `lab/labFixtures.ts`
- `lab/V0VisualSystemLab.tsx`
- `lab/HomeDVisualPreview.tsx`

Label every fixture surface: **LAB / FIXTURE**.

## WorkoutTimelineViewModel (Batch 0)

Adapter: `app/lib/visual-system/workoutTimelineViewModel.ts`

| Block type | Support | Notes |
|---|---|---|
| `repeat` | supported | work + first recovery between reps; compound recoveries noted as gap |
| `continuous` | supported | single work segment |
| `station_round` | unsupported | empty segments + reason |
| `strength` | unsupported | empty / partial when mixed |
| warmup / cooldown string[] | noted | not timed — no fabricated durations |

Never invents zones, intensity, pace, distance, recovery, or loads. Missing → `null` / omit.

## Home D integration (Batch 1)

Adapters (production-safe):

- `app/lib/visual-system/homeDSessionCardAdapter.ts`
- `app/lib/visual-system/timelineModality.ts`
- `app/lib/visual-system/extractStructuredWorkout.ts`

**Primary session rule:** first session after programme slot order  
`AM → Main → PM → Optional`. No invented coaching importance.

**Modality:** `inferTimelineModality` — unknown → `"other"`. Never invents `"run"`.

Lab fixtures (`lab/*`) must never be imported by Home D / resolvers.
