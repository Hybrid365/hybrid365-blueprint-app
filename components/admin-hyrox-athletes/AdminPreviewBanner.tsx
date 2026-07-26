"use client";

import Link from "next/link";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";

type Props = {
  athleteName: string;
  athleteEmail?: string | null;
  athleteId?: string;
  adminReturnHref?: string;
  exitHref?: string;
  onExit?: () => void;
};

/**
 * Persistent sticky banner for admin/coach athlete preview.
 * Does not cover mobile bottom nav (z-30; nav is z-40).
 */
export function AdminPreviewBanner({
  athleteName,
  athleteEmail,
  athleteId,
  adminReturnHref = "/admin/hyrox-athletes",
  exitHref,
  onExit,
}: Props) {
  const preview = useAthleteAdminPreview();
  const returnHref = preview?.adminReturnHref ?? adminReturnHref;
  const leaveHref = exitHref ?? returnHref;
  const idLabel = athleteId ?? preview?.portalAthlete.id ?? "";

  return (
    <div className="sticky top-0 z-30 border-b border-amber-500/40 bg-amber-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Preview mode
              </p>
              <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">
                Read only
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-amber-50">
              Viewing the athlete experience as {athleteName}
            </p>
            <p className="mt-0.5 truncate text-xs text-amber-200/70">
              {athleteEmail ? `${athleteEmail} · ` : ""}
              {idLabel ? `ID ${idLabel}` : "Admin athlete preview"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/20"
          >
            Return to Admin
          </Link>
          <Link
            href={leaveHref}
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-400"
          >
            Exit Preview
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
