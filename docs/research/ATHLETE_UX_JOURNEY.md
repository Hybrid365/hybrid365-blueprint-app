# Athlete UX journey

Research only. Does not authorise a live Home change, a merge, a deploy, or applying SQL.

**Workstream C.** Preferred athlete direction is Home D (`components/athlete-command-centre/visual/concepts/HomeConceptD.tsx`). Home D is a visual-lab prototype with demo fixtures. It is **not** live Home.

Related: `docs/HYBRID365_COACHING_PLATFORM.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/HYBRID365_INTERACTION_SYSTEM.md`, `docs/HYBRID365_PRODUCT_DESIGN_BENCHMARK.md`, contracts in `docs/contracts/`.

---

## Status of this document

| Item | State |
| --- | --- |
| Live athlete UI | Audited. Not modified. |
| Home D | Preferred direction. Not shipped. |
| Prescription engine (Workstream A) | Resolver exists. Athlete “why this pace” is **out of scope** until a later workstream. Published session targets today are coach-authored text / snapshot fields, not a live formula re-resolve. |
| Analytics (Workstream B) | Payload exists. Athlete Progress UI is **flag-default off**. |
| Race intelligence | Flag-default off. Migration 022 unapplied. |
| Performance Profile (athlete) | Flag-default off. |
| Weekly review (athlete) | Does not exist. Coach-only today. |
| Notifications / push | Do not exist. |
| Activity imports (Strava / wearables) | Blueprint only. Not wired to `hyrox_*` logs. |

Rules this journey must keep:

- Training first. Home is a weekly command centre, not a wellness dashboard.
- Coach copy is visually distinct from system copy. Internal `coach_note` never reaches the athlete.
- Missing data stays missing. Demo / visual-lab numbers never appear as a live result.
- Do not add unfinished destinations to primary navigation.

---

## 1. Information architecture

Recommended mobile destinations (Home D):

**HOME · PROGRAMME · PROGRESS · PERFORMANCE · MORE**

```
HOME            /athlete/dashboard
PROGRAMME       /athlete/programme
PROGRESS        /athlete/progress
PERFORMANCE     /athlete/benchmarks
MORE            sheet (not a page)
  Check-in      /athlete/check-in          always available; badge when due
  Races         /athlete/race-prep         only if HYROX_RACE_INTELLIGENCE_* is on
  Testing       /athlete/performance-testing   only during a testing week / protocol
  Sign out      existing header control
```

Desktop can flatten the same set in a left rail (Home D already does this). Do not invent a second IA.

### What each destination is for

| Destination | Job | Primary question |
| --- | --- | --- |
| **Home** | This week’s training. Select a day. Open a session. Complete it. See coach context for that day. Glance insights from **logged** data only. | What do I do now? |
| **Programme** | The published block: live / upcoming / past weeks. Same session drawer as Home. | What is the plan for this block? |
| **Progress** | Accumulation: Now → Recent → Longer-term. B analytics when the flag is on. | Am I actually getting better? |
| **Performance** | Active programming anchors, pending review, history. Submit a result. | What mark is my programme using? |
| **More → Check-in** | Weekly recovery / availability form for the coach. | How did this week land? |
| **More → Races** | Stored race history and split observations. Not race-week pacing. | What did I run, vs previous? |
| **More → Testing** | Testing-week protocol only. Distinct from Performance. | What test is due today? |

### Where secondary things live (do not add as tabs)

| Thing | Lives | Do not |
| --- | --- | --- |
| **Races** | More, and only when the race-intelligence flag is on for that athlete. Direct URL may still render an honest “not enabled” page. | Do not put a locked neon Races tab on the bar. |
| **Check-in** | More. Surface a **due badge** on More (and a coach-mark / CTA on Home when due). | Do not keep Check-in as a fourth primary tab. It is not daily work. |
| **Profile / account** | Sign-out lives in the portal header today. Assessment and onboarding are one-time flows (`/athlete/assessment`, `/athlete/onboarding`, `/athlete/testing`). There is **no athlete Profile destination** in nav. | Do not add Profile until it has live, useful fields (name, upcoming race label, connections). Do not ship an empty settings graveyard. |
| **Session history** | The session itself. Open a completed card from Home or Programme. Past Programme weeks are the archive. | Do not add a Session History tab. Logs are not a third calendar. |
| **Coach notes** | `athlete_facing_note` on the live week, plus per-session athlete-facing coach copy in the drawer. Home D: `CoachMark` on the selected day. | Do not promote `/athlete/coach-notes` (placeholder: “No coach notes available yet”). |
| **Resources** | Hidden. `/athlete/resources` is “Coming soon”. | Do not add to More. |
| **Visual lab / social prototypes** | Staging / dev only (`/athlete/visual-lab`, `/dev/visual-system`). | Never in athlete nav. |
| **Performance testing** | More, only while a testing week is active. Canonical title is **Performance testing**, not Performance. | Do not merge with Performance. |

