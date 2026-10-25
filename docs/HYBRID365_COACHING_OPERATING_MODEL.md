# Hybrid365 coaching operating model

Canonical 1-1 and Track workflow. Sits below `docs/HYBRID365_COACHING_PLATFORM.md`.

This document does **not** authorise product code, a live Home change, a migration, a merge, a deploy, or applying SQL. It resolves the five research docs into one set of product decisions.

Related: `docs/HYBRID365_PLATFORM_BLUEPRINT.md`, `docs/HYBRID365_AGENT_GUIDE.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/HYBRID365_INTERACTION_SYSTEM.md`, contracts in `docs/contracts/`. Research (not canonical): `docs/research/`.

Home D is the **approved** athlete Home foundation (sticky Mon–Sun day nav retained; refine, do not replace with Home A/C). Canonical: `docs/HYBRID365_HOME_DIRECTION.md`. It remains visual-lab only until a named human rollout task. Flags `HYROX_HOME_V2_*`, `HYROX_TODAY_V2_*`, and `HYROX_PERFORMANCE_HUB_*` stay off.

---

## Decisions

Rulings on the known tensions. The rest of this document implements them. Do not re-open these in a later research pass without a human.

| # | Tension | Ruling |
| --- | --- | --- |
| 1 | A wants required RPE + execution + pain on complete/partial. C wants fast default completed + RPE + optional note/pain. | **Coach-useful fast sheet.** Complete / Partial opens **one screen of chips**, not a form wall and not empty save. Required to save: session RPE (1–10), execution quality (4 chips), pain (`none` / `yes`). Optional on the same sheet: energy, legs (type-gated), collapsed note. Expand is for **one primary actual** only. Partial pre-selects execution `cut_short`; the athlete can change it. This is A's data with C's container. |
| 2 | A/D want first-class Partial. C asks relabel `modified` vs add Partial later. | **Partial is first-class in the product model now.** Athlete language is Completed / Partial / Missed only. Never show “Modified” as a coaching or athlete state. `modified` is legacy storage. Do not silently recast legacy rows. New Partial writes use a dedicated completion state (migration when a human approves SQL). Analytics: Partial is not completed. Weekly review must match analytics — stop counting `modified` as completed. |
| 3 | STARTED: A says skip. | **Confirmed. No Started / in-progress state.** Device mid-upload lives on the ingestion/match record (`pending_match`), not on the programme session. |
| 4 | Energy/legs: A says energy always shown, legs on run/HYROX/strength. C asks expand vs check-in vs not v1. | **A, optional.** Energy (`good` / `ok` / `low`) is shown on every complete/partial sheet, not required. Legs (`good` / `heavy` / `sore`) shown on run / HYROX / strength / compromised only, not required. Not expand-only. Not a fourth daily-readiness surface. Weekly check-in keeps 1–10 energy. Migration `017` stays unapplied. |
| 5 | Empty one-tap complete: A wants to drop it. | **Confirmed. Drop it.** Complete always opens the fast sheet. A session cannot become completed with empty RPE, empty execution, and empty pain. |
| 6 | Mid-week athlete notice: C says Updated + CoachMark + reason, no notifications product. | **Confirmed.** Label `Updated` + CoachMark + athlete-facing reason. No push / inbox product. Reason is **required to publish** REDUCE / REPLACE / MOVE / REMOVE / CHANGE TARGET. If an old republish has no reason, show `Updated` + the new target only — never invent copy, never leak an internal note. |
| 7 | Nav: C says Home / Programme / Progress / Performance / More; Check-in and Races in More. | **Confirmed.** Ship with Home D, not before. Check-in due badge on More (and a Home CTA when due). Races only when the race-intelligence flag is on. Performance testing in More only while a testing week is active. |
| 8 | Track: E says launch at L1 not L0; do not build Track writers until product mode, snapshots, audit, completion fields, templates, escalation queue exist. | **Confirmed.** L0 is a fallback when an anchor is missing, not a launch product. Track writers are forbidden until the hard gates in §4 are real on the shared engine. |
| 9 | Adaptation apply: dedicated write vs builder + audit. | **Decision sheet + builder mutations + dedicated audit.** The coach (or later Track) chooses KEEP / REDUCE / … on a decision sheet. Mutations use existing builder verbs and the publish/snapshot path. An append-only AdaptationAudit row is written at apply time. No second session-write API. A raw builder edit of next week is programme authoring, not an adaptation, unless it came through the decision sheet or was explicitly marked as an adaptation of a live week. |
| 10 | Prescription engine exists but builder is not wired. | **Batch 3, on the 1-1 critical path.** Wire structured `PrescriptionRule` → resolve → publish snapshot into the programme builder **before** Home D live adoption of “why this pace”, **before** adaptation CHANGE TARGET / REDUCE INTENSITY, **before** Track L1. The engine is not an adaptation engine and not a Track project. |

---

## 1. Product architecture

Hybrid365 is one coaching loop used by two products:

**Athlete profile → Prescription → Training → Execution → Feedback → Interpretation → Adaptation → Progress**

Do not create a second Performance Profile, prescription resolver, analytics payload, attention grammar, session model, or race model.

```
                    ┌──────────────────────────────────────────┐
                    │  Shared domain                            │
                    │  AthleteProfile · PerformanceProfile      │
                    │  PrescriptionRule / Snapshot              │
                    │  Programme / Week / Session               │
                    │  SessionExecution / Feedback / Actuals    │
                    │  CoachingSignal · Analytics               │
                    │  AdaptationRecommendation + Audit         │
                    │  RaceResult                               │
                    └──────────────────┬───────────────────────┘
                                       │
                    recommend only     │     apply if confident
              ┌────────────────────────┴────────────────────────┐
              │                                                 │
       1-1 / HYROX Team                                  Hybrid365 Track
       Coach publishes                                   Template + rules publish
       Coach activates anchors                           Track activation policy
       Command Centre inbox                              Coach-support exceptions
       Named coach presence                              System explanation
```

Community, free-week, and Hybrid75 (`/dashboard`, `/plan`, `/free-week`, `/hybrid75`, community `session_logs`, `runPrescription.ts`, community “HYROX Track”) sit **outside** this diagram. Do not reuse those write paths.

### Surfaces

| Surface | Job | Must not |
| --- | --- | --- |
| **Athlete app** (`/athlete`) | Weekly command centre (Home D direction), session, complete, Programme, Progress, Performance, More (Check-in / Races / Testing) | Show mock data as a live result. Leak `coach_note`. Invent a pace, FTP, or score. |
| **Coach / admin** (`/admin/hyrox-athletes`) | Operating system: roster scan, Command Centre, planner, weekly review, approvals | Marketing tiles. Silent programme edits. Treat mock roster as live attention. |
| **Shared domain** (`hyrox_*` + contracts) | One model of profile, prescription, execution, signals, adaptation | Fork a Track-only log, score, or resolver. |
| **Preview** (`/admin/hyrox-athletes/[id]/preview`) | Read-only View-as-Athlete | Mutate. |

