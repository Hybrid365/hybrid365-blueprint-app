import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { isSupabaseAuthCookieName } from "@/app/lib/supabase/apiRoute";
import {
  buildCookieStorageProbeReadDebug,
  type CookieStorageProbeReadDebug,
} from "@/app/lib/supabase/cookieProbe";
import {
  getSupabaseAuthStorageKey,
  isSupabaseAuthChunkCookieName,
  isSupabasePkceCodeVerifierCookieName,
} from "@/app/lib/supabase/persistSupabaseSessionCookies";

export type { CookieStorageProbeReadDebug };

export type MergedCookieEntry = { name: string; value: string };

export type AuthCookieSummary = {
  name: string;
  cookiesStoreLength: number;
  rawHeaderLength: number;
  requestLength: number;
  mergedLength: number;
  chosenSource: "cookies()" | "raw-header" | "request" | "none";
  startsWithBase64: boolean;
};

export type MergedCookieDebug = {
  cookiesStoreCount: number;
  cookiesStoreAuthTotalChars: number;
  rawHeaderChars: number;
  rawHeaderParsedCount: number;
  rawHeaderAuthTotalChars: number;
  requestCookieCount: number;
  requestAuthTotalChars: number;
  mergedCount: number;
  mergedAuthTotalChars: number;
  duplicateNamesDetected: boolean;
  duplicateNames: string[];
  authCookieSummaries: AuthCookieSummary[];
  primaryAuthTokenChosenSource: AuthCookieSummary["chosenSource"];
};

function decodeCookieValue(value: string): string {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Parse the raw Cookie request header (name=value pairs separated by ';'). */
export function parseRawCookieHeader(header: string): MergedCookieEntry[] {
  if (!header.trim()) return [];

  const result: MergedCookieEntry[] = [];
  let i = 0;

  while (i < header.length) {
    let end = header.indexOf(";", i);
    if (end === -1) end = header.length;
    const pair = header.slice(i, end).trim();
    const eq = pair.indexOf("=");
    if (eq > 0) {
      const name = pair.slice(0, eq).trim();
      const rawValue = pair.slice(eq + 1).trim();
      if (name) {
        result.push({ name, value: decodeCookieValue(rawValue) });
      }
    }
    i = end + 1;
  }

  return result;
}

function authTotalChars(list: { name: string; value?: string }[]): number {
  return list
    .filter((c) => isSupabaseAuthCookieName(c.name))
    .reduce((n, c) => n + (c.value?.length ?? 0), 0);
}

function shouldPreferValue(current: string, incoming: string): boolean {
  const curLen = current?.length ?? 0;
  const nextLen = incoming?.length ?? 0;
  if (nextLen === 0) return false;
  if (curLen === 0) return true;
  return nextLen > curLen;
}

type SourceKey = "cookies()" | "raw-header" | "request";

/**
 * Merge cookies from next/headers cookies(), Route Handler request.cookies, and raw Cookie header.
 * When the same name appears more than once, keep the longest non-empty value (never let empty
 * deletion placeholders overwrite a real session chunk).
 */
export function mergeAthleteRequestCookies(input: {
  cookieStore?: MergedCookieEntry[];
  requestCookies?: MergedCookieEntry[];
  rawCookieHeader?: string;
}): { cookies: MergedCookieEntry[]; debug: MergedCookieDebug } {
  const storeList = input.cookieStore ?? [];
  const requestList = input.requestCookies ?? [];
  const rawList = parseRawCookieHeader(input.rawCookieHeader ?? "");

  const lengthsByName = new Map<
    string,
    { value: string; lengths: Partial<Record<SourceKey, number>> }
  >();

  const ingest = (list: MergedCookieEntry[], source: SourceKey) => {
    for (const { name, value } of list) {
      const prev = lengthsByName.get(name);
      const len = value?.length ?? 0;
      const lengths: Partial<Record<SourceKey, number>> = { ...(prev?.lengths ?? {}), [source]: len };

      if (!prev) {
        lengthsByName.set(name, { value: value ?? "", lengths });
        continue;
      }

      const bestValue = shouldPreferValue(prev.value, value) ? value : prev.value;
      lengthsByName.set(name, { value: bestValue, lengths });
    }
  };

  ingest(storeList, "cookies()");
  ingest(requestList, "request");
  ingest(rawList, "raw-header");

  const cookies = Array.from(lengthsByName.entries()).map(([name, entry]) => ({
    name,
    value: entry.value,
  }));

  const duplicateNames: string[] = [];
  const authCookieSummaries: AuthCookieSummary[] = [];

  for (const [name, entry] of lengthsByName.entries()) {
    const sourcesWithData = (["cookies()", "raw-header", "request"] as SourceKey[]).filter(
      (s) => (entry.lengths[s] ?? 0) > 0
    );
    if (sourcesWithData.length > 1) duplicateNames.push(name);

    if (!isSupabaseAuthCookieName(name)) continue;

    const storeLen = entry.lengths["cookies()"] ?? 0;
    const rawLen = entry.lengths["raw-header"] ?? 0;
    const reqLen = entry.lengths.request ?? 0;
    const mergedLen = entry.value?.length ?? 0;

    let chosenSource: AuthCookieSummary["chosenSource"] = "none";
    if (mergedLen > 0) {
      if (mergedLen === rawLen && rawLen >= storeLen && rawLen >= reqLen) chosenSource = "raw-header";
      else if (mergedLen === storeLen && storeLen >= reqLen) chosenSource = "cookies()";
      else if (mergedLen === reqLen) chosenSource = "request";
      else chosenSource = "raw-header";
    }

    authCookieSummaries.push({
      name,
      cookiesStoreLength: storeLen,
      rawHeaderLength: rawLen,
      requestLength: reqLen,
      mergedLength: mergedLen,
      chosenSource,
      startsWithBase64: entry.value?.startsWith("base64-") ?? false,
    });
  }

  const primaryAuth = authCookieSummaries
    .filter((c) => c.name.includes("auth-token") && !c.name.includes("code-verifier"))
    .sort((a, b) => b.mergedLength - a.mergedLength)[0];

  return {
    cookies,
    debug: {
      cookiesStoreCount: storeList.length,
      cookiesStoreAuthTotalChars: authTotalChars(storeList),
      rawHeaderChars: input.rawCookieHeader?.length ?? 0,
      rawHeaderParsedCount: rawList.length,
      rawHeaderAuthTotalChars: authTotalChars(rawList),
      requestCookieCount: requestList.length,
      requestAuthTotalChars: authTotalChars(requestList),
      mergedCount: cookies.length,
      mergedAuthTotalChars: authTotalChars(cookies),
      duplicateNamesDetected: duplicateNames.length > 0,
      duplicateNames,
      authCookieSummaries,
      primaryAuthTokenChosenSource: primaryAuth?.chosenSource ?? "none",
    },
  };
}

/** Server Components / RSC — cookies() + raw Cookie header. */
export async function readAthletePortalCookies(): Promise<{
  cookies: MergedCookieEntry[];
  debug: MergedCookieDebug;
  mainAuth: MainAuthCookieReadDebug;
  storageProbe: CookieStorageProbeReadDebug;
}> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const rawCookieHeader = headerStore.get("cookie") ?? "";
  const merged = mergeAthleteRequestCookies({
    cookieStore: cookieStore.getAll(),
    rawCookieHeader,
  });
  const mainAuth = buildMainAuthCookieReadDebug(merged.cookies, merged.debug, rawCookieHeader);
  return {
    ...merged,
    mainAuth,
    storageProbe: buildCookieStorageProbeReadDebug(merged.cookies, mainAuth),
  };
}

