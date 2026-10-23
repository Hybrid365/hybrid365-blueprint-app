# Session execution and feedback

Research and conceptual contract for Workstream A. This document does **not** authorise product code, a live UI change, a migration, a merge, or a deploy.

Home D, Session Complete concept, and social completion cards live in the staging visual lab only. They are direction, not live behaviour.

Related: `docs/HYBRID365_COACHING_PLATFORM.md`, `docs/HYBRID365_PLATFORM_BLUEPRINT.md`, `docs/contracts/athlete-analytics.md`, `docs/contracts/coach-command-centre.md`, `docs/contracts/prescription-engine.md`.

---

## Purpose

Capture what happened in a programmed session with the least friction that still supports:

1. a coaching decision this week
2. athlete understanding of target vs actual
3. honest Progress (adherence, volume, session-RPE load)
4. later adaptation on the **same** engine for Track

Do not collect data because it is interesting. 1-1: the system assists; the coach decides. Track later automates only decisions this model already makes inspectable.

---

## Audit: what exists today

### Programme session status (live HYROX 1-1)

Stored on `hyrox_programme_sessions.status`. Schema check (`001_hyrox_team_schema.sql`):

| Stored value | Athlete UI word | How it is set today |
| --- | --- | --- |
| `scheduled` | upcoming / incomplete | Default on publish |
| `completed` | complete | Athlete taps **Mark complete**, or saves the log with the completed checkbox |
| `missed` | missed | In the type union and attention rules. **No athlete control sets it.** |
| `modified` | modified | Auto-set if `athlete_feedback.modifications` is non-empty and the athlete did not mark complete |

Not in the 1-1 schema: `started`, `in_progress`, `partially_completed`.

`completed_at` is set when status becomes `completed`. Clearing complete nulls it.

Write path: `upsertHyroxAthleteSessionLog` (`app/lib/hyroxAthleteSessionLogServer.ts`). Athlete surfaces: `SessionDrawer` → `useHyroxSessionLog` → server action or `POST /api/hyrox/athlete/session-log`. Preview is read-only.

**Mark complete does not require any feedback.** An athlete can complete a session with empty RPE, empty notes, and empty metrics. That session counts as completed for analytics and clears `key_session_incomplete` / `missed_programmed_session`.

**Save log** can persist feedback without completing. Status stays `scheduled` unless the completed checkbox is on, or modifications text flips it to `modified`.

Coach attention already treats a past programmed non-optional session that is not `completed` or `modified` as `missed_programmed_session` — even while the stored status is still `scheduled`. Key sessions due today or earlier fire `key_session_incomplete` instead. Optional slots are ignored.

### Community / Hybrid75 (do not reuse)

Paid community `session_logs` uses `completed | partial | skipped | moved`, plus typed `duration_minutes`, `distance_km`, `average_hr`, `pain_or_tightness`. Different tables, auth, and product. Do not write a 1-1 log through that path.

### Feedback payload (live)

`hyrox_programme_sessions.athlete_feedback` jsonb. Dual-read (`016` comment, `HyroxAthleteSessionFeedbackV2`):

**Legacy (always written):** `rpe`, `notes`, `modifications`, `score`, `loggedAt`

**V2 additive:** `schemaVersion: 2`, `activityType`, `planned` (snapshot at log time), `metrics` (activity-specific, all **strings**)

Activity types: `run | strength | bike | row | ski | hyrox | other`. Inferred from category / name / prescription (`inferSessionActivityType`). Heuristic. A compromised run+station piece becomes `hyrox`; a named 2K ski test can become `ski`.

### What the live log form actually asks

`SessionActivityLogFields` shows **every** field for the inferred type at once. Nothing is required. Nothing is hidden.