### Live nav vs recommended

Live `athleteNav.ts` (mobile primary): **Home · Programme · Progress · Check-In**, with Performance, Performance Testing, and Races (flag) in More. Desktop shows every visible item in one row.

That puts a weekly form in the same rank as today’s training and hides the programming anchors. Home D is the correction: Check-in drops to More; Performance becomes a primary tab.

`MobileAnchorBar` is a leftover in-page section scroller from the old dashboard mock. It is not part of the destination IA.

### Flag-gated destinations stay absent, not locked

| Flag | Athlete surface when off |
| --- | --- |
| `HYROX_RACE_INTELLIGENCE_*` | Races omitted from More. `/athlete/race-prep` says history is not enabled. |
| `HYROX_PERFORMANCE_PROFILE_*` | `/athlete/benchmarks` falls back to the older testing snapshot body. Title still says Performance when the flag is on. |
| `HYROX_ATHLETE_ANALYTICS_*` | Progress keeps the existing honest empty / this-week completion screen. |
| `HYROX_HOME_V2_*` / `HYROX_TODAY_V2_*` / `HYROX_PERFORMANCE_HUB_*` | Off unless a named rollout task. Home D is **not** these flags. |

---

## 2. Home D flow

Home D hierarchy (constitution + prototype):

**Week → Selected day → Planned training → Coach context → My insights**

Default selected day is **today**. Changing day swaps the body in place. It does not navigate.

### Journey: open app → complete → return

```
Open /athlete/dashboard
  → Home paints this Monday–Sunday strip
  → Today is selected (gold date; other days zinc)
  → Day title: “Today · Friday” or “Wednesday”
  → Session previews for that day (or rest copy)
  → Optional CoachMark for that day (athlete-facing only)
  → My insights below the fold (logged B fields only)

Tap a day chip
  → Selected day swaps
  → Open drawer, if any, closes
  → Same Home, new day body

Tap a session preview
  → Drawer slides in (150ms; reduced-motion: none)
  → Scrim 70% black
  → Hierarchy: PURPOSE → TARGET → STRUCTURE → PRESCRIPTION → COACH CONTEXT → COMPLETE
  → Close / scrim returns to the same day, same scroll

Tap Complete (fast default)
  → Save: status completed + session RPE (and optional note)
  → 160ms confirmation: Target · Actual (if entered) · RPE
  → “Your coach can see this result.”
  → Drawer closes or stays on the confirmation beat
  → Home preview for that session now reads Completed + actual line

Optional: expand log
  → Modality fields only
  → Save log
  → Same confirmation + same Home completed state
```

### Week strip interactions

| Control | Behaviour |
| --- | --- |
| Mon–Sun chips | Always visible. Full-width 7-up. Active = white + gold underline. Today’s date stays gold when not selected. |
| Session dots | One to three dots under the date = published session count that day. Rest = no dots. Unpublished week = no dots. |
| Unpublished week toggle (lab only) | Honest sentence: “No programme published for this week yet.” Do not invent sessions. |
| Rest day | “No programmed training today. Rest / Recovery. Nothing extra was prescribed.” |

### Session preview (Home card)

One tappable row, not a widget grid. Rank:

1. Slot · modality · **Completed** (if logged)
2. Session title
3. **Primary target** (the king number)
4. Primary detail (pace band, load, Z2)
5. Duration · actual (only after log)
6. One-line intent (optional)

Multi-session days (Tue double, Wed triple in the fixture) stack with a hairline timeline. Order is AM → midday → PM.

Completed preview example (Home D Monday):

- `AM · Run · Completed`
- Easy run
- **60 min**
- Z2
- `60 min · 62 min · Z2`

That is the return-Home state. Do not celebrate. Do not add a streak.

### Coach context on Home

Home D places a `CoachMark` (left gold rule, “From {coach name}”) under the day’s sessions on mobile, and in the right rail on desktop.

- Show only when that day has athlete-facing copy.
- Hide the section when empty. Never fall back to internal `coach_note`.
- System sentences (“No programme published”, “Rest / Recovery”, insight captions) stay zinc meta. They must not look like coach copy.

Live Home today treats coach copy as another card and also shows a 4-up of Next session / Check-in / Weekly focus / Race readiness. Those four tiles are the main hierarchy failure. Home D deletes them.

### My insights (Home, below the fold)

Supporting only. Never the first story.

Allowed when B analytics is on and the field is real:

- Weekly running km + vs previous week (null if no logged run distance)
- Training time (logged duration only) + completed / planned
- One current programming mark (e.g. 5K) + delta vs first **stored** point

Home D’s fixture follows the B shape. Live Home must not copy the demo kilometres. If B is off or a field is null: omit the insight, or one honest sentence. No race-readiness %, no interpolated series.

### Live Home vs Home D (audit)

