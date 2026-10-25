# Coached Command Centre — consolidated concept

Visual-lab only. Provisional direction approved for concept work. **Do not apply to live athlete screens, migrations, or production routes until human visual approval.**

Related: `docs/HYBRID365_PRODUCT_DESIGN_BENCHMARK.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/HYBRID365_INTERACTION_SYSTEM.md`, B/E contracts.

Lab: `/dev/visual-system` → **Coached** tabs. Capture: `npx tsx scripts/qa-hyrox-design-concept-shots.ts`.

---

## Composition recipe

| Source | Keep |
| --- | --- |
| **Home A** | Hierarchy: today → one progression signal → coach last among equals, never above the session |
| **Home C** | Visible coach presence and training intent — authored decisions, not branding |
| **Home B** | Telemetry density only on Progress and Race Intelligence |
| **Contracts** | B analytics fields, E race analysis, honest empties, status words, no invented readiness |

### Refinements applied

1. **Home** — today’s training is the hero; one personal progression signal (current 5K + delta vs previous) sits secondary. No week modality wall, no sRPE load, no readiness %.
2. **Coach presence** — CoachMark carries a real decision (today’s note, or “why this week changed” when an adjustment exists). Decorative “Coach” chrome without copy is forbidden.
3. **Session** — purpose + primary target readable in &lt;3s; structure as a picture; prescription secondary; coach; then complete.
4. **Completion** — three visual bands: Prescribed · Actual · Subjective. No celebration wall.
5. **Progress** — improvement vs previous (benchmark trajectory, week-over-week) before volume charts.
6. **Race** — Overall → Run analysis → Station analysis → vs previous. Observations only from stored splits.
7. **Avoid** — readiness scores, gamification, equal-weight dashboard clutter.

Home D (week-first strip) remains a separate research prototype. This consolidated concept is the **approved direction for review**, not a live Home swap.

---

## Screens in lab

| Tab id | Screen | Mobile | Desktop |
| --- | --- | --- | --- |
| `coached-home` | Home | Single column, today king | Today + coach · progression rail |
| `coached-session` | Session detail | Purpose → target → structure | Same hierarchy, wider structure |
| `coached-complete` | Completion | Prescribed / Actual / Subjective bands | Same |
| `coached-progress` | Progress | Now improvement → recent → longer | Wide charts after the improvement story |
| `coached-performance` | Performance | Hero mark + previous + pending | Same |
| `coached-race` | Race Intelligence | Overall → runs → stations → compare | Two-column run/station after overall |

State toggle in lab: **Populated** · **Loading** · **Empty** (honest unavailable copy; never invent zeros).

Fixture source: `concepts/fixture.ts` — labelled prototype demo data, not a live athlete.

---

## Workflow evaluation

### 1. Pre-session

| Need | Concept response |
| --- | --- |
| What do I do today? | Home: session name + primary target as the largest type |
| Why this session? | Purpose line under target; coach note is a decision, not a slogan |
| Open work fast | Single primary CTA → Session |
| Fail if empty | Empty Home: “No published session for today” — no fake threshold run |

**Pass criteria:** Athlete can name the session and target without scrolling past the fold on 390.

### 2. Session completion

| Need | Concept response |
| --- | --- |
| Understand the workout | Session: purpose + king number + interval picture |
| Log without a form wall | Complete: target/actual entry band, then subjective chips |
| See what was prescribed vs done | Three labelled bands; TargetActual component |
| Coach visibility | Confirm line: “Your coach can see this result.” |

**Pass criteria:** Prescribed, actual, and RPE are visually distinct after save. No confetti.

### 3. Training progression

| Need | Concept response |
| --- | --- |
| Am I getting better? | Progress opens on 5K trajectory vs previous marks; week-over-week completion second |
| Volume context | Rolling run km after the improvement story |
| Unsupported data | Explicit “Unsupported” line — never invent HR series |

**Pass criteria:** First Progress section answers “better than last mark?” before “how many km?”

### 4. Coach adjustment

| Need | Concept response |
| --- | --- |
| Notice a change | Home CoachMark labelled with coach name + “adjustment” when `whyChanged` exists |
| Understand the decision | Copy states what changed and why (demo fixture uses Tuesday fade → Saturday shortened) |
| Not mysterious | No silent chrome; if no adjustment, show today’s session coach note only |

**Pass criteria:** Adjustment copy is readable without opening Programme. Empty state has no fake adjustment.

### 5. Race comparison

| Need | Concept response |
| --- | --- |
| Overall result | Large overall + vs previous / vs goal |
| Run vs station | Separate sections; run fade called out |
| Vs previous race | Station deltas and observations from stored splits only |
| Empty | “No race results stored” — no invented Manchester time |

**Pass criteria:** Athlete can answer overall, weakest run signal, and biggest station delta without mixing sections.

---

## What this concept deliberately omits

- Readiness / recovery / strain composites
- Explore as a Home destination
- Week strip as Home (that remains Home D research)
- Full HYROX training-day split sheets on Complete
- Live SessionDrawer / Home / Progress replacement
- Any migration or production route change

---

## Approval gate

**STOP for human visual approval.** After approval, a separate named task may roll concepts into live athlete surfaces behind a new flag (do not reuse `HYROX_HOME_V2_*`).

Screenshots: `docs/visual-qa/concepts/coached-*-{390,1440}.png` plus empty/loading variants where captured.
