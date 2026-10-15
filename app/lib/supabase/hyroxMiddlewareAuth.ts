/**
 * Edge-middleware auth helpers.
 * Keep this module free of next/headers cookies() and service-role fallbacks —
 * those can hang past Vercel's middleware wall-clock limit.
 */

/** Stay well under Vercel middleware invocation limit (~25s). */
export const MIDDLEWARE_AUTH_CALL_TIMEOUT_MS = 2500;

export type AuthCallTimeoutResult<T> =
  | { ok: true; value: T }
  | { ok: false; timedOut: true };

export function isHyroxAdminProtectedPath(path: string): boolean {
  return path.startsWith("/admin") && path !== "/admin/no-access";
}

export async function withAuthCallTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<AuthCallTimeoutResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guarded = promise.then(
    (value): AuthCallTimeoutResult<T> => ({ ok: true, value }),
    (err: unknown): AuthCallTimeoutResult<T> => {
      console.warn("[hyrox-middleware] auth call failed", {
        label,
        message: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, timedOut: true };
    }
  );

  const raced = await Promise.race([
    guarded,
    new Promise<AuthCallTimeoutResult<T>>((resolve) => {
      timer = setTimeout(() => {
        console.warn("[hyrox-middleware] auth call timed out", { label, ms });
        resolve({ ok: false, timedOut: true });
      }, ms);
    }),
  ]);

  if (timer) clearTimeout(timer);
  return raced;
}
