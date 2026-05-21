import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { listHyroxApplications } from "@/app/lib/hyroxApplicationCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  buildHyroxApplicationInsertRow,
  isMissingRawPayloadColumnError,
  mapApplyFormFieldsToSubmitBody,
  normalizeApplicationSubmitInput,
  shouldIncludeApplicationRawPayload,
  validateApplicationSubmit,
  type HyroxApplicationSubmitBody,
} from "@/app/lib/hyroxApplicationSubmit";
import type { HyroxApplicationRow } from "@/app/lib/hyroxDatabaseTypes";

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

function insertFailedResponse(detail: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: "APPLICATION_INSERT_FAILED",
      detail,
    },
    { status }
  );
}

/** Public application submit from /hyrox-team/apply */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Hyrox application insert failed: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return insertFailedResponse("Supabase is not configured on the server.");
  }

  let body: HyroxApplicationSubmitBody;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as HyroxApplicationSubmitBody | Record<string, string>;
    body = normalizeApplicationSubmitInput(json);
  } else if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await request.formData();
    const fields: Record<string, string> = {};
    form.forEach((value, key) => {
      if (typeof value === "string" && !key.startsWith("_")) {
        fields[key] = value;
      }
    });
    body = mapApplyFormFieldsToSubmitBody(fields);
  } else {
    return badRequest("Unsupported content type.");
  }

  const validated = validateApplicationSubmit(body);
  if (!validated.ok) {
    return badRequest(validated.error);
  }

  const supabase = await createClient();

  async function attemptInsert(includeRawPayload: boolean) {
    const row = buildHyroxApplicationInsertRow(body, { includeRawPayload });
    return supabase.from("hyrox_applications").insert(row);
  }

  let includeRawPayload = shouldIncludeApplicationRawPayload();
  let { error } = await attemptInsert(includeRawPayload);

  if (error && includeRawPayload && isMissingRawPayloadColumnError(error.message)) {
    console.error(
      "Hyrox application insert failed: raw_payload column missing. Apply supabase/migrations/003_hyrox_applications_raw_payload.sql in Supabase, or set HYROX_APPLICATIONS_RAW_PAYLOAD=false in .env.local"
    );
    includeRawPayload = false;
    ({ error } = await attemptInsert(false));
  }

  if (error) {
    console.error("Hyrox application insert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return insertFailedResponse(error.message);
  }

  return NextResponse.json({
    success: true,
    status: "submitted",
  });
}

/** Coach list — live applications from Supabase (all statuses, newest first). */
export async function GET() {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { client: supabase, mode } = await createCoachServerClient();
  const { applications, error } = await listHyroxApplications(supabase);

  if (error) {
    console.error("Hyrox application list failed", {
      message: error,
      coachSupabaseMode: mode,
    });
    return NextResponse.json(
      {
        success: false,
        error,
        applications: [] as HyroxApplicationRow[],
        live: false,
        count: 0,
      },
      { status: 500 }
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Loaded hyrox applications", applications.length, {
      coachSupabaseMode: mode,
      statuses: applications.map((a) => a.status),
    });
  }

  let warning: string | undefined;
  if (applications.length === 0 && mode === "session") {
    warning =
      "No applications returned. Your login may not have profiles.role coach/admin in Supabase (RLS blocks reads). Set your profile role to coach, or add SUPABASE_SERVICE_ROLE_KEY for server-side coach reads.";
  }

  return NextResponse.json({
    success: true,
    live: true,
    applications,
    count: applications.length,
    coachSupabaseMode: mode,
    ...(warning ? { warning } : {}),
  });
}
