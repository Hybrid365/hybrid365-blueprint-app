# Hybrid365 — Production cleanup checklist (internal)

**Purpose:** Pre-launch or post-launch audit of test data in Supabase.  
**Important:** This document is **read-only guidance**. Do not run bulk deletes without reviewing each row. Nothing here auto-deletes.

Use the [Launch admin SOP](./launch-admin-sop.md) for access troubleshooting and SQL patterns.

---

## How to use this checklist

1. Run each **preview** query in Supabase SQL Editor.
2. Export or screenshot results for launch sign-off.
3. Decide per row: keep (real member), fix (wrong email/status), or delete (test only).
4. Execute **manual** deletes one user or one table at a time after confirmation.
5. Re-run preview queries until counts are acceptable.

---

## 1. Test users (`auth.users`)

**Look for:** `+test`, `launch@`, `@example.com`, internal team emails used only for QA, duplicate accounts.

```sql
select id, email, created_at, last_sign_in_at
from auth.users
where lower(email) like '%+test%'
   or lower(email) like '%@example.com'
   or lower(email) like '%launch%'
order by created_at desc;
```

**Also check:** users with membership but no programme (may be abandoned QA).

```sql
select u.id, u.email, m.status, pi.id as programme_instance_id
from auth.users u
left join public.memberships m on m.user_id = u.id
left join public.programme_instances pi on pi.user_id = u.id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%';
```

**Cleanup (manual only):** Delete test users in Supabase Auth UI or via admin API. Cascades may remove related `public.*` rows depending on FK `on delete` rules.

---

## 2. Test memberships (`public.memberships`)

**Look for:** `source = 'manual'` on non-staff accounts, duplicate rows per `user_id`, active status for test emails.

```sql
select m.*, u.email
from public.memberships m
join auth.users u on u.id = m.user_id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
   or m.source = 'manual'
order by m.updated_at desc;
```

**Preview all active (sanity):**

```sql
select u.email, m.status, m.expires_at, m.access_started_at, m.source, m.whop_membership_id
from public.memberships m
join auth.users u on u.id = m.user_id
where m.status = 'active'
order by m.updated_at desc;
```

**Cleanup:** Deactivate test rows — see SOP section 6 (`status = 'inactive'`). Do not delete real Whop-linked rows without checking Whop dashboard.

---

## 3. Pending Whop rows (`public.pending_whop_memberships`)

**Look for:** stale unclaimed actives, test checkout emails, duplicate emails.

```sql
-- Unclaimed queue
select id, email, whop_email, status, claimed_at, last_whop_event_at, created_at
from public.pending_whop_memberships
where claimed_at is null
order by created_at desc;

-- Test-like emails
select *
from public.pending_whop_memberships
where lower(email) like '%@example.com'
   or lower(email) like '%+test%';
```

**Cleanup:** Set `status = 'inactive'` for test pending rows, or delete only confirmed test emails. Real buyers who have not signed up yet should **stay** until they log in.

---

## 4. Challenge submissions (`public.challenge_submissions`)

**Look for:** test users, bogus proof URLs, duplicate week submits, incorrect `points_awarded`.

```sql
select cs.id, u.email, cs.challenge_week, cs.challenge_key, cs.status,
       cs.points_awarded, cs.submitted_at, cs.proof_url
from public.challenge_submissions cs
join auth.users u on u.id = cs.user_id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
order by cs.submitted_at desc;
```

**Review notes (no scoring code changes):**

| Field | What to check |
|-------|----------------|
| `status` | `approved` rows appear on leaderboard; `rejected` hidden |
| `points_awarded` | Auto-approve on submit may award points; lower to `0` or set `rejected` if proof invalid |
| `proof_url` / `proof_note` | Sensible link or note; empty may be OK for internal tests only |
| `challenge_week` | 1–6 for challenge window |

**Cleanup:** Delete test submissions only — see SOP section 7. Do not bulk-delete approved member proofs.

---

## 5. Session logs (`public.session_logs`)

**Look for:** test users, orphan logs after programme resets.

```sql
select sl.id, u.email, sl.week_number, sl.session_key, sl.completed, sl.completed_at
from public.session_logs sl
join auth.users u on u.id = sl.user_id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
order by sl.updated_at desc
limit 100;
```

**Orphan check (instance deleted but logs remain — should not happen if CASCADE):**

```sql
select sl.*
from public.session_logs sl
left join public.programme_instances pi on pi.id = sl.programme_instance_id
where pi.id is null;
```

---

## 6. Habit logs (`public.daily_habit_logs`)

```sql
select h.id, u.email, h.log_date, h.water_hit, h.protein_hit, h.steps_hit,
       h.sleep_hit, h.mobility_hit, h.proof_posted
from public.daily_habit_logs h
join auth.users u on u.id = h.user_id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
order by h.log_date desc
limit 100;
```

---

## 7. Benchmark tests (`public.benchmark_tests`)

```sql
select b.id, u.email, b.test_type, b.test_time, b.test_value, b.tested_at
from public.benchmark_tests b
join auth.users u on u.id = b.user_id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
order by b.tested_at desc nulls last;
```

---

## 8. Programme instances (`public.programme_instances` + `programme_weeks`)

**Look for:** test users, empty weeks, duplicate instances per user (should be one).

```sql
select u.email, pi.id, pi.title, pi.current_week, pi.created_at,
       count(pw.week_number) as week_rows
from public.programme_instances pi
join auth.users u on u.id = pi.user_id
left join public.programme_weeks pw on pw.programme_instance_id = pi.id
where lower(u.email) like '%@example.com'
   or lower(u.email) like '%+test%'
group by u.email, pi.id, pi.title, pi.current_week, pi.created_at;

-- Users with more than one instance (unexpected)
select user_id, count(*) as n
from public.programme_instances
group by user_id
having count(*) > 1;
```

**Reset notes:** Prefer user **Generate programme** on dashboard; admin delete patterns in [launch-admin-sop.md](./launch-admin-sop.md) section 8.

---

## 9. Related tables (quick pass)

| Table | Preview |
|-------|---------|
| `weekly_check_ins` | Join `auth.users`, filter test emails |
| `athlete_assessments` | Incomplete vs completed for launch accounts |
| `profiles` | Orphan or test display names |

```sql
select u.email, w.week_number, w.submitted_at
from public.weekly_check_ins w
join auth.users u on u.id = w.user_id
where lower(u.email) like '%+test%'
order by w.week_number;
```

---

## 10. Sign-off before launch

- [ ] No active `memberships` for `@example.com` / `+test` emails unless intentional staff sandboxes
- [ ] `pending_whop_memberships` queue reviewed; real buyers not deleted
- [ ] Challenge leaderboard has no junk `approved` rows from QA
- [ ] Whop webhook secret set in production; test webhooks not pointed at prod
- [ ] Vercel/env: production Supabase keys only on production
- [ ] Support copy live on dashboard (Need help? card)
- [ ] [launch-admin-sop.md](./launch-admin-sop.md) shared with anyone doing support

---

*Docs only — no application or schema changes.*
