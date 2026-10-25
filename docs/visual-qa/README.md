# Visual system QA — 23 Oct 2026

Lab: `http://localhost:3465/dev/visual-system`

Script: `npx tsx scripts/qa-hyrox-visual-system.ts` — 13 checks passed.

## Viewports

| Width | Overflow | Notes | Screenshot |
| --- | --- | --- | --- |
| 375 | none | Cards stack; session targets 2-up; social 9:16 stacks | `lab-375.png`, `lab-375-social.png` |
| 390 | none | Same hierarchy | `lab-390.png` |
| 430 | none | Measured series visible | `lab-430.png` |
| 768 | none | 2-column primitives | `lab-768.png` |
| 1440 | none | 2-column + 3 social cards | `lab-1440.png`, `lab-1440-social.png` |

## Contrast

Computed token pairs meet WCAG AA. Live lab text sample at 375: 0 failures. Meta/label tokens use zinc-400 on zinc-950 (zinc-500 failed 4.5:1).

## Reduced motion

`prefers-reduced-motion: reduce` → `[data-h365-motion]` animation `none`, duration `0s`. JS hook + CSS. Home `CountUp` does not animate measured numbers.

## Staging badge

Injected 24px STAGING strip at 375. H1 top was 79px. Not covered. `lab-375-staging-badge.png`.

Older captures from the first pass: `docs/qa/visual-system/screenshots/`.

## Direction concepts (research, not live UI)

Lab tabs on `/dev/visual-system`. Capture: `npx tsx scripts/qa-hyrox-design-concept-shots.ts`.

**Home foundation:** Version D — `docs/HYBRID365_HOME_DIRECTION.md` (sticky day nav retained).  
**Supporting surfaces:** Coached Session / Complete / Progress / Performance / Races — `concepts/COACHED_COMMAND_CENTRE.md` (Coached Home is comparison-only, not the Home target).

| Concept | 390 | 1440 |
| --- | --- | --- |
| Home D (Home foundation) | `concepts/home-d-390.png` | `concepts/home-d-1440.png` |
| Home D triple | `concepts/home-d-triple-390.png` | |
| Home D rest | `concepts/home-d-rest-390.png` | |
| Home D scrolled + nav | `concepts/home-d-scrolled-390.png` | |
| Home D drawer | `concepts/home-d-drawer-390.png` | |
| Coached Home *(not Home target)* | `concepts/coached-home-390.png` | `concepts/coached-home-1440.png` |
| Coached Session | `concepts/coached-session-390.png` | `concepts/coached-session-1440.png` |
| Coached Complete | `concepts/coached-complete-390.png` | `concepts/coached-complete-1440.png` |
| Coached Progress | `concepts/coached-progress-390.png` | `concepts/coached-progress-1440.png` |
| Coached Performance | `concepts/coached-performance-390.png` | `concepts/coached-performance-1440.png` |
| Coached Races | `concepts/coached-race-390.png` | `concepts/coached-race-1440.png` |
| Coached Home empty | `concepts/coached-home-empty-390.png` | |
| Coached Home loading | `concepts/coached-home-loading-390.png` | |
| Coached Progress empty | `concepts/coached-progress-empty-390.png` | |
| Coached Race empty | `concepts/coached-race-empty-390.png` | |
| Coached Complete form | `concepts/coached-complete-form-390.png` | |
| Home A | `concepts/home-a-390.png` | `concepts/home-a-1440.png` |
| Home B | `concepts/home-b-390.png` | `concepts/home-b-1440.png` |
| Home C | `concepts/home-c-390.png` | `concepts/home-c-1440.png` |
| Session detail | `concepts/session-390.png` | `concepts/session-1440.png` |
| Session complete | `concepts/complete-390.png` | `concepts/complete-1440.png` |
| Progress | `concepts/progress-390.png` | `concepts/progress-1440.png` |
| Performance | `concepts/performance-390.png` | `concepts/performance-1440.png` |
| Race intelligence | `concepts/race-390.png` | `concepts/race-1440.png` |