| Beat | Live Home | Home D (preferred) |
| --- | --- | --- |
| First story | 4 equal tiles, then a next-session card | Week strip → selected day → sessions |
| Week scan | No Mon–Sun strip | Always |
| Day change | Go to Programme | In-place day select |
| Session open | Drawer (correct) | Drawer (correct) |
| Completed return | Reloads programme; card status updates on Programme more clearly than Home | Preview shows Completed + actual |
| Coach | Another highlighted card | Distinct CoachMark |
| Insights | Race readiness tile + consistency % + Explore (second nav) | Logged B fields, below the fold |
| Nav | Home / Programme / Progress / Check-In | Home / Programme / Progress / Performance / More |

Home V2 / Today V2 exist behind flags and are **not** the preferred direction. Do not treat them as Home D.

---

## 3. Session detail hierarchy

Preferred order (constitution + Session Detail concept + Home D drawer):

**PURPOSE → TARGET → STRUCTURE → PRESCRIPTION → COACH CONTEXT → COMPLETE**

Live `SessionDrawer` is the right **container** (right sheet, sticky header + CTA, preview read-only) and the wrong **order**: tags → equal chips → Objective → Target (duplicated) → Warm-up → Main set novel → Cool-down → Coach note (another block) → Full prescription → What to record → optional log wall.

### Shared rules

- One primary target stays visible. Do not accordion it.
- Structure is a picture (work/rest timeline or spec rows), then text.
- Full prescription is the last disclosure, not the first.
- Coach context uses `CoachMark`. Film prompt stays its own labelled callout (already distinct live).
- Preview / View-as-Athlete: logging disabled, 44px controls, amber reason. No mutation.
- Unpublished / upcoming week: drawer may be readable; Complete is locked with “This session unlocks when the week goes live.”

### Workstream A assumption (target number)

When a later workstream publishes a prescription snapshot onto the session, the athlete TARGET is that **frozen number** (`resolvedValue` + unit, plus the display expression as meta).

Until then, TARGET is the coach-authored pace / load / duration already on the published row. Do not re-resolve `@5K +20s/km` in the athlete UI. If the snapshot is `missingAnchor` and there is no coach override, say the target is not resolved — do not estimate threshold, HYROX pace, or FTP.

### By session type

#### Easy run

| Layer | Content |
| --- | --- |
| Purpose | Why this is easy (absorb, aerobic, conversational). One sentence. |
| Target | Duration is usually the king (`60 min`). Zone / feel under it (`Z2`). |
| Structure | Single work block. No interval timeline unless there is a real drill. |
| Prescription | Pace cap or HR cap if prescribed. Hide empty rows. |
| Coach | Only if the coach wrote athlete-facing copy for this session or day. |
| Complete | Fast default. Expand: duration, optional distance / avg pace / HR if they want to type them. Imports should take these later. |

#### Intervals / threshold

| Layer | Content |
| --- | --- |
| Purpose | Hold a quality without fading. |
| Target | The interval prescription is the king (`6 × 5 min` or `3:25–3:30/km` — pick **one** king; the other is the line under it). |
| Structure | Work/rest timeline. Home D already does this. One primary block expanded on a small screen. |
| Prescription | Spec rows: rep, pace, recoveries, total time. Expression meta (`@THRESHOLD +5s/km`) only when a snapshot exists. |
| Coach | Pacing note if present (`coachPacingNote`). Distinct from purpose. |
| Complete | Fast default + RPE. Expand: average / last-rep pace, duration. Do not require every split. |

#### Strength

| Layer | Content |
| --- | --- |
| Purpose | What the session is for (posterior chain, not a second HYROX). |
| Target | The emphasis (`Heavy squat`) with the key set under it (`4 × 5 @ 70 kg`). |
| Structure | Exercise list as spec rows, not a paragraph. |
| Prescription | Exercise · sets · reps · load. Empty load stays empty. |
| Coach | “Leave one rep” belongs here if the coach wrote it. |
| Complete | Fast default + session RPE. Expand: only the exercises that were prescribed (pre-filled names), load / reps / RIR. Do not start from a blank “Exercise 1”. |

#### Complex HYROX mixed

| Layer | Content |
| --- | --- |
| Purpose | The race skill (station → run transition, density). |
| Target | Round structure is the king (`4 rounds`) with the coupling under it (`1 km + station`). |
| Structure | Repeating work blocks: run target, then station intent. Picture before the novel. |
| Prescription | Run pace, station constraint, total duration. Limiting-station fields are **log** fields, not the prescription. |
| Coach | Quality-over-heroics copy. |
| Complete | Fast default + RPE. Expand: total duration; optional run / station notes. Do not demand 8+8 splits for a training piece. Full race splits belong on Races. |

Live logging already branches by `activityType` (`run` / `strength` / `bike|row|ski` / `hyrox` / `other`). Keep that branch. Shrink the default.