### Authority

| Mode | System may | System must not |
| --- | --- | --- |
| **1-1 / HYROX Team** | Calculate, identify, compare, flag, recommend, preview | Silently change an important programme, activate an anchor, impersonate a coach note |
| **Hybrid365 Track** | Apply a **subset** of the same decisions when a named rule and confidence gate allow | Invent a second engine, diagnose, auto-pick a PB, impersonate Kieran |

1-1 is the product that must make Kieran faster now. Track is the same engine with a writer, later.

---

## 2. Core domain objects

Conceptual. No schema. Names here are the product language later contracts must freeze.

### Object catalogue

| Object | Owner | Meaning |
| --- | --- | --- |
| **AthleteProfile** | Athlete submits; coach interprets | Identity, assessment, upcoming race label, equipment, training days. Not a result history. |
| **PerformanceProfile** | Shared history; coach (1-1) or Track policy activates | Append-only benchmark results. One **active programming anchor** per type. Fastest lifetime is not the anchor. Race overall is history, not an active pace. |
| **Programme** | Coach authors (1-1); template family + rules (Track) | A block of weeks for one athlete. Draft until published. |
| **ProgrammeWeek** | Coach publishes (1-1); system may publish from a template (Track) | Monday–Sunday published snapshot + weekly intent + athlete-facing note + internal `coach_note`. |
| **ProgrammeSession** | Coach / template | One planned session on a day/slot. Holds the **published prescription snapshot**. History. |
| **PrescriptionRule** | Coach (or template author) | Structured rule (`basis` + `adjustment`). Display label is derived. Free text is not parsed. |
| **PrescriptionSnapshot** | System, at publish (or Track resolve) | Frozen number: rule, expression, anchor, resolved value, source (`formula` \| `coach_override`), `resolvedAt`. Changing an anchor later does not rewrite it. |
| **SessionExecution** | Athlete (or later confirmed device match / Track rule) | State machine on a **published** session: `planned` → `completed` \| `partial` \| `missed`. No `started`. |
| **SessionFeedback** | Athlete | Subjective chips: RPE, execution quality, energy, legs, pain, note, missed reason. |
| **SessionActuals** | Athlete and/or device | Objective result. One primary actual matching the prescription. Each value records source. Missing stays missing. |
| **CoachingSignal** | System (pure) | Transparent observation from stored facts (attention codes, interpretation cases). Not a score. Never writes the programme. |
| **AdaptationRecommendation** | System (pure) | Remaining-week options with observation, reason, confidence, athlete-facing explanation. `autoApplyForbidden: true` in 1-1. |
| **ProgrammeAdjustment** | Coach decides (1-1); system may apply (Track) | Accepted action on an **unlogged remaining** session: KEEP / REDUCE VOLUME / REDUCE INTENSITY / CHANGE TARGET / MOVE / REPLACE / REMOVE. |
| **WeeklyReview** | System prepares facts; coach writes decisions (1-1); Track uses the prepared facts | Planned vs happened vs response vs what changes next. Coach fields are decisions, not a journal. |
| **RaceResult** | Athlete or coach appends | One HYROX race as history + splits. Observations from stored seconds only. Does not change training. |

### Relationships

```
AthleteProfile
    │
    ├── PerformanceProfile ── active anchors ──► PrescriptionRule ──publish──► PrescriptionSnapshot
    │                                                                              │
    ├── Programme ── ProgrammeWeek ── ProgrammeSession ◄───────────────────────────�Snapshot
    │                                                                              │
    ├── Programme ── ProgrammeWeek ── ProgrammeSession ◄───────────────────────────┘
    │                                      │
    │                                      ├── SessionExecution (state)
    │                                      ├── SessionFeedback  (subjective)
    │                                      └── SessionActuals   (objective)
    │                                                │
    │                                                ▼
    │                                         CoachingSignal
    │                                                │
    │                                                ▼
    │                                      AdaptationRecommendation
    │                                                │
    │                         1-1: coach decides     │     Track: rule may apply
    │                                                ▼
    │                                      ProgrammeAdjustment ──► new snapshot on remaining session
    │                                                │
    │                                                ▼
    │                                      AdaptationAudit (append-only)
    │
    ├── WeeklyReview (reads week + logs + signals; may queue next-week candidates)
    └── RaceResult (history only; not an anchor)
```

### Ownership rules

- Athlete history is never silently overwritten.
- Published targets are immutable snapshots. Adaptation writes **forward** (new snapshot on a remaining session), never backwards.
- Internal `coach_note` never enters an athlete payload. Athlete-facing copy is a dedicated field.
- Preview cannot write.
- Optional sessions may stay `planned` forever without becoming missed.
- Demo / mock roster rows are not live coaching objects.

---

## 3. End-to-end 1-1 flow

Each stage lists athlete / coach / system action, data written or read, UI, and the trigger that opens the next stage.

### 3.1 Onboarding

| | |
| --- | --- |
| **Athlete** | Applies. Completes payment. Fills assessment. |
| **Coach** | Confirms payment. Reviews application. Opens Profile Review when assessment lands. |
| **System** | Creates `hyrox_athletes` row. Does not invent a programme. |
| **Data** | AthleteProfile (assessment answers, upcoming race label, equipment). Payment state. |
| **UI** | Intake on `/admin/hyrox-athletes` Applications → Accepted. Athlete: `/athlete/assessment`. |
| **Next trigger** | Coach starts a testing week, or maps the profile and generates the first draft. |

### 3.2 Testing

| | |
| --- | --- |
| **Athlete** | Completes the testing-week protocol (More → Performance testing, only while active). May submit a result. |
| **Coach** | Inserts / hydrates the testing week. Reviews results. Approves and **explicitly** activates anchors. |
| **System** | Stores each result as append-only PerformanceProfile history, status `pending` if athlete-submitted. Does not auto-activate. Does not estimate threshold / HYROX pace / FTP. |
| **Data** | Benchmark rows (`onboarding_test` / `performance_test` / `athlete_submitted` / `coach_entered`). Active anchors only after coach activation. |
| **UI** | Coach Testing + Performance Profile tabs. Athlete Performance (flag) for later submits; testing protocol is a distinct title. |
| **Next trigger** | At least the anchors the first week needs are active, **or** the coach will type overrides. Coach opens Programme Builder. |

