# Coach workflow & programme planner

Research only. Does not authorise product code, a live UI change, a merge, a deploy, or applying SQL.

Workstream B. Branch: `integrate/hyrox-batch-1`.

Related: `docs/HYBRID365_COACHING_PLATFORM.md`, `docs/HYBRID365_AGENT_GUIDE.md`, `docs/HYBRID365_PLATFORM_BLUEPRINT.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/contracts/coach-command-centre.md`, `docs/contracts/prescription-engine.md`, `docs/contracts/athlete-analytics.md`, `docs/contracts/performance-profile.md`, `docs/contracts/race-intelligence.md`.

---

## Product rule

Hybrid365 **assists**. The coach **decides**.

In 1-1, the system may calculate, flag, compare, recommend, and preview. It must not silently rewrite a published week, activate a benchmark, or invent a pace. Internal `coach_note` never falls back into athlete copy. Preview stays read-only.

Coach admin is a dense operating system: scan rows, text actions in the row, no marketing tiles.

---

## Current product (audit)

### Roster (`/admin/hyrox-athletes`)

Three lists:

| Tab | What it is | Coaching use |
| --- | --- | --- |
| Applications | Live intake | Accept / reject. Not daily coaching. |
| Accepted athletes | Live `hyrox_athletes` | Payment, auth link, onboarding link, “next action” by **stage** (paid / assessment / programme live). Default open is Profile Review or Programme Builder — not Overview. |
| Mock coach athletes | Demo roster | `CoachActionQueue` is mock-only. Do not treat as live attention. |

Accepted rows show: name, payment, linked, assessment/testing chips, published week count, manager stage, suggested next ops action. They do **not** show: attention flag count, yesterday’s RPE, unpublished live week, pending benchmark, or check-in due.

There is no live cross-athlete attention queue.

### Athlete admin (`/admin/hyrox-athletes/[id]`)

Header (always): name, list/programme badges, race date + countdown, block · week, then a tile grid (main limiter, secondary, check-in, recovery, recovery risk, training days/hours, next action). For live athletes several of those tiles still come from the mapped-profile stub, not Command Centre.

Tabs (Races hidden unless `HYROX_RACE_INTELLIGENCE_*`):

1. Overview
2. Assessment
3. Testing
4. Races (flag)
5. Performance Profile
6. Profile Review
7. Programme Builder
8. Block Review
9. Weekly Review
10. Check-Ins
11. Coach Notes

That is too many daily destinations. The coach currently reconstructs “what happened” by walking Overview → Weekly Review → Check-Ins → Programme Builder → Performance Profile.

### Overview today

**Flag off** (`HYROX_COACH_COMMAND_CENTRE_*` default off): preview link, Today snapshot, Performance Hub, classification / equipment / programme-status tiles. Useful for onboarding, not for a Tuesday evening scan.

**Flag on:** `CommandCentreOverview` — dense fact rows.

| Section | What it shows now | Gap vs daily need |
| --- | --- | --- |
| This week | Published only: completed/planned, key sessions, run km / time / avg RPE / session-RPE load (analytics when present), latest check-in energy/soreness, pending benchmark count, next upcoming key session | No completion list. No “what changed since yesterday”. Unpublished week is a sentence, not a draft cue. |
| Needs attention | Rule flags from `hyroxCoachAttention` | Flags jump to Weekly Review / Check-Ins / Performance Profile. No “adapt remaining week” action. No source-data panel. |
| Performance Profile | Active anchors + pending count | Management stays on the Profile tab (correct). |
| Recent progress | Previous week sessions/RPE; rolling 4 and modality only when analytics engine is present | Trend, not “last comparable session”. |
| Quick actions | Edit programme, View as athlete, Testing, pending benchmark, check-in, notes | Text links. Correct density. |

