import Link from "next/link";
import { cn } from "@/lib/utils";
import { RollingValue } from "./RollingValue";

/**
 * Compact performance insight — only when real typed values exist.
 * Hide entirely when missing/ambiguous (caller responsibility).
 */
export function BenchmarkMicro({
  label,
  value,
  detail,
  href,
  className,
}: {
  label: string;
  value: string;
  detail?: string | null;
  href?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-[var(--h365-border)] bg-[var(--h365-surface)] px-4 py-4",
        className
      )}
    >
      <p className="label-caps text-[var(--h365-text-muted)]">Insight</p>
      <p className="mt-2 text-xs text-[var(--h365-text-muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold leading-none num text-[var(--h365-text)]">
        <RollingValue value={value} />
      </p>
      {detail ? (
        <p className="mt-1.5 text-xs text-[var(--h365-accent)]">{detail}</p>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex text-[11px] font-semibold text-[var(--h365-accent)]"
        >
          Performance
        </Link>
      ) : null}
    </aside>
  );
}