### 3.3 Programming

| | |
| --- | --- |
| **Athlete** | Sees nothing until publish. Upcoming unpublished weeks stay locked. |
| **Coach** | Create week / Copy Week / Auto-Carry → place library or scratch sessions → resolve prescriptions → sixty-second context pass → preview → publish. |
| **System** | Resolves each `PrescriptionRule` against **active** anchors. Missing anchor + no override blocks that session’s publish. Copies snapshots onto published sessions. Strips logs on Copy Week. Internal notes stay internal. |
| **Data** | Programme draft → ProgrammeWeek + ProgrammeSessions + PrescriptionSnapshots. Week `athlete_facing_note` / `coach_note`. |
| **UI** | Programme Builder (library · week board · rail). Preview is read-only. |
| **Next trigger** | Publish. Athlete Home can render the live week. |

Until the builder is wired (Decision 10), the coach still authors targets as today. The operating model treats wiring as the next planner batch, not as optional polish.

### 3.4 Home D

| | |
| --- | --- |
| **Athlete** | Opens `/athlete/dashboard`. Sees Mon–Sun, today selected, that day’s sessions, CoachMark if athlete-facing copy exists, insights below the fold from **logged** analytics only. |
| **Coach** | Does not act on Home. May have left a week or day note at publish. |
| **System** | Renders published sessions only. Unpublished week = one honest sentence. Demo fixtures never appear as live numbers. |
| **Data** | Published ProgrammeWeek / Sessions. `athlete_facing_note`. Analytics fields only when the analytics flag is on **and** the value exists. |
| **UI** | Home D hierarchy: **Week → selected day → planned training → coach context → my insights.** Session preview: slot · title · primary target. Drawer on tap. Visual-lab only until rollout. |
| **Next trigger** | Athlete taps a session. |

### 3.5 Session

| | |
| --- | --- |
| **Athlete** | Inspects purpose, primary target, structure, prescription, coach context. |
| **Coach** | Already authored the snapshot and any athlete-facing session note. |
| **System** | Shows the **frozen** snapshot. Does not re-resolve `@5K +20s/km`. If `missingAnchor` and no override: say the target is not resolved. |
| **Data** | ProgrammeSession + PrescriptionSnapshot + athlete-facing session note. |
| **UI** | Drawer (live container). Order: **PURPOSE → TARGET → STRUCTURE → PRESCRIPTION → COACH CONTEXT → COMPLETE.** One king number stays visible. |
| **Next trigger** | Athlete taps Complete, Partial, or (after the date) answers Did you do this? |

### 3.6 Execution

| | |
| --- | --- |
| **Athlete** | Does the work in the real world. No in-app Start. |
| **Coach** | — |
| **System** | Session stays `planned` until the athlete resolves it. A later device file is `pending_match` on ingestion, not a session state. |
| **Data** | None yet. Forgotten sessions stay `planned`; attention may say “not completed” without claiming a confirmed miss. |
| **UI** | After the local calendar date: Home **Did you do this?** — Completed · Partial · Missed. No auto-miss at midnight. |
| **Next trigger** | Athlete chooses a completion state. |

### 3.7 Submission

| | |
| --- | --- |
| **Athlete** | Fast sheet: RPE, execution, pain required. Energy / legs / note optional. Expand: one primary actual. Missed: optional reason, stop. |
| **Coach** | — |
| **System** | Writes SessionExecution + SessionFeedback + SessionActuals onto the same programme session. Dual-read legacy `rpe` / `notes` until consumers move. Preview 403. |
| **Data** | `state`, `submittedAt`, RPE, execution quality, pain, optional energy/legs/note, optional primary actual + planned snapshot copy. `decisionSource: athlete`. |
| **UI** | One sheet. 160ms confirm: **Target · Actual · RPE**, then execution / legs / energy if present, then “Your coach can see this result.” Home preview becomes Completed / Partial / Missed. No confetti. |
| **Next trigger** | Save. Interpretation runs as a pure function over the new row. |

### 3.8 Interpretation

| | |
| --- | --- |
| **Athlete** | Sees stored target vs actual vs RPE only. No “threshold held” sentence until a later contract defines it and both sides exist. |
| **Coach** | Does not interpret yet — waits for Command Centre. |
| **System** | Builds CoachingSignals: target-vs-effort cases, `high_rpe_vs_prescribed`, pain flag, partial, confirmed miss, repeated legs/energy when chips exist. No composite score. |
| **Data** | CoachingSignal records (or on-the-fly flag evaluation — same codes). Reads analytics; does not re-implement it. |
| **UI** | None required for the athlete. Coach sees flags on Overview. |
| **Next trigger** | Any safety or remaining-week conflict, or the coach’s next daily open. |

### 3.9 Command Centre

| | |
| --- | --- |
| **Athlete** | Never sees this surface. |
| **Coach** | Opens Overview. In seconds: Needs attention → changes since last visit → this-week list (yesterday / today / next key) → check-in line → pending tests → one comparable. |
| **System** | Assembles published facts + analytics + attention codes. Does not edit the programme. Missing stays omitted. |
| **Data** | `HyroxAthleteAnalytics`, `evaluateCoachAttentionFlags`, active PerformanceProfile, latest check-in, published week. |
| **UI** | `/admin/hyrox-athletes/[id]` Overview. Dense rows. Flag action opens the **source panel**, not another tab. |
| **Next trigger** | Coach opens Adapt remaining week, or decides nothing is flagged (KEEP by absence). |

### 3.10 Coach decision

| | |
| --- | --- |
| **Athlete** | Still sees the original remaining week until publish. |
| **Coach** | Reads source data + remaining week + weekly intent. Picks KEEP or an action. Types the athlete-facing reason (required unless KEEP). |
| **System** | Highlights a suggested action when confidence is medium+; never applies it. `autoApplyForbidden: true`. |
| **Data** | AdaptationRecommendation (observation, reason, confidence, options). |
| **UI** | Decision sheet: KEEP · REDUCE · REPLACE · MOVE · REMOVE · CHANGE TARGET (Reduce may split volume vs intensity). |
| **Next trigger** | Coach confirms preview. |

### 3.11 Adjustment

| | |
| --- | --- |
| **Athlete** | — |
| **Coach** | Preview diff → publish affected remaining sessions. |
| **System** | Applies via builder verbs. Writes new PrescriptionSnapshot where the number changed. Writes AdaptationAudit: old state, new state, trigger, reason, `source: coach`, identity, timestamp, athlete-facing explanation. Does not touch completed rows. |
| **Data** | ProgrammeAdjustment + AdaptationAudit + updated remaining ProgrammeSessions. |
| **UI** | AdaptationPreview on the decision sheet. Builder remains the mutation surface. |
| **Next trigger** | Publish to the athlete. |

