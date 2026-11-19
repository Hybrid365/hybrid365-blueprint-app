import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TRACK_PROGRAMME_MUTATION_ENABLED } from "@/app/lib/track-foundation/productionBoundary";
import {
  PRODUCTION_TRACK_SUPABASE_REF,
  productionTrackAccessEnabled,
  productionTrackRef,
} from "./access";

export function productionTrackDb(
  env: Record<string, string | undefined> = process.env
): SupabaseClient {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) {
    throw new Error("Track programme mutation must stay off.");
  }
  if (!productionTrackAccessEnabled(env)) {
    throw new Error("Production Track canary access is off.");
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (productionTrackRef(url) !== PRODUCTION_TRACK_SUPABASE_REF) {
    throw new Error("Production Track target refused.");
  }
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Production Track is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
