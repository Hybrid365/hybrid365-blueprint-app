import { cn } from "@/lib/utils";

export function VsSectionHeader({
  eyebrow,
  title,
  meta,
  className,
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="label-caps text-[var(--h365-text-muted)]">{eyebrow}</span>
        ) : null}
        <h2 className="font-display text-xl font-semibold uppercase leading-none tracking-wide text-balance text-[var(--h365-text)]">
          {title}
        </h2>
      </div>
      {meta ? <div className="shrink-0 text-xs text-[var(--h365-text-muted)]">{meta}</div> : null}
    </div>
  );
}
