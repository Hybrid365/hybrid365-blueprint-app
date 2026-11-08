-- One active unpublished programme draft per athlete + global week.
-- Published snapshots (status=published or published_at set) remain free to coexist
-- with a single working unpublished revision — matching Programme Builder revision model.
--
-- Impact:
--   - Prevents concurrent blueprint imports (and concurrent ensure/copy inserts) from
--     creating sibling active unpublished drafts for the same week.
--   - Normal Programme Builder PATCH updates the same row — unaffected.
--   - ensureUnpublishedWorkingDraft still inserts one unpublished fork beside a
--     published snapshot; a second concurrent insert fails with unique_violation.
--
-- Pre-existing duplicates: older unpublished siblings are archived (not deleted).
--
-- Rollback:
--   drop index if exists public.hyrox_programme_drafts_one_unpublished_week_idx;
--   (Archived cleanup rows stay archived — no automatic unarchive.)
--
-- Do not apply to production until a human explicitly approves this migration.

-- 1) Archive older duplicate unpublished working drafts (keep newest per athlete/week).
with ranked as (
  select
    id,
    row_number() over (
      partition by athlete_id, week_number
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.hyrox_programme_drafts
  where published_at is null
    and status not in ('archived', 'published')
)
update public.hyrox_programme_drafts d
set
  status = 'archived',
  validation_warnings = coalesce(d.validation_warnings, '{}'::jsonb)
    || jsonb_build_object(
      'archivedReason',
      'Duplicate unpublished draft cleanup before one-unpublished-per-week unique index',
      'archivedAt',
      now()::text
    )
from ranked r
where d.id = r.id
  and r.rn > 1;

-- 2) Enforce at most one active unpublished draft per athlete/week.
create unique index if not exists hyrox_programme_drafts_one_unpublished_week_idx
  on public.hyrox_programme_drafts (athlete_id, week_number)
  where published_at is null
    and status not in ('archived', 'published');

comment on index public.hyrox_programme_drafts_one_unpublished_week_idx is
  'At most one active unpublished programme draft per athlete and global week. Published snapshots are excluded so draft revisions can coexist with live weeks.';
