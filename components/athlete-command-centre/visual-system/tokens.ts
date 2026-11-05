/**
 * Semantic tokens for the v0-derived athlete visual system.
 * Prefer these class helpers / CSS vars over raw hex in components.
 */

export const vsSurface =
  "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)]";
export const vsSurfaceRaised =
  "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface-raised)]";
export const vsHairline = "border-[var(--h365-hairline)]";
export const vsLabelCaps =
  "label-caps text-[var(--h365-text-muted)]";
export const vsDisplay =
  "font-display font-semibold uppercase tracking-wide text-[var(--h365-text)]";
export const vsMetric =
  "font-display font-semibold leading-none num text-[var(--h365-text)]";
export const vsTouch = "min-h-11 min-w-11";

/** Session / Home D card states — not benchmark pills. */
export const SESSION_STATUS_LABELS = {
  upcoming: "Upcoming",
  completed: "Completed",
  partial: "Partial",
  missed: "Missed",
  unresolved: "Not logged",
} as const;

export type SessionStatusKey = keyof typeof SESSION_STATUS_LABELS;
