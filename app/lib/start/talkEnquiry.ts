/** Coaching enquiry validation and insert mapping for /start and /start/talk. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_HANDLE_RE = /^[A-Za-z0-9._]{2,30}$/;

const MAX = {
  first_name: 80,
  instagram_handle: 32,
  goal: 2000,
  email: 254,
  hyrox_pb: 80,
  next_race: 200,
  source: 80,
  attributionValue: 200,
  landingPath: 300,
} as const;

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "landing_path",
] as const;

/** Stored on first-HYROX / no-PB start-funnel submissions. Schema unchanged. */
export const FIRST_HYROX_LEVEL_VALUE = "First HYROX / no PB yet";

export const COACHING_ENQUIRY_SOURCE = {
  talkToKieran: "talk_to_kieran",
  startFunnel: "start_funnel",
} as const;

export type CoachingEnquirySource =
  (typeof COACHING_ENQUIRY_SOURCE)[keyof typeof COACHING_ENQUIRY_SOURCE];

const ALLOWED_SOURCES = new Set<string>(Object.values(COACHING_ENQUIRY_SOURCE));

export type TalkEnquiryInput = {
  first_name?: string;
  instagram_handle?: string;
  main_goal?: string;
  goal?: string;
  email?: string;
  hyrox_pb?: string;
  current_hyrox_pb?: string;
  next_race?: string;
  source?: string;
  attribution?: unknown;
  /** Honeypot — must stay empty. */
  company_website?: string;
};

export type ValidateTalkEnquiryOptions = {
  /** When true, current HYROX PB or first-HYROX marker is required. */
  requireCurrentHyroxLevel?: boolean;
};

export type TalkEnquiryPayload = {
  first_name: string;
  instagram_handle: string;
  goal: string;
  email: string | null;
  current_hyrox_pb: string | null;
  next_race: string | null;
  source: CoachingEnquirySource;
  attribution: Record<string, string> | null;
};

export type CoachingEnquiryInsertRow = {
  first_name: string;
  instagram_handle: string;
  goal: string;
  email: string | null;
  current_hyrox_pb: string | null;
  next_race: string | null;
  source: CoachingEnquirySource;
  attribution: Record<string, string> | null;
  status: "new";
};

/** Server-side allowlist only. Unknown / missing values default to talk_to_kieran. */
export function resolveCoachingEnquirySource(raw: unknown): CoachingEnquirySource {
  const value = trim(raw);
  if (value && ALLOWED_SOURCES.has(value)) {
    return value as CoachingEnquirySource;
  }
  return COACHING_ENQUIRY_SOURCE.talkToKieran;
}

function trim(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next.length ? next : null;
}

function tooLong(value: string, max: number) {
  return value.length > max;
}

/** Store as @handle. Accepts handle, @handle, or an Instagram profile URL. */
export function normalizeInstagramHandle(value: string): string | null {
  let trimmed = value.trim();
  if (!trimmed) return null;

  trimmed = trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  trimmed = trimmed.replace(/[/?#].*$/, "").trim();
  trimmed = trimmed.replace(/^@+/, "").trim();
  if (!INSTAGRAM_HANDLE_RE.test(trimmed)) return null;

  return `@${trimmed.toLowerCase()}`;
}

export function sanitizeAttribution(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const out: Record<string, string> = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = trim(record[key]);
    if (!value) continue;
    const max = key === "landing_path" ? MAX.landingPath : MAX.attributionValue;
    out[key] = value.slice(0, max);
  }

  return Object.keys(out).length ? out : null;
}

export function isTalkEnquiryHoneypotTriggered(input: TalkEnquiryInput): boolean {
  return Boolean(trim(input.company_website));
}

export function validateTalkEnquiry(
  input: TalkEnquiryInput,
  options: ValidateTalkEnquiryOptions = {}
): { ok: true; data: TalkEnquiryPayload } | { ok: false; error: string } {
  const first_name = trim(input.first_name);
  const instagramRaw = trim(input.instagram_handle);
  const goal = trim(input.main_goal) ?? trim(input.goal);
  const email = trim(input.email)?.toLowerCase() ?? null;
  const current_hyrox_pb = trim(input.current_hyrox_pb) ?? trim(input.hyrox_pb);
  const next_race = trim(input.next_race);
  const source = resolveCoachingEnquirySource(input.source);
  const attribution = sanitizeAttribution(input.attribution);
  /** HYROX PB is optional on the pathway selector; Talk to Kieran also keeps it optional. */
  const requireCurrentHyroxLevel = options.requireCurrentHyroxLevel ?? false;

  if (!first_name) return { ok: false, error: "Please add your first name." };
  if (tooLong(first_name, MAX.first_name)) return { ok: false, error: "Please use a shorter first name." };

  if (!instagramRaw) return { ok: false, error: "Please add your Instagram handle." };
  const instagram_handle = normalizeInstagramHandle(instagramRaw);
  if (!instagram_handle) {
    return { ok: false, error: "Please add a valid Instagram handle." };
  }

  if (!goal) return { ok: false, error: "Please add your main training goal." };
  if (tooLong(goal, MAX.goal)) return { ok: false, error: "Please shorten your training goal." };

  if (email) {
    if (tooLong(email, MAX.email) || !EMAIL_RE.test(email)) {
      return { ok: false, error: "Please add a valid email, or leave it blank." };
    }
  }

  if (requireCurrentHyroxLevel && !current_hyrox_pb) {
    return { ok: false, error: "Please add your current HYROX level." };
  }
  if (current_hyrox_pb && tooLong(current_hyrox_pb, MAX.hyrox_pb)) {
    return { ok: false, error: "Please shorten your HYROX PB." };
  }
  if (next_race && tooLong(next_race, MAX.next_race)) {
    return { ok: false, error: "Please shorten your next race details." };
  }

  return {
    ok: true,
    data: {
      first_name,
      instagram_handle,
      goal,
      email,
      current_hyrox_pb,
      next_race,
      source,
      attribution,
    },
  };
}

export function buildCoachingEnquiryInsertRow(data: TalkEnquiryPayload): CoachingEnquiryInsertRow {
  return {
    first_name: data.first_name,
    instagram_handle: data.instagram_handle,
    goal: data.goal,
    email: data.email,
    current_hyrox_pb: data.current_hyrox_pb,
    next_race: data.next_race,
    source: data.source,
    attribution: data.attribution,
    status: "new",
  };
}
