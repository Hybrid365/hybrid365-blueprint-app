import { cn } from "@/lib/utils";

export function LabFixtureBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "label-caps text-[10px] text-[var(--h365-text-muted)]/80",
        className
      )}
    >
      LAB / FIXTURE
    </span>
  );
}
