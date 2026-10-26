# Contract: Week Composer

Status: MVP implemented (propose → coach review → draft apply). Default **OFF**.

Owner: Programming / coaching loop.

Depends on: Programming Anchors, Session Library, Session Family, session-execution, adaptation-engine, published week identity.

## Purpose

Propose the **next** or **remaining** programme week from inspectable inputs.

```
SYSTEM PROPOSES → COACH REVIEWS → COACH EDITS / SELECTS → COACH APPLIES (draft) → COACH PUBLISHES SEPARATELY
```

Never auto-publish. Never mutate completed history. Never invent missing anchors.

## Modes

| Mode | Use |
| --- | --- |
| `next_week` | Construct the following training week from recent structure + adaptation |
| `remaining_week` | Propose changes to upcoming sessions in the current week only |

## Decision authority

| Product | `decisionAuthority` |
| --- | --- |
| 1-1 | `"coach"` always |
| Future Track | `"system"` only for actions that pass `automationEligibility` |

1-1 ignores automation eligibility for apply — coach action is mandatory.

## Inputs — `WeekComposerContext`

Athlete · Programming Anchors (active only) · Current/recent programme weeks · Execution summaries · Adaptation recommendations · Weekly volume/quality/pain flags · Coach instruction (free text + structured constraints).

Missing context stays missing.

## Output — `WeekProposal`

Per day/slot: action (`KEEP` | `PROGRESS` | `REPEAT` | `REDUCE` | `CHANGE_TARGET` | `MOVE` | `REPLACE` | `REMOVE` | `ADD`), library/family/stage, prescription preview, reason, change vs previous, confidence.

Also: proposed run volume, quality count, notable changes, unresolved warnings, sessions requiring coach judgement, `libraryGaps[]`, optional athlete-facing change messages (not auto-sent).

`autoApplyForbidden: true` · `published: false` on apply · `decisionAuthority: "coach"` in 1-1.

## Session preference order

1. Exact scheduled session (KEEP / same structure)
2. Valid Session Family stage edge
3. Canonical Session Library entry
4. Custom only when coach chooses

If none: report `"No suitable canonical library session"` + library gap. Do not invent sessions.

## Stable structure

Preserve day/slot roles unless coach instructs otherwise, availability requires MOVE, adaptation makes change sensible, or race/taper context requires change.

Same-day progression default: Tuesday family → Tuesday next week.

## Apply

Writes **draft** programme only via existing draft persistence. Publish remains a separate coach action.

## Feature flag

```
HYROX_WEEK_COMPOSER_ENABLED=1
HYROX_WEEK_COMPOSER_ATHLETE_IDS=uuid,...
HYROX_WEEK_COMPOSER_DEV_ALL=1   # development only
```

Default OFF. Dedicated flag — do not reuse Session Family / execution chips flags.

## Invariants

1. Does not mutate completed / past sessions (Remaining Week).
2. Does not publish.
3. Missing anchors stay missing.
4. Family stage picks must be legal graph edges.
5. Internal coach notes never become athlete-facing copy.
6. Same objects for Track later — different authority only.
7. Library gaps are reported, not papered over with fake sessions.
