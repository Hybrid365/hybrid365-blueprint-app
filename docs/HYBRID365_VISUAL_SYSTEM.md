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
- Meta (date, source, age): 12px, zinc 500

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

- Short opacity or translate on enter, under 200ms.
- Completion can have one restrained confirmation. No confetti, badges, or streak flames.
- Do not animate numbers up from zero if the value is a measured result.

## Status words

Use the product words: Current, Pending review, Approved, Coach verified, Historical.

Do not substitute "PB", "Optimised", or "On fire".

## Access

- Body text at least 14px on athlete pages.
- Controls at least 44px tall on touch screens.
- Do not use colour alone for Current versus Historical. Keep the word.
- Respect `prefers-reduced-motion` by skipping the enter transition.
