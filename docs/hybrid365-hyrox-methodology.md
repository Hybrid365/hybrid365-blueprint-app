# Hybrid365 Hyrox Team — Programming Methodology

This document defines the coaching philosophy behind Hybrid365 Hyrox programming. It is the source of truth for the Hyrox session library (`src/lib/hyrox/sessionLibrary.ts`), pace prescription (`paceCalculator.ts`), athlete classification, weekly structures, and future programme generation rules.

---

## Core philosophy

> **Build the engine with controlled threshold and aerobic volume, use ergs and bike to add fitness without unnecessary impact, layer in Hyrox specificity closer to race day, and make every station session improve the athlete's ability to run again under fatigue.**

Hyrox is a hybrid endurance event. The programme is not “more running” or “more CrossFit.” It is a sequenced build of:

1. **Aerobic and threshold engine** (run + erg + bike)
2. **Station durability and strength** (sled, lunges, wall balls, carries)
3. **Compromised running** (running well *after* station work)
4. **Race specificity** (density, pacing, transitions) as the event approaches

Every week should answer: *Did we improve sustainable output without breaking recovery?*

---

## Coaching principles

1. **Alternate easy and hard days** where possible — protect tendons, calves, and nervous system.
2. **Monitor threshold minutes weekly** — run and erg threshold count toward the same progression budget.
3. **Use SkiErg, RowErg and bike** to add threshold/Z2 volume when extra running would add impact cost.
4. **Increase Hyrox specificity closer to race day** — base and engine early; compromised and race-pace late.
5. **Keep key session methods consistent** — scale volume, load, rest and complexity by ability, not the purpose of the session.
6. **Prescribe from data** — 5km, 10km and station benchmarks drive paces, watts, loads and progressions.
7. **Compromised sessions must train “run again”** — if the athlete cannot run with rhythm after stations, the session failed its purpose.
8. **Strength supports the race** — durability for stations and injury resilience, not maximal bodybuilding volume.

---

## Hard / easy structure

| Day type | Examples | RPE |
|----------|----------|-----|
| **Hard** | Threshold run, erg threshold, compromised builder, heavy legs | 7–9 |
| **Easy** | Easy run, bike Z2, mixed erg aerobic, recovery flush | 3–5 |
| **Moderate** | Upper strength (non-failure), long easy aerobic | 5–6 |
| **Rest** | Full rest or mobility only | — |

**Rules:**

- Beginners: max **2** hard days per week.
- Intermediates: **2–3** hard days with easy/erg between.
- Advanced: **3–4** hard exposures if recovery is green; doubles only for **Z2 erg/bike** PM sessions.
- Never stack: threshold run → heavy legs → full compromised on consecutive days (especially for running-limited athletes).

---

## Threshold progression

**What counts as threshold**

- Run intervals at ~threshold pace (e.g. 6×6 min, 3×10 min)
- Ski/Row 4-min reps at threshold watts/500m
- Controlled “steady-hard” blocks that stay below 5k pace

**Progression**

- Track **total threshold minutes per week** (run + erg).
- Progress **5–10%** weekly when sleep, soreness and RPE are stable for 2 weeks.
- If running tolerance is yellow, **substitute erg threshold** before adding run intervals.
- Near race (4–2 weeks out): maintain intensity, **reduce volume** — do not chase new threshold PRs in the gym.

---

## Z2 / erg / bike logic

**Purpose:** Build the engine without cumulative impact damage.

| Tool | Use when |
|------|----------|
| **Easy run** | Athlete tolerates volume; skill and impact needed |
| **Bike Z2** | Running-limited, poor recovery, double-day PM slot |
| **Mixed Ski/Row Z2** | Easy day substitute; weather/indoor constraints |
| **Erg threshold** | Extra threshold minutes without another hard run |

**Guideline:** When weekly run km is capped, **do not** silently replace all aerobic work with rest — replace with erg/bike Z2 so the engine still moves forward.

---

## Hyrox specificity by race timeline

| Phase | Weeks out | Emphasis | De-emphasis |
|-------|-----------|----------|-------------|
| **Far** | 12–9 | Easy volume, threshold, strength base, benchmarks | Full race sims, extreme compromised density |
| **Mid** | 8–5 | Compromised builders, station strength, threshold progression | Max testing weeks, strength PR chasing |
| **Near** | 4–2 | Race-pace runs, compromised density, transitions | New max lifts, volume spikes |
| **Race week** | 1 | Mobility, sharpness, fuelling, checklist | Heavy threshold, long sessions |

