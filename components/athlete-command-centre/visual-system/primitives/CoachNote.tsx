import { cn } from "@/lib/utils";

/**
 * Athlete-facing coach note — v0 CoachMark treatment.
 * Callers must pass published athlete-safe text — never internal coach_note.
 */
export function AthleteCoachNote({
  note,
  label = "From your coach",
  className,
  quoted = false,
}: {
  note: string;
  label?: string;
  className?: string;
  /** Prefer false for Home parity (v0 CoachMark has no quote marks). */
  quoted?: boolean;
}) {
  const body = note.trim();
  if (!body) return null;
  return (
    <aside
      data-coach-mark=""
      className={cn("border-l-2 border-[var(--h365-accent)]/80 pl-4", className)}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--h365-accent)]/90">
        {label}
      </p>
      <div className="mt-2 text-pretty text-sm leading-relaxed text-[var(--h365-text)]">
        {quoted ? <>&ldquo;{body}&rdquo;</> : body}
      </div>
    </aside>
  );
}
