"use client";

import Link from "next/link";
import {
  AthleteDesktopRailNav,
  AthleteMobileBottomNav,
} from "./AthleteAppNav";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { useAthletePortalOptional } from "./athletePortalContext";
import { athleteMobileNavClearanceClass } from "./visual/tokens";

export { AthletePortalGate } from "./AthletePortalGate";

/** v0 HomeConceptD desktop rail width */
export const ATHLETE_DESKTOP_RAIL_WIDTH_PX = 220;

function MockPreviewBanner() {
  return (
    <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs font-semibold text-amber-200/90 sm:px-6">
      Mock preview — sample data only (Alex Morgan). Not your real programme.
    </div>
  );
}

/**
 * Canonical athlete shell — v0 parity:
 * Desktop: persistent 220px left rail (wordmark, nav, account).
 * Mobile: sticky bottom nav shelf (no left rail).
 * Replaces legacy top-tab athlete chrome.
 */
export function AthletePortalShell({
  children,
  showNav = true,
  showNavWhenLinked = false,
  forceShowNav = false,
  adminPreviewMode = false,
}: {
  children: React.ReactNode;
  showNav?: boolean;
  /** Show portal nav for linked athletes on programme page before client programme API resolves. */
  showNavWhenLinked?: boolean;
  /** Progress / Performance: always show rail/shelf for signed-in athletes. */
  forceShowNav?: boolean;
  /** Hide sign-out / mock toggles when embedded in coach admin preview. */
  adminPreviewMode?: boolean;
}) {
  const adminPreview = useAthleteAdminPreview();
  const portal = useAthletePortalOptional();
  const {
    setProgrammePublishedMock = () => {},
    allowMockPreview = false,
    hasLinkedAthlete = false,
    programmeHubLive = adminPreview?.programmeHubLive ?? false,
    programmePublishedLive = adminPreview?.programmePublishedLive ?? false,
    useMockPreview = false,
    serverProgrammePublishedSeed = false,
    serverAuthConfirmed = false,
    portalAthlete = null,
    layoutAuth = { hasSession: false, email: null, userId: null, hasSupabaseAuthCookie: false },
  } = portal ?? {};
  const isAdminPreview = adminPreviewMode || Boolean(adminPreview);
  const signedIn = Boolean(layoutAuth.hasSession || portalAthlete || hasLinkedAthlete);
  const navVisible =
    !isAdminPreview &&
    showNav &&
    (forceShowNav
      ? signedIn
      : programmeHubLive ||
        (showNavWhenLinked && hasLinkedAthlete) ||
        (serverAuthConfirmed && serverProgrammePublishedSeed));

  const athleteLabel =
    portalAthlete?.name?.trim() ||
    portalAthlete?.email?.split("@")[0]?.trim() ||
    "Athlete";

  if (isAdminPreview) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6">{children}</div>
      </div>
    );
  }

  return (
    <div
      data-athlete-shell="v0"
      className="min-h-screen bg-black font-sans text-white"
    >
      {useMockPreview ? <MockPreviewBanner /> : null}

      {navVisible ? (
        <aside
          data-athlete-desktop-rail=""
          className="fixed bottom-0 left-0 top-[var(--hybrid365-env-badge-height,0px)] z-40 hidden w-[220px] flex-col border-r border-zinc-800 bg-black px-4 py-6 lg:flex"
        >
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
              Hybrid365
            </p>
            <p className="mt-2 truncate text-sm text-zinc-300">{athleteLabel}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AthleteDesktopRailNav />
          </div>

          <div className="mt-auto shrink-0 space-y-3 border-t border-zinc-800 pt-4">
            {allowMockPreview && hasLinkedAthlete && !programmePublishedLive ? (
              <label className="flex cursor-pointer items-start gap-2 text-[11px] font-semibold text-amber-200/90">
                <input
                  type="checkbox"
                  checked={useMockPreview}
                  onChange={(e) => setProgrammePublishedMock(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-600"
                />
                <span>Programme live (mock)</span>
              </label>
            ) : null}
            <p className="truncate text-[11px] text-zinc-500">
              {portalAthlete?.email ?? "Signed in"}
            </p>
            <Link
              href="/logout?next=/athlete/login"
              className="inline-flex min-h-11 items-center text-xs font-semibold text-zinc-400 transition hover:text-zinc-200"
            >
              Sign out
            </Link>
          </div>
        </aside>
      ) : null}

      {/* Mobile top strip only when bottom nav is off (waiting hub).
          When nav is visible, v0 has no mobile top wordmark/sign-out — shelf is canonical. */}
      {!navVisible ? (
        <div className="sticky top-[var(--hybrid365-env-badge-height,0px)] z-40 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
                Hybrid365
              </p>
              <p className="mt-1 text-sm text-zinc-300">{athleteLabel}</p>
            </div>
            <Link
              href="/logout?next=/athlete/login"
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300"
            >
              Sign out
            </Link>
          </div>
        </div>
      ) : null}

      <div
        className={
          navVisible
            ? "lg:pl-[220px]"
            : undefined
        }
      >
        <div
          className={`min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-8 ${
            navVisible
              ? `pt-4 sm:pt-6 ${athleteMobileNavClearanceClass}`
              : "py-6"
          }`}
        >
          {children}
        </div>
      </div>

      {navVisible ? <AthleteMobileBottomNav /> : null}
    </div>
  );
}
