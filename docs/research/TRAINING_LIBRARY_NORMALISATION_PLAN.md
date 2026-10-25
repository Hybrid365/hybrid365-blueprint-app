# Training library normalisation plan

**Status:** Proposed dry-run plan. **Do not mutate records** until a named engineering batch + human approval.

Companion: `TRAINING_LIBRARY_AUDIT.md`, `PROGRESSIVE_PROGRAMMING_ARCHITECTURE.md`.

---

## Goals

1. Canonical workout syntax for family-eligible sessions.
2. Map existing coach + foundation library rows without rewriting published programmes.
3. Attach objectives, prescription rules, and SessionFamily stages.
4. Leave incompatible / ambiguous rows untouched until coach review.

---

## Phases

### A. Define canonical syntax

Freeze in a future contract `docs/contracts/session-family.md` (not written yet):

- `StructuredWorkout` AST
- `Recovery.type` enum — **decided:** `walk` · `jog` · `easy_move` · `passive`
- duration always `durationSec` internally; display derived
- `PrescriptionRule` attachment per intensity slot
- Stage id ≠ week number
- Strength stages may encode structure; **no %1RM automation in progression v1** (coach loads authoritative)

See **Decided product constraints** in `PROGRESSIVE_PROGRAMMING_ARCHITECTURE.md`.

### B. Map existing library records (read-only)

Script (future): emit CSV/JSON report of every `CoachLibraryEntry` + foundation `HyroxSessionDefinition`:

- id, name, category, tags
- parse confidence for reps/work/recovery
- suggested modality + objective
- suggested family id / stage
- duplicate cluster id

**No writes.**

### C. Auto-classify high-confidence

Auto-tag only when:

- `editConfig` already has reps + repDurationMinutes, **or**
- mainSet matches a strict regex for `N×M min` + recovery, **and**
- category ∈ threshold / erg / volume_builder / compromised

Attach **additive** metadata in code (or draft DB columns) — never rewrite `prescription` history.

### D. Human review ambiguous

Queue for Kieran (methodology review of mapping output only — product decisions below already closed):

- near-duplicate threshold encodings → **alias/map** to canonical Threshold 5-min family; preserve history; no destructive delete
- tempo vs threshold → **separate families** (decided); do not merge tempo into threshold stages
- HYROX mixed multi-target
- strength progressions (structure OK; loads stay coach-selected in v1)
- anything parse confidence &lt; high

### E. Attach objectives / tags

Normalise tags to a controlled vocab (modality, energy system, specificity). Keep free tags as secondary.

### F. Attach prescription rules

For each family stage primary intensity: set `PrescriptionRule` from methodology defaults (e.g. threshold → `threshold_pace` + identity or +5s). Coach can override per athlete at draft time.

### G. Group into SessionFamily

Priority order:

1. **Threshold 5-minute repeats** (pilot — map foundation + coach + thresholdBlockProgression via alias; code-first family definition)
2. Tempo (separate family from threshold — not in pilot merge)
3. Volume builders (already family-tagged)
4. Compromised running
5. Erg threshold / aerobic
6. Easy / long aerobic ladders
7. Strength endurance structure ladders (no %1RM resolve in v1)

### H. Define progression stages + transitions

For each family: stages with structured workouts; default linear edges; deload + consolidation; optional REDUCE edge.

### I. QA

- Same athlete two stages → different structure, same rule basis
- Missing anchor → publish blocked unless override
- Copy Week does not advance stage
- Published snapshots unchanged when library stage edits
- Preview vs publish parity

---

## Approximate inventory (from audit)

| Set | Count |
| --- | --- |
| Coach library entries | ~153 |
| Foundation HYROX templates | ~36 |
| Unique programming family ids (tagged) | ~15 |
| Community progression families (separate) | ~19 |
| HYROX string progressions | 8 |
| High-confidence auto-map candidates | ~40–60 (estimate) |
| Ambiguous / dual-encoded | High for threshold & compromised |
| Clear one-offs | ~15–25 |

Re-count with the dry-run script before any conversion batch.

---

## Migration strategy (conceptual)

1. **Audit** (this doc + script report)
2. **Dry-run mapping** checked into `docs/research/` or CI artifact
3. **Classify** high / medium / low confidence
4. **Ambiguous review** by Kieran
5. **Convert compatible library code** (additive SessionFamily module; map old ids)
6. **Leave incompatible untouched** (still placeable as today)
7. **Rollback:** feature flag off; families unread; builder uses legacy library only

**Never** batch-update `hyrox_programme_sessions.prescription` for historical weeks.

Optional later DB: `hyrox_session_families` tables — only after code library proves out. `022` remains unrelated/unapplied.

---

## Dependencies

| Depends on | Why |
| --- | --- |
| Prescription engine wired in builder (Batch 3) | Athlete-specific resolve in preview/publish |
| Session execution fields (Batch 2 direction) | Feedback → PROGRESS/REPEAT/REDUCE later |
| Decided constraints in architecture doc | Closed; do not re-open in implementation without human change |

---

## Explicit non-goals for normalisation v1

- Rewriting community Hybrid75 library
- Auto-advancing stages on athlete complete (1-1)
- Hardcoding week 4 (or any week index) as deload
- %1RM prescription automation
- Admin Session Family authoring UI
- Track automated progression writers (until Track gates)
- Destructive deletion / rewrite of published or completed history
- LLM parsing of mainSet as SoT
- Applying SQL in the same task that authors it
