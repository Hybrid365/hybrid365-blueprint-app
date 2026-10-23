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