Attention codes already implemented: `pending_benchmark`, `missed_programmed_session`, `key_session_incomplete`, `high_rpe_vs_prescribed`, `pain_soreness`, `illness`, `repeated_heavy_legs`, `repeated_low_energy`, `missing_weekly_check_in`. Transparent rules. No scores. No diagnosis.

### Programme Builder today

Three columns on XL: **library (280) · week schedule (flex) · side rail (300)**.

**Keep (working):**

- Session library with category / staple / equipment / programming-standard hints
- Build from scratch (`ScratchSessionBuilder`)
- Edit drawer (`SessionEditDrawer`) — name, objective, warm-up / main / cool-down, manual target overrides, kind-specific fields, library prescription blocks, one **Coach note**, “what to record”
- Move (day + AM/Main/PM/Optional modal — not HTML5 drag; placement is still explicit)
- Replace from library or scratch
- Duplicate as optional
- Remove
- View / expand prescription on the card
- Draft save, approve week, approve block, publish, athlete-week preview
- Copy Week To… (empty or explicit replace; blocked if published or athlete history)
- Auto-Carry (“Start next week from previous programming”) — consecutive +1 into an empty unpublished week only
- Block 4+ selector, week tabs, programme start date, generation scope (week vs 4-week)
- Performance Testing week insert / hydrate
- Planned-load weekly summary + validation warnings
- Week notes: internal coach note, rationale, key focus, things to avoid, athlete-facing note

**Not in the builder:**

- Structured `PrescriptionRule` resolve / personal numeric preview (engine exists in `hyroxPrescriptionEngine`; Workstream A explicitly left builder wiring out)
- Comparable previous session
- Previous actuals (pace, split, RPE, notes)
- Recent response strip
- Coach recommendation chip (prepared, not auto-applied)
- Session intent as a first-class field (objective exists; intent/purpose for the athlete is not separated)
- Athlete-facing note vs internal note **per session** (one `coachNote` today; week-level split exists)
- Adjustment reason (what changed + why the athlete should see)
- Race context in the planner
- Mid-week KEEP / REDUCE / REPLACE / MOVE / REMOVE / CHANGE TARGET

Publish copies draft JSON onto published week rows. Published targets are snapshots. Copy Week strips athlete feedback. Hydrate-on-published-testing-week is the one existing “republish details” path — not a general adaptation workflow.

### Weekly Review / Check-Ins / Coach Notes / Block Review

**Weekly Review** (`CoachWeeklyReviewPanel` + `hyroxWeeklyReview`): week picker; planned / completed / missed; avg RPE; notes count; check-in status; session rows (key badge, RPE, athlete notes, modifications); full check-in; four private fields (observations, adjustments for next week, follow-up, session changes). Alerts: missing check-in, completion &lt; 70%, avg RPE ≥ 8, two+ RPE 9–10, missed key, low sleep/energy, pain text, repeated fatigue words.

It **summarises**. It does not prepare next-week options or write the next draft.

**Check-Ins tab:** list of submitted weeks — sleep / energy / soreness / struggle only. Omits win, pain/niggles, availability, stress, recovery, bodyweight, `coach_response` (column exists, no coach UI).

**Coach Notes tab:** same week fields as the builder rail. Live persist today is `coach_note` + `athlete_facing_note` on the draft. Rationale / key focus / things to avoid are client state unless a later save path stores them.

**Block Review:** 4-week completion summary, long-form notes, next-block recommendation, generate next block. Right cadence for block turns, wrong for Tuesday night.

### Race / Performance / Testing

- **Performance Profile tab:** full history, approve / activate / reject / enter. Command Centre only shows active anchors.
- **Testing tab:** Performance Testing coach panel + legacy benchmark table from the stub.
- **Races tab (flag):** append-only race entry, splits, vs previous, observations. Not on Command Centre. Migration 022 unapplied; writes still use 001 columns.

### Session log data already stored

