import { Play } from "lucide-react";

/** Set via NEXT_PUBLIC_HYBRID75_VSL_URL — YouTube, Vimeo, or direct MP4/WebM. */
const VSL_VIDEO_URL = process.env.NEXT_PUBLIC_HYBRID75_VSL_URL?.trim() ?? "";

type ParsedVsl =
  | { kind: "youtube" | "vimeo"; embedUrl: string }
  | { kind: "mp4"; src: string };

function parseVslUrl(url: string): ParsedVsl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (ytMatch) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
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
    return { kind: "youtube", embedUrl: trimmed };
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
          {parsed?.kind === "youtube" || parsed?.kind === "vimeo" ? (
            <iframe
              src={parsed.embedUrl}
              title="Hybrid 75 Summer Challenge — founder intro"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
    </div>
  );
}
