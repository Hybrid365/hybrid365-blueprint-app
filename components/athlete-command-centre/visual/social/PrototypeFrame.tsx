/** Staging-only 9:16 frame. Never present these props as a live athlete result. */

export function PrototypeFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="mx-auto w-full max-w-[360px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-zinc-800 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="absolute left-4 right-4 top-4 z-10 rounded-full border border-amber-400/50 bg-amber-400 px-3 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black">
          Prototype · demo props · not a live athlete result
        </p>
        <div className="flex h-full flex-col px-6 pb-8 pt-16">{children}</div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-zinc-400">{title}</figcaption>
    </figure>
  );
}
