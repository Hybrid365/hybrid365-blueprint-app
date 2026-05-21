"use client";

import { useCallback, useEffect, useState } from "react";

export const START_HERE_DISMISS_KEY = "hybrid365-dashboard-start-here-dismissed";

export function useDismissibleStartHere(forceShow: boolean) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(START_HERE_DISMISS_KEY) === "1");
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const visible = ready && (forceShow || !dismissed);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(START_HERE_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const showAgain = useCallback(() => {
    setDismissed(false);
    try {
      localStorage.removeItem(START_HERE_DISMISS_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { visible, dismissed, ready, dismiss, showAgain };
}
