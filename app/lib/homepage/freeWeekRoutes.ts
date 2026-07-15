/** Homepage free-week CTA routes — uses existing free-week params only. */

/** Existing free-week challenge modes — do not invent unsupported query keys. */
export const FREE_WEEK_ROUTES = {
  hyrox: "/free-week?challenge=hyrox",
  run: "/free-week",
  hybrid: "/free-week",
  default: "/free-week?challenge=hyrox",
} as const;