### 3.12 Athlete notification

| | |
| --- | --- |
| **Athlete** | Opens Home or Programme. Wednesday (example) shows `Updated` + CoachMark + new target + the coach’s reason. |
| **Coach** | Already published the reason. No separate notify step. |
| **System** | Attaches the athlete-facing explanation to the changed session/day. No push product. Unpublished drafts never notify. |
| **Data** | AdaptationAudit.athleteFacingExplanation on the remaining session payload. |
| **UI** | Home D selected day + Programme card + drawer eyebrow. Word + gold rule, not colour alone. Tuesday’s completed row is unchanged. |
| **Next trigger** | Athlete trains the new session (back to 3.5). |

### 3.13 Progress

| | |
| --- | --- |
| **Athlete** | Opens Progress when they want “am I getting better?” — not daily. |
| **Coach** | May glance Recent progress on Command Centre (same analytics engine). |
| **System** | `getHyroxAthleteAnalytics` only. Completed counts `state === completed`. Partial and missed are not completed. Logged duration only. Empty stays empty. |
| **Data** | Current week / previous week / rolling 4 / modality / benchmark series. |
| **UI** | **Now → Recent → Longer-term.** Flag off: honest existing Progress. No race-readiness %, no CTL. |
| **Next trigger** | End of week, or a new stored benchmark. |

### 3.14 Weekly review

| | |
| --- | --- |
| **Athlete** | Submits weekly check-in (More, badge when due). No athlete weekly letter in v1. |
| **Coach** | Opens Weekly Review. Reads prepared facts. Writes **what changes next** (short). Optionally “prepare next week.” |
| **System** | Assembles planned / done / missed / high RPE / pain quotes / check-in. Deduplicates Command Centre codes. Prepares next-week **candidates** on draft week n+1 when asked. |
| **Data** | WeeklyReview coach fields + check-in + signals. Candidates are AdaptationRecommendations scoped to next Monday–Sunday. |
| **UI** | Weekly Review tab. Four short decision fields, not more textareas. Block Review stays the 4-week essay. |
| **Next trigger** | Coach accepts / edits candidates in the builder and publishes next week. |

### 3.15 Next week

| | |
| --- | --- |
| **Athlete** | Monday Home strip is the new published week. Next-week focus is `athlete_facing_note`, not internal review fields. |
| **Coach** | Publish week n+1 (often Auto-Carry + two edits, or accepted candidates). |
| **System** | New snapshots for the new week. Previous published week stays history. Logs never copy forward. |
| **Data** | New ProgrammeWeek + Sessions + Snapshots. |
| **UI** | Home D new Mon–Sun. Programme live chip moves. |
| **Next trigger** | Loop restarts at 3.4. |

---

## 4. End-to-end Track flow

Track is the same loop. The only change is **who is allowed to write**.

```
1-1:   Signal → Recommend → COACH DECISION → builder apply → audit → athlete sees coach reason
Track: Signal → Recommend → SYSTEM DECISION (if gate) → same apply service → audit → athlete sees system reason
                 └─ else KEEP / ASK / CONSERVATIVE / ESCALATE
```

### Where COACH DECISION becomes SYSTEM DECISION

| Decision class | 1-1 | Track (only after hard gates) |
| --- | --- | --- |
| **A. Resolve** (L1) | Coach publishes; system resolves on that click | System may publish / resolve from a coach-approved template when the anchor exists |
| **B. Hold / soften** | Recommend REDUCE VOLUME / easy substitute / drop Optional | May apply when signals are clear, no pain/illness, week intent intact |
| **C. Progress** | Recommend only; coach changes target | May apply a **small** step after **two** comparable successes |
| **D. Rearrange week** | Coach MOVE / REPLACE | Ask athlete or conservative unless the rule is extremely narrow (non-key, availability) |
| **E. Redesign block** | Coach picks the next block | Escalate, or later pick another named template — never LLM-author a mesocycle |

Launch Track at **L1 (class A)**. L0 (static numbers, no profile) is only the fallback when `missingAnchor` is true: show feel/RPE, never invent 5K / threshold / FTP.

### Guardrails (both products; Track writers especially)

- Same objects, same resolver, same analytics, same attention codes, same action taxonomy.
- Completed history is never rewritten.
- Published snapshots stay readable as `old_state`.
- Pain / illness → conservative + escalate. No diagnosis. No creative REPLACE.
- No auto-activate fastest lifetime. Race result is never an active pace.
- No stacking keys. No destroying weekly intent. No cascading re-runs.
- Confidence is `low` / `medium` / `high` from countable evidence, not a 0–100 score.
- Athlete copy: **“Hybrid365 adjusted this session because …”** Never “Kieran moved this” unless a human did.
- If a support person intervenes: **“Coach support updated this session.”**
- Community Track / Hybrid75 generation is the wrong engine.

### Hard gates before any Track writer

1. `product_mode` on the athlete (1-1 vs Track) so write paths cannot collide.
2. Prescription wired library → draft → publish snapshot (Decision 10).
3. Append-only AdaptationAudit.
4. Shared completion contract: state, RPE, execution, pain on every modality (this operating model).
5. Track benchmark activation policy (contract). Still no auto-PB.
6. Coach-approved template families in the existing session library.
7. Escalation queue consuming the same attention codes.
8. Athlete-facing **system** explanation field, distinct from `athlete_facing_note` and `coach_note`.

Until those exist, Track work is documentation and shared-engine hardening only.

---

## 5. Session submission contract

Universal, dynamic, imports, optional, pain, missed. This is the v1 contract later `docs/contracts/session-execution.md` must freeze.

### States

| Product state | When | Notes |
| --- | --- | --- |
| Planned | Published, unresolved | Today’s `scheduled`. Product word: Planned. |
| Completed | Prescribed work was done | Requires the fast sheet. |
| Partial | Some prescribed work done; rest cut, swapped, or not finished | First-class. Execution defaults to `cut_short`. |
| Missed | Athlete or coach confirms it did not happen | Must be settable. Optional reason. No other chips. |

No Started. Optional sessions: no miss flag if left planned. Completing late is valid; `submittedAt` is submit time, not a rewrite of the programmed date. Do not auto-write missed at midnight.

**Legacy `modified`:** keep the stored value. Athlete UI: “Logged with changes.” Do not backfill to Completed or Partial. Analytics and weekly review: not completed. Stop auto-flipping status from a Modifications text box.

### Universal (every completed / partial)

