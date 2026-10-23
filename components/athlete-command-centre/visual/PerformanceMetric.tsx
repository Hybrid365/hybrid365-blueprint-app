import { StatusPill } from "./StatusPill";
import {
  type AthleteStatusKey,
  visualCard,
  visualCardPad,
  visualDerived,
  visualMeta,
  visualNumber,
} from "./tokens";

export function PerformanceMetric({
  label,
  value,
  derived,
  status,
  meta,
  empty = "No current value.",
}: {
  label: string;
  value: string | null | undefined;
  derived?: string | null;
  status?: AthleteStatusKey;
  meta?: string | null;
  empty?: string;
}) {
  const shown = value?.trim() || null;
  return (
    <article className={`${visualCard} ${visualCardPad}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
        {status ? <StatusPill status={status} /> : null}
      </div>
      {shown ? (
        <>
          <p className={`mt-4 ${visualNumber}`}>{shown}</p>
          {derived?.trim() ? <p className={visualDerived}>{derived}</p> : null}
          {meta?.trim() ? <p className={visualMeta}>{meta}</p> : null}
        </>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{empty}</p>
      )}
    </article>
  );
}
