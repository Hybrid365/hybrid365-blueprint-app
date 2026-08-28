import Image from "next/image";
import { HYBRID_PERFORMANCE_FOUNDER } from "@/app/lib/hybrid-performance/hybridPerformanceStory";

function FounderCaption({ lines }: { lines: readonly string[] }) {
  return (
    <figcaption className="absolute inset-x-0 bottom-0 flex min-h-[3.25rem] flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent px-2 pb-2.5 pt-8 text-center">
      {lines.map((line) => (
        <p
          key={line}
          className="text-[10px] font-black uppercase leading-[1.15] tracking-[0.14em] text-[#f4d23c] sm:text-[11px]"
        >
          {line}
        </p>
      ))}
    </figcaption>
  );
}

export function HybridPerformanceFounder() {
  const copy = HYBRID_PERFORMANCE_FOUNDER;

  return (
    <section
      id="founder"
      className="scroll-mt-[72px] overflow-x-hidden border-t border-white/[0.05] bg-[#050505] px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 className="font-black uppercase leading-[0.9] tracking-[-0.045em] text-white text-[clamp(1.45rem,4.4vw,2.2rem)]">
          {copy.headline}
        </h2>
        <p className="mt-1.5 text-sm text-white/45">{copy.supporting}</p>

        <div className="mt-4 hidden items-stretch gap-2 lg:flex">
          {copy.photos.map((photo, index) => (
            <div key={photo.src} className="flex min-w-0 flex-1 items-stretch gap-2">
              <figure className="relative min-w-0 flex-1 overflow-hidden rounded-md border border-white/[0.1] bg-[#0a0a0a]">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className={photo.imageClassName}
                    sizes="22vw"
                  />
                  <FounderCaption lines={photo.lines} />
                </div>
              </figure>
              {index < copy.photos.length - 1 ? (
                <span
                  className="flex w-3.5 shrink-0 items-center justify-center text-xs font-black text-white/55"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {copy.photos.map((photo) => (
            <figure
              key={photo.src}
              className="w-[46%] shrink-0 snap-start snap-always overflow-hidden rounded-md border border-white/[0.1] bg-[#0a0a0a]"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className={photo.imageClassName}
                  sizes="50vw"
                />
                <FounderCaption lines={photo.lines} />
              </div>
            </figure>
          ))}
        </div>

        <div className="mt-4 hidden grid-cols-4 gap-2 md:grid lg:hidden">
          {copy.photos.map((photo) => (
            <figure
              key={photo.src}
              className="relative overflow-hidden rounded-md border border-white/[0.1] bg-[#0a0a0a]"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className={photo.imageClassName}
                  sizes="22vw"
                />
                <FounderCaption lines={photo.lines} />
              </div>
            </figure>
          ))}
        </div>

        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/40">{copy.note}</p>
      </div>
    </section>
  );
}