| Field | Required? | Scale | Why |
| --- | --- | --- | --- |
| Completion state | Yes | completed / partial / missed | Adherence, Progress, attention, adaptation eligibility |
| Session RPE | Yes (hidden on missed) | Integer 1–10 chips | Load, `high_rpe_vs_prescribed`, “hit target but grinding” |
| Execution quality | Yes (hidden on missed) | `on_target` / `easier` / `harder` / `cut_short` | Intent vs RPE. Partial defaults `cut_short` |
| Pain | Yes (hidden on missed) | `none` / `yes`; optional location text if yes | Safety flag. Not a diagnosis |
| Energy | Shown, not required | `good` / `ok` / `low` | Same-day remaining-week signal. Do not also collect 1–10 |
| Legs | Shown on run / HYROX / strength / compromised only | `good` / `heavy` / `sore` | Hybrid freshness. Replaces hoping they type “heavy legs” |
| Note | Collapsed, optional | Short text | Context chips cannot say. Never required (trains “.”) |

### Dynamic (one primary actual)

Ask only what the prescription made the point of the session. Hide device fields.

| Session | Immediate | Conditional / expand | Hidden |
| --- | --- | --- | --- |
| Easy run | Duration **or** distance (pre-labelled from plan) | — | HR, cadence, elevation, power, pace |
| Threshold / intervals | Average work pace **or** held / faded / cut | Last-rep pace | Full lap table, HR |
| Long run | Duration and/or distance | Pace | Elevation, HR |
| Bike | Duration; watts only if prescribed | — | Distance, HR, cadence |
| Ski / row | Prescribed dimension + split if prescribed | Watts if prescribed | Calories, stroke, HR |
| Strength | Prefill prescribed lifts; athlete edits what changed | RIR on top set if prescribed | Invented duration, blank “Exercise 1” |
| HYROX mixed | Total time **or** run actual | Named station only if prescribed; optional limiter chip | Full 8+8 sheet, strongest station, Roxzone |
| Missed | Optional reason: illness / life / fatigue / other | — | Everything else |
| Partial | What was completed (one line or the primary actual) | Same optionals as type | Full unused grid |

If the prescription has no structured lifts, strength is chips + optional note — no blank grid.

### Imports (later, Integrations contract)

Provider → ingestion row → matcher → programme session.

- Fill objective actuals (duration, distance, pace, power, HR, splits). Hide those manual boxes.
- Subjective chips still belong to the athlete.
- Ambiguous match: athlete or coach confirms. High-confidence auto-attach is a Track-later option; 1-1 should still notify.
- Do not overwrite a submitted log. Offer “replace from device.”
- Disconnect does not delete published sessions or athlete logs.
- STARTED stays on the device.
- Unmatched Strava volume is not Progress.

### Optional sessions

May stay planned with no miss. Logging is useful and allowed. Attention ignores them.

### Pain

Binary flag, not a medical form. `yes` + optional “left calf” is enough to escalate. Copy reports what was logged. 1-1: never auto-rewrite the programme. Track: conservative reduce or escalate; never diagnose; never REPLACE into another hard session.

### Forgotten-submit

After the programmed local date, Home (and Programme) show Did you do this? — Completed · Partial · Missed. Then the same sheets. Attention may say “not completed.” It must not say the athlete confirmed a miss. Coach may confirm miss in 1-1. Track may auto-miss unresolved **non-key** sessions after the week window only if a later Track contract says so.

### Confirmation

Target · Actual · RPE (only values that exist) → execution / legs / energy if logged → “Your coach can see this result.”

### Dual-read and analytics

Until consumers move: keep writing legacy `rpe` / `notes`. Analytics `completedSessions` counts only `completed`. Sum logged duration and RPE when present on partials, but do not count Partial as completed. Session-RPE load is `duration × RPE` only when both exist. Strength duration stays unsupported until a coach asks for it.

### Do not collect

Max HR, cadence, elevation, running power, calories, stroke rate, strongest station, enjoyment, sleep, mood, motivation, stress, bodyweight, daily readiness score, proof URL, full HYROX split sheets on training days, retyped exercise names, a second RPE box, modifications-as-status, community `partial/skipped/moved` enums, opaque quality / readiness / strain scores.

---

## 6. Coach admin IA

Daily path: **Accepted roster → Overview → (Adapt or Builder) → done.**

Weekly path: **Overview → Weekly Review → Builder (next week) → Publish.**

Onboarding path: **Profile Review → Builder → Publish.**

```
/admin/hyrox-athletes
  Applications                         intake (not daily coaching)
  Accepted                             ops + coaching scan row
    → /[id] Overview                   Command Centre — daily home
    → /[id] Programme Builder          planner
    → /[id] Weekly Review              prepared facts + what changes next
    → /[id] Performance Profile        anchors / approvals
    → /[id] Check-Ins                  full check-in + coach_response
    → /[id] Testing                    test week / results
    → /[id] Races                      flag; splits
    → /[id] Assessment                 onboarding answers
    → /[id] Profile Review             map limiter / first draft
    → /[id] Block Review               week 4 / 8 / 12
    → /[id] Coach Notes                thin alias of week notes — do not invest
    → /[id]/preview                    read-only athlete
```

Do not add tabs. Coach Notes stays an alias; week notes live on the builder rail and Weekly Review.

### Roster row (required before 20 athletes)

`Name · Wk n published/draft · completed/planned · flags (n) · pending bench · check-in · next key`

Click opens Overview. Payment / link stay on expand. Mock `CoachActionQueue` is not this list.

### Overview (Command Centre)

Order: Needs attention → changes since last visit → this week (counts + yesterday / today / next key) → check-in line → pending tests → one comparable → quick actions (Edit programme · View as athlete · Adapt remaining week).

Slim header: race countdown · week n published/draft · flag count · next action. Drop stub limiter / recovery-risk tiles from the daily header.

Flag click opens **source panel + remaining week**, not a tab hop.

### What stays off the first screen

Assessment answers, library, block-review essay, race-split editor, full benchmark table, classification tiles.

---

## 7. Programme planner UX

The planner stays a **calendar editor**. Context is progressive disclosure. Do not add a form to create a session.

### Keep

Placement (Move modal today; true drag later without changing the model), session library, scratch, edit, draft/publish, Copy Week, Auto-Carry, Block 4+, replace, duplicate-optional, remove, validation, planned-load summary.

### Week view (card)

Show: slot, intent word (Threshold / Easy / Key), title, resolved target **or** “missing anchor”, vs-last pip if a comparable exists, `Changed` mark if adapted after publish, gold rule if an athlete-facing session note exists.

**Do not put on the card:** full prescription, previous splits, check-in essay, race stations, internal notes.

### Create / edit (drawer)