| Type | Fields shown today | Problem |
| --- | --- | --- |
| Run | distance, duration, average pace, avg HR, max HR, cadence, elevation, power, RPE, pain/tightness, notes | Eleven boxes after an easy 40-minute jog. Device fields asked by hand. |
| Strength | per-exercise name, sets, reps, load, RPE/RIR, notes; plus session RPE and session notes | Athlete retypes the programme. No prefill from prescription. Duration not asked (analytics later falls back to planned minutes in the sessionLogging aggregator — the analytics contract forbids that). |
| Bike / row / ski | distance, duration, pace/split, watts, calories, avg HR, max HR, cadence/stroke, RPE, notes | Calories and max HR have no coaching decision attached. |
| HYROX | total duration, run splits (textarea), station splits (textarea), limiting station, strongest station, RPE, notes | Asking for a full split sheet on a Tuesday compromised piece. Race intelligence already owns race splits. |
| Other | duration, RPE, notes | Fine. |

Plus two extra legacy fields always shown under the activity form: **Modifications** and **Time / score summary**.

`SessionCompleteConfirm` already accepts `execution`, `legs`, `energy`, and target/actual rows. Live drawer only passes RPE, notes, and optional score. Execution / legs / energy are **not collected**.

Weekly check-in (separate, already live): sleep, energy, stress, soreness, motivation, bodyweight, biggest win/struggle, `pain_niggles`, next-week availability. Daily readiness (`017`) is **unapplied** and includes a 0–100 composite — that score is out of scope here and conflicts with “no opaque scores”.

Home D completion chrome is visual-lab only. Do not treat it as the live log.

---

## 1. Session states

Proposed product states for a **programmed** session:

| State | Needed? | When set | Stored as (evolution) |
| --- | --- | --- | --- |
| Planned | Yes | Published, not yet resolved | Today: `scheduled` |
| Started | **No (see below)** | — | Do not add |
| Completed | Yes | Athlete (or later a confirmed device match) says the prescribed work was done | `completed` |
| Partially completed | Yes | Some prescribed work done; rest cut, substituted, or not finished | New value, or a constrained reuse of `modified` |
| Missed | Yes | Athlete or coach confirms it did not happen | `missed` — must become settable |

### STARTED is not worth it

Garmin and Strava need start/stop because **recording is the product**. Hybrid365 is a coaching OS. The session is already prescribed. In-app “Start” would:

- create a forgotten-in-progress pile (`scheduled` already does that job)
- imply live tracking we do not have
- add a tap that does not change a coaching decision

If a device workout is later mid-upload, that belongs on the **ingestion/match** record (`pending_match`), not on the programme session. The programme session stays planned until the athlete confirms complete / partial / missed, or a high-confidence match is confirmed.

### Forgotten-submit

Today a Tuesday threshold that was run but never logged stays `scheduled`. From Thursday the coach sees `missed_programmed_session` or `key_session_incomplete`. The athlete has no “I did this / I missed this” prompt.

Recommended behaviour:

1. After the session’s local calendar date, Home shows **Did you do this?** — three actions: Completed · Partial · Missed. Not a form.
2. Do **not** auto-write `missed` at midnight. Auto-miss invents history and poisons adherence.
3. Attention flags may keep saying “not completed” (that is true). They must not claim the athlete confirmed a miss.
4. Completing two days late is valid. `completed_at` is when they submitted, not a rewrite of the programmed date.
5. Optional later: a Sunday weekly-review nudge listing still-unresolved sessions. Coach can confirm miss in 1-1. Track may auto-miss unresolved non-key sessions after the week window if a later Track contract says so — same states, different decision source.

### `modified` vs partial

`modified` today means “typed something in Modifications.” That is not a coaching state. A scaled wall-ball weight that still finished the piece is **completed** plus a note. A session stopped after interval 3 of 5 is **partial**.

Recommendation: keep `modified` only as a legacy read until a migration can add `partially_completed`. Product language: Completed / Partial / Missed. Do not show “Modified” to athletes.

Optional sessions: athlete may ignore them with no miss flag (already true in Command Centre). Logging an optional is still useful.