`athlete_feedback` v2: status, completed_at, RPE, notes, modifications, planned snapshot, modality metrics (run pace/distance/HR, erg split/watts, strength sets, HYROX splits), `painOrTightness` on run metrics. Weekly check-in: sleep, energy, stress, soreness, recovery, bodyweight, win, struggle, pain_niggles, next_week_availability.

The gap is **assembly in the coach path**, not collection.

---

## 1. Daily coach workflow

Kieran should open **one athlete** and know, in seconds, whether to leave the week alone or act — without visiting every tab.

### First screen: Command Centre (default Overview)

Keep the existing Command Centre contract. Change **priority and density**, not the philosophy.

**See first (in this order):**

1. **Needs attention** — flags, severity, reason, source, date/session, one action.
2. **Changes since last visit** — new completions, new check-in, new pending benchmark, new pain/niggle text. (Not built. Needs `generatedAt` vs last-seen, or a simple “logged after X” filter.)
3. **This week execution** — `3/6` sessions, key `1/2`, then a **three-line list**: yesterday / today / next key (name, status, logged RPE if any). Counts alone force a tab hop.
4. **Upcoming key session** — already on the payload. Keep it high.
5. **Pending tests** — pending benchmark count + “review” (already).
6. **Check-in** — latest energy / soreness / pain line, or “due from Thursday” (already flagged).
7. **Recent performance** — one line: previous week completion + avg RPE; one line if a comparable key session exists (“Last Tue TH: 3:48/km · RPE 8”). Rolling 4 stays secondary.

**Do not put on first screen:** assessment answers, library, block-review essay, race-split editor, full benchmark table, classification tiles.

### Header

Replace the seven stub tiles with four live facts: race countdown, live week number + published/draft, attention count, next action (“Review Tue RPE” / “Publish week 8” / “Nothing flagged”). Limiter and recovery risk stay on Profile Review / Performance Profile.

### Roster (5 now, required at 20–50)

Accepted list should gain a coaching row, not only an ops row:

`Name · Wk n published/draft · 3/6 · flags (2) · pending bench · check-in · next key`

Click opens Overview. Ops actions (pay / link) stay on expand. Mock `CoachActionQueue` is not this list.

### When a flag fires

| Flag | First click | Second click only if needed |
| --- | --- | --- |
| High RPE / incomplete key / missed | Source panel on Overview (session + log + remaining week) | Weekly Review for the full week |
| Pain / illness / heavy legs / low energy | Check-in + the session note that fired | Weekly Review |
| Pending benchmark | Performance Profile | — |
| Missing check-in | Check-Ins | — |

The missing product is the **source panel + remaining-week options** (section 4). Today every flag dumps the coach into another tab.

---

## 2. Programme planner

The planner stays a **calendar editor**. Context is progressive disclosure. Do not add a form to create a session.

### Keep

Drag/placement (current Move modal; true drag-and-drop may replace the modal later without changing the model), library, custom/scratch, edit, draft/publish, Copy Week, Auto-Carry, Block 4+, replace, duplicate-optional, remove, validation, planned-load summary.

### Add (and where)

| Addition | Week overview (card) | Session editor (drawer) | Side rail | Drill-down (source / context panel) |
| --- | --- | --- | --- | --- |
| Personal prescription preview (`@5K +20s/km` → `4:12/km`) | One resolved number if present; “missing anchor” if not | Rule + resolved + override. Required before publish if a rule is set | Count of unresolved rules | — |
| Comparable previous session | Tiny “vs last” if one exists (`−4s` / `RPE 8`) | — | — | Full: date, planned, actual, RPE, note |
| Previous actuals | — | — | — | Same panel |
| Recent RPE / response | Amber pip if last 1–2 similar sessions were high | — | Week avg RPE if live week has logs | Last 2–3 similar sessions |
| Coach recommendation | Optional one-line chip (“Consider REDUCE Fri TH”) — never auto-applied | — | Week-level recommendation only when a flag exists | Options list (section 4) |
| Session intent | One word on card (`Threshold`, `Easy`, `Key`) — derive from library / key / category; editable | Short intent + existing objective. Intent is “why this sits here”; objective stays the workout aim | — | — |
| Athlete-facing note | Gold rule if set (same grammar as athlete Home) | Dedicated field. Published to athlete | Week athlete-facing note stays here | — |
| Internal note | — | Dedicated field. Never in athlete payload | Week `coach_note` stays here | — |
| Adjustment reason | “Changed” mark if this session was adapted after publish | Required when KEEP is not the action on a published/upcoming session | — | Shown in preview of athlete copy |
| Race context | — | — | One strip: event, date, weeks out, last race overall if stored. Not splits | Races tab for splits |