Keep name, category, objective, parts, kind-specific fields. Add at the **top**: PrescriptionRule + resolved number + override. Split today’s single `coachNote` into **athlete-facing** vs **internal**. Adjustment reason appears only when this session is an adaptation of a published/upcoming row.

Scratch: no history fields.

### Prescriptions

Rail: `n/m sessions resolved · k missing anchors`. Publish of a session with a rule and no override and `missingAnchor` is blocked. Override is legal and stored as `source: coach_override`. After Copy Week, drafts **re-resolve** against current active anchors; the source published week stays frozen.

This wiring is Batch 3 (Decision 10). Until then the rail does not pretend numbers are resolved.

### Previous performance

Not on the card as a novel. On **select**: context panel (drawer or rail swap) with comparable previous session — date, planned, actual, RPE, note — only when a deterministic match exists (same `coachLibraryId`, else same category + intent). Wrong match is worse than “no previous.” Do not invent a pace.

### Notes

| Note | Where | Athlete sees |
| --- | --- | --- |
| Week athlete-facing | Rail | Yes |
| Week internal `coach_note` | Rail | Never |
| Session athlete-facing | Editor | Yes (Home CoachMark / drawer) |
| Session internal | Editor | Never |
| Adjustment reason | Editor, only when adapting | Yes, as the Updated CoachMark |

### Publish

Save draft → preview → approve week/block → publish. After publish, Overview shows the week as published.

### Adjustment

Not a new tab. Open from Command Centre flag or “Adapt remaining week” when the live week is published and a flag exists. Decision sheet → builder verbs → audit → athlete Updated.

### What NOT to clutter

- Required recommendation, comparable history, or race context in the create form.
- A fourth always-on column.
- Race splits in the planner (one strip: event · date · weeks out · last overall if stored).
- Check-in essays on cards.
- Auto-applied REDUCE.
- Regenerating a published snapshot because a 5K was later approved.

---

## 8. Athlete IA

Primary vs More. Ship **with Home D**, not before.

```
HOME            /athlete/dashboard          this week’s training
PROGRAMME       /athlete/programme          the published block
PROGRESS        /athlete/progress           am I getting better?
PERFORMANCE     /athlete/benchmarks         programming anchors
MORE            sheet
  Check-in      /athlete/check-in           badge when due
  Races         /athlete/race-prep          only if race-intelligence flag on
  Testing       /athlete/performance-testing  only while a testing week is active
  Sign out      existing header
```

Desktop: same five; More optional if width allows Check-in / Races inline.

### Primary

| Destination | Question |
| --- | --- |
| Home | What do I do now? |
| Programme | What is the plan for this block? |
| Progress | Am I actually getting better? |
| Performance | What mark is my programme using? |

### More (not daily work)

Check-in, Races (flag), Performance testing (active protocol only).

### Never in nav

Profile (until it has live useful fields), Session history, Coach notes placeholder, Resources placeholder, Visual lab, locked neon Races tile, Explore (second nav). Sign-out stays in the header.

### Metric ownership (no duplicate heroes)

| Metric | Owner |
| --- | --- |
| Today’s sessions | Home |
| Week completion, run km, duration, sRPE | Progress Now / Recent |
| Active 5K / threshold / erg / FTP | Performance (Home may glance one current mark) |
| Race overall / splits | Races (overall may also appear as `hyrox_race` history, not as pace) |
| Check-in scores | Check-in. Not Progress. |

---

## 9. Feedback loop

```
                    ATHLETE                         COACH                         SYSTEM
                      │                               │                              │
  publish week ───────┼───────────────────────────────┼── Programme + Snapshots ─────┤
                      │                               │                              │
  Home D / session ───┤                               │                              │
  train (no Start)    │                               │                              │
  fast sheet ─────────┼──────── Execution/Feedback/Actuals ──────────────────────────┤
                      │                               │                              │
                      │                               │         interpret ───────────┤
                      │                               │         CoachingSignal       │
                      │                               │                              │
                      │         Command Centre ◄──────┼────── flags + analytics ─────┤
                      │         decision sheet        │         recommend            │
                      │         KEEP / REDUCE / … ────┼──────────────────────────────┤
                      │                               │                              │
                      │         publish remaining ────┼── Adjustment + Audit ────────┤
                      │                               │                              │
  Updated+CoachMark ◄─┼───────────────────────────────┼── athlete-facing reason ─────┤
                      │                               │                              │
  Progress Now ───────┼───────────────────────────────┼── analytics (completed only) ┤
  check-in (More) ────┼───────────────────────────────┤                              │
                      │         Weekly Review         │         prepare next week    │
                      │         what changes next ────┼── candidates on week n+1 ────┤
                      │                               │                              │
  new Monday Home ────┼──────── published week n+1 ───┼──────────────────────────────┘

Track later: the same arrows. SYSTEM DECISION may replace the coach click
on class A/B (and thin C) when gates and confidence allow.
```

---

## 10. Adaptation framework

**OBSERVE → INTERPRET → RECOMMEND → DECIDE → APPLY → EXPLAIN → AUDIT**

| Step | Meaning | 1-1 authority | Track authority |
| --- | --- | --- | --- |
| **OBSERVE** | Read stored facts: execution, feedback, actuals, check-in, analytics, remaining week, race date | System | Same |
| **INTERPRET** | Transparent observation (Cases A–D). Report what was logged, what may be inferred, what must not | System. No diagnosis | Same interpreter. No second model |
| **RECOMMEND** | Remaining-week actions with confidence and athlete-facing explanation | System. Highlight only | Same object |
| **DECIDE** | Choose KEEP or an action | **Coach** | **System** only when class + confidence + rule allow; else KEEP / ASK / CONSERVATIVE / ESCALATE |
| **APPLY** | Builder verbs on **unlogged remaining** sessions; new snapshot if the number changed | Coach publish | Same apply service, `source: system_auto` |
| **EXPLAIN** | Dedicated athlete-facing sentence | Coach may edit the prepared sentence; required on non-KEEP | System sentence, labelled as Hybrid365, never as Kieran |
| **AUDIT** | Append-only old / new / trigger / reason / source / identity / time / explanation | `source: coach` (or `system_recommendation` if shown and dismissed) | `source: system_auto` only on apply. Still store KEEP |

### Action preference

Smallest change first: KEEP → REDUCE VOLUME → REDUCE INTENSITY → CHANGE TARGET → MOVE → REPLACE → REMOVE.

Safety interrupt (pain / unwell) stops creative swaps.

### 1-1 vs Track

