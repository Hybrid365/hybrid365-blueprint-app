# Progressive programming architecture

**Status:** Research proposal + **decided product constraints** (2026-10-25).  
**Slice 1 implemented (code-first, not builder-wired):** `docs/contracts/session-family.md`, `app/lib/hyroxSessionFamily*.ts`, pilot `app/lib/families/threshold5MinRepeats.ts`.  
**Depends on:** `docs/research/TRAINING_LIBRARY_AUDIT.md`, `docs/contracts/prescription-engine.md`, `docs/HYBRID365_COACHING_OPERATING_MODEL.md`.

### Slice 1 clarifications (no change to decided constraints)

- Prescription slot id canonicalized to `run` (architecture draft said `primary_run`).
- Pilot Stage 4 = 6 × 5 min · 90 sec jog (RECOVERY_QUALITY / DENSITY; no volume jump). Consolidation and deload remain separate explicit stages.

---

## Decided product constraints (human-approved)

These close the open methodology questions from the progressive-programming audit. Implementation must respect them.

| # | Decision |
| --- | --- |
| 1 | **Progression architecture = hybrid graph** — default linear path; explicit `PROGRESS` / `REPEAT` / `REDUCE` / `DELOAD` / `SKIP_TO` edges. |
| 2 | **First pilot family** — Threshold 5-minute repeats. |
| 3 | **Block length** — support 3- and 4-week assignments; do **not** hardcode week 4 as deload; consolidation/deload is an explicit stage / coach choice. |
| 4 | **Canonical recovery types** — `walk` · `jog` · `easy_move` · `passive`. |
| 5 | **Strength** — no %1RM prescription automation in progression v1; coach-selected loads remain authoritative. |
| 6 | **Tempo** — separate training objective / family from threshold (not a threshold sibling stage). |
| 7 | **1-1 progression** — session completion never auto-advances stage; coach explicitly chooses / approves progression. |
| 8 | **Legacy duplicate threshold sessions** — preserve historical records; alias/map compatible records to canonical families; no destructive deletion or rewrite of published/completed history. |
| 9 | **Family authoring v1** — code-first / controlled structured definitions; do **not** build an admin Session Family authoring UI yet. |
| 10 | **Track** — reuse the same SessionFamily / Stage / Prescription objects; no automated progression writers until Track gates are implemented. |

---

## Design principles

1. **One platform** — extend coach library + editConfig + prescription engine; do not fork a Track-only workout model.
2. **Stage ≠ week** — progression stage is an athlete/coach decision; calendar week only schedules when it appears.
3. **Coach decides** — families assist; overrides always legal (1-1). Track may automate later on the **same** objects **after gates** — not before.
4. **Publish freezes numbers** — `PrescriptionSnapshot` immutable on published sessions.
5. **History never silently rewritten** — alias/map only; no destructive library or publish rewrite.
6. **Simplest graph that matches coaching** — hybrid linear default + explicit branch actions (**decided**).

---

## 1. SessionFamily (conceptual)

A **SessionFamily** is a coaching objective with ordered (and optionally branching) stages that share prescription rules and logging intent.

```
SessionFamily
  id: string                    // e.g. threshold_5min_repeats
  name: string
  modality: run | ski | row | bike | strength | hyrox | mixed | recovery
  objective: string             // coaching purpose
  tags: string[]
  description: string
  eligibility: {
    suitableLevels?: ...
    avoidIf?: ...
    requiresAnchors?: PrescriptionBasis[]
  }
  defaultEntryStageId: string
  consolidationStageId?: string
  deloadStageId?: string
  stages: SessionFamilyStage[]
  transitions: StageTransition[]   // see graph model
  athleteFacingBlurb?: string
  internalCoachNotes?: string
  sourceLibraryIds?: string[]      // legacy coach/foundation ids mapped in
```

**Not every library card becomes a family.** Tests, races, one-off race-week sessions stay standalone `CoachLibraryEntry` / custom sessions.

Reuse existing Programming System family **ids** where they already match (`sled_capacity_builder`, etc.) — attach real stage payloads instead of parallel cards only.

---

## 2. SessionFamilyStage

```
SessionFamilyStage
  id: string                    // stable key, NOT "week2"
  key: string                   // "stage_1" | "deload_a" | "consolidation"
  label: string                 // "6 × 5 min · 2 min walk"
  intent: volume | density | intensity | specificity | complexity | consolidation | deload
  structuredWorkout: StructuredWorkout   // canonical AST (new)
  qualityVolume?: {             // derived or explicit for coach scan
    thresholdMinutes?: number
    reps?: number
    totalWorkSeconds?: number
  }
  prescriptionRules: Array<{    // may be multiple (HYROX mixed)
    slot: "primary_run" | "ski" | "row" | "bike" | "strength" | "other"
    rule: PrescriptionRule
  }>
  athleteFacingNotes?: string
  internalCoachNotes?: string
  prerequisites?: string[]      // soft guidance
  mapsFromLibraryEntryIds?: string[]
```

