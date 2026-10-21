import { environmentBadge } from "@/app/lib/hybrid365EnvironmentBadge";

export function EnvironmentBadge() {
  const badge = environmentBadge();
  if (!badge) return null;

  const tone =
    badge.tone === "danger"
      ? "bg-red-600 text-white ring-red-300/60"
      : "bg-amber-400 text-black ring-black/20";

  return (
    <div
      role="status"
      aria-label={`Environment: ${badge.label}`}
      data-environment-badge={badge.label}
      className={`pointer-events-none fixed left-1/2 top-0 z-[2147483647] -translate-x-1/2 rounded-b px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-lg ring-1 ${tone}`}
    >
      {badge.label}
    </div>
  );
}
