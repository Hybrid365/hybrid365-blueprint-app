/**
 * Target guards for staging scripts. Every staging write goes through assertStagingTarget.
 * Production is only ever read, and only through assertProductionSchemaRead.
 *
 * Staging project ref is NOT hard-coded to a single historical project.
 * Declare it via HYROX_STAGING_SUPABASE_REF (preferred) or derive from NEXT_PUBLIC_SUPABASE_URL
 * when HYROX_ENV=staging. Production ref is always refused.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Historical dead project — kept for docs/tests only; not the sole accepted staging target. */
export const LEGACY_STAGING_PROJECT_REF = "uluapwqohujavhlpucta";
export const PRODUCTION_PROJECT_REF = "uuqdgbsntdjhojjkjkgd";

export class GuardError extends Error {}

export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** `.env.local` from the repo root, overridden by the process env. */
export function loadLocalEnv(root = process.cwd()) {
  return { ...parseEnvFile(join(root, ".env.local")), ...process.env };
}

function normaliseUrl(value) {
  return (value ?? "").trim().replace(/\/+$/, "");
}

/** Project ref from https://<ref>.supabase.co */
export function supabaseUrlProjectRef(url) {
  const normalised = normaliseUrl(url);
  if (!normalised) return null;
  try {
    const host = new URL(normalised).hostname;
    const m = /^([a-z0-9]{20})\.supabase\.co$/i.exec(host);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/** Project ref from a Supabase Postgres URL: direct `db.<ref>.supabase.co` or pooler user `postgres.<ref>`. */
export function databaseProjectRef(databaseUrl) {
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new GuardError("Database URL is not a valid postgres:// URL.");
  }
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) throw new GuardError("Database URL must use postgres://.");
  const direct = parsed.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/);
  if (direct) return direct[1];
  if (/\.pooler\.supabase\.com$/.test(parsed.hostname)) {
    const user = decodeURIComponent(parsed.username);
    const pooled = user.match(/^[a-z_]+\.([a-z0-9]{20})$/);
    if (pooled) return pooled[1];
  }
  throw new GuardError("Database URL is not a recognisable Supabase host, so its project cannot be proven.");
}

/**
 * Resolve the declared staging project ref.
 * Prefer HYROX_STAGING_SUPABASE_REF; else derive from NEXT_PUBLIC_SUPABASE_URL.
 */
export function resolveStagingProjectRef(env) {
  const declared = (env.HYROX_STAGING_SUPABASE_REF ?? "").trim().toLowerCase();
  if (declared) {
    if (!/^[a-z0-9]{20}$/.test(declared)) {
      throw new GuardError("HYROX_STAGING_SUPABASE_REF must be a 20-character Supabase project ref.");
    }
    if (declared === PRODUCTION_PROJECT_REF) {
      throw new GuardError("HYROX_STAGING_SUPABASE_REF must not be the production project.");
    }
    return declared;
  }
  const fromUrl = supabaseUrlProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  if (fromUrl && fromUrl !== PRODUCTION_PROJECT_REF) return fromUrl;
  throw new GuardError(
    "Staging project ref is not declared. Set HYROX_STAGING_SUPABASE_REF to the new staging project ref."
  );
}

/**
 * Proves the env targets the declared staging project. Throws GuardError otherwise.
 * `needDatabase` also requires HYROX_STAGING_DATABASE_URL to resolve to that staging project.
 */
export function assertStagingTarget(env, { needDatabase = false, needServiceRole = false } = {}) {
  const problems = [];
  const url = normaliseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const productionUrl = normaliseUrl(env.HYROX_PRODUCTION_SUPABASE_URL);

  if (env.HYROX_ENV !== "staging") problems.push("HYROX_ENV must be exactly 'staging'.");
  if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is not set.");

  let stagingRef = null;
  try {
    stagingRef = resolveStagingProjectRef(env);
  } catch (error) {
    problems.push(error.message);
  }

  const urlRef = supabaseUrlProjectRef(url);
  if (url && stagingRef && urlRef !== stagingRef) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL does not match HYROX_STAGING_SUPABASE_REF / declared staging project.");
  }
  if (url.includes(PRODUCTION_PROJECT_REF) || urlRef === PRODUCTION_PROJECT_REF) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is the production project.");
  }
  if (productionUrl && url === productionUrl) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL matches HYROX_PRODUCTION_SUPABASE_URL.");
  }
  if (stagingRef === PRODUCTION_PROJECT_REF) {
    problems.push("Declared staging ref is the production project.");
  }
  if (needServiceRole && !env.SUPABASE_SERVICE_ROLE_KEY) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  if (needDatabase) {
    const databaseUrl = env.HYROX_STAGING_DATABASE_URL ?? "";
    if (!databaseUrl) {
      problems.push("HYROX_STAGING_DATABASE_URL is not set.");
    } else if (databaseUrl.includes(PRODUCTION_PROJECT_REF)) {
      problems.push("HYROX_STAGING_DATABASE_URL points at the production project.");
    } else if (stagingRef) {
      try {
        if (databaseProjectRef(databaseUrl) !== stagingRef) {
          problems.push("HYROX_STAGING_DATABASE_URL is not the declared staging project.");
        }
      } catch (error) {
        problems.push(error.message);
      }
    }
  }

  if (problems.length) {
    throw new GuardError(`Refusing: target is not proven to be hybrid365-staging.\n- ${problems.join("\n- ")}`);
  }
  return { url, projectRef: stagingRef, databaseUrl: env.HYROX_STAGING_DATABASE_URL };
}

/** Live proof: the service-role key is accepted by the staging project's auth admin API. */
export async function proveStagingServiceRole(env) {
  const { url } = assertStagingTarget(env, { needServiceRole: true });
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${url}/auth/v1/admin/users?per_page=1`, { headers });
  if (!response.ok) {
    throw new GuardError(`Refusing: staging rejected SUPABASE_SERVICE_ROLE_KEY (HTTP ${response.status}).`);
  }
}

/** Production may only be read for structure, from its own untracked file, never from `.env.local`. */
export function assertProductionSchemaRead(databaseUrl) {
  if (!databaseUrl) throw new GuardError("HYROX_PRODUCTION_SCHEMA_READ_URL is not set.");
  if (databaseProjectRef(databaseUrl) !== PRODUCTION_PROJECT_REF) {
    throw new GuardError("HYROX_PRODUCTION_SCHEMA_READ_URL is not the production project; refusing to label it a production baseline.");
  }
  return databaseUrl;
}

export function redactDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.protocol}//${decodeURIComponent(parsed.username) || "?"}:***@${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "<unparseable>";
  }
}

/** @deprecated Use resolveStagingProjectRef / LEGACY_STAGING_PROJECT_REF. */
export const STAGING_PROJECT_REF = LEGACY_STAGING_PROJECT_REF;
/** @deprecated Prefer constructing from resolveStagingProjectRef(env). */
export const STAGING_SUPABASE_URL = `https://${LEGACY_STAGING_PROJECT_REF}.supabase.co`;
