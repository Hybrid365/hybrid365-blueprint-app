/**
 * Free-week track intent — display + homepage CTA routes only.
 * Does not affect programme generation. Generation still uses `challenge` where set.
 */

export type FreeWeekTrackId = "hyrox" | "run" | "hybrid";

export const FREE_WEEK_TRACK_CONFIRMATIONS: Record<
  FreeWeekTrackId,
  { label: string; body: string }
> = {
  hyrox: {
    label: "HYROX Performance selected",
    body: "We'll structure your free week around faster running, stronger stations and race performance.",
  },
  run: {
    label: "Run Performance selected",
    body: "We'll structure your free week around your target distance while protecting strength and muscle.",
  },
  hybrid: {
    label: "Strong. Fit. Fast. selected",
    body: "We'll structure your free week around strength, conditioning, body composition and hybrid fitness.",
  },
};

export function freeWeekTrackFromSearchParam(
  value: string | null
): FreeWeekTrackId | null {
  if (value === "hyrox" || value === "run" || value === "hybrid") return value;
  return null;
}

/**
 * Homepage CTAs.
 * `track` is for display confirmation.
 * HYROX also keeps `challenge=hyrox` so the existing HYROX form mode still activates
 * (generation logic unchanged — it does not read `track`).
 */
export const FREE_WEEK_ROUTES = {
  hyrox: "/free-week?track=hyrox&challenge=hyrox",
  run: "/free-week?track=run",
  hybrid: "/free-week?track=hybrid",
  default: "/free-week?track=hyrox&challenge=hyrox",
} as const;