---

## 4. Completion

### Fast default vs expand

Constitution: collect the minimum that supports coaching. Do not ask for what a device can provide later.

**Fast default (one screen, no expand):**

| Field | Why | Source today |
| --- | --- | --- |
| Completion state | Planned → completed (or later: partial / missed) | `Mark complete` sets `completed` + `status: completed` |
| Session RPE | Universal training response | Logged on the form; also duplicated inside modality metrics |
| Optional note | Anything the coach cannot see from numbers | `notes` |
| Pain / niggle flag | Safety. Not a diagnosis. | Run metrics have `painOrTightness`. Check-in has `painNiggles`. Session default does **not** yet have a first-class flag. |

**Conditional expand (only if the athlete opens “Add detail” / “Log session”):**

| Modality | Extra fields worth asking | Do not require |
| --- | --- | --- |
| Easy run | Duration, distance, avg pace | Cadence, elevation, power, max HR |
| Intervals | Duration, representative pace (avg or last work) | Every interval split |
| Erg | Duration, split or watts | Calories, max HR, stroke rate unless prescribed |
| Strength | Load / reps on prescribed lifts, session RPE | A blank exercise builder |
| HYROX mixed | Total duration, one limiter note if useful | Full race-split entry |

Live drawer today is invert: **Mark complete** is the primary CTA (good), but **Log session** reveals a wall (run: 10+ fields; strength: add-exercise builder; HYROX: run + station textareas). RPE is asked in the modality block **and** implied by the confirm. Notes exist in metrics **and** as a leftover. Score / modifications are extra.

**Recommended mapping to current logging (align with A + constitution):**

1. `Mark complete` = default path. Persist `status: completed`, `completed_at`, session RPE if entered, optional note.
2. Expand writes the same `athlete_feedback` jsonb (schema v2: `activityType`, `planned` snapshot, `metrics`) plus legacy `rpe` / `notes` / `modifications` / `score` for dual-read.
3. `modifications` stays available on expand (“cut the last two reps”). If they type it without marking complete, existing server rule may set `modified` — that is **athlete execution**, not a coach programme change. Do not reuse that word for “Wednesday was updated”.
4. Execution quality / legs / energy are constitution **candidates**. `SessionCompleteConfirm` already accepts them. Live does not collect them. **Do not add them to the fast default** until a human decides they earn the friction. Prefer: optional on expand, or infer later from check-in + notes. Pain stays a flag, not a paragraph, on the default path.

### Post-submit beat

Interaction system order:

1. Save.
2. 160ms confirmation (`SessionCompleteConfirm` / `CompletionConfirm`).
3. **Target · Actual · RPE** (only values that exist).
4. Execution / legs / energy only if logged.
5. “Your coach can see this result.”
6. Return Home: that session preview is Completed.

Live confirm today: “Session logged” + whatever RPE / notes / score was saved. It does **not** pair target vs actual. The concept (`SessionCompleteConcept`) does. Ship the hierarchy; do not ship the concept’s demo sentence (“Threshold held. 3s/km inside target.”).

### Interpretation (do not overclaim)

Coaching platform lists useful **future** signals (target achieved at expected effort, repeated heavy legs, and so on). There is **no athlete interpretation engine**.

After submit, the athlete may see:

| Allowed now | Not allowed |
| --- | --- |
| Target (published) vs actual (if they typed one) | “Threshold held”, “inside target”, readiness scores |
| RPE they entered | “Harder than expected” unless a later contract defines the rule and both sides exist |
| Coach can see this | Fake coach voice generated from the log |
| Home completed state; Progress **Now** counts update when B is on | Charts of zeros; progress from prescription duration |

Workstream A’s snapshot is the target side of “target vs actual”. Actual comes from the log or, later, a matched import. Until both exist, show the side that exists and leave the other blank.

Statuses the product already has: `scheduled` → `completed` | `modified` | `missed`. Constitution also wants started / in progress / partial. Do not invent UI for in-progress until a start action exists. Partial can reuse expand + `modified` carefully, or wait for an explicit `partial` value — do not silently recast `modified`.

---

## 5. Programme changes (Wednesday after Tuesday)

The loop the product must make obvious:

> Tuesday hard session submitted (missed target, high RPE, heavy legs). Coach looks at the rest of the week and changes Wednesday. The athlete must not discover that by accident.

### What exists today

| Mechanism | Athlete sees | Gap |
| --- | --- | --- |
| Coach republishes the live week | New session name / target next time they open Home or Programme (after reload) | No “this changed” label. No timestamp. No diff. |
| `athlete_facing_note` on the week | Home week rationale + Programme header, if the coach wrote it | Week-level only. Easy to miss. Not tied to Wednesday. |
| Per-session athlete-facing coach note | WeekSessionCard preview + drawer | Only if the coach wrote one on that session. |
| Internal `coach_note` / weekly-review `sessionChangesRequired` | Coach only | Must never leak. |
| Session status `modified` | Amber border + “Modified” on Programme cards | Means the **athlete** altered execution, not that the coach rewrote Wednesday. |
| Programme copy | “Future weeks may be adjusted after check-ins.” | Sounds like next week, not mid-week live edits. |
| Push / in-app inbox | None | Cannot rely on a notification system that is not built. |

