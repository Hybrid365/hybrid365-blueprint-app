# Hybrid365 platform blueprint

Production app: `https://plan.hybrid-365.com`

This document is the product and architecture map. It does not authorise a production deploy, a database migration, or a merge.

## Product vision

Hybrid365 is a hybrid-performance coaching platform. The app already delivers programmes. The platform should make coaching more personal and more efficient, then reuse that same decision logic for a lower-ticket product.

The coaching loop is:

**Athlete profile → Prescription → Training → Execution → Feedback → Interpretation → Adaptation → Progress**

Product constitution (Home, session, adaptation, Track vs 1-1): `docs/HYBRID365_COACHING_PLATFORM.md`. Canonical workflow: `docs/HYBRID365_COACHING_OPERATING_MODEL.md`. Athlete Home foundation (Version D): `docs/HYBRID365_HOME_DIRECTION.md`.

Two products share one engine:

| Product | Who decides | Software role |
| --- | --- | --- |
| HYROX 1-1 | The coach | Assists. The coach approves anchors, publishes programmes, and overrides targets. |
| Track (future, lower ticket) | Rules the coach has approved | Automates repeatable decisions. It does not invent a second performance model. |

Community, free-week, and Hybrid75 surfaces stay separate from the 1-1 athlete portal. Do not mix their tables, auth, or copy.

## Current systems

These exist and should be extended, not rebuilt:

- Applications, manual payment confirmation, onboarding, assessment, testing
- Programme builder, session library, custom sessions, drag/drop edit
- Draft and publish, Block 4+, Copy Week, Auto-Carry
- Athlete programme, session detail, session logging, weekly check-ins
- Coach preview / View-as-Athlete (read-only)

Production `main` at the time of this blueprint includes the middleware timeout fix, Copy Week, Auto-Carry, Block 4+, and athlete rollout hardening.

`feature/hyrox-performance-profile-phase-1` is unmerged. Its intended model is append-only benchmark history, one active programming anchor per type, athlete submission, coach approval, normalized values, and a Performance Profile resolver for later formulas. This branch does not contain that code. Do not treat it as live.

## Future systems

| Area | Purpose |
| --- | --- |
| Performance Profile | Benchmark history and the active programming anchor |
| Dynamic prescriptions | Resolve `@5K +20s/km`, threshold, erg, FTP, and strength expressions |
| Session Library V2 | Reusable intent templates that can carry dynamic targets |
| Athlete Dashboard | Mobile home for the current day, programme, and performance |
| Coach Command Centre | Fast programming, review, and attention queue |
| Session feedback | RPE, notes, pain, completion |
| Weekly review | Coach interpretation of the week |
| Training analytics | Transparent load, volume, and completion |
| Race profile | HYROX results, splits, limiters, race week |
| Integrations | Strava first, then other wearables, behind one activity model |
| Goals | Targets the athlete and coach can see |
| Coach adjustments | Explicit overrides that win over automation |
| Injury / niggle | Context that can block or soften prescription |
| Nutrition / bodyweight | Light support, not a second product |
| Social assets | Presentation of real results, not invented metrics |
| Track automation | Self-serve programmes on the same engine |

## Critical workflows

1. **Onboard.** Application → payment confirmed by a coach → assessment → testing week → profile.
2. **Programme.** Coach builds a draft → Copy Week / Auto-Carry when appropriate → publish. Published targets stay as history.
3. **Train.** Athlete sees the published session, logs it, and can leave feedback.
4. **Review.** Coach sees check-ins, logs, and pending benchmark submissions.
5. **Adapt.** Coach changes the next draft. Published weeks are not rewritten to match the new anchor.
6. **Preview.** View-as-Athlete renders the athlete UI and cannot mutate.

## Data ownership

| Data | Owner | Athlete can | Coach can |
| --- | --- | --- | --- |
| Profile and assessment | Athlete submits, coach interprets | Edit own onboarding answers | Read and map |
| Benchmark result | Shared history | Submit pending result, read own history | Approve, reject, choose the active anchor, enter a result |
| Active programming anchor | Coach | Read the current value | Set and replace |
| Draft programme | Coach | No | Edit until publish |
| Published session target | Historical record | Read | Not silently rewrite |
| Internal coach note | Coach | Never | Read and edit |
| Athlete-facing note | Coach, written for the athlete | Read | Edit |
| Session log and check-in | Athlete | Create own | Read |
| External activity | Integration layer | Connect own account later | Read matched summaries |

## Performance-data philosophy

- Store a result as history. Do not overwrite the previous result to save the latest one.
- Keep a raw display value and a numeric normalized value.
- Lifetime best, recent test, coach entry, and active programming anchor are different facts.
- The future formula engine reads the **active** anchor, not the fastest lifetime result.
- Missing data stays null. Do not estimate threshold, HYROX pace, or FTP unless a later contract defines the formula.
- Do not invent readiness, load, or race scores for display.

## Prescription philosophy

- 1-1 targets are coach-authored until a formula is explicitly resolved and snapshotted.
- A resolved target stores the expression, the anchor used, the numeric output, and the time it was resolved.
- Republishing or moving an anchor does not change an already published snapshot.
- Coach override wins over a formula.
- Track may resolve formulas without a human click, but it must call the same resolver and store the same snapshot.

## Integration philosophy

- Core tables store Hybrid365 sessions, benchmarks, and logs.
- An external provider writes into an ingestion table, then a matcher links an activity to a session.
- Strava is the first provider. Pace, distance, duration, heart rate, power, and splits are provider-neutral fields.
- Disconnecting a provider deletes or detaches imported activities. It does not delete coach-published sessions or athlete logs.

## Deployment philosophy

Feature work stays in an isolated worktree. Agents do not merge or deploy themselves.

`Feature branch → local QA → human review → merge to main → deploy the app → smoke test`

Database migrations are a separate approval. The Next.js deploy does not apply SQL. Apply migrations to staging first. Production SQL requires an explicit human approval.

Feature flags default off. Allow-lists (`*_ATHLETE_IDS`, `*_ATHLETE_EMAILS`) and development-only `*_DEV_ALL` are the rollout tools. Do not turn Home V2, Today V2, or Performance Hub on globally as part of unrelated work.

## Agent boundaries

See `docs/HYBRID365_AGENT_GUIDE.md` for roles, worktrees, and the merge gate. Contracts live in `docs/contracts/`. Staging lives in `docs/HYBRID365_STAGING.md`. Visual language lives in `docs/HYBRID365_VISUAL_SYSTEM.md`.
