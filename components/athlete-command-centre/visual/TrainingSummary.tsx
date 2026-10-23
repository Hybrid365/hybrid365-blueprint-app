import { visualCard, visualCardPad, visualEyebrow } from "./tokens";

export type TrainingSummaryItem = {
  label: string;
  value: string;
  sub?: string | null;
};

export function TrainingSummary({
  title,
  items,
  empty,
}: {
  title?: string;
  items: TrainingSummaryItem[];
  empty?: string;
}) {
  if (!items.length) {
    return empty ? (
      <article className={`${visualCard} ${visualCardPad}`}>
        {title ? <p className={visualEyebrow}>{title}</p> : null}
        <p className={`${title ? "mt-4" : ""} text-sm leading-relaxed text-zinc-400`}>{empty}</p>
      </article>
    ) : null;
  }

  return (
    <article className={`${visualCard} ${visualCardPad}`}>
      {title ? <p className={`${visualEyebrow} mb-4`}>{title}</p> : null}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {item.label}
            </dt>
            <dd className="mt-1.5 truncate text-lg font-bold tracking-tight text-white">{item.value}</dd>
            {item.sub?.trim() ? <p className="mt-1 text-xs text-zinc-400">{item.sub}</p> : null}
          </div>
        ))}
      </dl>
    </article>
  );
}
