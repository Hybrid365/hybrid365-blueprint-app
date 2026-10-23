# Adaptation architecture

Research / Workstream D. This document does **not** authorise product code, a rules engine, a migration, a flag rollout, a merge, a deploy, or applying SQL.

Related: `docs/HYBRID365_COACHING_PLATFORM.md` (constitution), `docs/HYBRID365_AGENT_GUIDE.md` (invariants), `docs/HYBRID365_PLATFORM_BLUEPRINT.md` (system map), `docs/contracts/prescription-engine.md`, `docs/contracts/athlete-analytics.md`, `docs/contracts/coach-command-centre.md`, `docs/contracts/performance-profile.md`, `docs/contracts/race-intelligence.md`.

---

## Status

**There is no adaptation engine.**

The coaching loop is specified as:

**Athlete profile → Prescription → Training → Execution → Feedback → Interpretation → Adaptation → Progress**

Today the loop stops at **flag + coach judgement**. The platform can calculate, flag, and surface exceptions. It does not interpret a session into a remaining-week recommendation, does not apply a KEEP / REDUCE / MOVE action, and does not write an adaptation audit record.

1-1 must **recommend only**. The coach decides. Hybrid365 Track may later apply the same recommendations when confidence and rules allow. Track must not invent a second interpretation model, a second action taxonomy, or a second prescription resolver.

This document is the architecture those later workstreams should implement against.

---

## Honest audit: what already exists

### Exists and is usable as input

| Area | What exists | Adaptation use |
| --- | --- | --- |
| Published week | `hyrox_programme_weeks` (`status = published`) with `weekly_focus`, `athlete_facing_note`, `coach_note` | Weekly intent, remaining-week session set. Internal `coach_note` never enters athlete copy. |
| Published session snapshot | `hyrox_programme_sessions.prescription` jsonb, `metadata`, slot, category, name | Planned work. Published targets are historical snapshots. |
| Session log | `status` (`scheduled` / `completed` / `missed` / `modified`), `completed_at`, `athlete_feedback` jsonb | Completion, RPE, notes, modifications, planned-vs-logged metrics. |
| Session feedback v2 | `activityType`, `planned` (`SessionPlannedTargets`), `metrics` (run / strength / erg / hyrox / other) | Objective actuals when logged. Run metrics may include `painOrTightness`. |
| Analytics | `getHyroxAthleteAnalytics` — completion, run km, logged duration, average RPE, session-RPE load, key-session counts, rolling 4, modality, benchmark series | Recent workload, adherence, trend. Read-only. Missing stays null. |
| Command Centre attention | `evaluateCoachAttentionFlags` — transparent codes, severity, reason, source, date, session | Exception queue. Never rewrites the programme. |
| Weekly review alerts | `computeWeeklyReviewAlerts` — overlapping but not identical codes | Second exception surface. Must not become a second engine. |
| Weekly check-in | `hyrox_check_ins` — sleep, energy, stress, soreness, recovery/motivation, bodyweight, `pain_niggles`, win/struggle, next-week availability | Subjective week-level context. |
| Performance Profile | Append-only `hyrox_athlete_benchmarks`, one active programming anchor per type | Benchmark progression. Not an auto-anchor. |
| Prescription engine | Structured rule → snapshot. Coach override wins. | Resolves a target. **Does not auto-change a published snapshot** when an anchor later changes. |
| Upcoming week | Published remaining sessions; Command Centre `upcomingKeySession` | Remaining-week and conflict detection. |
| Race context | `hyrox_athletes.race_date` / `race_name` / `target_time`; race-intelligence records (flag default off; migration 022 unapplied) | Race proximity. Does not auto-taper. |
| Session-library guardrails | `avoidIf`, race-week volume, “do not stack heavy legs + threshold” | Programming-time constraints. Not runtime adaptation. |
| Publish / sync audit | `PublishWeekAudit` / `PublishWeekSyncAudit` | Publish trace. **Not** an adaptation trail. |

### Exists but must stay off unless a rollout task says otherwise

| Area | Constraint |
| --- | --- |
| Daily readiness | Migration `017_hyrox_daily_readiness.sql` is unapplied in production. Flags `HYROX_HOME_V2_*`, `HYROX_TODAY_V2_*`, `HYROX_PERFORMANCE_HUB_*` stay off. Command Centre *can* read readiness if the table is present; adaptation must treat it as optional context, never a required input. Readiness comments already say it does not auto-change programmes. |
| Race intelligence UI | Default off. `022` unapplied. Upcoming `race_date` on the athlete row is enough for proximity. Do not invent split-based taper scores. |
| Analytics / Command Centre UI flags | Default off. The resolvers exist; live UI is not production behaviour until enabled. |

