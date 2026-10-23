# Hybrid365 agent guide

Read `docs/HYBRID365_PLATFORM_BLUEPRINT.md` before changing product behaviour.

## What this repo is

Next.js app for Hybrid365. Production is `https://plan.hybrid-365.com`.

HYROX 1-1 lives under `/athlete` and `/admin/hyrox-athletes`, with `hyrox_*` tables. Community, free week, and Hybrid75 use other routes (`/dashboard`, `/plan`, `/free-week`, `/hybrid75`) and other tables. Do not reuse a community write path for a 1-1 athlete.

## What must keep working

- Middleware auth, including the admin timeout guard
- Copy Week and Auto-Carry
- Block 4+ programme ranges
- Draft versus publish
- Athlete session logging
- Weekly check-ins
- Coach preview as read-only
- Payment confirmation and onboarding
- Athlete-facing copy: internal `coach_note` never falls back into athlete payloads
- Placeholder pages must not present mock figures as real athlete data

## Product invariants

1. Athlete history is not silently overwritten.
2. Published programme targets are immutable snapshots.
3. In 1-1, the coach has final authority.
4. An athlete-submitted benchmark does not become the programming anchor by itself.
5. Missing data stays missing.
6. Demo data never appears as a real production athlete.
7. Internal coach notes never reach the athlete.
8. Preview mode is read-only.
9. Dynamic prescriptions must be deterministic and explainable.
10. Track automation reuses the 1-1 performance and prescription engine.

## Branch and worktree rules

- Start from current `origin/main` unless the task names another base.
- Use a new worktree and branch. Do not reuse UX-lab, old Phase 1, Copy Week, Auto-Carry, or hardening worktrees.
- Do not switch another worktree's branch to "get it out of the way".
- One agent does not merge its own branch to `main` or deploy production.
- Do not commit secrets. `.env*` stays local. `.env.example` is names only.

## Migrations

- Add SQL under `supabase/migrations/`. Do not apply it to production in the same task unless the human explicitly says to.
- App deploy does not run migrations.
- Prefer a new append-only table over changing a unique key that currently overwrites history.
- Ship the migration file, RLS, rollback, and backfill rules. Stop for approval before production SQL.
- `017_hyrox_daily_readiness.sql` stays unapplied until a separate readiness rollout says otherwise.

## Athlete data and flags

- Do not mutate real athlete rows, logs, or programmes while testing.
- Signed-out checks and pure unit scripts are the default QA.
- Flags default off: `HYROX_HOME_V2_*`, `HYROX_TODAY_V2_*`, `HYROX_PERFORMANCE_HUB_*`.
- Performance Profile will use `HYROX_PERFORMANCE_PROFILE_*` the same way. Leave it off in production until rollout.
- Development `*_DEV_ALL=1` is local only.

## Multi-agent workflow

Large work is split after a contract exists.

1. **Coordinator** writes the contract in `docs/contracts/` and names the invariants.
2. **Data / API** implements the contract and publishes types. No UI polish.
3. **Athlete UI** and **Coach admin UI** build against that contract in separate worktrees.
4. **Visual** changes presentation only, after the data contract is stable.
5. **QA** runs `npm run qa:hyrox-all` plus the feature script and tries to break auth, preview, and history.

Parallel UI work waits until the contract's inputs, outputs, and error states are written down. Agents do not invent a second shape for the same concept.

Suggested order for a feature: contract → schema (unapplied) → server resolver → coach tools → athlete UI behind a flag → QA → human merge.

## Merge and deploy

```
feature work
→ isolated worktree
→ local QA
→ coordinator / human review
→ integration branch only if several branches must meet
→ final QA
→ human approval
→ merge to main
→ deploy the app
→ production smoke, no athlete-data writes
```

No agent applies a production migration or enables a global feature flag without that approval in the task itself.

## QA

From the repo root:

| Command | Covers |
| --- | --- |
| `npm run qa:hyrox-core` | Middleware timeout, coach preview |
| `npm run qa:hyrox-programme` | Block 4+, Copy Week, Auto-Carry |
| `npm run qa:hyrox-athlete` | Home V2 flag behaviour, Performance Hub flag behaviour |
| `npm run qa:hyrox-auth` | Middleware access and preview mutation block |
| `npm run qa:hyrox-data` | Today readiness and Performance Hub calculations |
| `npm run qa:hyrox-all` | Each of the above once, with a pass/fail summary |

`qa:hyrox-data` should gain `scripts/qa-hyrox-benchmarks.ts` when Performance Profile Phase 1 merges. Do not copy that unmerged script sideways.

There is no separate athlete-login integration script yet. Auth QA is the middleware and preview scripts. Add a real auth script when staging Supabase exists.

## Roles

| Agent | Owns | Must not |
| --- | --- | --- |
| Performance data | Tests, benchmark history, normalized values, active anchors, approval | Invent a metric or auto-activate an athlete submission |
| Prescription engine | Formula parse, offsets, FTP %, strength %, overrides, snapshots | Rewrite a published target because an anchor changed |
| Session library | Templates, categories, search, dynamic-target sessions | Remove coach edit or custom sessions |
| Athlete product | Home, programme, performance, progress, feedback, profile, session detail | Show mock data as live data |
| Coach admin | Command centre, programming, approvals, attention, weekly review | Optimise for marketing layout over speed |
| Analytics | Mileage, hours, completion, RPE, session-RPE, modality, trends | Hide a formula inside a single opaque score |
| Race intelligence | Race records, splits, stations, limiters, race week | Fake scientific scores |
| Integrations | Strava first, then wearables, matching, pace/HR/power | Couple `hyrox_*` tables to one vendor |
| Track automation | Self-serve programme choice and rule-based adaptation | Fork a second benchmark or formula engine |
| Athlete experience | Visual system, motion, charts, empty states | Change data meaning or status rules |
| QA / security | Auth, RLS, isolation, preview, history, migrations, smoke tests | Ship the feature it is reviewing |

The experience agent works on top of an approved contract. It does not rename statuses or fill missing numbers.

## Where to read next

- Coaching platform constitution: `docs/HYBRID365_COACHING_PLATFORM.md`
- Staging and demo athletes: `docs/HYBRID365_STAGING.md`
- Visual language: `docs/HYBRID365_VISUAL_SYSTEM.md`
- Performance Profile contract: `docs/contracts/performance-profile.md`
- Prescription contract: `docs/contracts/prescription-engine.md`
