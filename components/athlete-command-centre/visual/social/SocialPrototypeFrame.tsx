import { visualEyebrow, visualMeta } from "../tokens";

/** 9:16 staging-only frame. Always labelled as a prototype. */
export function SocialPrototypeFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="mx-auto w-full max-w-[360px]">
      <figcaption className="mb-2 flex items-center justify-between gap-2">
        <p className={visualEyebrow}>{title}</p>
        <p className={`${visualMeta} font-semibold uppercase tracking-[0.14em] text-amber-300`}>
          Prototype
        </p>
      </figcaption>
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-zinc-800 bg-black">
        <div className="absolute inset-x-0 top-0 z-10 border-b border-amber-400/40 bg-amber-400 px-3 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black">
          Demo — not a live athlete result
        </div>
        <div className="flex h-full flex-col px-6 pb-8 pt-10">{children}</div>
      </div>
    </figure>
  );
}