### Missing — say this plainly

- No remaining-week reasoner.
- No recommendation object (`OBSERVATION / REASON / CONFIDENCE / …`).
- No adaptation action applier.
- No adaptation audit table (old state, new state, trigger, reason, source, identity, timestamp, athlete-facing explanation).
- No structured per-session **energy**, **legs**, or **execution quality**. Those appear in the constitution and in visual-lab concepts (`SessionCompleteConfirm`, `SessionCompleteConcept`). They are not stored on `athlete_feedback` today.
- No first-class **partial** completion. Schema is `scheduled | completed | missed | modified`. Constitution wants Planned → Started → Completed → Partially completed → Missed. Analytics counts only `status === "completed"`. Weekly review treats `completed` **or** `modified` as completed. Those disagree.
- No numeric actual-vs-target interpreter. Logging UI shows string pairs (`buildPlannedCompletedPairs`). Analytics does not compute “target met”.
- Heavy legs is a session-note regex (`\bheavy legs\b`), not a field.
- Pain is free text (`painOrTightness` on run metrics, `pain_niggles` on check-ins).
- Key-session detection is coarse: `metadata.isKeySession === true`, else every non-optional non-recovery session. That over-marks “key”.
- Publish sync can still update a session that already has logs. It warns (`hadLogs`) but `skippedBecauseLoggedCount` is currently always `0`. Adaptation must be stricter: completed history is never rewritten.
- Two flag systems (Command Centre attention vs weekly review alerts) overlap. Adaptation should consume **facts**, not inherit two competing code lists.

The prescription engine is **not** an adaptation engine. It freezes a number on publish. Changing an active 5K or FTP later does not rewrite that snapshot. Adaptation, when it exists, may recommend a *new* remaining-week target; it must snapshot that new target the same way, not mutate the old one.

---

## 1. Input signals

Collect a signal only if it supports a coaching decision, athlete understanding, performance tracking, or future adaptation. Do not invent a composite “readiness 72” or a hidden risk score.

### Classification

| Class | Meaning |
| --- | --- |
| **Objective** | Stored fact the athlete or device reported as a value. Missing stays missing. |
| **Subjective** | Athlete-reported feel. Useful, not diagnostic. |
| **Derived** | Transparent calculation from stored facts. Formula is visible. |
| **Contextual** | Surrounding week / race / programme state. Not a response to this session. |

### Signal catalogue

| Signal | Class | Current source | Ready for adaptation? |
| --- | --- | --- | --- |
| Completion state | Objective | `hyrox_programme_sessions.status` | Partial yes. Need a first-class `partial` (or a logged “how much was done”) before Case C is reliable. |
| Actual vs target | Objective / derived | `athlete_feedback.planned` + `metrics`; display pairs only | Not ready as a number. Strings exist. A later interpreter may compare pace/split/watts/duration when both parse. Do not guess from the title. |
| Session RPE | Subjective | `athlete_feedback.rpe` or activity `metrics.rpe` / `sessionRpe` | Yes. `"6–7"` already uses the highest number in analytics. |
| Prescribed RPE | Contextual | Prescription / `planned.targetRPE` | Yes when present. Attention already flags logged > prescribed max + 1. |
| Energy | Subjective | Weekly check-in `energy`; readiness `energy` (off). **Not** on the session log. | Week-level yes. Session-level not stored. Visual lab only. |
| Legs / muscular state | Subjective | Session notes regex; check-in `soreness`; run `painOrTightness`. **No** structured legs field. | Pattern-level only (`repeated_heavy_legs`). Case B is weak until legs is a field or a constrained enum. |
| Execution quality | Subjective | Not stored. Visual-lab concept only. | No. Do not infer “on target” from a missing field. |
| Pain / niggle | Subjective | Check-in `pain_niggles`; session `painOrTightness`; readiness muscle soreness ≥ 8 (if table present) | Yes as a **flag**, not a diagnosis. Free text is enough to escalate; not enough to name a tissue. |
| Recent workload | Derived | Analytics current week + previous week + rolling 4: duration, run km, session-RPE load, average RPE | Yes, when logged duration and RPE both exist. Session-RPE load is `sum(duration × RPE)` only when both exist. |
| Repeated patterns | Derived | Attention: ≥2 “heavy legs” notes this+last week; last two check-ins energy ≤ 4. Weekly review: ≥2 RPE 9–10; ≥2 fatigue-keyword notes; completion &lt; 70%. | Yes as transparent counts. Do not merge them into one score. |
| Benchmarks | Objective | `hyrox_athlete_benchmarks` via Performance Profile / analytics series | Yes for progression. Pending rows are attention, not anchors. Fastest lifetime is not the programming value. |
| Adherence | Derived | `completionPct`, missed non-optional, incomplete key sessions, missing check-in (Thu+) | Yes. Incomplete current weeks are not treated as full weeks. |
| Upcoming training | Contextual | Remaining published sessions this week; `pickUpcomingKeySession`; intensity/key flags | Yes for remaining-week reasoning. Draft / unpublished weeks are not “upcoming training”. |
| Race / test proximity | Contextual | `hyrox_athletes.race_date`; week role (`Race week`, `Taper`, `Deload / Review`); testing-week template | Yes as calendar context. Do not invent a race-readiness percentage. |
| Weekly intent | Contextual | `weekly_focus`, block week role (`Threshold peak`, `Deload / Review`, …) | Yes as text/role. Not yet a structured intent object. |
| Illness mention | Subjective | Check-in text regex; readiness `feeling_unwell` (if present) | Escalate only. Not a diagnosis. |
| Coach override / notes | Contextual | Coach override on prescription; athlete-facing note; internal note | Coach decision wins. Internal notes never leak. |

