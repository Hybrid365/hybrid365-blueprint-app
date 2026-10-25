# Coached Command Centre — supporting concepts

Visual-lab only. **Do not apply to live athlete screens, migrations, or production routes until a named human task.**

**Home update (25 Oct 2026):** Version D is the approved **Home** foundation. See `docs/HYBRID365_HOME_DIRECTION.md`. The earlier Coached Home (A/C single-day hero) layout is **not** the Home target. This document remains the reference for **Session, Completion, Progress, Performance, and Races**.

Related: `docs/HYBRID365_PRODUCT_DESIGN_BENCHMARK.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/HYBRID365_INTERACTION_SYSTEM.md`, B/E contracts.

Lab: `/dev/visual-system` → Home D (Home) · **Coached** Session / Complete / Progress / Performance / Races. Capture: `npx tsx scripts/qa-hyrox-design-concept-shots.ts`.

---

## What still applies

| Surface | Keep from Coached research |
| --- | --- |
| **Session** | Purpose + primary target in seconds; structure as a picture; coach decision copy; then complete |
| **Completion** | Three bands: Prescribed · Actual · Subjective; no celebration wall |
| **Progress** | Improvement vs previous before volume; B analytics fields only; unsupported named |
| **Performance** | Hero mark · previous · pending review; status words |
| **Races** | Overall → run analysis → station analysis → vs previous; observations from stored splits only |
| **Contracts** | Honest empties, no invented readiness, B/E field honesty |

| Source | Role after Home D approval |
| --- | --- |
| **Home A** | Hierarchy ideas only (type weight, one king number) — **borrow into Home D’s selected-day block**, do not replace D |
| **Home C** | Coach presence / adjustment language — **on Home D’s selected day**, not a new Home shell |
| **Home B** | Telemetry density on Progress and Race only |
| **Home D** | **Home foundation** — sticky week nav, selected day, session previews |

### Avoid (all surfaces)

Readiness scores, gamification, equal-weight dashboard clutter, fake zeros, leaking internal coach notes.

---

## Home (superseded for layout)

Do **not** treat lab tab `coached-home` as the approved Home. Prefer **Home D**.

If refining Home later: keep D’s sticky date navigation and week→day structure; optionally absorb small Coached ideas (stronger target type, one mark delta, clearer adjustment CoachMark) without rebuilding the frame.

---

## Screens in lab (non-Home Coached tabs)

| Tab id | Screen | Notes |
| --- | --- | --- |
| `coached-session` | Session detail | Supporting direction |
| `coached-complete` | Completion | Prescribed / Actual / Subjective |
| `coached-progress` | Progress | Improvement first |
| `coached-performance` | Performance | Hero mark |
| `coached-race` | Race Intelligence | Overall → run → station |
| `coached-home` | *(archived research)* | Not the Home foundation — kept for comparison only |

Home foundation tab: `home-d`.

State toggle on Coached tabs: **Populated** · **Loading** · **Empty**.

Fixture source: `concepts/fixture.ts` — labelled prototype demo data, not a live athlete.

---

## Workflow evaluation (non-Home)

### Session completion

| Need | Concept response |
| --- | --- |
| Understand the workout | Session: purpose + king number + interval picture |
| Log without a form wall | Complete: prescribed / actual / subjective bands |
| Coach visibility | “Your coach can see this result.” |

**Pass:** Prescribed, actual, and RPE visually distinct. No confetti.

### Training progression

| Need | Concept response |
| --- | --- |
| Am I getting better? | Progress opens on mark trajectory vs previous |
| Volume context | Rolling run km after the improvement story |

**Pass:** First Progress section answers “better than last mark?” before “how many km?”

### Race comparison

| Need | Concept response |
| --- | --- |
| Overall / run / station | Separate sections; fade and station deltas from stored splits |

**Pass:** Sections do not mix. Empty = no invented race time.

### Pre-session / coach adjustment (Home)

Evaluated against **Home D**, not Coached Home:

| Need | Home D response |
| --- | --- |
| What do I do? | Select day (sticky strip) → session preview with primary target |
| Coach changed the plan | Selected-day CoachMark with real adjustment copy when present |
| Empty | Honest unpublished / rest / no session — never invent a threshold run |

---

## What this concept deliberately omits

- Replacing Home D with an A/C hero Home
- Removing the sticky date navigation
- Full HYROX training-day split sheets on Complete
- Live SessionDrawer / Home / Progress replacement in a docs pass
- Any migration or production route change

---

## Approval gate

Home foundation: **Home D** (`docs/HYBRID365_HOME_DIRECTION.md`).  
Supporting surfaces: this file’s Session / Complete / Progress / Performance / Race guidance.

**STOP for implementation until a named human task.** Live athlete surfaces unchanged in documentation-only work.
