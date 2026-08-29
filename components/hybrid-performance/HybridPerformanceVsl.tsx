import { HYBRID_PERFORMANCE_VSL } from "@/app/lib/hybrid-performance/hybridPerformanceStory";

export function getHybridPerformanceVslEmbedUrl() {
  const { youtubeId, vimeoId, src } = HYBRID_PERFORMANCE_VSL;
  if (youtubeId) return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
  if (src) return src;
  return null;
}

function PlayIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/55 sm:h-16 sm:w-16">
      <svg
        viewBox="0 0 24 24"
        className="ml-0.5 h-5 w-5 fill-white/90 sm:h-6 sm:w-6"
        aria-hidden
      >
        <path d="M8.2 5.6v12.8L19 12 8.2 5.6z" />
      </svg>
    </span>
  );
}

/** Shared 16:9 Hybrid Performance VSL player — no autoplay. */
export function HybridPerformanceVslPlayer({ title }: { title: string }) {
  const embedUrl = getHybridPerformanceVslEmbedUrl();

  return (
    <div className="relative aspect-video max-h-[200px] w-full overflow-hidden rounded-md border border-white/[0.1] bg-[#080808] sm:max-h-[280px] lg:max-h-[380px]">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          role="img"
          aria-label="Video coming soon"
        >
          <PlayIcon />
        </div>
      )}
    </div>
  );
}

export function HybridPerformanceVsl() {
  const copy = HYBRID_PERFORMANCE_VSL;
  return (
    <section id={copy.id} className="scroll-mt-[72px] bg-[#050505] px-4 pb-5 pt-1 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-white/28">
          {copy.label}
        </p>
        <HybridPerformanceVslPlayer title={copy.label} />
      </div>
    </section>
  );
}