| | 1-1 | Track |
| --- | --- | --- |
| `autoApplyForbidden` | Always true | False only for allowed class × confidence pairs |
| CHANGE TARGET | Coach only | Forbidden auto |
| REMOVE remaining key that **is** weekly intent | Coach only | Forbidden auto |
| Pain | Quote + escalate | Conservative reduce + escalate |
| Anchor approval side effect | Never rewrite this week | Recalc **unpublished future** only after an explicit activation policy |

### Worked example (constitution)

Tuesday key run: target missed, RPE 10, heavy legs, low energy. Upcoming: Wed high impact, Fri threshold, Sun long.

Observation: prescribed dose was not absorbed; stacking Tue leftover onto Wed destroys recovery space.

Typical 1-1 recommendation (threshold-build week): REDUCE Wed impact (volume or low-impact replace); KEEP Fri as the remaining quality at REDUCE VOLUME or REDUCE INTENSITY; REDUCE Sun long. Do not MOVE Tuesday onto Wednesday.

Coach decides. Athlete sees Updated + reason on the changed days. Tuesday’s log never changes.

---

## 11. Data → feature matrix

| Data | Why collect | Athlete UI | Progress | Command Centre | Adaptation | Track | Import or manual |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Completion state** | Adherence, flags, eligibility | Home / Programme status. Did you do this? | Now: completed / planned. Partial ≠ completed | This week list; missed / key incomplete | Observe + Case C | Same states; later auto-miss non-key only by contract | Manual (athlete or coach). Device match may propose, not silently set |
| **Session RPE** | Effort vs prescription; load | Fast sheet required. Confirm | Avg RPE; session-RPE load with duration | Avg RPE; `high_rpe_vs_prescribed` | Cases A–C; rising cost | Hold / soften / thin progress | Manual always |
| **Execution quality** | Intent met, independent of RPE | Fast sheet required | Not a Progress hero | Source panel | Raises confidence; declining execution | Soften on `harder` / `cut_short` | Manual always |
| **Energy (session)** | Same-day remaining week | Shown, optional, 3 chips | No (week energy is check-in) | Repeated low **session** energy (≥2 this week) | Remaining-week lean | Hold / soften | Manual |
| **Energy (check-in 1–10)** | Week-level response | Check-in (More) | Unsupported as wellness chart | Latest line; `repeated_low_energy` (two check-ins ≤ 4) | Pattern, not a single-session case | Hold / soften | Manual weekly |
| **Legs** | Hybrid freshness | Shown on run / HYROX / strength / compromised | No | `repeated_heavy_legs` from chips; regex fallback for legacy notes | Case B; upcoming impact | Soften next impact | Manual |
| **Pain** | Safety interrupt | Fast sheet required none/yes | No moral score | `pain_soreness`; quote text | Pain path: reduce / escalate; never diagnose | Conservative + escalate; never harder | Manual. Not inferred from HR |
| **Actual pace / split** | Target vs actual | Confirm Actual; Progress comparable later | Longer-term only via stored benchmarks; session compare in review | Source panel; comparable | “Target met” only when both parse | L2 progress needs this | Manual now if it is the point; **import later** |
| **Duration** | Volume, sRPE load | Primary actual when time-prescribed | Now / Recent logged minutes only | This week time (analytics) | Workload context | Soften volume | Manual or import |
| **Distance** | Run volume | When distance-prescribed | Now run km (logged, not titled) | This week km (analytics) | Workload | — | Manual or import |
| **HR** | Device context | Hidden until import | `unsupported` until a series exists | Not a flag | Not a v1 input | Not a decider | **Import only.** Do not ask by hand |
| **Watts** | FTP-target sessions | Only if prescribed | No invented FTP | Source panel | Target met when both parse | L1 resolve uses FTP anchor, not the ride | Manual if prescribed; import later |
| **Strength load / sets / reps** | Top-set vs prescribed | Prefill + edit (Batch 2.5 / 3 if prescription structured) | Not duration. Progression later from stored sets | Source panel | Not a v1 remaining-week driver | L1 omits strength % until a shared basis exists | Manual. Almost never imported |
| **Benchmark** | Programming anchor + longer-term Progress | Performance: submit pending. Home may glance Current | Longer-term series | Pending count; active anchors | Progression pattern; never auto-activate | Track activation policy, still no auto-PB | Athlete submit or coach enter |
| **Race result** | History, vs previous | More → Races (flag) | No (overall may exist as `hyrox_race` history) | Race strip: date / weeks out / last overall | Proximity context only. No auto-taper | Not V1 training input | Manual append. 022 unapplied |
| **Check-in (sleep, stress, soreness, availability)** | Weekly coach context | More, once a week | Unsupported as a chart | Snapshot + missing-from-Thursday flag | Availability may allow MOVE; soreness/pain escalate | Ask athlete to move non-key | Manual weekly |
| **Athlete note** | Unstructured context | Collapsed on sheet | No | Quoted in source / weekly review | Keyword illness already on check-in; session note is extra only | Escalate ambiguous prose | Manual |
| **Coach athlete-facing note / adjustment reason** | Coach presence; Wednesday story | Home CoachMark; Updated | No reprint | Quick action / preview | EXPLAIN | System explanation field instead | Coach (or system on Track) |
| **Internal coach note** | Coach memory | **Never** | Never | Coach-only, labelled Internal | Never in athleteFacingExplanation | Never generated as Kieran | Coach |
| **Prescription snapshot** | Personal target, audit | King number + expression as meta once wired | No | Builder resolve; source panel planned | CHANGE TARGET / REDUCE INTENSITY write a **new** snapshot | L1 writer | System at publish |
| **Weekly intent / key flag** | Remaining-week reasoning | Intent one-liner on preview | Key completed / planned | Upcoming key; do-not-stack | Protect intent | Same | Coach / library metadata |
| **Illness mention** | Escalate | Check-in / missed reason | No | `illness` flag | Safety; no diagnosis | Conservative + escalate | Manual text / readiness if ever applied |

---

## 12. MVP vs later vs later-later

### MVP (make 1-1 coaching faster and the loop real)

- Freeze this operating model and a session-execution contract.
- Session fast sheet: drop empty complete; required RPE + execution + pain; optional energy / legs / note; Partial + settable Missed; forgotten Did you do this?
- Command Centre as daily home: slim header, this-week list, flag → source panel.
- Fix Programme past-week status remap (history must not lie).
- Wire prescription resolve into builder + publish snapshots.
- Session athlete-facing vs internal note split.
- Roster coaching row.
- Adaptation **recommend** + decision sheet + audit + athlete Updated / CoachMark / reason.
- Weekly Review: prepared facts + what changes next (candidates can start thin).
- Athlete IA with Home D: Home / Programme / Progress / Performance / More.
- Progress Now → Recent → Longer-term on the existing analytics engine (flag still a human rollout).
- Home D live adoption (real selected-day data, no fixtures).

