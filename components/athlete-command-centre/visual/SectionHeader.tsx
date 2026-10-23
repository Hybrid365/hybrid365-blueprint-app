import { visualEyebrow } from "./tokens";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className={visualEyebrow}>{eyebrow}</p> : null}
        <h2 className={`${eyebrow ? "mt-1.5" : ""} text-sm font-semibold text-zinc-200`}>{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
