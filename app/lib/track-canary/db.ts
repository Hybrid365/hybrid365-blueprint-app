import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import { trackStagingWriteAllowed } from "@/app/lib/track-loop/flags";

const STAGING_ENV = "/Users/kieranhiggs/hybrid365-hyrox-visual-system-v0/.env.local";

export const CANARY_ATHLETE_ID = "a11ce365-0000-4000-8000-0000000000c1";
export const CANARY_EMAIL = "alex.hale.track-canary@hybrid365.test";
export const CANARY_NAME = "Alex Hale";

function parseEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

export function canaryDb(): SupabaseClient {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Track staging is closed in production.");
  }
  const file = parseEnv(STAGING_ENV);
  const url = file.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = new URL(url).host.split(".")[0] ?? "";
  const allowed = trackStagingWriteAllowed(
    {
      NEXT_PUBLIC_SUPABASE_URL: url,
      HYROX_STAGING_SUPABASE_REF: file.HYROX_STAGING_SUPABASE_REF,
      HYROX_ENV: "staging",
      HYROX_TRACK_STAGING_WRITE: "1",
      HYROX_TRACK_CANARY_ATHLETE_IDS: CANARY_ATHLETE_ID,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    CANARY_ATHLETE_ID
  );
  if (!allowed || ref !== "bfwboqaovirzjpxpwgty") {
    throw new Error("Track staging target refused.");
  }
  const key = file.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Track staging is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
