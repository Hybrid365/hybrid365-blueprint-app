# Track Compatibility Audit (1-1 coaching engine)

**Status:** audit only — do **not** implement Track auto-apply yet.  
**Date:** 2026-10-25 productionisation batch.

## Principles

- 1-1 remains coach-authoritative: propose → review → apply to **draft** → publish separately.
- Track may later auto-apply only actions classified as automation-safe.
- Never invent FTP / pace / anchors. Never mutate published history.

## Categories now structurally automation-ready

| Class | Meaning | Preconditions |
| --- | --- | --- |
| `SAFE_FAMILY_PROGRESSION` | Advance along a legal PROGRESS edge | High/medium confidence; valid family transition; no pain; anchor present when required |
| `SAFE_REPEAT` | Hold stage (REPEAT / KEEP) | Confidence not low; no pain; no conflicting signals |
| `SAFE_DELOAD` | Move to deload stage via legal edge | Valid DELOAD transition; no pain |
| `SAFE_EASY_VOLUME_ADJUSTMENT` | REDUCE along legal edge (e.g. easy/long volume, HYROX reduce) | Valid REDUCE edge; not race week; no missing required anchor for target rewrite |

## Still `REQUIRES_COACH` / blocked

| Class | Why |
| --- | --- |
| `REQUIRES_COACH` | Ambiguous evidence, unusual override, or policy default |
| `BLOCKED_PAIN` | Meaningful pain reported |
| `BLOCKED_LOW_CONFIDENCE` | Incomplete feedback |
| `BLOCKED_CONFLICTING_SIGNALS` | Recent comparables disagree |
| `BLOCKED_INVALID_TRANSITION` | No legal family edge |
| `BLOCKED_MISSING_ANCHOR` | Target rewrite needs anchor that is absent |
| `BLOCKED_RACE_WEEK` | Race-week safety |
| `BLOCKED_UNSAFE_VERB` | REMOVE / REPLACE / CHANGE_TARGET / MOVE / SKIP_TO / COACH_REVIEW |

## What still blocks lower-ticket Track automation

1. **No auto-publish path** — Composer apply persists draft only; Track must never publish.
2. **Week identity / duplicate rows** — live apply reuses unpublished draft for `week_number`; Track must use the same ensure/idempotent helpers.
3. **Coach load authority** — strength / farmers / sled loads stay coach-set; Track must not invent loads.
4. **FTP / threshold invent ban** — missing FTP → leave unresolved, never estimate.
5. **Selective apply UX** — Track would need an explicit accepted-set policy (or only apply `acceptedByDefault` SAFE_*).
6. **Manual edits after apply** — coach overrides remain authoritative; Track must not clobber `coach_override` slots.
7. **Library gaps** — `no_family` / `no_reduced_variant` sessions cannot be auto-rewritten.

## Ready for real 1-1 testing (human coach)

- Lossless structured workout round-trip for repeat / station_round / strength
- Expanded family library (incl. bike FTP, farmers, upper strength)
- Week Composer → live draft persist → Open in Programme Builder
- Adaptation eligibility tags for future Track
- Library gap dashboard (coach-facing)

## Wait

- Track auto-apply of any verb
- Auto-publish
- Invented anchors / loads
- Novelty families without library evidence
