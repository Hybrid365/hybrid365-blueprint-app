"use client";

import { useState } from "react";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import { PerformanceTestingPageView } from "@/components/athlete-command-centre/PerformanceTestingPageView";

export function PerformanceTestingPreviewClient({
  athleteId,
  athleteName,
  athleteStatus,
}: {
  athleteId: string;
  athleteName: string;
  athleteStatus: string;
}) {
  const [readOnly, setReadOnly] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const enableEditing = () => {
    setReadOnly(false);
    setConfirmOpen(false);
  };

  return (
    <CoachAdminShell
      title={`Performance Testing Preview · ${athleteName}`}
      backHref={`/admin/hyrox-athletes/${athleteId}?tab=Testing`}
      backLabel="Athlete dashboard"
      actions={
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={!readOnly}
            onChange={(e) => {
              if (e.target.checked) {
                setConfirmOpen(true);
              } else {
                setReadOnly(true);
              }
            }}
            className="rounded border-zinc-600"
          />
          Enable live saving
        </label>
      }
    >
      {confirmOpen ? (
        <div className="mb-4 rounded-2xl border border-amber-500/35 bg-amber-400/10 p-4">
          <p className="text-sm font-semibold text-amber-100">Enable live saving?</p>
          <p className="mt-1 text-xs text-zinc-300">
            Changes will be saved to this athlete&apos;s live testing record.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enableEditing}
              className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-bold text-black"
            >
              Enable saving
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-zinc-600 px-4 py-2 text-xs text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <PerformanceTestingPageView
        mode="coach_preview"
        athleteId={athleteId}
        athleteName={athleteName}
        athleteStatus={athleteStatus}
        readOnly={readOnly}
        backToAdminHref={`/admin/hyrox-athletes/${athleteId}?tab=Testing`}
      />
    </CoachAdminShell>
  );
}