### What not to invent

- Heart-rate load, CTL/ATL/TSB, interpolated benchmarks, population percentiles, inferred FTP / threshold / HYROX pace, Strava volume as a substitute for a missing log.
- Medical labels (tendinopathy, stress fracture, overtraining syndrome).
- A single opaque “adapt now” score.

---

## 2. Single-session interpretation

Interpretation converts one logged session into a **transparent observation**. It does not prescribe a diagnosis and it does not apply a programme change.

Required facts before interpreting: completion state, and at least one of (actual vs target, RPE, pain flag). If those are missing, say so. Do not fill them.

### Shared rules

- Report what was logged, then what may reasonably be inferred, then what must not be inferred.
- Compare RPE to the **prescribed** range when that range exists. If prescribed RPE is missing, compare only to the session’s intended intensity band (easy / moderate / hard) when that band is stored. If neither exists, do not call the session “too hard” or “too easy”.
- “Target met” requires a parseable planned value **and** a parseable actual. Otherwise the observation is “completed, target comparison unavailable”.
- Pain / niggle is a **safety interrupt**. It is not graded into a clinical category.
- Partial work is not a miss and not a complete. It is its own state.

### Case A — Target met, RPE 6

Example: threshold or quality session, planned 3:55/km, actual 3:52–3:55/km, logged RPE 6, no pain, no heavy-legs note.

**May reasonably be inferred**

- The athlete produced the prescribed work at a lower-than-expected cost if prescribed RPE was 7–8.
- The session does not, by itself, justify unloading the rest of the week.
- If this is a key session and the week’s intent is development, KEEP is the default remaining-week action.

**Must not be inferred**

- That the athlete is “under-trained”, “sandbagging”, or that the programming anchor is now wrong.
- That Friday’s threshold should automatically move up. One easy-feeling hit is not an anchor change. Performance Profile activation is a coach decision.
- Fitness gain. That needs repeated comparable sessions or a new approved benchmark.

**Typical recommendation shape:** KEEP remaining week. Optional note: “Session landed easier than prescribed RPE; watch the next comparable session before changing targets.” Confidence stays **low** until a second similar session or a test.

### Case B — Target met, RPE 9, heavy legs

Example: same target hit, logged RPE 9, athlete reports heavy legs (field or note), energy not required.

**May reasonably be inferred**

- The work was achieved at a higher cost than intended if prescribed RPE was ≤ 8.
- Cost may be residual fatigue, session density, heat, poor sleep, or a hard previous day. The system cannot name which.
- Remaining-week **high-impact or key** sessions are in conflict if they sit on tired legs (Wednesday high impact, Friday threshold, Sunday long).

**Must not be inferred**

- Injury, illness, or “overreaching”.
- That the target was too hard. They hit it.
- Automatic REMOVE of the weekly key session. Weekly intent may still need that stimulus at reduced volume or intensity.

**Typical recommendation shape:** KEEP the weekly key if it still serves intent, but REDUCE VOLUME or REDUCE INTENSITY on the next impact session, and do not stack another hard lower-body day. Confidence **medium** if RPE and legs agree; **low** if legs is only a note regex.

### Case C — Miss + partial + RPE 10

Example: Tuesday key run. Part of the set done (or status miss/modified), target not met, RPE 10, possibly low energy on the week check-in.

**May reasonably be inferred**

