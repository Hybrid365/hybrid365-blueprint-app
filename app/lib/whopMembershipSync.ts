import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_USER_LIST_PAGES = 25;

export type AuthLookupResult =
  | { ok: true; userId: string }
  | { ok: false; userId: null; listError?: string };

/**
 * Find auth user id by primary email (case-insensitive). Paginates admin listUsers.
 */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<AuthLookupResult> {
  const target = email.trim().toLowerCase();
  if (!target) return { ok: false, userId: null };

  let page = 1;
  const perPage = 1000;

  while (page <= MAX_USER_LIST_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { ok: false, userId: null, listError: error.message };
    }
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit?.id) return { ok: true, userId: hit.id };
    if (users.length < perPage) break;
    page += 1;
  }

  return { ok: false, userId: null };
}