**Do not put on the week card:** full prescription, previous splits, check-in essay, race stations, internal notes.

**Do not put in the editor as required fields:** recommendation, comparable history, race context. Those are prepared, not typed.

### Layout (keep the three columns)

```
Library / scratch          Mon–Sun board              Rail
  search                     day · slot · card          Planned load (keep, collapse)
  filters                    +AM +Main +PM +Opt         Validation (keep)
  add / replace mode         Edit · Move · Replace      Prescription resolve status
                             Dup · Remove               Race strip (one line)
                                                        Week notes (athlete / internal)
                                                        Publish (save / preview / publish)
```

Select a card → **context drawer or right-rail swap** (not a fourth column): comparable + actuals + response + recommendation. Close it and the rail returns to load / publish.

Editor stays a right sheet. Split **Coach note** into athlete-facing vs internal. Add prescription resolve + override at the top of the sheet (above warm-up). Adjustment reason appears only when the session is an adaptation of a published/upcoming row.

Scratch builder: keep name, category, objective, duration, RPE, parts. Intent can default from category. Do not add history fields to scratch.

---

## 3. Programming flow

```
CREATE WEEK
    → COPY WEEK or AUTO-CARRY (if consecutive empty)
    → EDIT (library / scratch / move / replace / targets)
    → RESOLVE PRESCRIPTIONS (preview numbers; override if needed)
    → REVIEW CONTEXT (comparables + remaining-week load + race strip)
    → PUBLISH
    → ATHLETE SEES WEEK
```

### CREATE WEEK

Empty week, generate selected week, generate 4-week block, or insert Performance Testing week. Unchanged.

### COPY / AUTO-CARRY

Unchanged rules:

- Copy: any week → empty draft, or explicit replace of unpublished programming. Never overwrite published or athlete history.
- Auto-Carry: only `fromWeek + 1`, only empty unpublished target, never backwards, never a jump. Notice: “started from week N — review before publish.”

Copy still strips logs. After Copy, prescriptions should **re-resolve against current active anchors** in the draft (not reuse the source week’s published snapshot). That is a later builder wiring task; the snapshot on the **source published** week stays frozen.

### EDIT

Same speed: click slot → add from library. Edit only when the template needs a change. Key / optional / slot remain placement, not a questionnaire.

### RESOLVE PRESCRIPTIONS

New step, not a new screen. Rail shows `3/5 sessions resolved · 2 missing anchors`. Coach can publish a week with a missing anchor only via **coach override** (already legal in the prescription contract). Unresolved formula + no override = block that session’s publish, not a silent estimate.

### REVIEW CONTEXT

Sixty-second pass on the week board: any high-RPE pip on a key day, any missing resolve, race week within 14 days on the rail. Open context panel only on the sessions that look wrong. Do not force a review modal.

### PUBLISH

Existing: save draft → preview → approve (week or block) → publish. Athlete APIs already drop internal notes. After publish, Overview should show the week as published; draft leftovers stay in the builder.

### ATHLETE SEES WEEK

Published sessions + athlete-facing week note + per-session athlete-facing note / intent / resolved target. Adjustment reason only when this week contains a mid-week change (section 4).

---

## 4. Mid-week adaptation