---

## 2. Universal post-session data

Collect these on **every** completed or partial session. Missed sessions skip the rest except an optional reason.

| Field | Purpose | Scale | Required? | Friction | Coaching decisions | Every session type? |
| --- | --- | --- | --- | --- | --- | --- |
| Completion state | Adherence, Progress, attention, adaptation eligibility | `completed` / `partial` / `missed` | Yes | 1 tap | Did the work happen? Key-session incomplete? Upcoming week still valid? | Yes |
| Session RPE | Effort vs prescription; session-RPE load | Integer 1–10 (Borg CR10). Not a typed string. Not a range. | Required on completed/partial. Hidden on missed. | 1 tap (10 chips) | `high_rpe_vs_prescribed`; load; “target hit but grinding” | Yes, including strength and mobility |
| Execution quality | Whether the **intent** was met, independent of RPE | `on_target` / `easier` / `harder` / `cut_short` | Required on completed/partial | 1 tap (4 chips) | Target exceeded at low effort; completed but not as prescribed; partial already implied by `cut_short` | Yes. Mobility can be `on_target` in one tap. |
| Energy | Same-day response for the **remaining week** | `good` / `ok` / `low` | Optional, shown | 1 tap | Repeated low energy; Tuesday hard + low energy → Wednesday impact recommendation | Yes, but **do not** also collect a 1–10 energy if weekly check-in already has 1–10. Three words is enough. |
| Legs / muscular | Hybrid-specific freshness | `good` / `heavy` / `sore` | Optional, shown on run / HYROX / strength / compromised. Hidden on easy bike, mobility, true rest. | 1 tap | Repeated heavy legs (replace note-regex); soften upcoming run/station density | Not mobility, not easy spin |
| Pain / niggle | Safety flag, not a diagnosis | `none` / `yes` ; if yes, optional short location text | Binary required. Text optional. | 1 tap; text only if yes | `pain_soreness`; never auto-diagnose; conservative recommend / escalate | Yes. `none` is one tap. |
| Athlete note | Context the chips cannot say | Free text, short | Optional | Keyboard. Hide behind “Add note”. | Coach scan; illness words already parsed from check-in — session note is extra context only | Optional everywhere |

### Why these, and not more

**Execution quality is not a duplicate of RPE.** RPE 7 on a prescribed 7–8 that hit pace is different from RPE 7 that missed every interval. Adaptation and Progress both need that split. Four chips. No slider.

**Energy on the session is justified; a second 1–10 energy is not.** Weekly check-in energy is a week-level signal (`repeated_low_energy` needs two submitted check-ins). Session energy is same-day and can change Wednesday’s recommendation after Tuesday’s threshold. Keep session energy to three words so we do not run a daily questionnaire.

**Legs are hybrid-specific, not wellness theatre.** Command Centre already hunts `\bheavy legs\b` in notes. A chip is more reliable than hoping the athlete types the phrase. Hide it when muscular state cannot change the next session.

**Pain is a flag, not a form.** Do not ask region, severity 1–10, sharp vs dull, or medical copy. `yes` + optional “left calf” is enough to escalate. The system must not generate a diagnosis (platform constitution).

**Do not require a note.** Required notes train athletes to type “.” and poison NLP flags.

### Fields that look universal but should not be

| Tempting field | Verdict |
| --- | --- |
| Sleep last night | Weekly check-in / future readiness. Not per session. |
| Motivation / mood / stress | Weekly check-in already. |
| Bodyweight | Weekly, optional. |
| Illness checkbox | Overlaps check-in + readiness `feeling_unwell`. If the athlete is ill they should miss or partial and write a note — do not add a third illness surface on every log. |
| Enjoyment / “would repeat” | No coaching decision. |
| Modifications (legacy text) | Fold into execution `cut_short` / note. Stop auto-flipping status from a text box. |
| Score / time summary (legacy) | Derive from actuals. Do not ask twice. |
| Film / proof upload | Coach-requested, not default. |

