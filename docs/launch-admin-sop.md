# Hybrid365 — Launch admin SOP (internal)

**Audience:** Founders / support with Supabase dashboard access (service role or SQL editor).  
**Scope:** Paid app access, Whop sync, memberships, programmes, challenge data.  
**Out of scope:** Changing app code, free-week flow (`/free-week`), Airtable, Kit, or programme generation logic.

---

## Before you start

| Tool | Use for |
|------|---------|
| [Supabase](https://supabase.com/dashboard) → **Table Editor** / **SQL Editor** | Read/write `public.*` and `auth.users` |
| Vercel (or host) **Logs** | `[whop webhook]`, `[whop claim]`, `[dashboard access]` |
| Whop dashboard | Confirm buyer email, membership active/cancelled |

**Golden rule:** App login email must match Whop checkout email (including `+` aliases). The app normalises email and matches `+` vs spaces in the local part when claiming pending rows.

**Active membership (app logic):**

- `public.memberships.status = 'active'`
- AND (`expires_at` IS NULL OR `expires_at` > now())

If that fails, the user is sent to `/dashboard/no-access`.

**Week unlock (paid dashboard):** Driven by `access_started_at` (or fallback `created_at`):

| Days since `access_started_at` | Unlocked programme weeks |
|-------------------------------|---------------------------|
| 0–30 | 1–4 |
| 31–60 | 1–8 |
| 61+ | 1–12 |

---

## 1. Check if a user has app access

### 1.1 Quick checklist

1. User can sign in (row in `auth.users`).
2. Row in `public.memberships` for that `user_id`.
3. Membership is **active** (see above).
4. Optional: `access_started_at` set if you expect week 5+ content before day 61.

### 1.2 Find the user by email

```sql
-- Replace with support email (lowercase is safest)
select
  u.id as user_id,
  u.email as auth_email,
  u.created_at as auth_created_at,
  m.status,
  m.expires_at,
  m.access_started_at,
  m.whop_email,
  m.source,
  m.whop_membership_id,
  m.last_whop_event_type,
  m.last_whop_event_at,
  m.updated_at
from auth.users u
left join public.memberships m on m.user_id = u.id
where lower(u.email) = lower('athlete@example.com');
```

**Interpretation**

| Result | Meaning |
|--------|---------|
| No `auth.users` row | User has not signed up / wrong email |
| `memberships` missing | Never activated or Whop only wrote to `pending_whop_memberships` |
| `status <> 'active'` | Deactivated or never set active |
| `expires_at` in the past | Treated as inactive |
| `whop_email` ≠ `auth.email` | May still work if membership is active; claim uses normalised match |

### 1.3 What the app does on login

On each paid dashboard load, the server:

1. Runs **pending claim** (`claimPendingWhopMembershipForUser`) if `auth.email` matches an unclaimed active row in `pending_whop_memberships`.
2. Loads `memberships` and blocks the dashboard if not active.

Ask the user to sign out and back in after you fix DB rows so claim runs again.

---

## 2. Fix wrong Whop / app email issues

### 2.1 Typical symptoms

- Paid on Whop but sees **“Hybrid365 access is not active for this email”** (`/dashboard/no-access`).
- Whop webhook succeeded but membership only exists under **pending**.
- User logs in with Gmail alias (`name+hybrid@gmail.com`) but Whop used a different variant.

### 2.2 Compare all emails

```sql
select 'auth' as src, u.email, u.id as user_id
from auth.users u
where lower(u.email) = lower('athlete@example.com')

union all

select 'membership_whop', m.whop_email, m.user_id
from public.memberships m
join auth.users u on u.id = m.user_id
where lower(u.email) = lower('athlete@example.com')
   or lower(coalesce(m.whop_email, '')) = lower('athlete@example.com')

union all

select 'pending', p.email, p.claimed_user_id
from public.pending_whop_memberships p
where lower(p.email) = lower('athlete@example.com')
   or lower(coalesce(p.whop_email, '')) = lower('athlete@example.com');
```

### 2.3 Preferred fixes (in order)

1. **User signs in with Whop checkout email** (simplest; no DB change).
2. **Pending row exists, auth exists, emails match after normalisation**  
   - User visits `/dashboard` or `/dashboard/no-access` once (claim runs automatically).  
   - Check logs for `[whop claim]`.
3. **Pending email wrong** — update pending row to match auth (only if you’ve verified identity with Whop):

```sql
update public.pending_whop_memberships
set
  email = lower('correct@example.com'),
  whop_email = lower('correct@example.com'),
  updated_at = now()
where id = '<pending-row-uuid>'
  and claimed_at is null;
```

Then user signs in again.

4. **Auth email wrong** — Supabase **Authentication → Users** → change email (or create new auth user and migrate — avoid duplicate memberships).

5. **Manual activation** (section 5) when Whop is correct but webhook/claim failed.

**Do not** delete production Whop webhook history without understanding `last_whop_event_id` idempotency.

---

## 3. Check `pending_whop_memberships`

Used when Whop fires **before** the buyer has a Supabase auth account (webhook stores access by email until first login).

### 3.1 Schema reference

- `email` — normalised checkout email (unique).
- `whop_email` — optional copy from Whop payload.
- `status` — `'active'` | `'inactive'`.
- `claimed_at` / `claimed_user_id` — set when claimed into `memberships`.

### 3.2 Useful queries

**Unclaimed active (support queue):**

```sql
select
  id,
  email,
  whop_email,
  status,
  expires_at,
  whop_membership_id,
  last_whop_event_type,
  last_whop_event_at,
  created_at
from public.pending_whop_memberships
where claimed_at is null
  and status = 'active'
order by created_at desc;
```

**Lookup by email:**

```sql
select *
from public.pending_whop_memberships
where lower(email) = lower('athlete@example.com')
   or lower(coalesce(whop_email, '')) = lower('athlete@example.com');
```

**Already claimed:**

```sql
select p.*, u.email as claimed_auth_email
from public.pending_whop_memberships p
left join auth.users u on u.id = p.claimed_user_id
where p.claimed_at is not null
order by p.claimed_at desc
limit 50;
```

### 3.3 Expected flow

1. Whop webhook → insert/update `pending_whop_memberships` (no `auth.users` yet).
2. User signs up / logs in with matching email.
3. Dashboard layout → claim → upsert `memberships` → mark pending `claimed_at`.

If step 3 fails, use section 2 and 5.

---

## 4. Check `public.memberships` status

### 4.1 Columns that matter at launch

| Column | Purpose |
|--------|---------|
| `user_id` | PK / unique; links to `auth.users` |
| `status` | `'active'` or `'inactive'` |
| `expires_at` | Optional; past date = no access |
| `access_started_at` | Month-based week unlock window |
| `whop_email`, `whop_membership_id`, `source` | Support / Whop traceability |
| `last_whop_event_id`, `last_whop_event_type`, `last_whop_event_at` | Webhook audit |

Migrations: `scripts/sql/memberships-whop-columns.sql`, `scripts/sql/memberships-access-started-at.sql`.

### 4.2 Status query

```sql
select
  m.*,
  u.email as auth_email,
  case
    when m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
    then true
    else false
  end as app_would_allow_access
from public.memberships m
join auth.users u on u.id = m.user_id
where u.email ilike '%athlete@example.com%';
```

### 4.3 All active members (light audit)

```sql
select
  u.email,
  m.status,
  m.expires_at,
  m.access_started_at,
  m.whop_membership_id,
  m.updated_at
from public.memberships m
join auth.users u on u.id = m.user_id
where m.status = 'active'
  and (m.expires_at is null or m.expires_at > now())
order by m.updated_at desc;
```

---

## 5. Manually activate a user

Use when Whop payment is valid but webhook/claim did not create an active membership.

**Prerequisites:** Confirm payment in Whop. User should have an `auth.users` row (or ask them to sign up first).

```sql
-- Set variables (Supabase SQL editor: run as one block or substitute manually)
-- user_id from auth.users lookup

insert into public.memberships (
  user_id,
  status,
  source,
  expires_at,
  access_started_at,
  whop_email,
  updated_at
)
values (
  '<user-uuid>',
  'active',
  'manual',
  null,                    -- or Whop renewal end: '2026-12-31T23:59:59Z'::timestamptz
  now(),                   -- starts month-1 unlock (weeks 1–4); adjust only if backdating
  lower('athlete@example.com'),
  now()
)
on conflict (user_id) do update set
  status = 'active',
  source = coalesce(public.memberships.source, 'manual'),
  expires_at = excluded.expires_at,
  access_started_at = coalesce(public.memberships.access_started_at, excluded.access_started_at),
  whop_email = excluded.whop_email,
  updated_at = now();
```

**After activation**

1. If a matching **pending** row exists, mark it claimed to avoid double-processing:

```sql
update public.pending_whop_memberships
set
  claimed_at = now(),
  claimed_user_id = '<user-uuid>',
  updated_at = now()
where lower(email) = lower('athlete@example.com')
  and claimed_at is null;
```

2. User signs out and in, opens `/dashboard`.
3. Confirm no redirect to `/dashboard/no-access`.

**Backdating / extending unlock months:** Set `access_started_at` to the real start date (e.g. purchase date). Do not reset it on reactivation unless you intend to reset their unlock window.

---

## 6. Deactivate a user

Use for refunds, chargebacks, or abuse. Prefer Whop cancellation so webhooks stay the source of truth; use SQL when Whop is already cancelled or webhook missed.

```sql
update public.memberships
set
  status = 'inactive',
  updated_at = now()
where user_id = '<user-uuid>';
```

Optional: set `expires_at = now()` for clarity.

```sql
update public.pending_whop_memberships
set status = 'inactive', updated_at = now()
where lower(email) = lower('athlete@example.com')
  and claimed_at is null;
```

User will hit `/dashboard/no-access` on next request. **Does not** delete programme data.

---

## 7. Clean test challenge submissions

Table: `public.challenge_submissions`  
Statuses: `pending`, `approved`, `rejected`. Leaderboard reads **approved** rows.

### 7.1 Preview test user’s submissions

```sql
select id, challenge_week, challenge_key, challenge_title, status, points_awarded, submitted_at
from public.challenge_submissions
where user_id = '<user-uuid>'
order by submitted_at desc;
```

### 7.2 Delete all submissions for a test account

```sql
delete from public.challenge_submissions
where user_id = '<user-uuid>';
```

### 7.3 Delete only pending (safer)

```sql
delete from public.challenge_submissions
where user_id = '<user-uuid>'
  and status = 'pending';
```

### 7.4 Delete by email

```sql
delete from public.challenge_submissions cs
using auth.users u
where cs.user_id = u.id
  and lower(u.email) = lower('test+launch@example.com');
```

**Warning:** Approved rows affect provisional/leaderboard points until recalculated on next page load. Do not delete real members’ approved proofs without explicit approval.

### 7.5 Review challenge scores & submissions (launch support)

Members submit from `/dashboard/challenge`. Scoring rules live in `app/lib/hybridChallengeMetrics.ts` — **do not change code** for support fixes; adjust rows in Supabase.

**Queue — recent submissions:**

```sql
select
  cs.id,
  u.email,
  cs.challenge_week,
  cs.challenge_title,
  cs.status,
  cs.points_awarded,
  cs.score_time,
  cs.score_value,
  cs.score_unit,
  cs.proof_url,
  cs.proof_note,
  cs.submitted_at,
  cs.reviewed_at,
  cs.admin_notes
from public.challenge_submissions cs
join auth.users u on u.id = cs.user_id
order by cs.submitted_at desc
limit 50;
```

**Approve / adjust points (invalid proof → reject or zero points):**

```sql
update public.challenge_submissions
set
  status = 'rejected',
  points_awarded = 0,
  admin_notes = 'Proof unclear — resubmit with link or screenshot',
  reviewed_at = now(),
  updated_at = now()
where id = '<submission-uuid>';
```

```sql
update public.challenge_submissions
set
  status = 'approved',
  points_awarded = 25,
  admin_notes = 'Verified',
  reviewed_at = now(),
  updated_at = now()
where id = '<submission-uuid>';
```

**Leaderboard impact:** Only `status = 'approved'` rows count toward `approvedChallengePoints` and public leaderboard reads. Provisional dashboard points also include habits, check-ins, and session logs — see `provisionalTotalChallengePoints` in code.

**Member-facing copy:** Ask for Telegram proof and tags `@kieranhiggsfit` / `@hybrid.365` for public shares (shown on challenge page).

---

## 8. Reset / regenerate a programme

### 8.1 User-driven (preferred)

Requirements:

- Active membership
- Completed athlete assessment (`athlete_assessments.completed_at` set)

User: **Dashboard → Generate programme** (calls `POST /api/dashboard/generate-programme`).

Behaviour:

- Upserts all **12** `programme_weeks` from current assessment + benchmarks.
- Sets `programme_instances.current_week = 1`.
- Week `is_unlocked` in DB reflects membership month; UI also enforces unlock via `access_started_at`.

Does **not** delete `session_logs` or `weekly_check_ins` automatically — old logs may reference old session keys.

### 8.2 Admin: inspect current programme

```sql
select
  pi.id as programme_instance_id,
  pi.title,
  pi.current_week,
  pi.goal_focus,
  pi.ability_level,
  count(pw.week_number) as weeks_with_rows
from public.programme_instances pi
left join public.programme_weeks pw on pw.programme_instance_id = pi.id
join auth.users u on u.id = pi.user_id
where lower(u.email) = lower('athlete@example.com')
group by pi.id, pi.title, pi.current_week, pi.goal_focus, pi.ability_level;
```

### 8.3 Admin: clear weeks only (keep instance + logs)

```sql
delete from public.programme_weeks
where programme_instance_id = '<programme-instance-uuid>';
```

Then ask user to **Generate programme** again (or run seed script in dev — see `scripts/seed-paid-12-week-programme.ts`).

### 8.4 Admin: full programme reset (destructive)

Deletes instance; **`session_logs` CASCADE**; habits/check-ins/challenge rows may lose `programme_instance_id` (SET NULL).

```sql
-- Preview
select id from public.programme_instances
where user_id = '<user-uuid>';

delete from public.programme_instances
where user_id = '<user-uuid>';
```

User completes assessment → generates fresh instance.

### 8.5 Admin: reset progress data only (optional)

```sql
delete from public.session_logs where user_id = '<user-uuid>';
delete from public.weekly_check_ins where user_id = '<user-uuid>';
-- Optional:
-- delete from public.daily_habit_logs where user_id = '<user-uuid>';
-- delete from public.benchmark_tests where user_id = '<user-uuid>';
```

Coordinate with the athlete before wiping benchmarks or check-ins.

### 8.6 Reset assessment (rare)

```sql
update public.athlete_assessments
set completed_at = null
where user_id = '<user-uuid>';
```

Only if they must re-onboard; does not delete programme rows by itself.

---

## 9. SQL snippets — common support cases

### A. “Paid but no access” — full triage

```sql
with target as (
  select lower('athlete@example.com') as em
)
select 'auth_user' as step, u.id::text, u.email, null::text
from auth.users u, target t where lower(u.email) = t.em
union all
select 'membership', m.user_id::text, m.status, m.whop_email
from public.memberships m, target t
join auth.users u on u.id = m.user_id
where lower(u.email) = t.em or lower(coalesce(m.whop_email,'')) = t.em
union all
select 'pending', p.id::text, p.status, p.email
from public.pending_whop_memberships p, target t
where lower(p.email) = t.em or lower(coalesce(p.whop_email,'')) = t.em;
```

### B. Force claim pending → membership (manual)

Only after verifying email ownership:

```sql
-- 1) Ensure membership active (section 5)
-- 2) Mark pending claimed
update public.pending_whop_memberships
set claimed_at = now(), claimed_user_id = '<user-uuid>', updated_at = now()
where id = '<pending-id>' and claimed_at is null;
```

### C. Extend unlock window / fix “only 4 weeks visible”

```sql
-- See how many days since start
select
  access_started_at,
  extract(day from now() - access_started_at) as days_since_start
from public.memberships
where user_id = '<user-uuid>';

-- Example: grant month-2 unlock (weeks 1–8) by setting start 31+ days ago
update public.memberships
set access_started_at = now() - interval '32 days'
where user_id = '<user-uuid>';
```

Use carefully — this is a support override, not billing truth.

### D. Whop webhook audit for membership id

```sql
select user_id, status, whop_membership_id, last_whop_event_id, last_whop_event_type, last_whop_event_at
from public.memberships
where whop_membership_id = '<whop-membership-id>';
```

### E. List users stuck on no-access with active pending

```sql
select p.email, p.whop_email, p.created_at, p.last_whop_event_at
from public.pending_whop_memberships p
where p.status = 'active'
  and p.claimed_at is null
  and exists (
    select 1 from auth.users u
    where lower(u.email) = lower(p.email)
  )
order by p.created_at;
```

→ User should log in again; if still stuck, run section 5.

### F. Programme exists but dashboard empty

```sql
select week_number, is_unlocked, (plan_json is not null) as has_plan
from public.programme_weeks
where programme_instance_id = '<programme-instance-uuid>'
order by week_number;
```

If `is_unlocked` false for weeks they expect, check `memberships.access_started_at` (section 4 / 9C).

### G. Duplicate membership row check

`memberships.user_id` should be unique. If upserts failed historically:

```sql
select user_id, count(*) from public.memberships group by user_id having count(*) > 1;
```

---

## Escalation / logs

| Log prefix | Meaning |
|------------|---------|
| `[whop webhook]` | Incoming Whop event, pending store, membership upsert |
| `[whop claim]` | Pending → memberships on login |
| `[dashboard access] inactive membership` | Gate blocked user |
| `[membership access]` | Fetch/entitlement issues |

**Whop:** Confirm webhook URL points to production `/api/webhooks/whop` and `WHOP_WEBHOOK_SECRET` is set in production.

**Do not** share service-role keys, webhook secrets, or this document with athletes.

---

## Related SQL migrations (repo)

| File | Purpose |
|------|---------|
| `scripts/sql/pending-whop-memberships.sql` | Pending table |
| `scripts/sql/pending-whop-memberships-whop-email.sql` | `whop_email` column |
| `scripts/sql/memberships-whop-columns.sql` | Whop audit columns on `memberships` |
| `scripts/sql/memberships-access-started-at.sql` | `access_started_at` + unlock windows |
| `scripts/sql/hybrid-challenge-foundation.sql` | `challenge_submissions` |

---

*Last updated for launch milestone: memberships gate, Whop webhook + pending claim, month-based week unlock, dashboard tracking.*