### Later (same engine, more leverage)

- Comparable matcher + planner context panel.
- Strength prefill from structured prescription.
- `loggingActivityType` on publish (inference remains fallback).
- Strava ingest → match → fill actuals.
- Athlete weekly letter on Home (Sunday / Monday) or post-check-in — system facts + coach next-week note.
- Check-in `coach_response` UI.
- Race intelligence 022 applied when a human approves; Races in More; planner race strip.
- Publish-sync hard-refuse content updates on logged sessions.
- Explicit `isKeySession` on every published row (today over-marks).
- Track **gates** (mode, templates, activation policy, escalation queue, system explanation) — still no L2 writer.

### Later-later

- Track L1 writers (template publish + resolve).
- Track B-class hold/soften, then thin C-class progress.
- Notifications / push product (Updated + CoachMark is enough until then).
- Athlete Profile in More (name, race label, connections).
- Daily readiness as optional context only — not a product, not a score. `017` stays off unless a named rollout.
- Race-week pacing / fuelling / station targets (coach-published, not auto).
- HTML5 drag-and-drop (model unchanged).
- Track L3 rearrange / L4 template block shift.
- Wearables beyond Strava; strength device import.

### What NOT to build

- Started / in-progress session state.
- Empty one-tap complete.
- Notifications product in the next batches.
- Track L0 as a launch.
- Track writers before the eight hard gates.
- A second profile, resolver, analytics engine, attention grammar, or log table.
- Community Track / Hybrid75 / `runPrescription.ts` reuse.
- Home V2 / Today V2 / Performance Hub flags.
- Daily readiness UI / applying `017` as part of coaching work.
- Applying `022` inside an unrelated batch.
- Composite readiness, CTL/ATL/TSB, race-readiness %, population percentiles, inferred FTP / threshold / HYROX pace.
- Medical diagnosis from pain.
- Auto-activate lifetime bests.
- LLM programme authorship.
- Locked Races tab, Explore grid, Profile graveyard, Session history tab, Coach notes / Resources / Visual lab in athlete nav.
- Full HYROX split sheets on training days.
- Confetti, streaks, PB fireworks.
- Silent mid-week republish without `Updated`.

---

## 13. Implementation roadmap

Dependency order from what is **actually built** on `integrate/hyrox-batch-1`, not a copy of research A–H.

Already on this branch (flags default off; not production behaviour until a human enables them): Performance Profile resolver + table; prescription **engine** (unwired); analytics resolver; Command Centre overview + attention flags; race-intelligence code (`022` unapplied); Home D visual-lab; live session log with empty complete and `scheduled|completed|missed|modified`.

Copy Week, Auto-Carry, Block 4+, draft/publish, preview read-only stay intact in every batch.

### Batch 2 — Close the loop on what happened

Highest leverage for n = 5. Unblocks interpretation quality.

1. Coordinator: `docs/contracts/session-execution.md` freezing §5.
2. Unapplied migration: `partial` status (or equivalent), structured feedback fields, settable `missed`. Stop modifications-text auto-status.
3. Athlete fast sheet on the **existing** drawer (not a full Home D rewrite): drop empty complete; required chips; shrink modality wall to one primary actual; Partial + Missed; forgotten Did you do this?
4. Dual-read legacy `rpe` / `notes`. Analytics: partial ≠ completed. Align weekly review with that.
5. Command Centre: this-week session list; flag → source panel; slim header. Keep the flag default off until Kieran’s allow-list.
6. Fix Programme past-week “all complete” display bug.

Do not ship Home D, Track, or adaptation apply in this batch.

### Batch 3 — Planner becomes a coaching workspace

Unlocks personal targets and Track L1 later.

1. Wire `PrescriptionRule` → resolve → missing-anchor gate → publish snapshot in Programme Builder (Decision 10).
2. After Copy Week, re-resolve drafts; keep source snapshots frozen.
3. Split session athlete-facing vs internal notes. Athlete APIs must not leak the internal field.
4. Roster coaching row + batch attention summary (required before 20 athletes).
5. Comparable matcher + read-only context panel (can slip to Batch 4 if time-boxed).

### Batch 4 — Home D and athlete IA

Presentation + selected-day model on **real** published data. No fixtures.

1. Home D hierarchy live behind a **new** named rollout — do not reuse `HYROX_HOME_V2_*`.
2. Nav: Home / Programme / Progress / Performance / More.
3. Drawer reorder to purpose → target → structure → spec → coach → complete (fast sheet already from Batch 2).
4. Progress sequenced Now → Recent → Longer-term.
5. Remove live Home race-readiness / Explore / Check-in-as-primary.
6. `Updated` chrome can land as a no-op until Batch 5 writes audit rows.

### Batch 5 — Adaptation assist (1-1 recommend only)

1. Coordinator: `docs/contracts/adaptation-engine.md` from §10.
2. Pure interpreter + remaining-week reasoner + QA. No writer.
3. Unapplied AdaptationAudit table.
4. Decision sheet on Command Centre + Adapt remaining week. Apply = builder verbs + audit + required athlete reason.
5. Athlete Updated + CoachMark + reason.
6. Weekly Review “prepare next week” candidates (thin: reuse the same recommendation shape).
7. Harden publish-sync: refuse content updates on logged sessions.

### Batch 6 — Actuals get cheaper

1. Integrations contract: Strava ingest → match → confirm → fill actuals.
2. Strength prefill from structured library prescription.
3. `loggingActivityType` on publish.
4. Athlete weekly letter (system facts + existing next-week `athlete_facing_note`).
5. Race `022` only if a human changes staging max and wants Races in More.

### Batch 7 — Track gates, then L1 only

1. Product mode. Template families. Activation policy contract. Escalation queue. System explanation field.
2. Track L1: template publish + same resolver + same snapshots.
3. No L2/L3 writers in the same batch.

### After that

Track B-class, thin C-class, notifications product, Profile in More, readiness only under a named task.

---

## Recommended next engineering batch

**Batch 2: session submission + Command Centre daily scan.**

That is the smallest batch that (a) gives Kieran coach-useful data on every session, (b) stops empty completes from poisoning Progress and flags, (c) makes Partial and Missed real, and (d) saves the daily tab-walk — without waiting for Home D, prescription UI, or Track.

Do not start Track. Do not apply SQL in the same task that writes it. Do not turn Home V2 / analytics / Command Centre / race flags on globally as a side effect.

---

## Document status

Canonical operating model for Hybrid365 1-1 and future Track. Research docs in `docs/research/` remain evidence; if they disagree with this file, **this file wins**.

No product code, UI, migration, merge, or deploy is authorised by publishing this document.