---

## 3. Dynamic modality fields

Principle: **one primary actual that matches the prescription.** Everything a watch can send later is import-only. Manual now only when it is the session’s point.

| Field | Manual now | Import later | Calculated | Optional / hide |
| --- | --- | --- | --- | --- |
| **RUN** | | | | |
| Duration | Immediate if prescribed as time | Device moving time | — | Hide if distance-prescribed and distance entered |
| Distance | Immediate if prescribed as km | Device | — | Hide if time-prescribed and duration entered |
| Average pace | Conditional: quality / threshold / long | Device | duration ÷ distance when both exist | Hide on easy run if duration or distance is present |
| Interval / set summary | Conditional: structured quality only — “held / faded / stopped early” or last-rep pace, not every split | Device lap file | — | Hidden on easy / recovery |
| Average HR, max HR, cadence, elevation, power | No | Yes | — | Do not show empty boxes |
| **BIKE** | | | | |
| Duration | Immediate | Device | — | |
| Average power | Immediate if FTP-based target | Device | — | Hide if session is easy spin with no watt target |
| Distance | No | Device | — | Optional “add” |
| HR, cadence | No | Device | — | Hidden |
| **SKI / ROW** | | | | |
| Duration or distance | Immediate — whichever was prescribed | Erg / device | — | The other is optional |
| Average split | Immediate if a split was prescribed | Erg | — | Hide on easy aerobic pieces with only a time cap |
| Watts | Conditional if watts prescribed | Erg | — | Hidden otherwise |
| Calories, stroke rate, HR | No | Erg | — | Hidden |
| **STRENGTH** | | | | |
| Exercise actuals | Confirm / edit **prefilled** prescribed movements: load, sets done, reps done, optional RIR | Rare (some gym systems) | — | Do not ask the athlete to name “Back squat” again |
| Session RPE | Universal RPE covers this | — | — | Do not ask session RPE twice |
| Duration | No | — | Do **not** invent from planned minutes | Analytics already lists `strength_logged_duration` as unsupported. Keep it unsupported until a coach cares. |
| **HYROX / MIXED** | | | | |
| Total duration | Immediate | Device | — | |
| Compromised run pace or duration | Immediate if a run target exists | Device | — | |
| Key station time | Conditional: only stations the prescription named (e.g. “sled push 20m @ X”) | — | — | Not a full eight-station sheet |
| Limiting station | Conditional: one optional chip list | — | — | Hide on short station skill pieces |
| Full run + station splits | No, except a labelled simulation / time-trial | Race / device | — | Race intelligence owns race-day splits |
| Strongest station | No | — | — | Ego field. Limiting station is the coaching one. |

### Audit vs this table

Today every string in `RunSessionMetrics` / `ErgSessionMetrics` / `HyroxSessionMetrics` is treated as equally important. `planned` snapshot is useful and should stay: purpose, estimated minutes, target pace/split/load/HR/RPE, activity type. Store it at submit as a **copy of the published snapshot**, not a live re-resolve (prescription contract: published targets are frozen).

Activity-type inference should become an explicit `loggingActivityType` on the published prescription when the coach cares (hint already exists on `PrescriptionExtensionHints`). Inference remains the fallback. Do not make the athlete pick the sport after every session.

---

## 4. Minimum-friction UX by session kind

Immediate = on the first complete sheet. Conditional = second row or “add detail”. Hidden = import or never.