- The prescribed dose was not absorbed. The athlete reached a limiter (fitness, fatigue, execution, environment). The system does not know which limiter.
- Remaining hard sessions this week are the conflict, not “add a makeup threshold”.
- Adherence and response are both in play: a miss is an adherence fact; RPE 10 on the portion completed is a response fact. Keep them separate in the observation.

**Must not be inferred**

- That the athlete “failed” or that the programme is wrong in general.
- That the missed work should be moved onto Wednesday. That is how key sessions get stacked.
- A new programming anchor from a blow-up session.

**Typical recommendation shape:** Do not chase the miss. REDUCE VOLUME or REDUCE INTENSITY on the next hard session; consider MOVE only onto a recovery-space day that is not already a key; REMOVE only if weekly intent survives without that session (e.g. optional, or a third hard exposure). Confidence **medium** when completion + RPE + upcoming conflict are all present; stay **low** if “partial” is only inferred from `modified` + a note.

### Case D — Easy session + pain

Example: easy aerobic or recovery work, RPE in the easy band, pain or niggle flagged (`painOrTightness`, check-in `pain_niggles`, or equivalent).

**May reasonably be inferred**

- Something is irritating enough to report on a session that should not have been costly.
- Remaining-week action is safety-first: REDUCE (especially impact, heavy lower, station lunges/sled) or escalate to the coach. KEEP only purely non-provocative work if the coach (1-1) or conservative rules (Track later) allow it.

**Must not be inferred**

- A diagnosis, tissue, or time-to-heal.
- That the easy session “caused” the pain.
- That a hard session later this week is fine because today’s RPE was low.
- Automatic REPLACE with a different hard modality. Substitution can still provoke. Default is reduce or escalate, not clever swaps.

**Typical recommendation shape:** No intensity increase. REDUCE VOLUME / REDUCE INTENSITY on remaining impact and heavy lower. ESCALATE to coach. FORBID auto-apply on Track. Confidence of the **pain flag** can be high (they wrote it); confidence of any specific training swap stays **none** — the action is conservative, not creative.

### Other single-session outcomes (for completeness)

| Logged facts | Reasonable observation | Default lean |
| --- | --- | --- |
| Target exceeded, RPE below prescribed | Work cheaper than planned | KEEP; do not auto-raise targets |
| Completed, no actuals, RPE in range | Done as prescribed, comparison unavailable | KEEP |
| Missed, no log, optional slot | Adherence gap on optional work | KEEP week; do not punish |
| Missed key, no RPE | Incomplete key — attention already fires | Coach review; do not invent response |
| High RPE vs prescribed, target unknown | Cost higher than intended | Same lean as Case B, lower confidence |

---

## 3. Multi-session patterns and confidence

One session produces an observation. Repeated, comparable sessions raise confidence. Patterns must stay countable and named.

### Pattern catalogue

| Pattern | Evidence | Grows confidence when | Does not mean |
| --- | --- | --- | --- |
| Repeated high cost | ≥2 sessions in current + previous week with RPE ≥ prescribed max + 1, or ≥2 RPE 9–10 | Same modality or same key type | Overtraining |
| Repeated heavy legs | ≥2 structured legs flags, or ≥2 “heavy legs” notes (current + previous week) | Agrees with high RPE or missed quality | Injury |
| Repeated low energy | Last two submitted weekly check-ins energy ≤ 4 | Agrees with rising RPE at similar pace | Depression / illness |
| Rising cost at similar output | Comparable session (same rule / same distance / same station work): actual holds or worsens while RPE rises | Two or more comparable pairs | Fitness loss as a diagnosis |
| Falling execution | Structured execution field declines across comparable sessions, or repeated partials on the same key type | Field exists and is used | “Poor mindset” |
| Adherence drift | Completion &lt; 70% on a **complete** week, or ≥2 missed non-optional in a live week after the date | Recurs across weeks | Life chaos as a moral judgement |
| Positive absorption | Target met at expected or easier RPE, twice, same key type | Benchmark later confirms | Licence to jump the next block |
| Benchmark progress | Approved series improves (analytics points, oldest → newest) | Coach-approved or coach-entered | Auto-activate the new anchor |
| Pain recurrence | Pain/niggle on ≥2 days or both session + check-in | Any recurrence | Diagnosis; still escalate |
| Upcoming conflict | Current response is costly **and** a key/high-impact session remains inside 48 hours | Dates and key flags are known | Automatic cancel of the week |

### Confidence

Confidence is **not** a 0–100 score. It is a small, explainable enum derived from countable evidence.

```ts
type AdaptationConfidence = "low" | "medium" | "high";
```