### StructuredWorkout (minimal AST)

Enough to generate editConfig + athlete structure view:

- `warmup: string[]` (prose OK)
- `blocks: IntervalBlock[]`
- `cooldown: string[]`
- `guidance: string[]`

```
IntervalBlock =
  | { type: "repeat"; reps: number; work: Work; recoveries: Recovery[] }
  | { type: "continuous"; work: Work }
  | { type: "station_round"; rounds: number; run?: Work; station: StationSpec; recoveries?: Recovery[] }
  | { type: "strength"; exercises: StrengthSet[] }

Work = { kind: "time" | "distance"; value: number; unit: "sec" | "m" | "km" }
Recovery = { durationSec: number; type: "walk" | "jog" | "easy_move" | "passive"; note?: string }
```

Canonical recovery types are **decided** (`walk` · `jog` · `easy_move` · `passive`). Display strings are **derived** for athlete UI. Do not parse free text as SoT going forward.

---

## 3. Progression model: **hybrid** (decided)

| Model | Verdict |
| --- | --- |
| A. Strict linear only | Too rigid (cannot repeat/reduce honestly) |
| B. Full free graph | Over-engineered for n=5→50 |
| **C. Hybrid** | **Decided** |

**Default path:** ordered stages `S1 → S2 → S3 → …` plus named **deload** and **consolidation** stages (as explicit stages the coach can select — never implied by calendar week number).

**Explicit transitions** (coach or later Track):

```
StageTransition
  fromStageId
  action: PROGRESS | REPEAT | REDUCE | DELOAD | SKIP_TO
  toStageId
  when?: "coach_default_block" | "feedback_suggest" | "manual_only"
```

Block generator uses `coach_default_block` edges. Feedback suggestions use the same actions (operating model adaptation later).

**Week example (legal):**

| Week | Stage |
| --- | --- |
| 1 | S2 |
| 2 | S3 |
| 3 | S3 (REPEAT) |
| 4 | Deload |
| 5 | S3 or S4 |

---

## 4. Progression dimensions (canonical)

Do **not** collapse to `difficulty: 3`.

| Dimension | Structural levers |
| --- | --- |
| **VOLUME** | reps, work duration/distance, total quality minutes |
| **DENSITY** | shorter recovery, more active recovery |
| **INTENSITY** | PrescriptionRule offset / % (or coach override) |
| **SPECIFICITY** | station integration, compromised coupling, race order |
| **COMPLEXITY** | technical demand flag / movement list |
| **RECOVERY_QUALITY** | walk → jog → active |
| **CONSOLIDATION** | same structure, intentional non-progress |
| **DELOAD** | reduced volume/density, intent preserved |

Each stage declares primary `intent` dimension(s). UI shows what changed vs previous stage (diff of structured fields) — transparent.

---

## 5. Eligibility

### Family-eligible

Threshold intervals (pilot: **Threshold 5-minute repeats**) · **tempo** as its **own** family (not merged into threshold) · VO2 intervals · long-run volume ladders · erg intervals · bike %FTP progressions · strength endurance ladders (structure only in v1; loads coach-selected) · HYROX volume builders · compromised running builders · hybrid engine progressions.

### Non-family / one-off

Benchmark tests · race results · race-week specials · pure technique diagnostics · one-off custom experiments · recovery flushes (unless explicitly “easy volume ladder”).

---

## 6. Multi-week block assignment (future UX)

```
SELECT ATHLETE
→ OPEN PROGRAMME
→ ADD SESSION FAMILY (library drawer / progression modal)
→ START STAGE (defaultEntry or coach pick)
→ BLOCK LENGTH (3–4 typical; coach editable)
→ RECURRING DAY + SLOT
→ PREVIEW GENERATED WEEKS (stage per week + resolved targets)
→ EDIT individual weeks (unlink or retarget stage)
→ APPROVE / PUBLISH
```

### Auto vs coach-selected

Block length supports **3 and 4 weeks**. Do **not** hardcode week 4 (or any week index) as deload. Consolidation / deload appear only when the coach selects those stages or an explicit transition.

| Generated automatically | Coach must choose |
| --- | --- |
| Default stage sequence along `coach_default_block` edges from entry stage | Entry stage |
| Resolved targets from active anchors | Whether any week is consolidation / deload / hold / skip |
| Placement warnings (adjacency) | Overrides when missingAnchor |
| — | Final publish |

Never auto-publish. Completion never advances stage in 1-1.

---

## 7. Prescription integration

Matches existing contract:

| Layer | Stores |
| --- | --- |
| **Library / Stage** | `PrescriptionRule`(s) only |
| **Draft** | rule + live `resolveHyroxPrescription` preview |
| **Publish** | immutable `PrescriptionSnapshot` (+ structured workout snapshot) |

Multi-target example (HYROX mixed stage):