| Session | Immediate (target ≤ 3 taps + optional 1 actual) | Conditional | Hidden |
| --- | --- | --- | --- |
| Easy run | Complete · RPE · execution. Duration **or** distance (one box, pre-labelled from plan). | Energy, legs, note, pain=yes text | HR, cadence, elevation, power, pace |
| Threshold / intervals | Complete · RPE · execution. One actual: average work pace **or** “held / faded / cut”. | Legs, energy, last-rep pace, note | Full lap table, HR, power |
| Long run | Complete · RPE · execution. Duration and/or distance (both useful; still two boxes max). | Legs (shown), energy, pace, note | Elevation, HR, cadence |
| Strength | Complete · RPE · execution. Prefill: each prescribed lift with planned load/sets/reps; athlete edits what changed. | RIR on the top set only if prescribed; note; pain | Invented session duration, unused accessory lines |
| Ski / row intervals | Complete · RPE · execution. Average split **or** work duration. | Watts if prescribed, note | Calories, stroke rate, HR, every interval |
| HYROX compromised | Complete · RPE · execution. Total time **or** run actual. | Named station actual, limiting station chip, legs | Full split sheet, strongest station, Roxzone |
| Missed | Missed. Optional one-line reason (illness / life / fatigue / other). | — | All metrics, RPE, execution, energy, legs |
| Partial | Partial · RPE · execution=`cut_short` default. What was completed (one line or the primary actual). | Note, pain, energy/legs if relevant type | Full unused metric grid |

**Mark complete without a sheet is allowed only as a shortcut that still opens the three chips** (RPE, execution, pain=none). Today’s one-tap complete with zero data is too empty for Progress and Adaptation. Three chips is the new minimum, not eleven boxes.

Confirmation (`SessionCompleteConfirm`): Target · Actual · RPE, then execution / legs / energy if present, then “Your coach can see this result.” No confetti. Visual-lab Complete concept already sketches this; live drawer does not.

---

## 5. Target vs actual — which deltas matter

Store **both** the planned snapshot and the actuals. Do not overwrite the published prescription. Do not invent a missing actual.

| Pair | Meaningful to store | Meaningful to display | Not meaningful |
| --- | --- | --- | --- |
| Pace / split vs target | Yes, as display string + normalized seconds when parseable | Signed delta vs target (`+3s/km`, `−2s/500m`). Missing stays blank. | A 0–100 “pace compliance” score |
| Duration vs planned minutes | Yes when both exist | “48 vs 45 min” on long / easy. Ignore ±2 min. | Treating a 3-minute overtime as failure |
| Distance vs planned km | Yes for runs prescribed by distance | Same | Inferring distance from the title |
| Power vs FTP% target | Yes when both exist | Watts and %FTP if the FTP anchor exists | Inferring FTP from the ride |
| Strength load vs prescribed | Yes per prefilled exercise | “70 vs 72.5 kg” on the top set | Volume-tonnage as a personality score |
| RPE vs prescribed range | Yes | Already a Command Centre rule: logged > max + 1 | Colouring the week red from one session |
| Execution quality vs target | Yes (enum) | Sentence: “On target at RPE 6” / “Held target, RPE 9” | Combining into one “quality score” |
| HR vs zone | Only if imported | Optional later. Analytics lists HR as unsupported today — keep it so until a series exists. | Asking for average HR by hand |
| Session-RPE load | Calculated: `durationMinutes * rpe` only when both exist (analytics contract) | Week sum vs previous week | CTL / ATL / TSB |
| Completion | Status | Completed / planned, key completed / key planned | Counting `modified` as completed (analytics already does not) |

Partial sessions: store actuals for what was done. Deltas may be null. Do not compute “60% of the workout” unless the prescription has a countable set structure and the athlete marked sets done.

---

## 6. Device / Strava (future)

Integration philosophy is already in the blueprint: provider writes an **ingestion** row; a matcher links it to a programme session. Disconnecting a provider must not delete published sessions or athlete logs.

Rules for this workstream:

1. **No duplicate entry.** If a matched activity supplies duration, distance, pace, power, HR, splits — those fields are filled and the manual boxes stay hidden. Subjective chips (RPE, execution, energy, legs, pain, note) still belong to the athlete.
2. **Attach to the programme session.** A Strava run that is not linked is a floating activity, not Progress. Progress and Adaptation read programme sessions, not the vendor feed.
3. **Confirm ambiguous matches.** Same-day easy run vs the programmed threshold: show both, athlete or coach picks. High-confidence (same day, same modality, duration within a later-defined band) may auto-attach in Track; 1-1 should still notify.
4. **Do not silently overwrite a submitted log.** If the athlete already typed 8.2 km and Strava says 8.4, keep the athlete values and offer “replace from device.” History is not rewritten.
5. **STARTED stays on the device.** Watch start/stop never becomes a Hybrid365 session status.
6. **One activity model.** Pace, distance, duration, HR, power, splits are provider-neutral. Do not couple `hyrox_*` columns to Strava IDs.

Out of scope until Integrations owns a contract: Garmin, WHOOP strain, Apple Health.

---

## 7. Feedback → transparent coaching signals

Convert stored fields into sentences the coach (and later Track) can inspect. No composite readiness. No “session quality 73”.

| Observation | Inputs | Does not fire when |
| --- | --- | --- |
| Target achieved at expected effort | Actual within target band **and** RPE inside prescribed range **and** execution `on_target` | Any input missing |
| Target exceeded at lower effort | Faster/higher actual **and** RPE ≤ prescribed min **and** execution `easier` or `on_target` | Missing target or RPE |
| Completed but harder than expected | RPE > prescribed max + 1 (existing rule) **or** execution `harder` | Prescribed RPE missing and execution not `harder` |
| Target missed | Execution `harder` or `cut_short` **or** actual outside target the wrong way | Partial already covers cut-short |
| Partial completion | Status `partial` | — |
| Missed (confirmed) | Status `missed` | Unlogged past session (attention only) |
| Repeated heavy legs | ≥2 sessions in current + previous week with legs=`heavy` | One session; use chips not note-regex once chips exist |
| Repeated low session energy | ≥2 sessions in the current week with energy=`low` | Single session; do not collapse with weekly check-in energy |
| Increasing RPE at similar performance | Same activity + similar actual, RPE up across comparable sessions | <2 comparable rows; missing actuals |
| Declining execution | `harder` or `cut_short` on consecutive similar key sessions | Mixed session types |
| Pain / niggle reported | pain=`yes` | Empty / `none` |
| Unlogged past key session | Date ≤ today, key, status still planned | Optional slot; future date |

1-1: these are Command Centre flags and weekly-review lines. They never rewrite the programme.

Track: the same observations become inputs to Keep / Reduce / Replace / Move / Remove / Change target, with recorded reason and decision source. Uncertain → conservative or escalate.

Pain must never become a medical diagnosis. Copy reports what was logged.

---

## 8. Conceptual contracts (fields only)

Not TypeScript. Not a schema migration. Names are proposals for the coordinator.

### SessionExecution

The state machine on a **published programme session**.

| Field | Meaning |
| --- | --- |
| programmeSessionId | Existing session id |
| athleteId | Owner |
| state | `planned` / `completed` / `partial` / `missed` |
| programmedDate | Calendar YMD of the session (not submit time) |
| submittedAt | When the athlete (or confirmed match) resolved the state; null if still planned |
| completedAt | Same as today when state is completed; null otherwise |
| decisionSource | `athlete` / `coach` / `device_match` / `track_rule` |
| weekLocked | Unchanged: unpublished or upcoming week cannot be logged |
| matchedActivityId | Null until Integrations. Does not change state by itself |

Invariants: published targets stay on the session. Execution does not rewrite prescription history. Preview cannot write. Optional sessions may stay planned forever without a miss.

### SessionFeedback

Subjective, athlete-owned, one blob per execution submit.

