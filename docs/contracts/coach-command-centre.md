# Contract: Coach Command Centre

Status: proposed. Implementation lives on `feature/hyrox-coach-command-centre`. Do not treat this file as deployed behaviour.

Owner: Coach admin agent (Workstream C).

Consumers: Coach admin UI on `/admin/hyrox-athletes/[id]` Overview.

Depends on: Performance Profile resolver (Phase 1), published programme sessions, weekly check-ins, optional daily readiness, and Workstream B `getHyroxAthleteAnalytics` when that module is present on the branch.

Does not own: prescription engine, Workstream B analytics calculation, athlete visual system, race intelligence, Programme Builder / Copy Week / Auto-Carry / Block 4+, migration 021, Workstream A.

## Purpose

Give the coach a dense, desktop-first overview of one athlete: this week, what needs attention, the active performance anchors, and recent progress. Assist. Do not automate programme edits.

## Surface

Mount on the existing individual athlete admin page, Overview tab. Do not rebuild Programme Builder. Preview / View-as-Athlete stays read-only under `/admin/hyrox-athletes/{id}/preview`.

Desktop-first. Scan rows, not marketing tiles. Actions are text controls in the row.

Mock roster athletes are not shown as live Command Centre metrics.

## Analytics consumption (Workstream B)

Command Centre does **not** implement a second analytics engine. It must not compute rolling volume, modality distribution, session-RPE load, run distance, or training duration.

It consumes this **frozen** Workstream B interface when `getHyroxAthleteAnalytics` is present:

```ts
type HyroxWeekSummary = {
  startDate: string;
  endDate: string;
  completeWeek: boolean;
  plannedSessions: number;
  completedSessions: number;
  completionPct: number | null;
  runDistanceKm: number | null;
  trainingDurationMinutes: number | null;
  averageRpe: number | null;
  sessionRpeLoad: number | null;
  keySessionsCompleted: number;
  keySessionsPlanned: number;
};

type HyroxAthleteAnalytics = {
  athleteId: string;
  generatedAt: string;
  currentWeek: HyroxWeekSummary;
  previousWeek: HyroxWeekSummary | null;
  rolling4: {
    runDistanceKm: number | null;
    trainingDurationMinutes: number | null;
    completionPct: number | null;
    averageRpe: number | null;
  };
  distribution: {
    modality: "run" | "bike" | "skierg" | "rowerg" | "strength" | "hyrox_specific" | "other";
    sessionCount: number;
    durationMinutes: number | null;
  }[];
  benchmarks: {
    type: string;
    label: string;
    points: {
      date: string;
      display: string;
      normalizedValue: number;
      normalizedUnit: string;
      source: string;
      status: string;
    }[];
  }[];
  unsupported: string[];
};
```

Wiring on this branch:

- `app/lib/hyroxCommandCentreAnalyticsTypes.ts` — consumer copy of the frozen type. Type-only. Not an engine.
- `app/lib/hyroxCommandCentreAnalyticsAdapter.ts` — types against the frozen shape. Tries `getHyroxAthleteAnalytics` only if a getter is registered (B is not on this branch). Otherwise returns `{ status: "unavailable", analytics: null }`. Never invents athlete numbers. Never substitutes zeros for missing distance, duration, or RPE.

| B present | Command Centre |
| --- | --- |
| `getHyroxAthleteAnalytics` returns a payload that matches the frozen shape | THIS WEEK run distance / training time / session-RPE load, plus RECENT PROGRESS rolling 4 / distribution / benchmark series, come from that payload. Missing fields stay null. |
| Function absent, throws, or returns null | `analyticsStatus` is `unavailable`. Run distance, training time, session-RPE load, rolling 4, modality distribution, and benchmark trend series stay omitted. THIS WEEK still shows planned/completed session counts, logged average RPE, pending benchmark count, check-ins, and active Performance Profile anchors from existing tables. |

Never invent athlete numbers. Demo / mock roster athletes do not appear as live Command Centre metrics.

## THIS WEEK

Shown only from real rows or from B's `currentWeek`:

- completed / planned published sessions (published week rows; omitted if unpublished)
- run distance (B only)
- training time (B only)
- average RPE (B if present; otherwise mean of logged session RPE values, or omitted)
- latest submitted weekly check-in (week number, date, energy, soreness; not a diagnosis)
- pending benchmark count (Performance Profile rows with `status = pending`; omitted if table unavailable)
- upcoming key session this week (key, not completed, session date **after** today)

