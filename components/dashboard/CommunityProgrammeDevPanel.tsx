import type { CommunityProgrammeGateDebug } from "@/app/lib/communityProgrammeStatus";

type Props = {
  debug: CommunityProgrammeGateDebug;
};

/** Dev-only gate diagnostics for paid /dashboard/programme. */
export function CommunityProgrammeDevPanel({ debug }: Props) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 font-mono text-xs text-amber-100">
      <p className="mb-2 font-bold uppercase tracking-wide text-amber-300">Programme gate debug (dev)</p>
      <ul className="space-y-1">
        <li>instance: {debug.instanceId ?? "null"}</li>
        <li>raw week count: {debug.rawWeekCount}</li>
        <li>meaningful raw weeks: {debug.rawMeaningfulWeekCount}</li>
        <li>programmeGenerated: {String(debug.programmeGenerated)}</li>
        <li>canViewProgramme: {String(debug.canViewProgramme)}</li>
        <li>build card reason: {debug.buildCardReason}</li>
      </ul>
    </div>
  );
}