**Specificity definition:** Sessions that pair **station work → run** at race-relevant loads and rhythms, plus race-pace running repeats.

---

## Athlete types

Classification IDs used in code (`athleteClassification.ts`):

| ID | Description |
|----|-------------|
| `beginner_foundation` | New to structured Hyrox — conservative spacing, technique, Z2 bias |
| `running_limited` | Engine/run durability limiter — threshold, easy frequency, long aerobic |
| `station_limited` | Stations break down — sled, WB, lunges, erg threshold |
| `strength_dominant_run_limited` | Strong gym, weak run — run priority over extra strength |
| `runner_dominant_station_limited` | Runs well fresh, fades after stations — compromised + station work |
| `balanced_intermediate` | No single dominant limiter — even hybrid distribution |
| `advanced_competitive` | High training age — density, doubles, race sims |
| `high_output_poor_recovery` | Trains hard but accumulates fatigue — fewer hard days, more Z2 erg/bike |

---

## Weekly structure examples

### Beginner — 4 days

- Mon: Lower strength + prehab  
- Tue: Threshold or tempo (short)  
- Wed: Bike/erg Z2  
- Thu: Short compromised builder  
- Sat: Long easy run or erg aerobic  
- Sun: Recovery / mobility  

### Intermediate — 5 days

- Mon: Lower strength  
- Tue: Threshold run  
- Wed: Easy run  
- Thu: Compromised builder  
- Fri: Erg Z2  
- Sat: Long aerobic  
- Sun: Recovery  

### Advanced — 6 days

- Mon: Upper strength  
- Tue: Threshold run  
- Wed: Erg threshold  
- Thu: Compromised  
- Fri: Easy run  
- Sat: Long aerobic  
- Sun: Recovery (optional bike flush)  

### Pro — 6–7 days

- As advanced, with optional **PM Z2 double** on easy days only  
- Compromised density and race-pace work increase in final 4–6 weeks  

Templates are codified in `weeklyStructureRules.ts`.

---

## How 5km / 10km / testing informs prescription

### Running

- **5km time** → primary anchor for **5k pace**, **interval/VO2**, and **threshold** run prescriptions (`paceCalculator.ts`).
- **10km time** → refines **steady** and **threshold** when both benchmarks exist.
- **Hyrox race run pace** → estimated from 5k (+ ability multiplier) — slower than 5k pace due to fatigue.

### Ergs

- **1km Ski / 1km Row tests** → threshold watts or /500m targets for erg intervals.
- Retest every **4–6 weeks** in build phases.

### Stations

- **Wall ball, sled, lunge, farmer benchmarks** → loads, rep targets and compromised session scaling.
- **Mini Hyrox compromised test** → anchors “run after stations” pacing.

### Weekly check-in

- Sleep, soreness, pain, bodyweight → adjust **hard-day count** and **run vs erg ratio** for the following week.

All pace outputs are **coaching estimates** — RPE, terrain and fatigue still govern on the day.

---

## Session scaling principles

Each session in the library includes **beginner / intermediate / advanced / pro** variants.

| Scale lever | Beginner | Pro |
|-----------|----------|-----|
| Volume | Fewer reps, shorter intervals | Full prescribed density |
| Intensity | Lower pace/load, wider rest | Race load, minimal rest |
| Complexity | Fewer stations per block | Full race simulation |
| Rest | Longer between work bouts | Short, controlled |

**Non-negotiable:** The **training benefit** stays the same (e.g. threshold is still threshold; compromised still ends with a run that matters).

---

## Session library categories

| Category | Role |
|----------|------|
| `run_development` | Engine, threshold, race-pace running |
| `erg_development` | Low-impact threshold and Z2 |
| `compromised_running` | Station → run, race rhythm |
| `strength` | Durability, sled support, prehab |
| `testing` | Benchmarks for prescription updates |

See `sessionLibrary.ts` for full definitions (32 initial sessions).

---

## How this guides the app

1. **Session library** — canonical session templates with variants; programme generator picks IDs, not ad-hoc text.
2. **Pace calculator** — turns 5k/10k into zones for UI and plan JSON.
3. **Classification** — routes athletes to structure templates and rule sets.
4. **Weekly structures** — day-role slots (hard run, erg Z2, compromised, etc.).
5. **Programme rules** — must/should/may logic for session category emphasis by limiter and race timeline.

**Not in scope yet:** UI wiring, Supabase persistence, or automatic week generation — this foundation is intentionally data-first.

---

## Extended coaching model (v2)

### Block and phase progression