If the live week is unpublished, say so. Do not fill from a draft. Today's incomplete key session is a NEEDS ATTENTION flag, not an "upcoming" row.

If a field is missing, show an honest empty / unavailable state. Do not chart zeros.

## NEEDS ATTENTION

Transparent rule flags only. Each flag has: code, severity, reason (the rule and the observed values), source, date and/or session, and a link/action.

No AI risk scores. No medical diagnoses. Copy reports what the athlete logged, not what it “means clinically”.

| Code | Fires when | Does not fire when |
| --- | --- | --- |
| `pending_benchmark` | ≥1 benchmark row `status = pending` | Table unavailable (then pending is missing, not zero) |
| `missed_programmed_session` | Published non-optional session, calendar date &lt; today, status not `completed` or `modified`. Key sessions use `key_session_incomplete` instead. | Date unknown; future sessions; optional slot |
| `key_session_incomplete` | Key session, date ≤ today, not completed/modified | Upcoming key sessions (those are THIS WEEK, not flags) |
| `high_rpe_vs_prescribed` | Logged RPE &gt; prescribed range max + 1, and both values parsed | Prescribed RPE missing; logged RPE missing |
| `pain_soreness` | Check-in soreness ≥ 8, or non-empty `pain_niggles`, or session `painOrTightness`, or readiness muscle soreness ≥ 8 | Empty notes; scores below threshold |
| `illness` | Daily readiness `feeling_unwell` in the last 7 local dates, or check-in text matching `\b(ill|illness|sick|unwell|flu|cold|fever)\b` | No such row. Not a diagnosis. |
| `repeated_heavy_legs` | ≥2 session notes in current + previous week matching `\bheavy legs\b` | A single mention |
| `repeated_low_energy` | Last two submitted weekly check-ins both have energy ≤ 4 | Fewer than two submitted check-ins with energy |
| `missing_weekly_check_in` | Published live or past week with no submitted check-in. Live week only from Thursday (Europe/London) onward. | Upcoming unpublished weeks; live week Mon–Wed |

Flags never rewrite the programme.

Implementation: `app/lib/hyroxCoachAttention.ts` + `app/lib/hyroxCoachAttentionParse.ts`. Pure functions. No I/O.

## PERFORMANCE PROFILE

Surface active anchors only: 5K, threshold, ski 2K, row 2K, FTP, HYROX run pace, plus pending count.

Link to the existing Performance Profile tab. Do not duplicate benchmark management, approval, or activation.

If migration 021 is unavailable, say unavailable. Missing anchors stay null.

## RECENT PROGRESS

Prefer B's `previousWeek`, `rolling4`, `distribution`, `benchmarks`, `unsupported`.

Without B: previous-week planned/completed and logged average RPE from published programme session rows when that week exists; everything else empty/partial with an honest sentence.

## QUICK ACTIONS

Coach-only, on this page:

- Edit programme → Programme Builder tab
- View as athlete → existing preview start route (read-only)
- Review testing → Testing tab
- Review pending benchmark → Performance Profile tab
- Open weekly check-in → Check-Ins tab
- Athlete-facing weekly note → Coach Notes tab
- Internal coach note → Coach Notes tab, only because that field is already supported on the draft / published week (`coach_note`)

Internal `coach_note` never falls back into athlete copy. Athlete APIs already null it via `withoutInternalWeekCoachNote` / `athleteFacingWeeklyNote`. Command Centre is a coach API and may show the internal note on the coach surface with an Internal label.

## Auth

- Page: existing `/admin/hyrox-athletes` layout (`assertHyroxCoachAccess`). Non-coaches redirect to `/admin/no-access`. Athletes cannot open this layout.
- API: `GET /api/hyrox/athletes/[id]/command-centre` calls `requireHyroxCoachApi` before the service-role client.
- Athletes cannot read this API. Non-coaches are 403.
- Preview cookie cannot mutate. Command Centre V1 is GET-only.

## Out of scope

- Auto-editing programmes, Copy Week, Auto-Carry, Block 4+ logic
- Prescription formula resolution / `runPrescription.ts`
- Computing rolling volume, modality distribution, or session-RPE load
- Athlete shell redesign, visual primitive library, staging badge, social 9:16
- Race schema/UI beyond linking an existing race tab if present
- Invented readiness / load / injury scores
- Workstream A / B / D / E implementations
