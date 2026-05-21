/** Dev-only mock preview for the Hyrox athlete portal (never for production athletes). */

export const HYROX_MOCK_PROGRAMME_STORAGE_KEY = "hyrox-athlete-programme-live-mock";
export const HYROX_LEGACY_MOCK_ACTIVE_KEY = "hyrox-athlete-mock-active";

export function isHyroxAthleteMockPreviewAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

export function readHyroxMockPreviewEnabled(): boolean {
  if (!isHyroxAthleteMockPreviewAllowed()) return false;
  if (typeof sessionStorage === "undefined") return false;
  const next = sessionStorage.getItem(HYROX_MOCK_PROGRAMME_STORAGE_KEY);
  const legacy = sessionStorage.getItem(HYROX_LEGACY_MOCK_ACTIVE_KEY);
  return next === "1" || legacy === "1";
}

export function writeHyroxMockPreviewEnabled(enabled: boolean): void {
  if (!isHyroxAthleteMockPreviewAllowed()) return;
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(HYROX_MOCK_PROGRAMME_STORAGE_KEY, enabled ? "1" : "0");
  if (!enabled) {
    sessionStorage.removeItem(HYROX_LEGACY_MOCK_ACTIVE_KEY);
  }
}

export function clearHyroxMockPreviewStorage(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(HYROX_MOCK_PROGRAMME_STORAGE_KEY, "0");
  sessionStorage.removeItem(HYROX_LEGACY_MOCK_ACTIVE_KEY);
}
