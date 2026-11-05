import { cn } from "@/lib/utils";

/**
 * Athlete-facing coach note only.
 * Callers must pass published athlete-safe text — never internal coach_note.
 */
export function AthleteCoachNote({
  note,
  label = "From your coach",
  className,
}: {
  note: string;
  label?: string;
  className?: string;
}) {
  const body = note.trim();
  if (!body) return null;
  return (
    <figure className={cn("relative flex flex-col gap-3 py-1 pl-5", className)}>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-[var(--h365-accent)]"
      />
      <figcaption>
        <span className="label-caps text-[var(--h365-text-muted)]">{label}</span>
      </figcaption>
      <blockquote className="text-pretty text-[15px] leading-relaxed text-[var(--h365-text)]">
        &ldquo;{body}&rdquo;
      </blockquote>
    </figure>
  );
}
