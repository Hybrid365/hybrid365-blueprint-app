# Progressive programming — visual QA

**Pilot:** Threshold — 5 Minute Repeats  
**Environment:** `hybrid365-staging` only (`HYROX_ENV=staging`)  
**Flag:** `HYROX_SESSION_FAMILIES_ATHLETE_IDS` allow-list (not global `ENABLED=1`)

## Staging allow-list

```
HYROX_SESSION_FAMILIES_ATHLETE_IDS=77b9be0c-81c0-4209-902d-2330e33ae4f0,03bd3d0d-b3e8-44ed-8b30-a702c769ef2c
```

## Shot list

| File | Context |
| --- | --- |
| `01-builder-add-progression-1440.png` | Programme Builder with Add progression |
| `02-family-selection-1440.png` | Family selected — Threshold 5 Minute Repeats |
| `03-stage-selection-1440.png` | Starting stage list |
| `04-four-week-preview-1440.png` | Four-week proposal preview |
| `05-resolved-target-1440.png` | Resolved formula target |
| `06-coach-override-1440.png` | Coach override vs formula |
| `07-missing-anchor-1440.png` | Developing — Apply blocked |
| `08-generated-sessions-builder-1440.png` | Builder after apply |
| `09-live-copy-week-1440.png` | Live Copy Week → Block 2 W1 draft (7 sessions) |
| `10-live-auto-carry-1440.png` | Live Auto-Carry — family Stage 1 retained on next week |
| `11-unlink-dialog-1440.png` | Structural edit unlink confirmation |
| `12-change-stage-1440.png` | Change stage modal |
| `13-athlete-programme-family-390.png` | Athlete programme — **Threshold Intervals** (no stage leak) |
| `14-athlete-session-detail-390.png` | Athlete session detail — title safe, 5×5 + 3:55/km |
| `15-block-boundary-ui-1440.png` | Block 1 published / Block 2 draft; no auto-publish |
| `16-coach-vs-athlete-title-1440.png` | Coach stage badge vs athlete-safe title (composite / pair) |

## Slice 5 integrity notes

- Canonical week identity: `athlete_id + week_number` (see `docs/contracts/programme-week-identity.md`)
- Republish syncs + archives superseded published siblings (no hard delete)
- Athlete titles: `Threshold Intervals`; coach retains `Threshold 5 Minute Repeats · Stage N`

## Not in scope

Home D live, Track automation, feedback-informed progression, migration 022, new families.
