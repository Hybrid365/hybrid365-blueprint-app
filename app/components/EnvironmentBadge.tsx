import { environmentBadge } from "@/app/lib/hybrid365EnvironmentBadge";
import { ENV_BADGE_HEIGHT_PX } from "@/components/athlete-command-centre/visual/tokens";

export function EnvironmentBadge() {
  const badge = environmentBadge();
  if (!badge) return null;

  const tone =
    badge.tone === "danger"
      ? "bg-red-600 text-white"
      : "bg-amber-400 text-black";

  return (
    <>
      <style>{`:root{--hybrid365-env-badge-height:${ENV_BADGE_HEIGHT_PX}px;--h365-env-banner:${ENV_BADGE_HEIGHT_PX}px}`}</style>
      <div
        role="status"
        aria-label={`Environment: ${badge.label}`}
        data-environment-badge={badge.label}
        data-environment-badge-layout="bar"
        className={`pointer-events-none fixed inset-x-0 top-0 z-[2147483647] flex h-6 items-center justify-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${tone}`}
      >
        {badge.label}
      </div>
    </>
  );
}