| Field | Meaning |
| --- | --- |
| completionState | Mirrors execution state (completed / partial / missed) |
| sessionRpe | Integer 1–10 or null (null on missed) |
| executionQuality | `on_target` / `easier` / `harder` / `cut_short` or null (null on missed) |
| energy | `good` / `ok` / `low` or null |
| legs | `good` / `heavy` / `sore` or null |
| pain | `none` / `yes` |
| painNote | Optional short text if pain=`yes` |
| note | Optional free text |
| missedReason | Optional: `illness` / `life` / `fatigue` / `other` when missed |

Invariants: chips over text. Missing stays null. Internal coach notes never land here. Dual-read: until UI changes, keep writing legacy `rpe` / `notes` so Command Centre and analytics keep working.

### SessionActuals

Objective result of this programmed session. Manual, imported, or calculated — each value records `source`.

| Field | Meaning |
| --- | --- |
| activityType | `run` / `bike` / `ski` / `row` / `strength` / `hyrox` / `other` |
| planned | Snapshot copy: purpose, duration minutes, target pace/split/load/HR/RPE (already exists) |
| primaryActual | The one number that matched the prescription (pace or duration or load or split), display + normalized |
| durationMinutes | Logged or imported; never prescribed minutes |
| distanceKm | Logged or imported; null if not a distance session |
| averagePaceSecondsPerKm | Normalized when parseable |
| averageSplitSecondsPer500 | Ski/row |
| averagePowerWatts | Bike / erg |
| strengthSets | Array of { exerciseId or name, prescribed load/sets/reps, actual load/sets/reps, rir? } |
| hyrox | { totalDuration, namedStationActuals[], limitingStation? } |
| intervalSummary | Optional: `held` / `faded` / `stopped_early` |
| source | `athlete` / `device` / `mixed` |
| calculated | Deltas vs planned that are safe to show (pace delta, RPE vs prescribed). Empty if inputs missing. |

Invariants: do not estimate threshold, HYROX pace, or FTP from a session. Do not fill empty actuals. Strength duration stays null. HR series stays unsupported until imported as a series.

Analytics continues to read: `state === completed` for completion counts; logged duration only; RPE mean; `duration * rpe` when both exist; run `distanceKm` on run modality. Partial and missed are not completed.

---

## Recommended set (for the integration architect)

### Universal (completed / partial)

- Completion state
- Session RPE 1–10
- Execution quality (4 chips)
- Pain none/yes (+ optional note)
- Energy good/ok/low (shown, not required)
- Legs good/heavy/sore (shown only on run / HYROX / strength / compromised)
- Optional note (collapsed)

### Modality (immediate only)

- Run easy: duration or distance
- Run quality: average work pace or held/faded/cut
- Long run: duration and/or distance
- Bike: duration; watts only if prescribed
- Ski/row: prescribed dimension (time or distance) + split if prescribed
- Strength: prefilled prescribed lifts, edit what changed
- HYROX mixed: total time or run actual; named station only if prescribed

### Submission flows

1. **Did it** — Complete + 3 required chips (RPE, execution, pain) + 0–1 primary actual.
2. **Partly** — Partial, execution defaults to `cut_short`, same chips, what was done.
3. **Missed** — Missed + optional reason. Stop.
4. **Forgotten** — After programmed date, same three actions, no extra guilt copy.
5. **Device later** — Match → confirm if needed → fill actuals → still ask subjective chips once.

### Edge cases

- Mark complete with no actuals: allowed if chips are present. Progress shows completion and RPE; volume stays null.
- Double-log: edit in place on the same session row; do not append a second history row for the same programme session (session log is not a benchmark).
- Coach edits a draft week: published log stays on the published session (already true; Copy Week must not copy `athlete_feedback`).
- Upcoming week: stay locked (already true).
- Optional session: no miss flag; logging still allowed.
- Two sessions one day: match and complete independently.
- Pain=yes: flag only; no programme rewrite in 1-1.
- Illness in a note: existing check-in/readiness parsers; do not add a session illness score.
- Partial + device file for the full activity: keep partial; do not auto-upgrade to completed.
- Strength with no structured prescription: one optional note + RPE, not a blank exercise grid.