| Level | When | 1-1 | Track (later) |
| --- | --- | --- | --- |
| `low` | Single session, missing actuals, regex-only legs, unpublished remaining week, conflicting signals | Show observation. Recommend KEEP or “no recommendation”. | No auto-apply. Escalate or no-op. |
| `medium` | Two agreeing signals (e.g. miss + RPE 10, or target met + RPE 9 + legs) and a clear upcoming conflict | Recommend remaining-week actions. Coach decides. | Apply only the most conservative allowed action (usually REDUCE VOLUME or REDUCE INTENSITY), never REMOVE of a key, never CHANGE TARGET. |
| `high` | Pattern across ≥2 comparable sessions **or** pain/niggle present (pain uses a separate safety path) | Same recommendation, higher certainty in the reason. | May apply the listed safe actions when the rule table allows. Still no medical logic. |

Confidence rises when:

1. The same observation repeats on a **comparable** session (same intent, not “any run”).
2. Subjective and objective agree (hit target + high RPE; miss + high RPE; easy RPE + pain).
3. The week window is complete enough (do not treat Wednesday as a finished week).
4. Upcoming sessions are dated and classified (key / intensity).

Confidence stays low when data is missing, when the only evidence is a keyword, when the session is not comparable, or when weekly intent is unknown.

Do not average unrelated flags into a confidence number. “Missed Monday easy + Friday RPE 9” is two facts, not one medium-confidence story.

---

## 4. Remaining-week reasoning

The unit of adaptation is the **remaining published week**, not “the next workout”.

Worked example from the constitution: Tuesday hard run — target missed, RPE 10, heavy legs, low energy. Upcoming: Wednesday high impact, Friday threshold, Sunday long run.

### Inputs to the reasoner

| Input | Role |
| --- | --- |
| **CURRENT RESPONSE** | Interpretation of the triggering session(s) plus any open pattern (Cases A–D, flags). |
| **WEEKLY INTENT** | Why this week exists: `weekly_focus` / block week role (build, peak, deload, taper, race week, test). |
| **UPCOMING** | Published sessions still ahead of `today`, with key / intensity / modality. |
| **RECOVERY SPACE** | Gaps that can absorb a MOVE without creating back-to-back keys. Easy / rest / optional days. |
| **RACE / TEST** | Days to `race_date` if set; week role `Race week` / `Taper` / testing week. A test or race this week is a hard constraint. |

Draft sessions and unpublished weeks are not upcoming training. Do not fill from a draft.

### Decision order

1. Safety interrupt (pain / unwell flag) → reduce or escalate; stop creative swaps.
2. Protect weekly intent. A threshold-peak week should not lose every quality session because Tuesday was ugly. A deload or race week should not gain a makeup key.
3. Protect the next key. Do not stack Tuesday’s leftover onto Wednesday’s high impact.
4. Prefer the smallest change that resolves the conflict: KEEP → REDUCE VOLUME → REDUCE INTENSITY → CHANGE TARGET → MOVE → REPLACE → REMOVE.
5. Apply **one** adaptation cycle per trigger window. Do not cascade (see safeguards).

### Action taxonomy

| Action | Meaning | Typical use | Forbidden when |
| --- | --- | --- | --- |
| **KEEP** | Leave remaining sessions as published | Case A; unclear data; intent requires the stimulus and cost is isolated | Pain on an impact session still ahead (then reduce or escalate) |
| **REDUCE VOLUME** | Same session, less work (fewer reps, shorter long run, drop a set) | Case B/C when intent still needs the quality | Would drop the session below “still is that session” without saying REPLACE |
| **REDUCE INTENSITY** | Same structure, easier target / lower RPE | Costly absorption, race-week sharpness, rising RPE | Used as a silent CHANGE TARGET on a test |
| **CHANGE TARGET** | New numeric target, new snapshot | Repeated Case A (too easy) or repeated miss at an unchanged target — **coach in 1-1** | Single session; missing actuals; as a side effect of a new 5K approval |
| **MOVE** | Same session to another day in the remaining week | Isolated miss with a true recovery-space day | Destination already has a key / high-impact session; would create back-to-back hards; destination is race/test day |
| **REPLACE** | Different session, same day, same intent family (e.g. run threshold → erg threshold) | Impact management when intent is “threshold minutes”, not “this exact run” | Pain case (default reduce/escalate); would change weekly intent (threshold → race sim) |
| **REMOVE** | Session does not happen | Optional slot; third hard exposure; conflict that cannot be reduced | Sole remaining key that **is** the weekly intent; rewriting a completed row to “never existed” |

`Reduce` in the constitution is here split into **REDUCE VOLUME** and **REDUCE INTENSITY** so Track rules can be precise. Coach UI may still show a single “Reduce” control that picks one.