There is no adaptation audit trail on the athlete payload (constitution wants: what changed, previous, new, reason, source, timestamp).

### Recommended athlete notice (no new destination)

Use surfaces that already exist. Do not add a notifications product.

1. **Label on the changed session** (Home D preview + Programme card + drawer eyebrow): `Updated` (or `Coach adjusted`). Word + gold rule. Not colour alone.
2. **Coach reason** in a `CoachMark` on that day / session: athlete-facing sentence the coach typed when they changed it (“Wednesday intervals dropped to 4 reps after Tuesday”). If they typed nothing, still show `Updated` and the new target — never invent a reason, never use the internal note.
3. **Home D state:** if today or the selected day contains an updated unpublished-to-the-athlete session, the CoachMark appears above the fold. Selecting Wednesday shows the new preview immediately (primary target is the new one).
4. **Programme:** the Wednesday card gets the same `Updated` word. Upcoming weeks stay `Upcoming — subject to coach review`. Do not animate a draft into a live session.
5. **In-app notice, if built later:** one line on Home, not a feed. “Kieran updated Wednesday.” CTA opens that day. Until then, the label + CoachMark are the product.

1-1 rule remains: Hybrid365 may recommend; the coach publishes. The athlete sees the **published** change, not the recommendation.

Completed Tuesday is immutable. The notice is only about remaining work.

---

## 6. Progress: NOW → RECENT → LONG TERM

Progress answers: **am I actually getting better?** It does not replace Home or Performance.

Preferred hierarchy (Progress concept + B contract):

| Band | Window | Content (only if real) |
| --- | --- | --- |
| **Now** | Current Monday–Sunday, labelled in progress until after Sunday | Completion (completed / planned), logged run km, logged duration, session-RPE load, key sessions. One lead number — usually completion or run km, not six equal tiles. |
| **Recent** | Previous week + rolling 4 (days up to `asOf` only) | Vs previous week; rolling run / duration / completion / avg RPE; current-week modality mix. Trajectory over a grid when a series exists. |
| **Longer-term** | Stored benchmark points, oldest → newest | Named tests with delta vs previous stored point. No interpolation. |

Live Progress today:

- Flag off: this-week completion + any logged testing snapshot. Honest empty chart sentence.
- Flag on: B payload as sibling summaries (this week, previous week, rolling 4, modality, benchmark cards). Fields are right; story is a grid.

### What belongs where (no duplicate metric surfaces)

| Metric | Home | Progress | Performance | Races |
| --- | --- | --- | --- | --- |
| Today / selected day’s sessions | **Owner** | No | No | No |
| This-week completed / planned | Glance (insights) | **Now** (owner) | No | No |
| Logged run km / duration / sRPE | Glance if B on | **Now / Recent** (owner) | No | No |
| Rolling 4 / modality mix | No | **Recent** (owner) | No | No |
| Active 5K / threshold / erg / FTP | One current mark in insights, optional | Longer-term series | **Owner** (current / pending / historical) | No |
| Pending benchmark | No (or a single Home CTA if pending) | No | **Owner** | No |
| Weekly check-in scores | Due CTA only | No (B lists `check_in_wellness` as unsupported) | No | No |
| Race overall / splits / vs previous | No | No | Race overall may appear as a `hyrox_race` history row, not as pace | **Owner** |
| Race-week pacing / fuelling | No | No | No | Placeholder only — do not invent |
| Coach weekly note | CoachMark on Home / Programme | Link back, do not reprint | No | No |
| Race readiness % / CTL / population rank | **Forbidden** | **Forbidden** | **Forbidden** | **Forbidden** |

Home live still labels a tile “Race readiness” even though the resolver now returns “Awaiting data”. That label should leave Home when Home D lands. Completion % on Home as “consistency” duplicates Progress **Now**.

Performance is the programming-anchor library. Progress longer-term may **plot** a series B already computed; it must not become a second submit/approve UI.

---

## 7. Weekly review (athlete)

Coach weekly review already exists (`CoachWeeklyReviewPanel`, `GET/POST /api/hyrox/athletes/[id]/weekly-review`). It is coach-only: planned vs logged rows, check-in, rule alerts, and four internal fields (`coachObservations`, `adjustmentsForNextWeek`, `followUpMessageNeeded`, `sessionChangesRequired`).

There is **no athlete weekly-review page**. The 9:16 `WeekInReviewCard` is a labelled prototype.

### What the athlete should get (when a later task ships it)

