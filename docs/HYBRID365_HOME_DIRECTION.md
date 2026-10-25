# Hybrid365 Home direction

**Status:** Approved information architecture after visual review (25 Oct 2026).  
**Scope:** Design recommendation only. Does **not** authorise live athlete Home changes, migrations, push, merge, or deploy.

Related: `docs/HYBRID365_PRODUCT_DESIGN_BENCHMARK.md`, `docs/HYBRID365_VISUAL_SYSTEM.md`, `docs/HYBRID365_INTERACTION_SYSTEM.md`, `docs/HYBRID365_COACHING_PLATFORM.md`, `docs/visual-qa/concepts/COACHED_COMMAND_CENTRE.md`.

Prototype: `components/athlete-command-centre/visual/concepts/HomeConceptD.tsx` (visual lab only).

---

## Decision

**Version D (Home D) is the foundation of the athlete Home screen.**

This **supersedes** the earlier Phase 0 recommendation that used Home A/C (single-day hero without a week strip) as the primary Home layout, including the consolidated `Coached Home` lab tab.

| Surface | Foundation |
| --- | --- |
| **Home** | **Home D** — week-first Training Command Centre |
| Session detail | Coached Command Centre research (refine on existing drawer) |
| Completion | Coached Command Centre research (fast sheet / bands) |
| Progress | Coached Command Centre research (improvement first) |
| Performance | Coached Command Centre research (hero mark) |
| Races | Coached Command Centre research (overall → run → station) |

---

## Non-negotiable Home D structure

Preserve Version D’s existing layout and overall structure. **Refinement, not redesign.**

### Must retain

1. **Sticky, interactive Mon–Sun date navigation** — athletes select a day and see that day’s training. This is core to the athlete experience. Do not remove, replace, or demote it to a secondary control.
2. **Week → selected day → planned training** hierarchy.
3. **In-place day swap** (not a separate calendar page).
4. **Session previews** for the selected day (slot · title · primary target).
5. **Coach context** on the selected day when athlete-facing copy exists.
6. **Insights below the fold** from stored analytics only (honest empties; no invented readiness).
7. Mobile sticky bottom nav pattern already shown in the prototype; desktop week/day composition already in Home D.

### Allowed refinements (later, named visual task)

- Stronger typography and target hierarchy on the selected-day session.
- Better visual emphasis on **today’s** primary session within the D frame (without abandoning the week strip).
- Small, meaningful performance indicators (e.g. one mark delta) — not a dashboard.
- Clearer coach **adjustment** presentation (real decision copy, not branding).
- Improved spacing and visual polish.
- Subtle, purposeful interactions (reduced-motion safe).

### Forbidden

- Replacing the Home D layout with Home A / Coached Home single-column hero.
- Removing or changing the sticky date navigation.
- Large dashboard sections (modality walls, sRPE load stacks, equal-weight metric grids).
- Unnecessary wellness / readiness / strain scores.
- Increasing visual clutter.
- Rebuilding components that already work in the Home D prototype.
- Treating Coached Home lab tabs as the live Home target.

---

## Relationship to Coached Command Centre research

The Coached Command Centre consolidated concepts remain **useful** for:

- Session Detail (purpose → target → structure in seconds)
- Completion (Prescribed · Actual · Subjective)
- Progress (improvement vs previous before volume)
- Performance (current mark · previous · pending)
- Races (overall → run → station → vs previous)

They do **not** redefine Home. Borrow coach-presence and progression *ideas* into Home D only where they fit the week/day model (e.g. adjustment CoachMark on the selected day, one small mark signal) — never by swapping layouts.

Lab reference: `/dev/visual-system` → Home D (foundation) · Coached Session / Complete / Progress / Performance / Races (supporting).

---

## Live product gate

Home D stays visual-lab until a **named human rollout task**. Do not reuse `HYROX_HOME_V2_*`, `HYROX_TODAY_V2_*`, or `HYROX_PERFORMANCE_HUB_*` for that rollout without an explicit task. Demo fixtures must never appear as live athlete results.

**STOP.** Documentation only in this pass — no live implementation.
