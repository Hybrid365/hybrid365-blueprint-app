/** Dev-only structured logs for Hyrox athlete auth debugging. */

export function logHyroxAuthDebug(
  scope: string,
  payload: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[hyrox-auth:${scope}]`, payload);
}