### Device strategy

Ingest → match to programme session → confirm ambiguity → fill actuals → never drop subjective → never delete coach/athlete history on disconnect.

### Data for Progress

From this model, Progress should use: completion counts, key-session completion, logged duration, run distance, average RPE, session-RPE load, modality mix, comparable-session actual vs previous (when both actuals exist). Empty stays empty. No device volume until matched.

### Data for Adaptation

From this model, Adaptation should use: confirmed miss/partial, high RPE vs prescribed, execution `harder` / `cut_short`, repeated heavy legs, repeated low session energy, pain flag, unlogged key session, plus the remaining week’s intent (already in the constitution). 1-1 recommends. Track applies only when confidence is high. Every change records previous value, new value, reason, source, time.

### Do not collect

Max HR, cadence, elevation, running power, calories, stroke rate, strongest station, enjoyment, sleep, mood, motivation, stress, bodyweight, daily readiness score, proof URL, full HYROX split sheets on training days, retyped exercise names, a second RPE box, modifications-as-status, community `partial/skipped/moved` enums, opaque quality/readiness/strain scores.

---

## Principles taken from other products (not their UI)

| Source | Take | Leave |
| --- | --- | --- |
| Strava | Activity-type metrics; one dominant actual; attach a file to a day | Feed-as-home, kudos, PR banners, asking every Garmin channel by hand |
| Garmin | Structured target vs actual after the file lands; start/stop lives on the device | Training Status %, equal widget stack, invented recovery time as a coach |
| WHOOP | Post-activity journal is short; strain is a consequence of duration × intensity (we already have session-RPE load) | Recovery ring, 0–21 strain as identity, streaks |
| TrainingPeaks | Planned vs completed is the endurance sentence; compliance is a scan for the coach | TSS/IF/PMC as personality; green/red morality; calendar-as-athlete-home |
| Runna | Complete first, feel second, enrich later; coaching copy stays next to the work | Consumer-training-plan tone; hiding the coach |

Hybrid365 remains a high-performance OS: training first, numbers with weight, coach present, self-comparison, no mock results.

---

## Open questions for the integration architect

1. **Schema:** add `partially_completed` (and maybe rename `scheduled` → `planned` in the product layer only), or overload `modified` until a migration is approved? `001` check constraint cannot gain a value without a new migration. This task must not apply SQL.
2. **Minimum chips vs today’s one-tap complete.** Requiring RPE + execution + pain will drop the empty-complete path. Confirm that is an accepted adherence trade for better load and flags.
3. **`modified` backfill.** Existing rows with modifications text — treat as completed, partial, or leave as `modified` forever in analytics (`modified` is not completed today)?
4. **Strength actuals.** Is prefill-from-prescription in scope for the first execution contract, or is “RPE + note + optional top-set load” enough until Session Library V2 stores structured lifts?
5. **Session energy vs weekly check-in vs unapplied daily readiness.** Three energy surfaces is too many. Recommend: session 3-chip + weekly 1–10; do not ship daily readiness energy as a fourth.
6. **Forgotten-submit SLA.** How many days until 1-1 coach is expected to confirm a miss? Should Track auto-miss, and on which session classes?
7. **Device match confidence.** Who owns the matcher contract — Integrations workstream — and does execution wait on it or ship manual-only first?
8. **Analytics contract freeze.** Adding `partial` must not silently count as completed. Confirm Workstream B treats partial like missed for `completedSessions` and still sums logged duration/RPE when present.
9. **Activity-type source of truth.** Coach-set `loggingActivityType` on publish vs inference. Wrong type today dumps the wrong 11-box form.
10. **Command Centre `repeated_heavy_legs`.** Switch from note-regex to legs chip once collected; keep regex as fallback for legacy notes?

---

## Status

Research only. File: `docs/research/SESSION_EXECUTION_FEEDBACK.md`. No product code, no UI, no migration.