Not a second Progress. A short end-of-week letter on Home (Sunday / Monday) or as the first screen of Check-in.

| Block | Content | Source | Coach vs system |
| --- | --- | --- | --- |
| What was planned | Session count, key sessions | Published week | System |
| What happened | Completed / missed / modified; logged duration / run km if present | Logs + B `currentWeek` once the week is `complete` | System |
| How it felt | Avg RPE if logged; check-in energy / soreness if submitted | Logs / check-in | System (quoted, not diagnosed) |
| Highlights | Comparable sessions that have **both** a target and an actual, or a new stored benchmark | Snapshot + log + Performance history | System sentence, inspectable |
| Needs attention | Pain flag, repeated high RPE — factual | Same rules as coach attention, athlete-safe copy | System |
| Next-week focus | Why next week is built this way | `athlete_facing_note` on the next published week, or a dedicated athlete-facing weekly-review field the coach publishes | **Coach** |
| What changed | Mid-week or next-week adjustments | Adaptation record + athlete-facing reason | **Coach** |

Do not show coach-only alerts (“Completion rate below 70%”) as moral scores. Do not auto-write “you need more threshold”. If the coach has not published next-week copy, say next week is not published yet.

Check-in stays the athlete’s **input**. Weekly review is the **output**. Do not merge them into one 15-field form.

---

## 8. Friction

### Repetitive inputs

- Run log asks distance, duration, pace, avg HR, max HR, cadence, elevation, power, RPE, pain, notes — then the drawer still has modifications + score.
- RPE can be entered in modality metrics and again as session RPE (strength has both).
- Notes exist on the exercise, the session metrics, and the leftover field.
- Check-in asks five 1–10 sliders that overlap session RPE / pain (sleep, energy, stress, soreness, recovery) plus bodyweight and four text areas. Worth it **once a week**; not worth mirroring onto every session.
- Strength starts from a blank exercise instead of the prescribed list.
- HYROX training completion asks for split dumps that belong on Races.

### Extra clicks

- Live Home: tile or card → often Programme → View session → drawer. Home D: day → session → drawer (one hop).
- Complete requires opening the drawer. Correct. Opening **Log session** to type RPE should not be required for the default path — put RPE on the complete sheet.
- Check-in as a primary tab is a weekly click athletes take even when it is not due.
- Performance lives in More (live). Athletes will not find pending review.
- Explore on live Home restates the nav.

### Confusing states

| State | Confusion | Honest copy |
| --- | --- | --- |
| Unpublished week | Live Home still has chrome and “Loading programme…” / empty mocks if preview is on | Home D: “No programme published for this week yet.” |
| Upcoming week | Programme chips say Upcoming; logging locked | Keep. Do not show as Live. |
| Past Programme week | **Live bug / risk:** Programme remaps every past-week session `status` to `complete` for display | Show actual `completed` / `missed` / `modified` / scheduled. Otherwise history lies. |
| `modified` | Sounds like the coach changed the session | Relabel athlete-side as “Logged with changes” or “Partial”. Reserve `Updated` for coach edits. |
| Race readiness tile | Label implies a score; value is awaiting or, in older paths, completion % | Remove from Home. |
| Mock preview | Allowed only behind an explicit banner | Never as a real athlete result. Staging concepts already banner this. |
| Coach notes / Resources routes | Exist, empty | Keep out of nav. |
| Races when flag off | Hidden — good | Keep hidden. |
| Analytics vs Performance Hub vs old Progress | Three Progress bodies behind flags | One Progress: B when on, honest empty when off. Performance Hub stays off. |
| Preview | Logging looks like buttons | Disabled + “read-only preview”. Already true; keep. |

### Where imports help

Blueprint: Strava first, then wearables, into an ingestion table, then a matcher. Disconnect does not delete published sessions or athlete logs.

Imports should steal **objective** fields from the expand sheet:

- Run / bike: duration, distance, pace, HR, power
- Erg: split, watts, duration
- Not: RPE, pain, how it felt, coach-facing notes
- Not: strength loads (until a real strength source exists)
- Not: HYROX station splits unless the file actually has them

Until a match exists, do not show a ghost “awaiting Strava” as if the session failed. Complete remains available without a file.

---

## Journey map

```
ONBOARD (once)
  Application → paid → assessment → testing week → first published block
  Performance testing lives in More only while that protocol is active

WEEKLY LOOP
  Mon open Home
    → see week · today · sessions · coach mark if any
    → train
    → open session → complete (fast) → confirm → Home completed
    → optional expand / later import match

  Mid-week (e.g. Tue submit → Wed change)
    → coach publishes remaining-week edit
    → Home / Programme: Updated + CoachMark + new target
    → athlete does not need a new app section

  Thu–Sun
    → Check-in badge on More (and Home CTA if due)
    → submit check-in (input)
    → no athlete weekly-review letter yet

  Next week publishes
    → Home strip is the new Monday–Sunday
    → next-week coach focus is athlete_facing_note, not internal review fields

DEEP WORK (not daily)
  Programme     block archive, upcoming locked weeks
  Progress      Now / Recent / Longer-term (B)
  Performance   current marks, submit pending, history
  Races         stored results (flag)
```