Example: Tuesday hard run — target missed, RPE 10, heavy legs, low energy. Upcoming: Wednesday high-impact, Friday threshold, Sunday long run.

**This flow does not exist today.** Flags stop at “Review week.”

### Flow

```
FLAG (attention)
  → SOURCE DATA (what was logged)
  → REMAINING WEEK (Wed / Fri / Sun + weekly intent)
  → OPTIONS (coach picks)
  → PREVIEW (athlete-facing reason + new targets)
  → PUBLISH
  → ATHLETE SEES CHANGE + REASON
```

### Source data (prepared)

From rows that already exist:

- Session: name, date, prescribed RPE/pace, logged RPE, actual pace/split if logged, notes, pain/tightness, completion state
- Check-in if submitted: energy, soreness, pain_niggles
- Attention reason string (the rule + observed values)

No diagnosis. No “injury risk score.”

### Remaining week

List **unpublished-or-still-upcoming** sessions only. Completed history is not editable. Show slot, intent, key, current target. Weekly intent = existing week rationale / key focus if stored, else library roles on the days.

### Options (coach clicks one; Hybrid365 does not apply)

| Action | Meaning | Typical use |
| --- | --- | --- |
| KEEP | No programme change. Optional athlete-facing “hold as planned.” | Isolated hard session, rest of week easy |
| REDUCE | Same session, less volume or shorter reps | Friday TH after a blow-up Tuesday |
| REPLACE | Swap template (library / scratch) | Wednesday station day → easy aerobic |
| MOVE | Same session, different day/slot | Shift Friday quality to Saturday |
| REMOVE | Delete upcoming session from the draft | Drop optional / second quality |
| CHANGE TARGET | Same structure, new number / override | `@5K +20` → `@5K +30` or typed pace |

These map onto **existing builder verbs** (edit, replace, move, remove, target override). The new product is the **decision sheet**, not new session mutations.

### Preview → publish

- Diff: previous session/target vs new
- Athlete-facing adjustment reason (required for REDUCE / REPLACE / MOVE / REMOVE / CHANGE TARGET)
- Internal note optional
- Publish only the affected upcoming sessions (or the remaining week). Do not rewrite completed rows. Store: what changed, previous, new, reason, `decision_source: coach`, timestamp (platform constitution).

1-1: recommendation may pre-highlight REDUCE Friday; the coach still clicks. Track later may auto-apply when confidence is high — same options, same snapshot shape.

### Where it lives

Not a new top-level tab. Open from Command Centre flag action, or from a “Adapt remaining week” control on the week board when the live week is published and a flag exists. Builder remains the execution surface.

---

## 5. Weekly review

Question: what was planned, what happened, how they responded, what improved, what needs attention, **what changes next**.

### Prepared automatically (do not make the coach assemble)

| Fact | Source already | Show as |
| --- | --- | --- |
| Planned / completed / missed | Published sessions + status | `5/7 · 1 missed · 1 no log` |
| High RPE | Logged vs prescribed + weekly avg | List of sessions, not a score |
| Strong execution | Completed key + RPE inside prescribed (or missing prescribed → completed on target if actuals exist) | Short list |
| Benchmark | Pending + any new approved row this week | Count + types |
| Niggle / pain | Check-in `pain_niggles`, session `painOrTightness` | Quoted text |
| Comments | Session notes, check-in win/struggle/availability | Quoted, truncated |
| Check-in scores | Sleep / energy / soreness / stress | Numbers; low ≤ 4 already amber |

Alerts already cover most of this. Deduplicate with Command Centre flags (same codes where possible; do not invent a second language).

### Coach still writes (short)

Keep the four Weekly Review fields, but treat them as **decisions**, not a journal:

1. Observation (optional if flags already say it)
2. What changes next (this is the one that matters)
3. Follow-up message? (yes/no + one line)
4. Session changes required (or a checkbox “open Adapt on next week”)

