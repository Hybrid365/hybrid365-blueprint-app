# Hybrid365 interaction system

Motion reinforces hierarchy, cause/effect, success, and continuity. It does not decorate.

Live tokens stay in `components/athlete-command-centre/visual/tokens.ts` and `visual/motion.tsx`. Concepts in the visual lab may preview the same grammar. Do not lengthen live motion without a review.

Easing for all of the below: `cubic-bezier(0.22, 1, 0.36, 1)` (`MOTION_EASE`).

## Durations

| Token | Duration | Use |
| --- | --- | --- |
| `--h365-motion-fast` | 120ms | Pressed colour, hover, hairline emphasis |
| `--h365-motion-base` | 160ms | Confirmation, coach-mark appear, tab ink |
| `--h365-motion-enter` | 180ms | Page/module enter: opacity + 4px translateY |
| Drawer (live) | 150ms | Session drawer slide-in |
| Chart draw (concept) | 180ms | Polyline dash, then stop. No looping |
| Structure expand | 160ms | Session blocks open |

Stay under 200ms on athlete surfaces unless reduced-motion already skips it. Do not introduce springy overshoot.

## Navigation

- Tab changes: fade 180ms. Do not slide the whole app sideways — that fights the bottom nav.
- Home → session: the drawer is the continuity. The session does not remount as a marketing page.
- More menu: instant. It is a directory, not a scene.
- Flag-gated Races: the destination is simply absent until enabled. Do not show a locked neon tile.

## Drawer

- Live: right sheet, `motion-safe:slide-in-from-right` 150ms, `motion-reduce:animate-none`.
- Scrim: 70% black. Tap scrim or close (44px) dismisses.
- Body scrolls; header and completion CTA stay put in concepts.
- Opening with log form expanded is a deep link, not a second animation.

## Expand / collapse

- Session structure (intervals, stations) can expand in place 160ms.
- Only one primary block expanded on a small screen if the content is long.
- Do not accordion the primary target. It stays visible.

## Charts

- Enter with the series already at true values. Optional 180ms stroke draw.
- Scrub (desktop / later): one readout, one highlight. Linked to the named split, not five tooltips.
- Empty series: sentence, no skeleton of a fake shape.
- Do not animate a measured 17:55 from 00:00.

## Pressed states

- Buttons: 120ms background shift. Primary stays yellow-400 on zinc-950.
- Cards that open a session: border zinc-800 → zinc-700. No lift shadow.
- Disabled logging in preview: control remains 44px, no press animation, message stays.

## Loading

- First paint may use a one-line “Loading your programme…”.
- Live rule today: text + retry, not skeletons of fake metrics.
- If a later phase adds skeletons, they are geometry only (hairlines), never numbers.

## Completion

1. Athlete saves.
2. 160ms confirmation (`CompletionConfirm` / `SessionCompleteConfirm`).
3. Hierarchy: Target · Actual · RPE, then execution / legs / energy if logged, then “Your coach can see this result.”
4. No confetti, badges, streaks, haptics fireworks, or full-screen victory.

## PB / improvement

- Show the delta the contract already has (`↓ 7 sec`, `−2:11 vs previous`).
- Do not relabel status as “PB” or “On fire”. Current / Historical stay.
- Motion: the delta may fade in 160ms. The time itself does not roll.

## Benchmark approval

- Athlete submit → **Pending review** (status word, extra padding). No celebration.
- Coach approve / activate → **Current**. Previous row becomes **Historical**.
- The swap is a status change, not a fireworks takeover.

## Coach-change state

- Coach mark (left gold rule) appears 160ms when the week has athlete-facing copy or an adjustment.
- Unpublished upcoming weeks stay labelled upcoming. Do not animate a draft into a live session on the athlete side.
- Internal notes have no athlete state.

## Reduced motion

`prefers-reduced-motion: reduce`:

- Skip enter translate/fade (`usePrefersReducedMotion`, `[data-h365-motion]`, `.h365-motion-enter`).
- Skip drawer slide (`motion-reduce:animate-none`).
- Skip chart stroke draw.
- Keep instant state: logged, pending, current, error.

## What motion is for

| Intent | Example |
| --- | --- |
| Hierarchy | Primary target is already large; motion does not compete |
| Cause / effect | Save → confirmation with the numbers just entered |
| Success | Logged, coach can see it |
| Continuity | Home session → drawer, same name and target |

Decorative rings, looping loaders on static data, and page-wide parallax are out.