---

## Screen and state transitions

```
Home (day D)
  ├─ select day D'                  → Home (day D')
  ├─ open session S                 → Drawer(S, inspect)
  │    ├─ close / scrim             → Home (same day)
  │    ├─ Complete (default)        → Saving → Confirm → Home (S completed)
  │    ├─ expand log → Save         → Saving → Confirm → Home (S completed / modified)
  │    └─ preview                   → Drawer read-only
  ├─ CoachMark (if copy)            → stay; no extra route
  └─ insights tap (optional)        → Progress or Performance, only if the number lives there

Programme
  ├─ week chip live/past/upcoming   → week list
  ├─ View / Log                     → same Drawer as Home
  └─ locked / not generated         → honest empty, no fake sessions

Progress
  └─ read only. CTA only when a check-in is due or a test is pending
     (action sits next to the sentence)

Performance
  ├─ submit result                  → Pending review (no celebration)
  └─ coach approve/activate         → Current; previous Historical

Check-in
  ├─ needs_completing               → form
  ├─ completed                      → read-only submission
  └─ locked                         → “unlocks when this week is live”

Races (flag on)
  ├─ list / expand splits
  └─ add race                       → append history; does not change training
```

Session lifecycle the athlete should recognise:

`Planned → (optional in progress, later) → Completed | Logged with changes | Missed`

Coach-only lifecycle on the same row: republish may change **future** planned content. It must not rewrite a completed log.

---

## Home → Session → Submit (happy path)

1. Open app. Auth + paid + linked. Unpublished: one sentence, no mock week.
2. Home D, today selected, published sessions for today.
3. Inspect the preview (purpose-level intent + primary target). Enough to start easy work without opening the drawer; intervals / HYROX should still open.
4. Open session. Purpose → king target → structure picture → spec → coach mark → Complete.
5. Fast complete: RPE + optional note. Save to `hyrox_programme_sessions` (`status`, `completed_at`, `athlete_feedback`).
6. Confirm Target · Actual · RPE with **only stored values**. Coach-can-see line.
7. Back on Home, that preview shows Completed and the actual line.
8. Progress Now increments completed count after refresh when analytics is on. No invented interpretation.

Preview cookie: stop at step 4. Buttons visible, inert.

---

## Programme adjustment notification

Minimum viable (no push product):

```
Coach publishes Wednesday change
  → remaining planned session payload updates
  → athlete-facing reason attached to session or day (or week note if that is all they wrote)
  → Home D Wednesday: CoachMark + Updated + new primary target
  → Programme Wednesday card: same
  → Tuesday completed row unchanged
```

Do not: silently swap the title; use `modified`; leak `sessionChangesRequired`; notify for unpublished drafts.

---

## Weekly review (athlete, recommended later)

Place: Home, when the previous week is calendar-complete, **or** the top of Check-in after submit.

Content: planned vs happened, quoted response, inspectable highlights, coach next-week focus.

Do not ship until: B can mark `currentWeek.complete`, and there is an athlete-facing field (existing `athlete_facing_note` on the next week is enough to start). Do not render the social prototype as a live letter.

---

## Nav recommendation

**Ship with Home D, not before:**

1. Mobile: Home · Programme · Progress · Performance · More.
2. More: Check-in (badge when `checkInDue`), Races if flagged, Performance testing if a testing week is active, nothing else.
3. Desktop: same five, More optional if width allows Check-in / Races inline.
4. Remove live Explore. Remove Check-in from the primary four.
5. Keep Performance vs Performance testing titles.
6. Keep sign-out in the header. Do not add Profile, Coach notes, Resources, Visual lab, or Session history.

---

## UX risks

1. **Shipping Home D visuals onto live Home without real day-session data** — the live dashboard is next-session + tiles, not a week strip. Adoption needs a real selected-day model, not the fixture.
2. **Demo insights leaking** — Home D fixtures are labelled. A careless wire-up would show 5K 17:55 as a real athlete.
3. **Race readiness / consistency %** still teach the wrong Home story even when the number is “Awaiting data”.
4. **Past-week Programme remaps all sessions to `complete`** — athletes and coaches can disagree with reality.
5. **`modified` vs coach Updated** — same English, opposite authors.
6. **Silent mid-week republish** — the Wednesday-change story fails today.
7. **Completion wall** — athletes skip logging, so B stays empty, so Progress/Home insights stay empty, so the product looks unfinished.
8. **Interpretation copy** in the complete concept will be tempting to ship. It is not backed by an engine.
9. **Duplicate metric surfaces** if Home insights, Progress Now, and Performance all hero the same 5K.
10. **Check-in as primary nav** trains “form first” instead of “train first”.
11. **Three Progress implementations** (old section, B, Performance Hub) behind flags.
12. **Coach notes / Resources placeholders** if someone adds them to More “for completeness”.
13. **Races / 022 / flag** — do not show split UI that estimates Roxzone or uses onboarding overwrite as history.
14. **Preview vs mock preview** — mock programme toggle must keep its amber banner; preview must stay read-only.