Do not add more textareas. Block Review stays the 4-week essay.

### “What changes next”

Hybrid365 prepares **candidates** on the **next** draft week (often Auto-Carried):

- Same structure as mid-week options, scoped to next Monday–Sunday
- Pre-filled from: missed keys, high RPE cluster, pain text, availability line, pending test
- Coach accepts / edits / ignores, then publishes next week

Until that exists, Weekly Review “adjustments for next week” is a note the coach must re-type into the builder. That is the main weekly time leak.

---

## 6. Efficiency: 5 athletes now, 20–50 later

### Time today (honest)

For each athlete the coach typically: Overview tiles or Command Centre → Weekly Review → Check-Ins → Builder → maybe Profile. Copy Week / Auto-Carry already remove the worst blank-week work. The remaining cost is **reconstruction** (what happened) and **re-entry** (what to change).

### Highest time-saves (estimated)

| Change | Save per athlete / week | At 5 | At 25 | Why |
| --- | --- | --- | --- | --- |
| Roster attention row (skip quiet athletes) | 2–4 min avoided on “nothing to do” | ~15 min | **~60–90 min** | Largest scale lever. Does not exist. |
| Command Centre as default + this-week list | 3–5 min (one screen vs 3 tabs) | ~20 min | ~75 min | Flags exist; list and “changes” do not. |
| Mid-week decision sheet | 5–10 min when a flag fires | 10–20 min (1–2 flags/week across 5) | **45–90 min** | Today: read logs, invent the rest-of-week plan, edit card-by-card. |
| Prepared next-week candidates after review | 8–15 min | 40–60 min | **3–5 h** | Auto-Carry copies; coach still re-thinks every session. |
| Prescription resolve in builder | 2–4 min/week once formulas are used | 10–15 min | 50–80 min | Mental arithmetic and inconsistency. Engine is ready; UI is not. |
| Context panel (comparable + last RPE) | 2–3 min/key session | 15 min | ~1 h | Stops opening athlete preview / Weekly Review to remember last Tuesday. |

**Largest now (n = 5):** next-week candidates + Command Centre default + context panel.

**Largest later (n = 20–50):** roster attention (skip work) + mid-week sheet (standardise the 20% of athletes who spiked) + next-week candidates (the other 80% are Copy/Carry + two edits).

Do not automate publish, anchor activation, or KEEP/REDUCE. Those stay clicks. The save is **not re-gathering**.

---

## Target information architecture

### Admin

```
/admin/hyrox-athletes
  Applications                         intake
  Accepted                             ops + coaching scan row
    → /[id] Overview                   Command Centre (daily home)
    → /[id] Programme Builder          planner
    → /[id] Weekly Review              week facts + “what changes next”
    → /[id] Performance Profile        anchors / approvals
    → /[id] Check-Ins                  full check-in + coach_response
    → /[id] Testing                    test week / results
    → /[id] Races                      flag; splits
    → /[id] Assessment                 onboarding answers
    → /[id] Profile Review             map limiter / generate first draft
    → /[id] Block Review               week 4 / 8 / 12
    → /[id] Coach Notes                thin alias of week notes
    → /[id]/preview                    read-only athlete
```

Daily path: **Accepted → Overview → (Adapt or Builder) → done.**

Weekly path: **Overview → Weekly Review → Builder (next week) → Publish.**

Onboarding path: **Profile Review → Builder → Publish.** Unchanged.

Coach Notes as its own tab is optional later; it duplicates the builder rail. Do not add tabs.

### Athlete overview (coach)

```
Header          name · race · week n · published|draft · N flags
Needs attention flags (or “Nothing flagged”)
This week       counts + yesterday / today / next key
Check-in        one line
Pending tests   count
Progress        previous week + one comparable
Quick actions   Edit programme · View as athlete · Adapt remaining week
```

### Programme builder

