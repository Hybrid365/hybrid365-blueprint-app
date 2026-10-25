# Training library audit

**Status:** Research only. No records modified. No migrations. No product code.  
**Branch context:** `integrate/hyrox-batch-1`  
**Date:** 25 Oct 2026

Related: `docs/HYBRID365_COACHING_OPERATING_MODEL.md`, `docs/contracts/prescription-engine.md`, `docs/research/PROGRESSIVE_PROGRAMMING_ARCHITECTURE.md`, `.cursor/rules/session-library.mdc`, `.cursor/rules/programme-builder.mdc`.

---

## Executive finding

Hybrid365 already has **multiple overlapping workout / progression representations**. The cleanest path is to **extend and unify** them under one SessionFamily model — not invent a fourth library.

Critical weakness: **stage is often conflated with calendar / block week** (`block_week` 1–4, `week1`…`week4` strings). Progressive programming requires **stage independent of week**.

---

## 1. Sources of truth (current)

| Source | Location | Purpose | Shape | Created | Read | Athlete-specific? | Reusable? | Publish snapshot? | Safe to extend? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **HYROX foundation library** | `src/lib/hyrox/sessionLibrary.ts` (+ enrichments) | Methodology templates (~36 `defineSession`) | `HyroxSessionDefinition` — string arrays for warmup/main/cooldown; ability variants; optional `progressionExamples` week1–4 strings | Code | Community/Hyrox generators, some coach mapping | No | Yes | Indirect via resolve | Yes — carefully; ids already referenced |
| **Coach programme library** | `app/lib/hyroxCoachSessionLibrary*.ts` (~153 entries) | Programme Builder cards | `CoachLibraryEntry` + free-text `prescription` + optional `progressionFamily` / level | Code | Builder `SessionLibraryPanel`, draft placement | No | Yes | Copied into draft/prescription jsonb | **Primary extension surface** |
| **DB `hyrox_session_library`** | `001_hyrox_team_schema.sql` | Future/remote library rows | name, category, `prescription` jsonb, tags | Rarely used vs code libraries today | Coach if populated | No | Yes | N/A | Schema can hold families later; do not assume populated |
| **Community `sessionLibrary`** | `app/lib/sessionLibrary.ts` | Hybrid75 / community plans | Separate templates | Code | Community dashboard | Profile-based | Yes | Community path | **Out of scope for 1-1** — do not merge engines |
| **Progression families (community/paid)** | `app/lib/progressionFamilies.ts` (~19 families) | Week-in-block variants | `ProgressionFamily` + `block_week` 1–4 variants; string `main[]` | Code | Week blueprint / Track-ish flows | Ability/goal filtered | Yes | Into week plan | **Do not make canonical for 1-1** without decoupling stage from week |
| **HYROX session progressions** | `src/lib/hyrox/sessionProgression.ts` (8 families) | In-block string progressions | family → week1–4 **strings** | Code | Resolvers | No | Yes | Notes only | Migrate to structured stages |
| **Threshold block progression** | `src/lib/hyrox/thresholdBlockProgression.ts` | Numeric threshold ladders by programme block | Structured reps/duration/recovery per block×week | Code | Threshold session builders | Partially (HR/RPE notes) | Yes | Into mainSet strings | Best existing **structured** progression seed |
| **Programming System registry** | `app/lib/hyrox-team/modules/programmingSystem/` | Family registry + levels + hints | `ProgrammingProgressionFamily`, standards | Code | Coach library tags / builder hints | No | Yes | No | Reuse **ids/names**; add stage payloads |
| **Draft session** | `CoachDraftSession` in `hyroxCoachProgrammeDraft.ts` | Editable week | `editConfig` + prescription text lines + volumeMeta | Builder | Preview / publish | Yes (targets typed) | No | Yes → DB | Extend with family/stage refs |
| **Published session** | `hyrox_programme_sessions` | Athlete history | `prescription` jsonb (+ embedded `editConfig`), status, feedback | Publish | Athlete UI, analytics, CC | Yes | No | **Is** the snapshot | Never silently rewrite |
| **Prescription engine** | `hyroxPrescriptionEngine.ts` + contract | Resolve rule → number | `PrescriptionRule` → `PrescriptionSnapshot` | Not wired to builder yet | QA / future publish | Yes | Rules reusable | Snapshot on publish (intended) | Canonical for targets |
| **Run prescription (community)** | `app/lib/runPrescription.ts` | Community pace guides | Zones from tests | Runtime | Member dashboard | Yes | Logic reusable | Stored on community sessions | Keep **outside** `/athlete` 1-1 path |
| **Custom / scratch** | Builder “from scratch” | One-offs | `editConfig.kind: generic` + `customParts` | Coach | Same as draft | Yes | Optional | Yes | Keep forever |