### Worked remaining-week (Tuesday miss, RPE 10, heavy legs)

| Upcoming | With weekly intent “threshold build” | With weekly intent “deload” or “race week” |
| --- | --- | --- |
| Wed high impact | REDUCE VOLUME or REPLACE with low-impact aerobic. Do not MOVE Tuesday onto Wednesday. | REMOVE or REDUCE to recovery. |
| Fri threshold | KEEP at REDUCE VOLUME or REDUCE INTENSITY so the week still has a quality stimulus. | KEEP only as a short sharpening touch, or REMOVE. |
| Sun long run | REDUCE VOLUME. Do not add Tuesday’s missed intervals. | REDUCE VOLUME or KEEP easy. |

Observation the coach should see: “Tuesday key was partial / missed at RPE 10 with heavy legs. Wednesday is high impact — stacking would destroy recovery space. Friday is the remaining quality session; Sunday is the remaining aerobic session.”

### Safeguards

- **No stacking key sessions.** MOVE and makeup are illegal if the destination day already has a key or high-impact session, or if they create accidental back-to-back hards without explicit overload intent (that intent is a coach decision).
- **No destroying weekly intent.** A build/peak week must keep at least one session that still serves the week’s purpose, unless safety interrupt fires. A deload/taper/race week must not gain extra keys.
- **Never rewrite completed history.** Completed, missed, and logged `athlete_feedback` stay as the athlete recorded them. Adaptation writes **forward** onto remaining published sessions, or onto a new snapshot row, never backwards. Publish-sync updating a logged session (current warning-only behaviour) is not an adaptation path.
- **No cascading adaptations.** One trigger produces one recommendation set for the remaining week. Accepting “reduce Wednesday” must not immediately re-run the engine and then strip Friday. Re-evaluation waits for the next logged session or a coach action.
- **No unpublished fill.** Do not recommend from a draft. If the rest of the week is unpublished, the recommendation is “publish or coach-edit first”.
- **Prescription snapshots stay snapshots.** REDUCE INTENSITY / CHANGE TARGET produces a **new** snapshot (expression, anchor, resolved value, `resolvedAt`, source). The original published target remains readable as the old state.
- **Preview is read-only.** View-as-Athlete never applies an adaptation.
- **Internal notes never leak.** Athlete-facing explanation is a dedicated field.

---

## 5. 1-1 recommendation shape

Hybrid365 assists. The coach approves meaningful programme decisions.

Every recommendation is explainable in the same five parts. No extra hidden terms.

```ts
type AdaptationRecommendation = {
  observation: string;          // what was logged / derived, in coach language
  reason: string;               // why this remaining-week conflict exists
  confidence: AdaptationConfidence;
  upcomingConflict: {
    sessionId: string;
    name: string;
    dateYmd: string;
    why: string;                // e.g. "key threshold 48h after costly key miss"
  } | null;
  recommendedActions: AdaptationRecommendedAction[];
  athleteFacingExplanation: string; // only this may later show to the athlete
  escalateToCoach: boolean;
  autoApplyForbidden: boolean;  // always true in 1-1
};
```

```ts
type AdaptationRecommendedAction = {
  action: AdaptationAction;
  sessionId: string | null;     // remaining-week session, or null for KEEP-week
  summary: string;              // "Cut Friday threshold from 6×6 to 4×6"
  oldStateRef: string;          // id of current published snapshot / session
  proposedNewState: unknown;    // conceptual; see data contract
};
```

```ts
type AdaptationAction =
  | "KEEP"
  | "REDUCE_VOLUME"
  | "REDUCE_INTENSITY"
  | "CHANGE_TARGET"
  | "MOVE"
  | "REPLACE"
  | "REMOVE";
```

### Mode

| Mode | Engine | Apply |
| --- | --- | --- |
| **1-1 / HYROX Team** | Same interpreter + same taxonomy | Recommend and preview only. Coach applies via Programme Builder / remaining-week edit. `autoApplyForbidden: true`. |
| **Track (later)** | Same interpreter + same taxonomy | May apply when `confidence` and the action’s rule allow. Escalate or no-op when they do not. |

Do not pretend a system recommendation is a personal coach note. Label source: `system` vs `coach`.

The Command Centre is the natural 1-1 surface: NEEDS ATTENTION already lists exceptions; this recommendation sits beside those flags as a **decision**, not as another flag code. Weekly review is the end-of-week counterpart, not a second model.

---

## 6. Audit trail