```
CREATE / COPY / AUTO-CARRY / GENERATE
Week board      placement + compact cards
Context panel   on select: comparable, actuals, RPE, recommendation
Editor          structure + resolve + athlete note + internal note
                + adjustment reason if adapting
Rail            load, validation, unresolved count, race strip, week notes, publish
```

### Week review

```
Facts           planned / done / missed / high RPE / strong / niggle / comments
Check-in        full
Coach           what changes next (short)
Action          “Prepare next week” → candidates on draft week n+1
```

### Mid-week adaptation

```
Flag → source → remaining week → KEEP|REDUCE|REPLACE|MOVE|REMOVE|CHANGE TARGET
     → athlete reason → preview → publish
```

---

## Key UI components (coach, not athlete primitives)

Dense rows. Text buttons. No gold marketing cards.

| Component | Job |
| --- | --- |
| `RosterCoachRow` | Name, week state, completion, flag count, pending, check-in, next key. Open Overview. |
| `CommandCentreOverview` | Keep. Add this-week session list, changes-since, Adapt action. Slim header. |
| `AttentionFlagRow` | Existing. Action opens source panel, not only a tab. |
| `SessionSourcePanel` | Planned vs logged, RPE, note, pain, check-in snippet. Read-only. |
| `RemainingWeekList` | Upcoming sessions + current targets. |
| `AdaptationOptionBar` | KEEP / REDUCE / REPLACE / MOVE / REMOVE / CHANGE TARGET. |
| `AdaptationPreview` | Diff + athlete-facing reason. Publish. |
| `WeekBoard` | Current `WeeklyScheduleBuilder`. Keep verbs. |
| `SessionCard` (coach) | Slot, intent, title, resolved target, vs-last pip, changed mark. |
| `SessionEditDrawer` | Keep. Split notes. Add resolve + override. Adjustment reason when needed. |
| `SessionContextPanel` | Comparable + last 2–3 responses. Closed by default. |
| `PrescriptionResolveRow` | Expression, anchor, number, missing, override. |
| `CopyWeekToModal` / Auto-Carry toggle | Keep as-is. |
| `CoachPublishPanel` | Keep. Add unresolved-prescription gate. |
| `WeeklyReviewPanel` | Keep facts. Shorten notes. Add “prepare next week.” |
| `RaceContextStrip` | Event · date · weeks out · last overall. Link to Races. |

Athlete visual primitives (`PerformanceMetric`, `StatusPill`, …) are for `/athlete`. Coach surfaces stay tabular.

---

## Data dependencies

| Need | Contract / table | Ready? |
| --- | --- | --- |
| This week counts, upcoming key, flags | Command Centre + `hyroxCoachAttention` | Yes (flag off by default) |
| Run km, time, session-RPE load, rolling 4 | `getHyroxAthleteAnalytics` | Yes on this branch; UI flag off |
| Active anchors | Performance Profile resolver | Yes |
| Pending benchmarks | `hyrox_athlete_benchmarks` | Yes |
| Check-in | `hyrox_check_ins` | Yes; Check-Ins tab is thin |
| Session logs / actuals | `hyrox_programme_sessions.status` + `athlete_feedback` | Yes |
| Comparable session | Same logs + library id / category / intent | **Not assembled.** Need a deterministic matcher (same `coachLibraryId` or category + intent, previous completed, most recent). No invented paces. |
| Prescription preview | `resolvePrescription` + active profile | Engine yes; builder **not wired** |
| Copy Week / Auto-Carry | `hyroxCopyProgrammeWeek*` | Yes |
| Published snapshots | Programme publish path | Yes |
| Athlete vs internal notes | Week: `athlete_facing_note` / `coach_note`. Session: one `coachNote` | Week yes; session split **not modelled** |
| Adjustment audit | Constitution requires what/previous/new/reason/source/time | **No table.** Do not reuse overwriting draft JSON as history. |
| Race strip | `hyrox_athletes.race_*` + last race overall | Upcoming race yes; last overall via race intelligence (flag; 022 unapplied) |
| Daily readiness | Optional; 017 unapplied | Flags already tolerate absence |
| Roster attention | Per-athlete Command Centre GET | **No batch API** |