export type MainAuthCookieReadDebug = {
  rawCookieHeaderNames: string[];
  mainAuthTokenName: string;
  mainAuthTokenExists: boolean;
  mainAuthTokenValueLength: number;
  sessionChunkCookieNames: string[];
  sessionChunkTotalChars: number;
  emptyMainAuthDuplicateDetected: boolean;
  codeVerifierCookiePresent: boolean;
  codeVerifierCookieNames: string[];
};

export function buildMainAuthCookieReadDebug(
  cookies: MergedCookieEntry[],
  debug: MergedCookieDebug,
  rawCookieHeader?: string
): MainAuthCookieReadDebug {
  const mainAuthTokenName = getSupabaseAuthStorageKey();
  const rawNames = parseRawCookieHeader(rawCookieHeader ?? "").map((c) => c.name);
  const mainEntry = cookies.find((c) => c.name === mainAuthTokenName);
  const mainSummary = debug.authCookieSummaries.find((c) => c.name === mainAuthTokenName);
  const storeLen = mainSummary?.cookiesStoreLength ?? 0;
  const headerLen = mainSummary?.rawHeaderLength ?? 0;
  const mergedLen = mainEntry?.value?.length ?? 0;

  const emptyMainAuthDuplicateDetected =
    Boolean(mainEntry) &&
    mergedLen === 0 &&
    (storeLen > 0 ||
      headerLen > 0 ||
      debug.duplicateNames.includes(mainAuthTokenName) ||
      rawNames.filter((n) => n === mainAuthTokenName).length > 1);

  const codeVerifierCookieNames = cookies
    .filter((c) => isSupabasePkceCodeVerifierCookieName(c.name))
    .map((c) => c.name);

  const sessionChunkCookies = cookies.filter((c) =>
    isSupabaseAuthChunkCookieName(c.name, mainAuthTokenName)
  );

  return {
    rawCookieHeaderNames: rawNames,
    mainAuthTokenName,
    mainAuthTokenExists: Boolean(mainEntry),
    mainAuthTokenValueLength: mergedLen,
    sessionChunkCookieNames: sessionChunkCookies.map((c) => c.name),
    sessionChunkTotalChars: sessionChunkCookies.reduce(
      (n, c) => n + (c.value?.length ?? 0),
      0
    ),
    emptyMainAuthDuplicateDetected,
    codeVerifierCookiePresent: codeVerifierCookieNames.length > 0,
    codeVerifierCookieNames,
  };
}

/** Route Handlers — request.cookies + cookies() + raw Cookie header. */
export async function readAthleteRouteHandlerCookies(
  request: NextRequest
): Promise<{ cookies: MergedCookieEntry[]; debug: MergedCookieDebug }> {
  const cookieStore = await cookies();
  return mergeAthleteRequestCookies({
    cookieStore: cookieStore.getAll(),
    requestCookies: request.cookies.getAll(),
    rawCookieHeader: request.headers.get("cookie") ?? "",
  });
}
