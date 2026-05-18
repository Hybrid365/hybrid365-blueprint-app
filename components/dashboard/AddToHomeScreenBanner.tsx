"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";

const STORAGE_KEY = "hybrid365-home-screen-cta-dismissed";

/**
 * Mobile-only prompt to save /dashboard to the home screen.
 * Dismissal persisted in localStorage. Hidden in standalone / PWA display mode.
 */
export function AddToHomeScreenBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }

    try {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const iosStandalone = nav.standalone === true;
      const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (iosStandalone || displayStandalone) setAlreadyInstalled(true);
    } catch {
      // ignore
    }

    setReady(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!ready || dismissed || alreadyInstalled) return null;

  return (
    <div className="relative mb-5 md:hidden">
      <div className="overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-3.5 shadow-lg shadow-black/40 ring-1 ring-yellow-500/10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-yellow-400/10 blur-2xl" />
        <div className="relative flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/30">
            <Smartphone className="h-5 w-5 text-yellow-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pr-9">
            <p className="text-[13px] font-bold leading-snug tracking-tight text-white">
              Save Hybrid365 to your home screen
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              Open your programme, habits, challenge and progress in one tap.
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">
              Access is linked to your Whop email. Keep using the same email when logging into Hybrid365.
            </p>
            <p className="mt-2.5 text-[10px] leading-relaxed text-zinc-500">
              <span className="font-semibold text-zinc-400">iPhone Safari:</span> Tap Share → Add to Home Screen.
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
              <span className="font-semibold text-zinc-400">Android Chrome:</span> Tap menu → Add to Home screen.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={handleDismiss}
            className="absolute right-1.5 top-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/90 bg-zinc-900/90 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