Missing data stays null. Do not estimate threshold, HYROX pace, or FTP to fill the planner.

---

## Manual vs Hybrid365 prepares

### Hybrid365 prepares (no coach typing)

- Attention flags and reasons
- This-week counts, upcoming key, pending tests
- Check-in snapshot
- Analytics when the engine returns them
- Prescription number from rule + active anchor
- Comparable previous session + last actuals/RPE (when a match exists)
- Remaining-week list after a bad response
- Suggested option **highlight** (e.g. REDUCE Friday) with the rule stated
- Next-week candidates after weekly review
- Copy Week / Auto-Carry seed
- Planned-load summary and adjacency warnings (already)
- Validation (“two keys on consecutive days”)

### Coach decides (always in 1-1)

- Publish
- Active programming anchor
- KEEP vs REDUCE vs REPLACE vs MOVE vs REMOVE vs CHANGE TARGET
- Coach override of a formula
- Athlete-facing wording (may accept a prepared sentence)
- Whether a hard week stays hard
- Generating / skipping a block
- Anything with pain/niggle (system only quotes; coach interprets)

### Stays out of scope

- Silent programme edits
- Medical language
- Composite readiness / load / race-readiness scores
- Mock roster metrics as live
- Rewriting completed history
- Enabling Command Centre / analytics / race flags as part of this research

---

## Suggested build order (when a human starts implementation)

1. Turn Command Centre on for Kieran’s athletes; slim the header; add this-week session list + flag → source panel. No builder change.
2. Accepted roster coaching row (batch attention). Unlocks 20–50.
3. Session context panel + comparable matcher (read-only).
4. Wire prescription resolve into draft/publish (Workstream A snapshot shape only).
5. Adaptation sheet (options = existing builder mutations + reason + audit row).
6. Weekly Review “prepare next week” → candidates on week n+1.
7. Session note split + adjustment reason on athlete Home (athlete workstream).
8. Race strip when race intelligence is on.

Each step is assist-only. Copy Week, Auto-Carry, Block 4+, draft/publish, preview read-only stay intact.

---

## Open questions

1. **Command Centre default.** Ship as default-on for live 1-1, or keep the flag until the this-week list and slim header exist?
2. **Published mid-week edits.** Adaptation publish of upcoming sessions vs today’s “edit draft and republish the week” (used for testing-detail hydrate). Need an explicit product rule so snapshots stay traceable.
3. **Comparable matcher.** Library id only, or also category + intent + day-role? Wrong match is worse than “no previous.”
4. **Session `coachNote` split.** Additive fields vs a later migration? Athlete APIs must not start leaking internal text.
5. **Adjustment audit storage.** New append-only table vs week metadata JSON. Constitution wants previous/new/reason/source/time.
6. **Roster batch API.** N Command Centre fetches vs one coach-scoped summary. Required before 20 athletes.
7. **Coach Notes tab.** Keep, merge into Weekly Review, or leave as alias?
8. **True drag-and-drop.** Keep Move modal (fast, explicit slot) or add HTML5/pointer drag? Constitution says retain drag/drop; current code is a modal.
9. **Rationale / key focus persist.** Live save currently covers `coach_note` + `athlete_facing_note`. Should the other week fields become first-class columns?
10. **Check-in `coach_response`.** Column exists. Is the reply in Check-Ins, or only via athlete-facing week note?
11. **Race strip without 022.** Upcoming `race_date` is enough for “3 weeks out”; last overall needs a stored race. Do not invent splits.
12. **Who sees prepared recommendations.** Coach only, until Track. Confirm no athlete-facing “the system reduced Friday” unless the coach published an adjustment reason.
