# Progressive programming — Slice 4 visual QA

**Pilot:** Threshold — 5 Minute Repeats  
**Environment:** `hybrid365-staging` only (`HYROX_ENV=staging`)  
**Flag:** `HYROX_SESSION_FAMILIES_ATHLETE_IDS` allow-list (not global `ENABLED=1`)

## Staging allow-list (this pass)

```
HYROX_SESSION_FAMILIES_ATHLETE_IDS=77b9be0c-81c0-4209-902d-2330e33ae4f0,03bd3d0d-b3e8-44ed-8b30-a702c769ef2c
```

- Demo Competitive — threshold anchor present (Case A–C, F–G, publish)
- Demo Developing — no threshold (Case D missing-anchor)
- Production remains OFF (no global enable; production env untouched)

## Shot list (coach desktop ~1440)

| File | Context |
| --- | --- |
| `01-builder-add-progression-1440.png` | Programme Builder with Add progression |
| `02-family-selection-1440.png` | Family selected — Threshold 5 Minute Repeats |
| `03-stage-selection-1440.png` | Starting stage list S1–S4 / Consol / Deload |
| `04-four-week-preview-1440.png` | WEEK · DAY · STAGE · STRUCTURE · TARGET |
| `05-resolved-target-1440.png` | Anchor 3:50 → formula 3:55 |
| `06-coach-override-1440.png` | Override 3:52 shown with RULE + formula 3:55 |
| `07-missing-anchor-1440.png` | Developing — Apply blocked, no silent estimate |
| `08-generated-sessions-builder-1440.png` | Builder after apply (schedule / toolbar context) |
| `12-change-stage-1440.png` | Change stage modal — PROGRESS / REPEAT / DELOAD / SKIP_TO |

## Cases exercised on staging

- **A** — 4-week proposal S1→S2→S3→Consol; applied Wed AM with resolved 3:55
- **B** — Week 3 manually set to Stage 2 before Apply → stored S1,S2,S2,Consol
- **C** — Override UI shows coach override ≠ formula
- **D** — Developing missing threshold blocks Apply
- **E** — Domain QA: structural unlink vs note retain (browser unlink dialog not re-shot)
- **F/G** — Domain + copy/auto-carry helpers: same stage, re-resolve, no auto-progress
- **Publish** — Week 1 republished; `prescription.sessionFamily` snapshot present
- **Block boundary** — ensure-weeks created Block 2 weeks 5–7; `current_week` unchanged

## Not redesigned

Athlete session UI, Track automation, feedback-informed progression, additional families, migration 022.
