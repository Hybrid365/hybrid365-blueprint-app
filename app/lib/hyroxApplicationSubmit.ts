import type { HyroxApplicationInsert, HyroxJson } from "@/app/lib/hyroxDatabaseTypes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type HyroxApplicationSubmitBody = {
  name?: string;
  email?: string;
  instagram_handle?: string;
  phone?: string;
  hyrox_experience?: string;
  current_level?: string;
  target_event?: string;
  target_date?: string | null;
  goal?: string;
  reason_for_applying?: string;
  documentation_interest?: boolean;
  raw_payload?: HyroxJson;
};

export function normalizeInstagramHandle(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v.startsWith("@") ? v.slice(1) : v;
}

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length ? t : null;
}

/** Resolve applicant name from form or API field aliases. */
export function resolveApplicationName(fields: Record<string, unknown>): string | null {
  return (
    str(fields.name) ??
    str(fields.fullName) ??
    str(fields.full_name) ??
    null
  );
}

export function resolveApplicationEmail(fields: Record<string, unknown>): string | null {
  const email = str(fields.email);
  return email ? email.toLowerCase() : null;
}

export function resolveApplicationInstagram(fields: Record<string, unknown>): string | null {
  const raw =
    str(fields.instagram_handle) ??
    str(fields.instagramHandle) ??
    str(fields.instagram);
  return raw ? normalizeInstagramHandle(raw) : null;
}

/** Map /hyrox-team/apply form field names to API payload. */
export function mapApplyFormFieldsToSubmitBody(
  fields: Record<string, string>
): HyroxApplicationSubmitBody {
  const documented = fields.documented?.trim().toLowerCase();
  const raw_payload: HyroxJson = {};

  const extras: Record<string, string | undefined> = {
    location: fields.location,
    hyrox_pb: fields.hyrox_pb,
    five_km_time: fields.five_km_time,
    weekly_training: fields.weekly_training,
    weakness: fields.weakness,
    training_history: fields.training_history,
    team_training: fields.team_training,
    source: fields.source,
    consent: fields.consent ? "yes" : undefined,
    documented_preference: fields.documented,
  };

  for (const [k, v] of Object.entries(extras)) {
    const s = str(v);
    if (s) raw_payload[k] = s;
  }

  const currentLevel =
    str(fields.hyrox_pb) ??
    str(fields.five_km_time) ??
    null;

  const asUnknown = fields as Record<string, unknown>;

  return {
    name: resolveApplicationName(asUnknown) ?? undefined,
    email: resolveApplicationEmail(asUnknown) ?? undefined,
    instagram_handle: resolveApplicationInstagram(asUnknown) ?? undefined,
    hyrox_experience: str(fields.hyrox_experience) ?? undefined,
    current_level: currentLevel ?? undefined,
    target_event: str(fields.upcoming_race) ?? undefined,
    goal: str(fields.main_goal) ?? undefined,
    reason_for_applying: str(fields.why_join) ?? undefined,
    documentation_interest: documented === "yes",
    raw_payload: Object.keys(raw_payload).length ? raw_payload : undefined,
  };
}

/** Normalize JSON/form payloads before validation. */
export function normalizeApplicationSubmitInput(
  input: HyroxApplicationSubmitBody | Record<string, string>
): HyroxApplicationSubmitBody {
  const rec = input as Record<string, unknown>;
  const hasFormShape =
    "name" in rec ||
    "full_name" in rec ||
    "fullName" in rec ||
    "main_goal" in rec ||
    "why_join" in rec ||
    "hyrox_pb" in rec;

  const nameFromInput = resolveApplicationName(rec);
  if (hasFormShape || !nameFromInput) {
    const stringFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === "string") stringFields[k] = v;
    }
    return mapApplyFormFieldsToSubmitBody(stringFields);
  }

  return {
    ...(input as HyroxApplicationSubmitBody),
    name: nameFromInput ?? undefined,
    email: resolveApplicationEmail(rec) ?? undefined,
    instagram_handle: resolveApplicationInstagram(rec) ?? undefined,
  };
}

/** Parse optional target date — empty/invalid free text → null (form does not collect ISO dates). */
export function parseApplicationTargetDate(value: unknown): string | null {
  if (value == null) return null;
  const d = String(value).trim();
  if (!d) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return d;
}

export function shouldIncludeApplicationRawPayload(): boolean {
  const flag = process.env.HYROX_APPLICATIONS_RAW_PAYLOAD?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return true;
}

export function isMissingRawPayloadColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("raw_payload") && (m.includes("column") || m.includes("schema cache"));
}

/** Insert row — only columns on hyrox_applications (001 + optional 003 raw_payload). */
export function buildHyroxApplicationInsertRow(
  body: HyroxApplicationSubmitBody,
  options?: { includeRawPayload?: boolean }
): HyroxApplicationInsert {
  const includeRawPayload = options?.includeRawPayload ?? shouldIncludeApplicationRawPayload();

  const row: HyroxApplicationInsert = {
    name: resolveApplicationName(body as Record<string, unknown>)!,
    email: resolveApplicationEmail(body as Record<string, unknown>)!,
    instagram_handle: resolveApplicationInstagram(body as Record<string, unknown>),
    phone: str(body.phone),
    hyrox_experience: str(body.hyrox_experience),
    current_level: str(body.current_level),
    target_event: str(body.target_event),
    target_date: parseApplicationTargetDate(body.target_date),
    goal: str(body.goal),
    reason_for_applying: str(body.reason_for_applying),
    documentation_interest: body.documentation_interest === true,
    status: "submitted",
  };

  if (
    includeRawPayload &&
    body.raw_payload &&
    typeof body.raw_payload === "object" &&
    Object.keys(body.raw_payload).length > 0
  ) {
    row.raw_payload = body.raw_payload;
  }

  return row;
}

export function validateApplicationSubmit(
  body: HyroxApplicationSubmitBody
): { ok: true; row: HyroxApplicationInsert } | { ok: false; error: string } {
  const name = resolveApplicationName(body as Record<string, unknown>);
  if (!name) return { ok: false, error: "Full name is required." };

  const email = resolveApplicationEmail(body as Record<string, unknown>);
  if (!email) return { ok: false, error: "Email is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  if (body.target_date != null && String(body.target_date).trim()) {
    const parsed = parseApplicationTargetDate(body.target_date);
    if (!parsed) {
      return {
        ok: false,
        error: "target_date must be YYYY-MM-DD when provided.",
      };
    }
  }

  return {
    ok: true,
    row: buildHyroxApplicationInsertRow(body),
  };
}