---

## 2. Canonical workout model today (honest)

There is **no single structured interval AST**. Closest layers:

1. **Intent template** — `CoachLibraryEntry` / `HyroxSessionDefinition` (mostly free-text lines).
2. **Semi-structured editor** — `CoachSessionEditConfig` (reps, repDurationMinutes, recovery string, paces as strings, exercises as strings).
3. **Resolved athlete view** — prescription jsonb + display lines.
4. **Target formula** — `PrescriptionRule` (structured) — **engine exists; builder not wired** (operating model Batch 3).

### Flow

```
LIBRARY (CoachLibraryEntry / HyroxSessionDefinition)
  → BUILDER place / edit (CoachDraftSession + editConfig)
  → DRAFT WEEK (local / draft status)
  → PUBLISH (hyrox_programme_sessions.prescription jsonb snapshot)
  → ATHLETE VIEW (mapPublishedSessionsToAthleteUi)
  → COMPLETION (athlete_feedback; Batch 2 contract direction)
```

### Field classification

| Field | Structure |
| --- | --- |
| Library id, category, tags, hardDay, volumeMeta numbers | **STRUCTURED** |
| `editConfig.reps`, `repDurationMinutes`, `rounds`, `runDistanceM`, modality enums | **STRUCTURED** (partial) |
| `editConfig.recovery`, `targetPace`, `exercises`, `setsReps`, mainSet lines | **SEMI-STRUCTURED** / free text |
| warmup / mainSet / cooldown arrays | **FREE TEXT** |
| `PrescriptionRule` | **STRUCTURED** (not yet attached to most library rows) |
| Coach / athlete notes | **FREE TEXT** |
| Progression week strings (`week1`…`week4`) | **FREE TEXT** posing as progression |

---

## 3. Library content audit (counts)

### HYROX foundation (`sessionLibrary.ts`)

- **~36** `defineSession` templates.
- Categories (approx): run_development, tempo_aerobic_quality, erg_development, compromised_running, strength, testing (+ subcategories).
- Ability variants: beginner / intermediate / advanced / pro (mostly **volume/rest narrative**, not structured stages).
- Optional `progressionExamples` week1–4 **strings** on some sessions.

### Coach library (Programme Builder)

- **~153** entries across Data (76), Volume builders (21), HYROX-specific (35), Mini compromised (6), Batch (6), Hybrid engine (4), Kieran (5).
- **`progressionFamily` tagged:** concentrated in volume builders + HYROX-specific + hybrid (~60 tagged level rows; **~15 unique family ids**). Staples/Kieran/batch/mini largely **untagged**.
- Levels seen: level_1, level_2, level_3 (rare), advanced, deload — **level ≠ calendar week**, but also **≠ a full stage graph** yet (mostly parallel library cards).

### Classification (methodology buckets)

Eligible for families (high level):

| Bucket | Examples in library | Family-ready? |
| --- | --- | --- |
| Easy / long aerobic run | Easy Run, Long Easy | Yes (volume stages) |
| Threshold / tempo run | 6×6, 3×10, tempo | **Yes — top priority** |
| VO2 / 5K pace | 8×3 | Yes |
| Erg threshold / aerobic | Ski/Row intervals, Z2 bike | Yes |
| Compromised / HYROX | Mini test, wallballs, sled+burpee | Yes (specificity stages) |
| Volume builders / station EMOM | Sled, WB, lunges, carry | Partially tagged already |
| Strength | Heavy legs, single-leg | Yes (load/reps) with care |
| Testing / benchmarks | Parkrun, 2K erg, station tests | **One-off / non-family** |
| Race week specials | Race-week templates | **One-off** |
| Recovery / mobility | Easy flush, prehab | Usually non-family |

### Duplicates / near-duplicates

- Threshold **6×6** foundation vs coach **threshold** staples vs `thresholdBlockProgression` ladders vs `progressionFamilies.threshold_volume_a` — **same coaching idea, four encodings**.
- Compromised mini / wall-ball / sled families overlap between `sessionProgression.ts` and coach HYROX-specific cards.
- Easy aerobic appears in foundation + coach staples + programming family `easy_aerobic_run`.

### Naming / syntax inconsistency

Recovery examples found in free text:

- `90s easy jog between`
- `90s–2 min easy jog between`
- `75–90 sec`
- `2–3 min easy between reps`
- `120s` / `2 min walk` (in progression docs/examples)

