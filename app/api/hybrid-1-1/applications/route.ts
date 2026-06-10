import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { listHybrid11Applications } from "@/app/lib/hybrid11ApplicationCoachDb";
import { tagHybrid11ApplicantInKit } from "@/app/lib/hybrid11KitTag";
import {
  mapHybrid11FormToSubmitBody,
  normalizeHybrid11SubmitInput,
  validateHybrid11ApplicationSubmit,
  type Hybrid11ApplicationSubmitBody,
} from "@/app/lib/hybrid11ApplicationSubmit";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { Hybrid11ApplicationRow } from "@/app/lib/hybrid11DatabaseTypes";

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

function insertFailedResponse(detail: string, status = 500) {
  return NextResponse.json(
    { success: false, error: "APPLICATION_INSERT_FAILED", detail },
    { status }
  );
}

/** Public application submit from /one-to-one-coaching/apply */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Hybrid 1-1 application insert failed: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return insertFailedResponse("Supabase is not configured on the server.");
  }

  let body: Hybrid11ApplicationSubmitBody;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Hybrid11ApplicationSubmitBody | Record<string, string>;
    body = normalizeHybrid11SubmitInput(json);
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
    body = mapHybrid11FormToSubmitBody(fields);
  } else {
    return badRequest("Unsupported content type.");
  }

  const validated = validateHybrid11ApplicationSubmit(body);
  if (!validated.ok) {
    return badRequest(validated.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hybrid_1_1_applications").insert(validated.row);

  if (error) {
    console.error("Hybrid 1-1 application insert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return insertFailedResponse(error.message);
  }

  try {
    const firstName = validated.row.full_name.split(/\s+/)[0] ?? validated.row.full_name;
    await tagHybrid11ApplicantInKit(validated.row.email, firstName);
  } catch (kitErr) {
    console.warn("[hybrid-1-1] Kit tagging error (non-blocking):", kitErr);
  }

  return NextResponse.json({ success: true, status: "new" });
}

/** Coach list — all Hybrid 1-1 applications, newest first. */
export async function GET() {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { client: supabase, mode } = await createCoachServerClient();
  const { applications, error } = await listHybrid11Applications(supabase);

  if (error) {
    console.error("Hybrid 1-1 application list failed", { message: error, coachSupabaseMode: mode });
    return NextResponse.json(
      {
        success: false,
        error,
        applications: [] as Hybrid11ApplicationRow[],
        live: false,
        count: 0,
      },
      { status: 500 }
    );
  }

  let warning: string | undefined;
  if (applications.length === 0 && mode === "session") {
    warning =
      "No applications returned. Ensure migration 013 is applied and you are signed in as coach/admin.";
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
