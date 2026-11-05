import { cn } from "@/lib/utils";
import { RollingValue } from "./RollingValue";

export function VsStat({
  label,
  value,
  unit,
  className,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="label-caps text-[var(--h365-text-muted)]">{label}</span>
      <span
        className={cn(
          "font-display text-2xl font-semibold leading-none num",
          accent ? "text-[var(--h365-accent)]" : "text-[var(--h365-text)]"
        )}
      >
        <RollingValue value={value} />
        {unit ? (
          <span className="ml-1 font-sans text-xs font-normal text-[var(--h365-text-muted)]">
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}