---

## Data dependencies

| Journey need | Dependency | Ready? |
| --- | --- | --- |
| Week strip + day sessions | Published `hyrox_programme_weeks` + sessions, calendar from `programme_start_date` | Yes (Programme already has days) |
| Session drawer content | Published prescription / metadata, athlete-facing coach fields | Yes. Formula snapshot display later. |
| Fast complete | Existing session-log API + `athlete_feedback` v2 | Yes. UX should ask less. |
| Target vs actual confirm | Published target + logged metrics / score | Partial. Confirm UI does not pair them yet. |
| Home insights | B `getHyroxAthleteAnalytics` + Performance Profile current mark | B yes, flag off. Profile athlete flag off. |
| Progress Now / Recent / Long | Same B payload | Yes when flag on. |
| CoachMark | `athlete_facing_note`, per-session athlete-facing note | Yes. Empty = hide. |
| Updated Wednesday | Adaptation record: previous, new, reason, source, time | **No.** Constitution specifies it; not on the athlete payload. |
| Weekly review letter | B complete week + athlete-facing next-week copy | Partial. Coach review exists; athlete surface does not. |
| Check-in due badge | Existing check-in summary (`needs_completing` / due from Thursday for coaches) | Yes. |
| Performance submit / pending | Performance Profile APIs, flag | Yes, flag off. |
| Races | Race intelligence APIs, flag, migration 022 | Flag off. 022 unapplied. Reads can map 001 display → seconds. |
| Imports | Ingestion + matcher | Not built. |
| In-progress / start session | No start action | Not built. |
| Interpretation sentences | No athlete interpretation contract | Not built. Do not fake. |

---

## Live surface audit (short)

| Surface | File | Verdict for this journey |
| --- | --- | --- |
| Nav / shell | `athleteNav.ts`, `AthleteAppNav.tsx`, `AthletePortalShell.tsx` | Refit to Home D five. Hide placeholders. |
| Live Home | `AthleteHomeDashboard.tsx` | Rethink hierarchy. Keep drawer wiring, live programme reload, preview lock. |
| Home D | `HomeConceptD.tsx`, `homeDFixture.ts` | Preferred. Demo only. |
| Programme | `ProgrammePageView.tsx`, `WeekSessionCard.tsx` | Keep week chips + drawer. Fix past-week status remap. Add Updated. |
| Session | `SessionDrawer.tsx` | Keep sheet. Reorder to purpose → target → structure → spec → coach → complete. Shrink default log. |
| Complete | `SessionCompleteConfirm.tsx`, live footer | Keep restraint. Add Target · Actual · RPE from real fields only. |
| Progress | `ProgressPageClient.tsx`, `AthleteAnalyticsSection.tsx` | Sequence Now → Recent → Long. Flag off stays honest empty. |
| Performance | `PerformanceProfileAthleteView.tsx` | Keep status words. Flag off keeps old body. |
| Testing | `PerformanceTestingPageView.tsx` | More only when active. |
| Races | `RacePrepPageView.tsx`, `RaceHistoryAthleteView.tsx` | More + flag. No race-week plan. |
| Check-in | `CheckInPageView.tsx` | More + due badge. Keep weekly form. |
| Coach notes / Resources | placeholder pages | Hidden. |
| Coach weekly review | admin panel | Not athlete-facing. |

---

## Open questions

1. Who writes the Wednesday athlete-facing reason — required field on republish, or optional with a bare `Updated` label?
2. Is `modified` kept as a storage value and only relabelled, or do we add `partial` / `logged_with_changes` in a later migration?
3. Does Home D adoption require a new selected-day payload, or can Programme’s live week be reused as Home’s data?
4. When B is off, does Home omit My insights entirely, or show only completed / planned from the programme row?
5. Are execution / legs / energy collected on session expand, on check-in only, or not at all in v1 of Home D?
6. Where does the athlete weekly letter live first — Home Sunday module, or post-check-in confirmation?
7. Should a pending benchmark create a Home CTA, or only live on Performance?
8. Is mid-week republish of a **live** week actually allowed in the planner today, or do coaches edit via a new publish that athletes already reload? (Journey assumes they can change remaining days.)
9. Profile: any live fields worth a More row later (upcoming race name from `hyrox_athletes`, Strava connection), or keep header-only?
10. Workstream A snapshot on the athlete session: when it lands, is the expression shown under the king number, or coach-only until a copy pass?
