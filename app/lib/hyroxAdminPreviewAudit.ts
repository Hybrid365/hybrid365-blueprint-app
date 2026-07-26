/**
 * Lightweight audit trail for admin/coach athlete preview opens.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PreviewAuditEvent = {
  coachUserId: string;
  athleteId: string;
  event: "preview_started" | "preview_ended" | "preview_page_view";
  route?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordHyroxAdminPreviewAudit(
  supabase: SupabaseClient,
  event: PreviewAuditEvent
): Promise<void> {
  try {
    await supabase.from("hyrox_admin_preview_events").insert({
      coach_user_id: event.coachUserId,
      athlete_id: event.athleteId,
      event_type: event.event,
      route: event.route ?? null,
      metadata: event.metadata ?? {},
    });
  } catch (e) {
    // Never break preview UX on audit failure
    if (process.env.NODE_ENV === "development") {
      console.warn("[hyrox-preview-audit]", e);
    }
  }
}
