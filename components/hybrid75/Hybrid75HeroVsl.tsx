import { ExternalLink, Play } from "lucide-react";

/** Unlisted Hybrid 75 founder VSL — override via NEXT_PUBLIC_HYBRID75_VSL_URL if needed. */
export const HYBRID75_VSL_YOUTUBE_WATCH_URL = "https://youtu.be/A1m2eZuK6IU";
export const HYBRID75_VSL_YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/A1m2eZuK6IU";

const VSL_VIDEO_URL =
  process.env.NEXT_PUBLIC_HYBRID75_VSL_URL?.trim() || HYBRID75_VSL_YOUTUBE_WATCH_URL;

type ParsedVsl =
  | { kind: "youtube"; embedUrl: string; watchUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "mp4"; src: string };

function parseVslUrl(url: string): ParsedVsl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      watchUrl: `https://youtu.be/${id}`,
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  if (trimmed.includes("youtube.com/embed/")) {
    const idMatch = trimmed.match(/embed\/([\w-]{11})/);
    return {
      kind: "youtube",
      embedUrl: trimmed.split("?")[0] ?? trimmed,
      watchUrl: idMatch ? `https://youtu.be/${idMatch[1]}` : HYBRID75_VSL_YOUTUBE_WATCH_URL,
    };
  }
  if (trimmed.includes("player.vimeo.com/video/")) {
    return { kind: "vimeo", embedUrl: trimmed };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
    return { kind: "mp4", src: trimmed };
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("http")) {
    return { kind: "mp4", src: trimmed };
  }

  return null;
}

function VslPlaceholder() {
  return (
    <div className="relative flex h-full min-h-[200px] w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:min-h-[240px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F4D23C]/60 bg-[#F4D23C]/10 shadow-[0_0_32px_rgba(244,210,60,0.25)] sm:h-20 sm:w-20">
        <Play className="ml-1 h-8 w-8 fill-[#F4D23C] text-[#F4D23C] sm:h-9 sm:w-9" />
      </div>
      <p className="relative mt-4 text-center text-sm font-medium text-white/70">
        Founder intro video coming soon
      </p>
      <p className="relative mt-1 text-center text-xs text-white/40">
        Upload will connect automatically via{" "}
        <code className="text-[#F4D23C]/80">NEXT_PUBLIC_HYBRID75_VSL_URL</code>
      </p>
    </div>
  );
}

export function Hybrid75HeroVsl({ className = "" }: { className?: string }) {
  const parsed = VSL_VIDEO_URL ? parseVslUrl(VSL_VIDEO_URL) : null;

  return (
    <div className={className}>
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#F4D23C] lg:text-left">
        Watch this before you start
      </p>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#F4D23C]/35 bg-zinc-950/90 shadow-[0_0_48px_rgba(244,210,60,0.1)] ring-1 ring-white/5 backdrop-blur-sm">
        <div className="aspect-video w-full">
          {parsed?.kind === "youtube" ? (
            <iframe
              src={parsed.embedUrl}
              title="Hybrid 75 Summer Challenge VSL"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : parsed?.kind === "vimeo" ? (
            <iframe
              src={parsed.embedUrl}
              title="Hybrid 75 Summer Challenge VSL"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : parsed?.kind === "mp4" ? (
            <video
              className="h-full w-full bg-black object-contain"
              src={parsed.src}
              controls
              playsInline
              preload="metadata"
            >
              <track kind="captions" />
            </video>
          ) : (
            <VslPlaceholder />
          )}
        </div>
      </div>

      <p className="mt-2.5 text-center text-xs leading-relaxed text-white/50 sm:text-sm lg:text-left">
        Kieran explains the challenge, the rules, the dashboard and how to join.
      </p>

      {parsed?.kind === "youtube" ? (
        <a
          href={parsed.watchUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#F4D23C] transition hover:text-[#F4D23C]/80 lg:justify-start"
        >
          Watch on YouTube
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      ) : null}
    </div>
  );
}