Rep formats: `6×6 min`, `6 x 6 Minutes`, `5 x 5 min Threshold` — inconsistent separators and unit words.

**Must canonicalise before trusted auto-progression.**

### Objective clarity

- Clear: most threshold/erg/compromised tagged sessions.
- Unclear: some `generic` editConfig sessions; custom scratch; mixed “quality” without energy-system tag.
- Progression relationship obvious: threshold ladders, volume-builder level_1→2→3, compromised rounds progressions.
- Should **not** be families: tests, races, single technique diagnostics, one-off race-week sessions.

---

## 4. Workout syntax audit

| Concept | Current representation | Issue |
| --- | --- | --- |
| Repetitions | `editConfig.reps` **or** text `6×` | Dual |
| Work duration | `repDurationMinutes` **or** text | Dual |
| Work distance | `runDistanceM` / text km | Incomplete |
| Recovery duration | **string** (`recovery`, `restRecovery`) | Non-canonical |
| Recovery type | buried in string (“jog”, “walk”) | Not enum |
| Pace / split / watts | strings + future `PrescriptionRule` | Engine unused in builder |
| Strength load | free text / RPE string | No 1RM basis in Phase A engine |
| Stations | text / rounds + station fields | Partial |
| Warm-up / cool-down | string arrays | OK as prose |
| Coaching instructions | coachNote / coachNotes | Split athlete vs internal still pending Batch 3 |

**Canonicalisation minimum for families:** structured `{ reps, work: {kind: time|distance, value, unit}, recoveries: [{durationSec, type}], intensityRule?: PrescriptionRule }` with display strings **derived**.

---

## 5. Running prescription audit

| Objective | Current handling | Quality |
| --- | --- | --- |
| Easy / long Z2 | Text + pace zones from 5K (community) / coach typed target | OK narrative; 1-1 often manual |
| Steady / tempo | Mixed labels | Ambiguous vs threshold |
| Threshold | Best structured path (`thresholdBlockProgression` + editConfig threshold_run) | **Strongest** |
| VO2 / 5K | Library text @ 5k pace | Needs `run_5k_pace` rule |
| 10K | Mentioned in methodology; **not** in prescription Phase A bases | Gap |
| HYROX run | `hyrox_run_pace` basis exists | Needs wiring + activation |
| Race-specific | Ad hoc | Coach override |

**Performance Profile anchors used by engine:** 5K pace, threshold, HYROX run, ski 2K, row 2K, FTP.  
**Not in Phase A:** 10K, ski 1K, strength 1RM, estimated thresholds.

`runPrescription.ts` serves **community** paths — do not make it the 1-1 canonical resolver.

---

## 6. Erg / bike / strength

| Modality | Anchor today | Engine | Gap |
| --- | --- | --- | --- |
| SkiErg | `ski_2k_split` | Yes | Attach rules to stages |
| Row | `row_2k_split` | Yes | Same |
| Bike | `ftp_watts` % | Yes | HR-only sessions stay manual |
| Strength | Coach load / RPE text | **No** 1RM basis | Expand engine later or keep coach load |

---

## 7–8. Ambiguous / family candidates / one-offs (summary counts)

| Bucket | Approx |
| --- | --- |
| Coach library total | ~153 |
| High-confidence structured edit kinds (threshold/erg/compromised fields present) | ~40–60 (estimate; many still text-main) |
| Family-tagged coach rows | ~60 level cards / ~15 families |
| Foundation HYROX templates | ~36 |
| Ambiguous / dual-encoded threshold & compromised | High (see duplicates) |
| Clear one-offs (testing, race week, benchmarks) | ~15–25 |
| Family candidates not yet tagged (threshold staples, easy/long, VO2) | Significant |

Exact automated classification should be a dry-run script in a later batch — **not run as a mutating migration**.

---

## 9. Weaknesses (current)

1. **Three+ progression systems** with different semantics (week-tied vs level tags vs free-text examples).
2. **No structured interval AST** shared by library → builder → publish.
3. **Prescription engine unwired** — athlete-specific targets mostly typed strings.
4. **Stage ≡ week** in several modules — blocks progressive coaching reality (repeat / reduce mid-block).
5. **Syntax drift** in recovery and rep notation.
6. Community vs 1-1 libraries risk accidental cross-wiring.
7. DB `hyrox_session_library` unused as live SoT — code libraries dominate.

---

## 10. Safety note

Do not rewrite published `prescription` jsonb, completed feedback, or historical drafts when introducing families. Attach family/stage ids as **additive** metadata; backfill only via audited dry-run.