- `primary_run`: `{ basis: hyrox_run_pace, identity }`
- `ski`: `{ basis: ski_2k_split, +8s/500m }`
- `row`: `{ basis: row_2k_split, +5s/500m }`

Missing anchor blocks that slot’s publish unless coach override (existing invariant).

**Strength (decided for progression v1):** no %1RM prescription automation. Coach-selected loads remain authoritative. Stages may still encode structure (sets/reps/RPE guidance) without resolving percentage-based loads.

---

## 8. Athlete stage tracking

### Recommendation

**Persistent lightweight progress row** + **programme history as evidence**.

```
AthleteSessionFamilyProgress (conceptual)
  athleteId
  familyId
  currentStageId
  lastCompletedStageId
  lastDecision: PROGRESS | REPEAT | REDUCE | DELOAD | SKIP_TO | MANUAL
  lastProgrammeSessionId?
  updatedAt
  updatedBy: coach | system
```

**Why not derive-only:** Copy Week / manual edits / skipped weeks make pure derivation ambiguous.  
**Why not calendar week:** Forbidden by product goal.

On block assign: set/update `currentStageId` to entry stage.  
**1-1 (decided):** athlete session **completion never auto-advances** stage. Stage changes only when the coach explicitly chooses / approves a progression action.

**Track (decided):** reuse this same progress model later; **no automated progression writers** until Track gates exist.

---

## 9. Feedback-informed progression (future; no writer now)

Inputs (Batch 2+ execution + analytics): completion, actual vs target, RPE, execution quality, energy/legs, pain, repeated patterns, week intent, upcoming load, race proximity.

| Action | Meaning |
| --- | --- |
| **PROGRESS** | Next default stage along family path |
| **REPEAT** | Same stage again (consolidation) |
| **REDUCE** | Prior stage, consolidation stage, or deload stage |
| **REVIEW** | No automatic stage suggestion — open source panel |

Every suggestion: observation · reason · confidence · upcoming conflict · athlete-facing explanation.  
1-1: `autoApplyForbidden: true`. Pain → REDUCE/REVIEW only — no diagnosis.

---

## 10. Copy Week / Auto-Carry / manual rules

| Verb | Family-linked behaviour |
| --- | --- |
| **Copy Week** | Copy **session content + stage id snapshot** as-is into empty draft week. Do **not** auto-advance stage. Strip logs (existing). |
| **Auto-Carry** | Same as today: one week forward into empty unpublished. Carry stage id **unchanged** unless coach opens “advance family” intentionally. |
| **Manual edit of structure** | Keep family link if still same family; if coach replaces with unrelated session → **unlink** family (clear stage id). |
| **Manual stage change** | Updates draft stage id + re-resolves rules; published history untouched. |
| **Published session** | Immutable. Stage tracking updates only via explicit coach progress decision / audit. |

---

## 11. Coach admin IA (where interactions live)

| Interaction | Surface |
| --- | --- |
| Browse families / levels | Library drawer (extend SessionLibraryPanel) |
| Add family block | **Progression modal** (new) from builder |
| Edit single session structure | Existing session editor |
| See stage + vs last + target resolve | Right-side context panel |
| Week board placement | Existing week grid |
| Publish | Existing publish flow + missing-anchor gate |

**Family authoring v1 (decided):** code-first / controlled structured definitions in repo. Do **not** build an admin Session Family authoring UI yet. Do not put full family authoring inside the day card.

### Legacy library mapping (decided)

- Preserve historical library records and all published/completed history.
- Alias / map compatible threshold (and later other) records onto canonical families + stages.
- No destructive deletion; no silent rewrite of published or completed prescriptions.

---

## 12. Track compatibility (decided)

```
1-1: coach selects family + entry stage + transitions; completion never auto-advances
Track (later, gated): may select entry stage + apply PROGRESS/REPEAT/REDUCE writers
Same SessionFamily / Stage / PrescriptionRule / publish snapshot
Until Track gates exist: no automated progression writers
```

No second Track library. Community Hybrid75 / `runPrescription.ts` stay outside.

### Pilot scope (decided)

First implemented family: **Threshold 5-minute repeats**. Tempo is a separate family when it lands — not stages inside the threshold family.

---

## 13. External principles (not clones)

| System | Useful principle |
| --- | --- |
| TrainingPeaks | Structured workout steps; planned vs actual overlay |
| TrainerRoad | Explicit progression levels separate from calendar |
| Runna | Plan generation with editable workouts |
| Garmin / Zwift | Portable interval structure (reps, duration, targets) |
| Final Surge / Athletica | Coach assign + athlete personalisation |

Avoid: opaque “fitness score” driving stage; silent week auto-hardens.

---

## 14. Coach authority (non-negotiable)

Coach can always: pick entry stage · skip · repeat · reduce · edit generated session · override prescription · unlink family · insert custom session · refuse publish.

Engine assists. It does not dictate.
