# Contract: Session execution & feedback

Status: Foundation slice (domain + coach weekly review). Athlete chip UI flag-default OFF.

Owner: Coaching loop / adaptation agent.

Consumers: Adaptation engine, Weekly Review, Analytics (read-only), future Week Composer, Track (same model).

## Purpose

Capture what happened in a programmed session with the least friction that still supports coach decisions and transparent adaptation recommendations.

## Canonical outcomes

Every programmed session ultimately resolves to one of:

| Outcome | Meaning |
| --- | --- |
| `complete` | Prescribed work done |
| `partial` | Some prescribed work done |
| `missed` | Confirmed did not happen |

Do **not** auto-write `missed` at midnight. Forgotten sessions use “Did you do this?” then the same completion flow.

DB `hyrox_programme_sessions.status` remains `scheduled | completed | missed | modified` until a later migration adds first-class `partial`. Product mapping without migration:

| Outcome | Stored status (interim) |
| --- | --- |
| complete | `completed` |
| partial | `modified` (+ `execution.completion = "partial"`) |
| missed | `missed` |

Canonical SoT for adaptation is the **execution summary**, not legacy `modified` alone.

## Execution summary (canonical)

```ts
{
  completion: "complete" | "partial" | "missed"
  execution: "all" | "most" | "some" | "missed_target" | null  // null when missed
  rpe: number | null   // 1–10; null when missed or missing
  control: "very_controlled" | "controlled" | "appropriate" | "hard" | "maximal" | null
  pain: "none" | "minor" | "meaningful" | null
  energy: "good" | "ok" | "low" | null  // optional
  athleteNote: string | null
  missedReason: "illness" | "life" | "fatigue" | "pain_injury" | "schedule" | "other" | null
  actuals: Record<string, string | number | null> | null
  source: "structured" | "legacy_inferred"
}
```

Stored additively under `athlete_feedback.execution` (jsonb). Legacy `rpe` / `notes` / metrics remain dual-written. Do not destroy historical records.

## Missed sessions

Collect only: completion=`missed`, `missedReason`, optional note. No RPE / execution / control.

## Invariants

1. Missing stays missing — do not invent RPE or execution.
2. Pain is a flag, never a diagnosis.
3. Preview is read-only.
4. Community `session_logs` is a different product — do not reuse.
5. Analytics may continue counting `status === "completed"` only; Weekly Review / adaptation use the execution summary.
