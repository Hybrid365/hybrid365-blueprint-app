import type { Hybrid11ApplicationInsert, Hybrid11Json } from "@/app/lib/hybrid11DatabaseTypes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Hybrid11ApplicationSubmitBody = {
  full_name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  age?: string | number;
  location?: string;
  occupation?: string;
  main_goal?: string;
  body_composition_goal?: string;
  performance_goal?: string;
  target_outcome?: string;
  reason_for_applying?: string;
  training_background?: Hybrid11Json;
  benchmarks?: Hybrid11Json;
  availability?: Hybrid11Json;
  nutrition_lifestyle?: Hybrid11Json;
  injuries_limitations?: Hybrid11Json;
  coaching_fit?: Hybrid11Json;
  consent?: Hybrid11Json;
  raw_payload?: Hybrid11Json;
};

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length ? t : null;
}

function jsonObject(value: unknown): Hybrid11Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Hybrid11Json = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v == null) continue;
    if (typeof v === "string") {
      const s = v.trim();
      if (s) out[k] = s;
    } else if (typeof v === "boolean" || typeof v === "number") {
      out[k] = v;
    }
  }
  return out;
}

function parseAge(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 13 || n > 100) return null;
  return n;
}

export function normalizeInstagram(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v.startsWith("@") ? v.slice(1) : v;
}

const TRAINING_KEYS = [
  "current_training_split",
  "training_age",
  "current_weekly_training_days",
  "current_weekly_training_hours",
  "current_running_volume",
  "gym_strength_experience",
  "conditioning_experience",
  "sports_events",
] as const;

const BENCHMARK_KEYS = [
  "five_k_time",
  "ten_k_time",
  "easy_run_pace",
  "squat",
  "deadlift",
  "bench",
  "pull_up",
  "bodyweight",
  "progress_photos_available",
  "conditioning_benchmarks",
] as const;

const AVAILABILITY_KEYS = [
  "days_available",
  "preferred_training_days",
  "double_sessions",
  "gym_access",
  "equipment_available",
  "work_schedule",
] as const;

const NUTRITION_KEYS = [
  "current_nutrition_approach",
  "biggest_nutrition_struggle",
  "sleep_quality",
  "stress_level",
  "recovery_confidence",
  "alcohol_social",
] as const;

const INJURY_KEYS = [
  "current_injuries",
  "previous_injuries",
  "movements_to_avoid",
  "limitations",
] as const;

const COACHING_FIT_KEYS = [
  "need_most_from_coach",
  "weekly_checkins_willing",
  "track_progress_willing",
  "athlete_dashboard_happy",
  "team_meetups_interest",
  "anything_else",
] as const;

const CONSENT_KEYS = [
  "information_accurate",
  "consent_contact",
  "content_documentation_consent",
] as const;

function pickSection(
  fields: Record<string, string>,
  keys: readonly string[]
): Hybrid11Json {
  const out: Hybrid11Json = {};
  for (const key of keys) {
    const v = str(fields[key]);
    if (v) out[key] = v;
  }
  return out;
}

function pickConsent(fields: Record<string, string>): Hybrid11Json {
  const out: Hybrid11Json = {};
  if (fields.consent_information_accurate === "yes") out.information_accurate = true;
  if (fields.consent_contact === "yes") out.consent_contact = true;
  if (fields.consent_content_documentation === "yes") out.content_documentation_consent = true;
  return out;
}

/** Map flat form fields to structured submit body. */
export function mapHybrid11FormToSubmitBody(
  fields: Record<string, string>
): Hybrid11ApplicationSubmitBody {
  const raw_payload: Hybrid11Json = {};
  const known = new Set([
    "full_name",
    "email",
    "phone",
    "instagram",
    "age",
    "location",
    "occupation",
    "main_goal",
    "body_composition_goal",
    "performance_goal",
    "target_outcome",
    "reason_for_applying",
    "consent_information_accurate",
    "consent_contact",
    "consent_content_documentation",
    ...TRAINING_KEYS,
    ...BENCHMARK_KEYS,
    ...AVAILABILITY_KEYS,
    ...NUTRITION_KEYS,
    ...INJURY_KEYS,
    ...COACHING_FIT_KEYS,
  ]);

  for (const [k, v] of Object.entries(fields)) {
    if (!known.has(k) && str(v)) raw_payload[k] = str(v)!;
  }

  return {
    full_name: str(fields.full_name) ?? undefined,
    email: str(fields.email)?.toLowerCase() ?? undefined,
    phone: str(fields.phone) ?? undefined,
    instagram: normalizeInstagram(fields.instagram) ?? undefined,
    age: fields.age,
    location: str(fields.location) ?? undefined,
    occupation: str(fields.occupation) ?? undefined,
    main_goal: str(fields.main_goal) ?? undefined,
    body_composition_goal: str(fields.body_composition_goal) ?? undefined,
    performance_goal: str(fields.performance_goal) ?? undefined,
    target_outcome: str(fields.target_outcome) ?? undefined,
    reason_for_applying: str(fields.reason_for_applying) ?? undefined,
    training_background: pickSection(fields, TRAINING_KEYS),
    benchmarks: pickSection(fields, BENCHMARK_KEYS),
    availability: pickSection(fields, AVAILABILITY_KEYS),
    nutrition_lifestyle: pickSection(fields, NUTRITION_KEYS),
    injuries_limitations: pickSection(fields, INJURY_KEYS),
    coaching_fit: pickSection(fields, COACHING_FIT_KEYS),
    consent: pickConsent(fields),
    raw_payload: Object.keys(raw_payload).length ? raw_payload : undefined,
  };
}

