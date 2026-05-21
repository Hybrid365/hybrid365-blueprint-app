import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  parsePaymentLinkType,
  recordHyroxStatusHistory,
} from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    payment_link_type?: string;
    amount?: number;
  };

  const { client: supabase, mode } = await createCoachServerClient();

  const { athlete: existing, error: fetchError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (fetchError) {
    console.error("Hyrox confirm-payment fetch failed", {
      athleteId,
      message: fetchError,
      coachSupabaseMode: mode,
    });
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!existing) {
    console.error("Hyrox confirm-payment athlete not found", { athleteId, coachSupabaseMode: mode });
    return NextResponse.json(
      { success: false, error: "Athlete not found.", detail: `No row for id ${athleteId}` },
      { status: 404 }
    );
  }

  const statusFrom = existing.status;
  const paymentLinkType = parsePaymentLinkType(body.payment_link_type);
  const amount =
    typeof body.amount === "number" && Number.isFinite(body.amount) ? body.amount : null;

  const { error: updateError } = await supabase
    .from("hyrox_athletes")
    .update({
      payment_status: "paid",
      status: "payment_confirmed",
    })
    .eq("id", athleteId);

  if (updateError) {
    console.error("Hyrox confirm-payment update failed", updateError);
    return NextResponse.json(
      { success: false, error: "PAYMENT_CONFIRM_FAILED", detail: updateError.message },
      { status: 500 }
    );
  }

  const { athlete: updated, error: reloadError } = await fetchHyroxAthleteById(
    supabase,
    athleteId
  );

  if (reloadError || !updated) {
    return NextResponse.json(
      {
        success: false,
        error: "PAYMENT_CONFIRM_FAILED",
        detail: reloadError ?? "Payment updated but row could not be reloaded.",
      },
      { status: 500 }
    );
  }

  const { error: paymentInsertError } = await supabase.from("hyrox_payments").insert({
    athlete_id: athleteId,
    application_id: updated.application_id,
    payment_link_type: paymentLinkType,
    amount,
    currency: "gbp",
    status: "paid",
    raw_event: { source: "manual_coach_confirm", confirmed_at: new Date().toISOString() },
  });

  if (paymentInsertError) {
    console.warn("[hyrox/confirm-payment] hyrox_payments insert", paymentInsertError.message);
  }

  await recordHyroxStatusHistory(supabase, {
    athleteId,
    statusFrom,
    statusTo: "payment_confirmed",
    changedBy: auth.ctx.userId,
    reason: "manual_payment_confirmed",
    metadata: { payment_status: "paid", payment_link_type: paymentLinkType, amount },
  });

  return NextResponse.json({
    success: true,
    message: "Payment confirmed. Next step: link athlete account / send onboarding.",
    athlete: updated as HyroxAthleteRow,
  });
}
