# Contract: Adaptation engine (foundation)

Status: Recommend-only for 1-1. No auto programme mutation. No LLM primary decision.

Owner: Coaching loop agent.

Depends on: `docs/contracts/session-execution.md`, `docs/contracts/session-family.md`, `docs/contracts/athlete-analytics.md`.

## Loop

PRESCRIPTION → EXECUTION → FEEDBACK → INTERPRETATION → ADAPTATION RECOMMENDATION → COACH DECISION → NEXT PRESCRIPTION

## Authority

| Mode | Engine | Apply |
| --- | --- | --- |
| 1-1 | Same deterministic rules | Coach decides. `autoApplyForbidden: true` |
| Track (later) | Same rules | May apply when confidence + action allow |

Never invent a second Track taxonomy.

## Verbs (canonical)

```
KEEP | PROGRESS | REPEAT | REDUCE | DELOAD | CHANGE_TARGET | MOVE | REPLACE | REMOVE | SKIP_TO | COACH_REVIEW
```

Session Family stage outcomes (primary when linked):

```
PROGRESS | REPEAT | REDUCE | DELOAD | SKIP_TO | COACH_REVIEW
```

(`KEEP` = no stage change / no remaining-week change.)

Map family recommendations only onto **allowed** graph edges. Never invent stage IDs. Invalid transitions are impossible via the bridge helper.

## Recommendation shape

```ts
{
  verb: AdaptationVerb
  confidence: "low" | "medium" | "high"
  reasons: string[]           // bullet facts, not prose fluff
  suggestedNext: {
    familyId: string | null
    fromStageId: string | null
    toStageId: string | null
    toStageLabel: string | null
  } | null
  coachOptions: AdaptationVerb[]
  autoApplyForbidden: true
  escalateToCoach: boolean
  sessionId: string
  familyId: string | null
  evidenceSessionIds: string[]
  automationEligibility: {
    allowed: boolean
    class: AutomationClass
    reasons: string[]
  }
  athleteExplanation: {
    title: string
    summary: string
    change: string | null
  }
}
```

`automationEligibility` is a **policy assessment only**. 1-1 still requires an explicit coach decision even when `allowed: true`. Track may later inspect this field — do not implement writers here.

No 0–100 score. No “AI recommends” label — source is `system_recommendation`.

## Confidence

| Level | When |
| --- | --- |
| low | Missing execution chips, single isolated session, conflicting signals |
| medium | Complete structured feedback on one quality session |
| high | ≥2 agreeing exposures on same family/objective + complete feedback |

Pain `meaningful` → `COACH_REVIEW`, never diagnose. Confidence of the safety interrupt can be high; confidence of creative swaps stays none.

Missed due to illness / life / schedule → do not interpret as fitness failure (prefer KEEP / no progression penalty).

## Coach decision / audit

`recommendation != decision`.

Record (append-only in weekly review `coach_notes.adaptationDecisions` until a dedicated table exists):

- system recommendation + confidence + reasons
- coach decision verb
- final chosen transition (toStageId when family)
- timestamp, coach user id
- `programmeModified: false` unless coach separately edits the programme

Dismissing a recommendation is auditable and is **not** a programme change.

## Safety

Pain may only: lower progression confidence, recommend HOLD/`COACH_REVIEW`, suggest reduce/remove for coach consideration. Never medical conclusions.
