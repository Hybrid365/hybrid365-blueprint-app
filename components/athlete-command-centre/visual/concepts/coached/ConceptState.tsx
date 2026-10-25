import { visualBody, visualEyebrow, visualMeta } from "../../tokens";

export type CoachedConceptState = "populated" | "loading" | "empty";

export function ConceptLoading({ lines = 4 }: { lines?: number }) {
  return (
    <div data-concept-state="loading" className="space-y-4" aria-busy="true" aria-label="Loading prototype">
      <p className={visualEyebrow}>Loading</p>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded-sm bg-zinc-800"
          style={{ width: `${88 - i * 12}%` }}
        />
      ))}
      <div className="mt-6 h-16 animate-pulse rounded-md bg-zinc-900" />
      <p className={`mt-4 ${visualMeta}`}>Prototype skeleton — not live data.</p>
    </div>
  );
}

export function ConceptEmpty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div data-concept-state="empty" className="space-y-3">
      <p className={visualEyebrow}>Unavailable</p>
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className={visualBody}>{body}</p>
      <p className={visualMeta}>Honest empty — no invented pace, FTP, or race time.</p>
    </div>
  );
}
