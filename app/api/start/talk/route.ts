import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  buildCoachingEnquiryInsertRow,
  isTalkEnquiryHoneypotTriggered,
  validateTalkEnquiry,
  type TalkEnquiryInput,
} from "@/app/lib/start/talkEnquiry";

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

function insertFailedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Couldn't send your details just yet. Please try again shortly.",
    },
    { status: 500 }
  );
}

function silentAccept() {
  return NextResponse.json({ success: true });
}

/** Public Talk to Kieran enquiry from /start/talk. */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Talk enquiry insert failed: missing Supabase env");
    return insertFailedResponse();
  }

  let body: TalkEnquiryInput;
  try {
    body = (await request.json()) as TalkEnquiryInput;
  } catch {
    return badRequest("Invalid request.");
  }

  // Honeypot: pretend success so bots do not retry. Add rate-limiting here later if needed.
  if (isTalkEnquiryHoneypotTriggered(body)) {
    return silentAccept();
  }

  const validated = validateTalkEnquiry(body);
  if (!validated.ok) {
    return badRequest(validated.error);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaching_enquiries")
    .insert(buildCoachingEnquiryInsertRow(validated.data));

  if (error) {
    console.error("Talk enquiry insert failed", {
      message: error.message,
      code: error.code,
    });
    return insertFailedResponse();
  }

  return NextResponse.json({ success: true });
}
