# Real 1-1 coach dry-run (staging)

**Athlete:** Demo Competitive `77b9be0c-81c0-4209-902d-2330e33ae4f0`  
**Env:** `HYROX_ENV=staging` only

## Flags (athlete allow-list only — no globals)

```
HYROX_SESSION_FAMILIES_ATHLETE_IDS=77b9be0c-81c0-4209-902d-2330e33ae4f0,...
HYROX_WEEK_COMPOSER_ATHLETE_IDS=77b9be0c-81c0-4209-902d-2330e33ae4f0
HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS=77b9be0c-81c0-4209-902d-2330e33ae4f0
```

Do not set `*_ENABLED=1` globally.

## Harness

```bash
HYROX_ENV=staging npx tsx scripts/qa-hyrox-coach-dry-run-staging.ts
```

Mutates staging Demo Competitive only. Restores `current_week` snapshot at end.
