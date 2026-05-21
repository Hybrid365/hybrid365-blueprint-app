import { createClient } from "@/app/lib/supabase/server";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CoachSupabaseMode = "service_role" | "session";

/**
 * Server-side Supabase for coach dashboard reads/writes after app-level coach auth.
 * Prefers service role when configured (bypasses RLS — needed when coach access is via
 * HYROX_COACH_EMAILS / INTERNAL_ADMIN_EMAILS but profiles.role is still `member`).
 */
export async function createCoachServerClient(): Promise<{
  client: SupabaseClient;
  mode: CoachSupabaseMode;
}> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return { client: createServiceRoleClient(), mode: "service_role" };
  }
  return { client: await createClient(), mode: "session" };
}