Every accepted adaptation (coach-applied in 1-1, rule-applied later on Track) records a row. Recommendations that the coach dismisses should also be recordable so the system can learn what was ignored, without treating ignore as a programme change.

### Required fields

| Field | Purpose |
| --- | --- |
| `old_state` | Session id, prescription snapshot, day, slot, name, status. Enough to restore what the athlete would have seen. |
| `new_state` | Same shape after the action. Null new session if REMOVE. New day/slot if MOVE. New snapshot if CHANGE TARGET / REDUCE. |
| `trigger` | Session id(s), check-in id, flag codes, as-of date. Why the engine woke up. |
| `reason` | The same reason string shown to the coach. Transparent. |
| `source` | `coach` \| `system_recommendation` \| `system_auto` (Track later). 1-1 never writes `system_auto`. |
| `identity` | Coach user id when a human decides; system actor id when Track applies; athlete id the change belongs to. |
| `timestamp` | When the decision was recorded. |
| `athlete_facing_explanation` | What the athlete may see (“Friday’s run is shorter because Tuesday landed much harder than planned”). Never an internal note, never a diagnosis. |

### Rules

- Append-only. A later change is a new row. Do not update the old adaptation to “the latest”.
- Published prescription history remains readable through `old_state`.
- Completed session logs are never the `new_state` of an adaptation.
- Preview opens are not adaptations (`hyroxAdminPreviewAudit` stays separate).
- Publish / Copy Week / Auto-Carry audits stay separate. Those are programme-authoring events, not response-driven adaptations. If a coach uses Programme Builder to enact a recommendation, the adaptation row still records the coaching decision; the publish sync records the write.

---

## 7. Safety

Pain/niggle feedback must not generate a medical diagnosis. Uncertain situations produce conservative behaviour or coach escalation.

### When to emit no recommendation

- Trigger session has no completion state and no RPE and no pain flag.
- Remaining week is unpublished or has no dated upcoming sessions.
- Signals conflict without a safety interrupt (e.g. RPE 6 and a “heavy legs” regex only).
- Athlete is a mock / demo roster row.
- Preview mode.

Show the observation if one exists. Action list is empty. `confidence: "low"`.

### When to escalate (no auto path)

- Any pain / niggle flag (session, check-in, or readiness if present).
- Illness wording or `feeling_unwell`.
- Incomplete key session plus another key still today.
- Repeated pain across two sources.
- Confidence `low` on Track.
- Missing weekly check-in is **not** an adaptation trigger; it is an attention flag only.

### When to forbid auto-apply (Track later; always in 1-1)

- Pain or unwell.
- CHANGE TARGET.
- REMOVE of a session that is the week’s remaining key intent.
- MOVE that would stack keys or land on race/test day.
- Any action whose `old_state` is a completed or logged session.
- Anchor / benchmark approval side effects. Approving a 5K does not rewrite this week.

### Pain-only path

Pain is not a programming puzzle.

1. Record the flag as logged text. Do not clinically interpret it.
2. Recommend REDUCE VOLUME and/or REDUCE INTENSITY on remaining impact, heavy lower, and station-specific work that commonly provokes (sled, lunges, wall balls) — as **load reduction**, not as treatment.
3. Escalate to the coach in 1-1. Track later: reduce or skip auto, then escalate.
4. FORBID REPLACE-into-another-hard-session and FORBID CHANGE TARGET.
5. KEEP is allowed only for clearly non-impact recovery work already published, and only as a recommendation.

### Other safety invariants (platform)

- Athlete history is not silently overwritten.
- Missing data stays missing.
- Internal `coach_note` never falls back into athlete payloads.
- Same engine for 1-1 and Track.
- Readiness flags stay off unless a rollout task turns them on. If they later turn on, they are optional context, not an auto-adapter.

---

## Conceptual data contract

Ideas only. No schema, no migration, no types shipped in `app/lib`. A later coordinator contract should freeze names before anyone implements.

### Interpreter (pure)

```ts
// Conceptual — do not implement in this workstream.
type AdaptationSignalBag = {
  athleteId: string;
  asOfYmd: string;
  triggerSession: { /* published session + feedback + planned/actual */ };
  recentSessions: Array<{ /* current + previous week */ }>;
  analytics: HyroxAthleteAnalytics | null;          // existing Workstream B payload
  attentionFlags: CoachAttentionFlag[];             // existing Workstream C flags
  latestCheckIn: { energy: number | null; soreness: number | null; painNiggles: string | null } | null;
  dailyReadiness: Array<{ localDate: string; feelingUnwell: boolean; muscleSoreness: number | null }> | null; // optional
  weeklyIntent: { weekNumber: number; focus: string | null; role: string | null };
  upcoming: Array<{ id: string; dateYmd: string; name: string; isKey: boolean; intensity: string | null }>;
  race: { dateYmd: string | null; daysUntil: number | null };
};

type AdaptationInterpretation = {
  caseCode: "target_met_easy" | "target_met_costly" | "miss_partial_max" | "easy_with_pain" | "completed_uncompared" | "insufficient_data";
  observation: string;
  inferred: string[];
  notInferred: string[];
  confidence: AdaptationConfidence;
};
```

