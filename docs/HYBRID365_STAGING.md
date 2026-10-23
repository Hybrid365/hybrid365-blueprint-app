# Staging Supabase and environments

Staging project: `hybrid365-staging`, `https://uluapwqohujavhlpucta.supabase.co`. Production (`uuqdgbsntdjhojjkjkgd`) is never written by any script here.

## Runbook

All commands run from the repo root. Each one refuses unless `HYROX_ENV=staging`, `NEXT_PUBLIC_SUPABASE_URL` is exactly the staging project, it is not `HYROX_PRODUCTION_SUPABASE_URL`, and (for database commands) `HYROX_STAGING_DATABASE_URL` resolves to the staging project ref.

### Local `.env.local`

```
HYROX_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://uluapwqohujavhlpucta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # staging publishable key, sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=            # staging secret key, sb_secret_... (or legacy service_role eyJ...)
HYROX_PRODUCTION_SUPABASE_URL=https://uuqdgbsntdjhojjkjkgd.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
HYROX_STAGING_DATABASE_URL=           # staging Connect -> Session pooler URL, with DB password
```

### Schema

The migration chain does not create the base tables it depends on (`profiles`, `memberships`, `programme_instances`, `programme_weeks`, `athlete_assessments`, `weekly_check_ins`, and others made in the production dashboard). Staging therefore gets a structure-only baseline read from production.

1. Put the production pooler URL in `.env.production-schema-read` as `HYROX_PRODUCTION_SCHEMA_READ_URL=...`. That file is untracked and is the only place the script reads it from.
2. `npm run staging:schema:read-production`. Reads `pg_catalog` in a `READ ONLY` transaction. No rows. Writes `supabase/staging/baseline-pre.sql`, `baseline-post.sql`, `production-schema-snapshot.json`.
3. Delete `.env.production-schema-read`. Review the baseline files.
4. `npm run staging:schema:apply` (dry run), then `npm run staging:schema:apply -- --apply`. Order: `baseline-pre.sql`, migrations `001`..`021`, `baseline-post.sql`, `api-role-grants.sql`. The last file restores the classic Supabase grants to `anon`, `authenticated` and `service_role`; the staging project hides new tables from those roles by default, production does not. Anything above `021` (for example `022`) is refused. `021` (Performance Profile benchmarks) is allowed on staging only; it is not applied to production. Each file runs in its own transaction and is recorded with its sha256 in `hybrid365_staging.applied_files`; a changed file is refused rather than re-run.
5. `npm run staging:schema:compare`. Read-only drift report against the production snapshot. `hyrox_daily_readiness` (017) is expected as staging-only until production applies it.

The two `002_*` files share a version number. Supabase CLI history would reject that, so staging uses its own history table instead of `supabase db push`.

### Demo athletes

```
npm run staging:seed                         # dry run
npm run staging:seed -- --apply              # create or refresh
npm run staging:seed -- --reset              # delete every @staging.hybrid365.local user and athlete row
npm run staging:seed -- --login demo-competitive
```

`--login` prints a one-time `http://localhost:3000/auth/callback?...&token_hash=...` link. No email is sent. `demo-coach` signs in to `/admin/hyrox-athletes`; add `demo-coach@staging.hybrid365.local` to `HYROX_COACH_EMAILS` in `.env.local` if the coach gate needs the allowlist.

Seeded on main: auth user, profile role, `hyrox_athletes` row, submitted 5K / SkiErg / RowErg tests (pace and 500 m split derived from the stored time; RPE and splits left empty), and the race as `hyrox_race_results` history. FTP, threshold pace, and historical benchmark rows wait for the Performance Profile schema.

### Supabase Auth (staging dashboard)

Manual. Not set by any script, and not needed for `--login` links. In the `hybrid365-staging` project only (never production), open Authentication -> URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`
  - `https://*-vr4sq6hwsv-8436s-projects.vercel.app/**` (Vercel Preview)

The app sends `/auth/callback?portal=athlete&next=/athlete/dashboard` and `/auth/callback?portal=community&next=/dashboard`; the `**` entries cover the query strings. Email OTP to `@staging.hybrid365.local` cannot be delivered, so use `--login` for demo users.

### Vercel Preview

Not done yet. Previews still read production. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are single variables targeting both Preview and Production, so separating them edits records Production uses. Do it by hand in Vercel -> project `project-ih4h1` -> Settings -> Environment Variables:

1. For each of the three variables: open the row menu -> Edit, untick **Preview** only, leave **Production** ticked and the value untouched, Save.
2. Add Environment Variable, environment **Preview** only, for each:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://uluapwqohujavhlpucta.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = staging publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = staging secret key (mark Sensitive)
   - `HYROX_ENV` = `staging`
   - `HYROX_PRODUCTION_SUPABASE_URL` = `https://uuqdgbsntdjhojjkjkgd.supabase.co`
