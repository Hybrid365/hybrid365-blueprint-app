# Hybrid365 visual system

Presentation only. Do not change what a status means in order to make a screen look finished.

## Colour

- Near-black surfaces: zinc 950 / black
- Off-white text: zinc 100–200
- Muted gold for the few words that matter: yellow 400 at low emphasis, not a fill behind everything
- Borders: zinc 800, hairline
- Warning copy: amber text on the same dark surface

Avoid neon green, large gradients, and glassmorphism.

## Type

- Eyebrow: 10px, uppercase, wide tracking, gold or zinc 500
- Section title: small, semibold, zinc 200
- Performance number: 30–36px, bold, tight tracking, white
- Derived pace or split: 14px, zinc 300, directly under the number
- Meta (date, source, age): 12px, zinc 400 (AA on near-black; zinc 500 failed 4.5:1)

One number should dominate each result. Do not give the label and the value the same size.

## Layout

- Athlete screens are mobile-first. Check 375, 390, and 430, then 768 and 1440.
- Page padding stays consistent with the existing athlete stack. Do not invent a second page width.
- Cards are quiet: border, slight elevation, padding. A card earns its box by grouping one idea.
- Coach admin is denser. Scan rows, not marketing tiles. Actions are text buttons in the row.

Avoid wrapping every line in its own rounded container.

## Data

- Show only real values.
- Empty means an honest sentence, not a chart of zeros.
- Loading and error are text states with one retry, not skeletons of fake metrics.
- Charts, when a later phase adds them, plot measured series. Label the unit. No decorative sparklines.

## Motion

Source: `components/athlete-command-centre/visual/motion.tsx` and CSS variables in `app/globals.css`.

| Token | Duration | Use |
| --- | --- | --- |
| `--h365-motion-fast` | 120ms | Hover / colour |
| `--h365-motion-base` | 160ms | Confirmation |
| `--h365-motion-enter` | 180ms | Enter fade + 4px translate |

Rules:

- Stay under 200ms. Ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- Completion can have one restrained confirmation (`SessionCompleteConfirm` / `CompletionConfirm`). No confetti, badges, or streak flames.
- Do not animate numbers up from zero if the value is a measured result.
- `prefers-reduced-motion: reduce` skips enter and confirm animation (`usePrefersReducedMotion`, `.h365-motion-enter`, `[data-h365-motion]`).
- Session drawer slide is 150ms and `motion-reduce:animate-none`.

## Status words

Use the product words: Current, Pending review, Approved, Coach verified, Historical.

Do not substitute "PB", "Optimised", or "On fire".

## Access

- Body text at least 14px on athlete pages.
- Controls at least 44px tall on touch screens.
- Do not use colour alone for Current versus Historical. Keep the word.
- Respect `prefers-reduced-motion` by skipping the enter transition.

## Athlete primitives

Reusable presentation only. Live in `components/athlete-command-centre/visual/`. They accept real data props and do not invent a metric.

| Component | Role |
| --- | --- |
| `PerformanceMetric` | One dominant value, optional derived pace/split, status word, meta |
| `MetricDelta` | Caller-formatted change string only. Hidden when empty |
| `ProgressChartCard` | Plots a supplied measured series. Empty = honest sentence |
| `BenchmarkCard` | Current / pending / historical result using `PerformanceMetric` |
| `TrainingSummary` | Caller-supplied week items. Empty = honest sentence |
| `SectionHeader` | Eyebrow + title + optional description |
| `StatusPill` | Product words only: Current, Pending review, Approved, Coach verified, Historical |
| `SessionTarget` | Duration, RPE, pace, split, HR — hide when the value is empty |

## Surface naming

- **Performance** (`/athlete/benchmarks`) — current programming anchors and history (Phase 1).
- **Performance testing** (`/athlete/performance-testing`) — testing-week protocol.

Do not mix the two titles.

Active Performance values dominate: label, large number, derived split, then the word Current. Pending review rows keep the same hierarchy with more padding. History keeps the status word.

## Environment badge

On staging / preview the badge is a reserved 24px strip at the top of the viewport (`--hybrid365-env-badge-height`). Athlete sticky headers use that offset. The label stays unmistakable. It must not cover athlete UI at 375–430px.

## Staging social prototypes

9:16 cards in `components/athlete-command-centre/visual/social/`. Staging / development galleries: `/athlete/visual-lab` (signed-in) and `/dev/visual-system` (local / staging, no athlete session).

- `SessionCompleteCard`
- `WeekInReviewCard`
- `PerformanceProgressCard` (`PerformanceProgressSocial` alias layout)
- `SessionCompleteSocial`, `WeekInReviewSocial`, `PerformanceProgressSocial`

Every card is labelled **Prototype** and **Demo — not a live athlete result**. Props come from `SOCIAL_PROTOTYPE_DEMO`. No export pipeline. Do not render these as a production athlete result.

## QA

`npx tsx scripts/qa-hyrox-visual-system.ts` checks primitive empty states, product status words, motion durations, reduced-motion hooks, contrast token pairs, 44px touch, badge offset, and prototype labelling. Viewports: 375, 390, 430, 768, 1440. Screenshots: `docs/visual-qa/`.