Reuse `HyroxAthleteAnalytics` and `CoachAttentionFlag`. Do not fork them. The interpreter **reads** those contracts; it does not re-implement rolling volume or attention regexes.

### Reasoner (pure)

```ts
type RemainingWeekPlan = {
  interpretation: AdaptationInterpretation;
  weeklyIntent: AdaptationSignalBag["weeklyIntent"];
  upcoming: AdaptationSignalBag["upcoming"];
  recoverySpace: Array<{ dateYmd: string; reason: string }>;
  raceOrTest: { inWindow: boolean; dateYmd: string | null };
  recommendation: AdaptationRecommendation;
};
```

### Apply (later, not 1-1 auto)

```ts
type AdaptationDecision = {
  recommendationId: string;
  chosenActions: AdaptationRecommendedAction[];
  source: "coach" | "system_auto";
  decidedBy: string;
  decidedAt: string;
};

type AdaptationAuditRecord = {
  id: string;
  athleteId: string;
  oldState: unknown;
  newState: unknown;
  trigger: unknown;
  reason: string;
  source: "coach" | "system_recommendation" | "system_auto";
  identity: { athleteId: string; actorId: string };
  timestamp: string;
  athleteFacingExplanation: string;
};
```

1-1 writes `source: "coach"` when the coach accepts, or `source: "system_recommendation"` when recording a shown-but-not-applied card. Only Track later may write `system_auto`.

### Ownership boundaries

| Later agent | May | Must not |
| --- | --- | --- |
| Adaptation interpreter | Pure functions over existing payloads | Write programmes, invent medical copy, fork analytics |
| Remaining-week apply | Coach-approved edits to **unlogged** remaining sessions; new snapshots | Touch completed logs; silent publish; cascade |
| Prescription engine | Resolve a **new** snapshot when CHANGE TARGET / REDUCE INTENSITY asks | Rewrite an old snapshot because an anchor moved |
| Command Centre / weekly review | Render the recommendation | Compute a second interpretation |
| Track automation | Call this engine | Fork a second benchmark, formula, or action list |
| Session logging | Optionally add structured energy / legs / execution / `partial` | Treat visual-lab fixtures as live fields |

### Suggested later contract path

1. Freeze this architecture as `docs/contracts/adaptation-engine.md` (coordinator).
2. Add structured session fields and/or `partial` status **only** if a human wants that friction (separate migration, unapplied until approved).
3. Ship a pure interpreter + reasoner + QA script. No UI apply.
4. Coach Command Centre: recommendation card, coach decide.
5. Athlete-facing explanation on remaining-week sessions the coach accepted.
6. Track auto-apply last, behind a flag, same engine.

---

## What this workstream did not do

- No product code, no rules engine implementation, no SQL, no flags flipped.
- No medical diagnoses.
- Did not enable readiness, Home V2, Today V2, Performance Hub, or race-intelligence UI.
- Did not treat visual-lab energy / legs / execution as live athlete data.

---

## Open questions

1. Should `partial` become a first-class `hyrox_programme_sessions.status`, or a field on `athlete_feedback` so analytics can stay `completed === "completed"`?
2. Are structured session fields for energy, legs, and execution worth the extra completion friction, or is weekly check-in + RPE + pain enough for v1?
3. Who owns numeric actual-vs-target — analytics (new derived fields) or the adaptation interpreter?
4. Should Command Centre attention and weekly review alerts collapse to one flag catalogue before the interpreter consumes them?
5. How is weekly intent structured beyond `weekly_focus` text — enough for Track rules?
6. Remaining-week apply path: dedicated adaptation write, or coach enacts in Programme Builder and the audit row is attached?
7. May a coach edit athlete-facing explanation, or is it frozen from the recommendation?
8. What confidence × action pairs is Track allowed to auto-apply? (Proposal above: medium+conservative reduce only; never pain, never CHANGE TARGET, never key REMOVE.)
9. Should publish-sync be hardened to refuse content updates on logged sessions before adaptation ships, given it currently warns and still writes?
10. Key-session detection is too broad for “do not stack keys”. Does adaptation require an explicit `isKeySession` on every published row?