export function normalizeHybrid11SubmitInput(
  input: Hybrid11ApplicationSubmitBody | Record<string, string>
): Hybrid11ApplicationSubmitBody {
  const rec = input as Record<string, unknown>;
  if ("full_name" in rec && typeof rec.full_name === "string") {
    const stringFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === "string") stringFields[k] = v;
    }
    return mapHybrid11FormToSubmitBody(stringFields);
  }

  return {
    ...(input as Hybrid11ApplicationSubmitBody),
    email: str(input.email)?.toLowerCase() ?? undefined,
    instagram: normalizeInstagram(input.instagram) ?? undefined,
    training_background: jsonObject(input.training_background),
    benchmarks: jsonObject(input.benchmarks),
    availability: jsonObject(input.availability),
    nutrition_lifestyle: jsonObject(input.nutrition_lifestyle),
    injuries_limitations: jsonObject(input.injuries_limitations),
    coaching_fit: jsonObject(input.coaching_fit),
    consent: jsonObject(input.consent),
  };
}

export function buildHybrid11ApplicationInsertRow(
  body: Hybrid11ApplicationSubmitBody
): Hybrid11ApplicationInsert {
  return {
    full_name: str(body.full_name)!,
    email: str(body.email)!,
    phone: str(body.phone),
    instagram: normalizeInstagram(body.instagram ?? undefined),
    age: parseAge(body.age),
    location: str(body.location),
    occupation: str(body.occupation),
    application_type: "hybrid_1_1",
    track: "hybrid_performance",
    status: "new",
    main_goal: str(body.main_goal),
    body_composition_goal: str(body.body_composition_goal),
    performance_goal: str(body.performance_goal),
    target_outcome: str(body.target_outcome),
    reason_for_applying: str(body.reason_for_applying),
    training_background: jsonObject(body.training_background),
    benchmarks: jsonObject(body.benchmarks),
    availability: jsonObject(body.availability),
    nutrition_lifestyle: jsonObject(body.nutrition_lifestyle),
    injuries_limitations: jsonObject(body.injuries_limitations),
    coaching_fit: jsonObject(body.coaching_fit),
    consent: jsonObject(body.consent),
    raw_payload: jsonObject(body.raw_payload),
    coach_notes: null,
  };
}

export function validateHybrid11ApplicationSubmit(
  body: Hybrid11ApplicationSubmitBody
): { ok: true; row: Hybrid11ApplicationInsert } | { ok: false; error: string } {
  const fullName = str(body.full_name);
  if (!fullName) return { ok: false, error: "Full name is required." };

  const email = str(body.email);
  if (!email) return { ok: false, error: "Email is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  if (!str(body.main_goal)) return { ok: false, error: "Main goal is required." };

  const trainingDays =
    str(body.training_background?.current_weekly_training_days as string | undefined) ??
    str((body as Record<string, unknown>).current_weekly_training_days as string | undefined);
  if (!trainingDays) {
    return { ok: false, error: "Current weekly training days is required." };
  }

  if (!str(body.reason_for_applying)) {
    return { ok: false, error: "Please tell us why you want 1-1 coaching." };
  }

  const consent = jsonObject(body.consent);
  if (consent.information_accurate !== true) {
    return { ok: false, error: "Please confirm your information is accurate." };
  }
  if (consent.consent_contact !== true) {
    return { ok: false, error: "Please consent to be contacted about your application." };
  }

  return { ok: true, row: buildHybrid11ApplicationInsertRow(body) };
}