- **Phase 1 / Block 1:** Build aerobic base, load tolerance and ability to cope with training **before** rushing threshold volume.
- **Volume first:** Gradually progress total weekly volume; then swap some easy volume toward more threshold work.
- **Later phases:** More intensity above race pace, faster running, then more Hyrox-specific compromised work near race day.
- **Week 4 deload:** Each 4-week block ends with ~10–20% volume reduction while **keeping rhythm** and session types.

### Hard / easy — avoid grey zone

Easy and hard must be **obvious**. Classification uses:

- Time at threshold HR / RPE  
- Muscular fatigue and impact load  
- Whether the session impairs next-day recovery  

**Weekly rhythm (when calendar allows):**

- **Sunday:** Longer-duration aerobic (Z2, run or erg/bike)  
- **Monday:** Recovery-leaning aerobic + upper strength  

### Double session progression ladder

1. Double **aerobic** (easy run + bike Z2)  
2. **Threshold run** + easy aerobic PM  
3. **Threshold run** + SkiErg/RowErg threshold PM (lower-end run threshold)  

Never jump straight to double-threshold. Readiness = prior weeks’ volume, check-ins, sleep, niggles (HRV/RHR if tracked).

### Running, pace and environment

- 5km + 10km → easy, steady, threshold, 10km, 5km, Hyrox race paces. **5km only** → estimate 10km (`estimate10kSecondsFrom5k`).  
- **Pace + HR/RPE:** If threshold pace pushes HR too high when fatigued, **slow down**.  
- Hyrox threshold: **longer reps / less rest before more speed**.  
- Treadmill: **1% incline** default (calf/Achilles exceptions).  
- **Outdoor/track** for key runs where possible.  
- Advanced: **~40–50 km/week run**; extra work via erg/bike.

### Aerobic and erg

- Ergs/bike protect **run quality** while building volume.  
- **12–15+ h/week:** easy work can be more Z1/low Z2.  
- **Time-restricted:** purposeful higher Z2, not grey-zone junk.  
- Erg threshold ~**5s faster than race pace** — still HR/RPE governed.

### Station weakness personalisation

Assessment weaknesses **directly change** programming:

| Weakness | Action |
|----------|--------|
| Wall balls | WB EMOM add-ons → WB under fatigue |
| Sled | Extra sled in leg sessions, frequent exposure |
| Burpees | Rhythm volume → fatigued burpees |
| Multiple | **Rotate focus** across 4-week block |

See `stationPersonalisation.ts`.

### Strength (Hyrox-specific)

- **Leg endurance** > max strength for most athletes.  
- Tempo squats/hack squats, higher reps, breathing, RDLs, lunges, quad/calf.  
- **Grip:** holds **heavier than race weight** where safe.  
- Avoid DOMS that ruins threshold or compromised runs.

### Recovery and check-ins

Poor sleep/recovery → less threshold, swap hard for easy aerobic, suggest **HRV/RHR** monitoring. Future dashboard: **interactive session swaps** from check-in data.

### Bodyweight

Support **lean, fast, performance** goals — lean up, maintain or build muscle as appropriate. **No fat loss that harms key sessions.**

### Session library progression

- Same key sessions within a **4-week block** with weekly progression (`sessionProgression.ts`).  
- Scale volume, intensity, load, rest — **same benefit** per level.  
- Enriched sessions: film prompts, prescription rationale (`sessionLibraryEnrichments.ts`).

### Dashboard and documentation

- Show **focuses, targets, key sessions**, why sessions were chosen from assessment/testing.  
- Prompt: **“Film this set for feedback”** on key station/movement work.  
- Encourage documentation for accountability, Telegram coaching and social proof.

---

## Related code

| File | Purpose |
|------|---------|
| `src/lib/hyrox/methodology.ts` | Structured `HYROX_METHODOLOGY` export |
| `src/lib/hyrox/sessionLibrary.ts` | Session templates |
| `src/lib/hyrox/paceCalculator.ts` | Pace zones from benchmarks |
| `src/lib/hyrox/athleteClassification.ts` | Athlete typing |
| `src/lib/hyrox/weeklyStructureRules.ts` | Weekly templates |
| `src/lib/hyrox/programmeRules.ts` | Selection rules |
| `src/lib/hyrox/sessionProgression.ts` | 4-week progression templates |
| `src/lib/hyrox/stationPersonalisation.ts` | Weakness-driven programming |
| `src/lib/hyrox/sessionLibraryEnrichments.ts` | Film prompts, rationale, enrichments |

---

*Hybrid365 Hyrox Team — internal coaching methodology v2. Refine formulas and thresholds with field data and coach review.*