3. Re-open Production's three variables and confirm they still show Production with the original values.
4. Redeploy one preview. It should show the STAGING badge. A red `PRODUCTION DATA` badge means Preview still reads production.
5. Add the Preview redirect URL to the staging Auth settings above if not already there.

Never set `HYROX_STAGING_DATABASE_URL` on Vercel.

### Known production schema drift

Found by `npm run staging:schema:compare` on 2026-10-21. Recorded only; nothing has been applied to production.

- Production has no `hyrox_admin_preview_events`, so `018_hyrox_admin_preview_audit.sql` was never applied there. `app/lib/hyroxAdminPreviewAudit.ts` inserts into it.
- Production `hyrox_applications.raw_payload` is `jsonb` nullable with no default. `003_hyrox_applications_raw_payload.sql` declares `not null default '{}'::jsonb`. Staging follows the migration.
- `hyrox_daily_readiness` (017) is staging-only by design.

Fixing either production item needs its own approved migration task.

### Environment badge

`app/components/EnvironmentBadge.tsx` renders a tab at the top centre from the root layout: `STAGING` when `HYROX_ENV=staging`, `PREVIEW` on Vercel Preview, `PRODUCTION DATA` (red) when a local or preview build reads the production project. Hidden when `VERCEL_ENV=production`.

## Design

## Problem

Local `.env.local` has been aimed at the production Supabase project. A migration, seed, or service-role script run from a laptop can change real athletes.

## Target

One Supabase project for production and a second project for staging.

| | Production | Staging |
| --- | --- | --- |
| Name | Existing production project | `hybrid365-staging` |
| Used by | Vercel Production for `plan.hybrid-365.com` | Local default and Vercel Preview |
| Service role | Vercel Production and an explicit production command | Local and Preview only |
| Data | Real athletes | Disposable demo athletes |

Staging must be able to reset. Production must not.

## Env files

Next.js loads `.env.local` for `next dev` and `next build` on a laptop. Vercel injects its own env per environment. Do not commit any of these files.

| File | Committed | Purpose |
| --- | --- | --- |
| `.env.example` | Yes | Names only |
| `.env.local` | No | Staging URL and staging service role. This is the default local file. |
| `.env.production.local` | No | Production URL and keys. Used only with an explicit command. Next will also load this for `next build` locally, so do not keep it in the worktree during ordinary builds. |
| Vercel Production | Hosted | Production project |
| Vercel Preview | Hosted | Staging project |

Recommended local habit:

1. `.env.local` points at staging.
2. Production keys live in a password manager or Vercel, not in the default local file.
3. A script refuses to seed or migrate unless `HYROX_ENV=staging` and `NEXT_PUBLIC_SUPABASE_URL` is not the production URL.

`scripts/staging/lib/stagingGuard.mjs` implements that refusal for every staging script. `npm run qa:hybrid365-staging` covers it.

## Cutover

1. Create the empty staging project in the Supabase dashboard.
2. Apply the schema with the runbook above. `017` and `021` are allowed on staging; `022` is not.
3. Copy `.env.example` to `.env.local` and fill staging values.
4. Remove the production service role from the shared local env file.
5. Set Vercel Preview to the staging project. Leave Vercel Production unchanged.
6. Run `npm run qa:hyrox-all` against code, then a staging smoke (create athlete, publish, log, delete).

Until step 4, treat every local service-role script as production-dangerous.

## What staging is for

- Apply and roll back migrations
- Test RLS with a real staging auth user
- Accept an application and confirm a fake payment
- Onboard, submit tests, publish a programme, log a session, submit a check-in
- Reset demo athletes

## What staging is not for

- Production smoke of `plan.hybrid-365.com`
- Copying the production database into a laptop file
- Trying a destructive SQL statement "just to see"

## Demo athletes

Deterministic fixtures live in `scripts/staging/hyrox-demo-athletes.json`.

| Id | Profile | 5K | Ergs | HYROX |
| --- | --- | --- | --- | --- |
| `demo-developing` | Newer athlete | about 22:00 | Moderate | No active race anchor |
| `demo-competitive` | Racing athlete | about 18:00 | Strong | Sub-65 history, not auto-active |
| `demo-high-performance` | High performance | about 16:30 | Strong | Sub-60 history, not auto-active |

Each fixture should eventually include an auth user, assessment, testing rows, benchmark history, one published week, logged sessions with RPE, a check-in, and one race result. Active anchors are explicit. The race is history unless the fixture says `active: true`.

Seed only after staging exists, `HYROX_ENV=staging`, and the URL guard passes. Do not seed production.

## Variable classes

See `.env.example`.

- **Public:** `NEXT_PUBLIC_*`. These ship to the browser. Never put a service role here.
- **Server-only:** service role, signing secret, coach email lists, webhook secrets.
- **Staging-specific:** staging URL, staging anon key, staging service role, `HYROX_ENV=staging`.
- **Production-specific:** production URL and keys, stored in Vercel Production. `HYROX_ENV=production`.
