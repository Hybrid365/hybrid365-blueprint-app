# Contract: Prescription engine

Status: not started. Depends on the Performance Profile resolver.

Owner: Prescription engine agent.

Consumers: Session library, programme publish, athlete session detail, Track automation.

## Purpose

Turn a coach-authored expression plus the active profile into a numeric target, then freeze that number on publish.

## Expressions

Examples, not a parser spec:

- `@5K +20s/km`
- `@THRESHOLD +5s/km`
- `@2K_SKIERG +6s/500m`
- `@2K_ROW +4s/500m`
- `@FTP 85%`

A later contract revision will list the exact grammar. Until then, do not store free text as if it had already been resolved.

## Input

- Expression
- Output of the Performance Profile resolver
- Optional coach override value
- Resolution time

## Output

```ts
{
  expression: string
  anchorType: string
  anchorValue: number
  anchorUnit: string
  offset: number | null
  resolvedValue: number
  resolvedUnit: string
  resolvedAt: string
  source: "formula" | "coach_override"
  missingAnchor: boolean
}
```

## Invariants

- If the anchor is null, `missingAnchor` is true and `resolvedValue` is null. Do not substitute a lifetime best or a population average.
- The same expression and the same anchor always produce the same number.
- The explanation is the expression plus the anchor value. No hidden curve.
- A coach override stores `source: "coach_override"` and the typed number. The expression can remain visible as context.
- Publish copies the resolved output onto the session snapshot.
- Changing the active anchor later does not update that snapshot.
- Unpublishing is a product decision. Recalculation is not an automatic side effect of approval.
- Track calls this resolver. It does not reimplement the arithmetic.

## Out of scope until this contract is implemented

Session-library formula fields, draft resolution, and athlete-facing "why this pace" copy. Those need the snapshot shape above first.
