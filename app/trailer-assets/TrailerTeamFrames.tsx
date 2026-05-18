import type { ReactNode } from "react";

const cinematicBg =
  "relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black";

const glow =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(244,210,60,0.12),transparent)]";

/** 16:9 trailer frame (~1920×1080 style) */
export function Frame169({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[960px] overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50 ${className}`}
    >
      <div className={`${cinematicBg} aspect-video w-full`}>
        <div className={glow} />
        <div className="relative flex h-full w-full flex-col items-center justify-center p-8 sm:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/** 9:16 reel / story frame */
export function Frame916({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl shadow-black/50 ${className}`}
    >
      <div className={`${cinematicBg} aspect-[9/16] w-full`}>
        <div className={glow} />
        <div className="relative flex h-full w-full flex-col justify-end p-8">{children}</div>
      </div>
    </div>
  );
}

/** Landscape overlay ~900×520 */
export function OverlayLandscape({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#F4D23C]/25 bg-zinc-950/95 shadow-xl backdrop-blur-sm ${className}`}
    >
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/** Vertical overlay */
export function OverlayVertical({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#F4D23C]/25 bg-zinc-950/95 shadow-xl backdrop-blur-sm ${className}`}
    >
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Small badge / stamp */
export function BadgeStamp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-[#F4D23C]/40 bg-zinc-950/90 px-4 py-2 shadow-lg ${className}`}
    >
      {children}
    </span>
  );
}

/** Phone mock */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-zinc-800 bg-zinc-950 shadow-2xl ${className}`}
    >
      <div className="aspect-[9/19] w-full overflow-hidden bg-zinc-950">{children}</div>
    </div>
  );
}

export function AssetRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-24 last:mb-8">
      <p className="mb-1 font-mono text-[11px] text-zinc-600">{label}</p>
      {hint ? <p className="mb-4 text-xs text-zinc-500">{hint}</p> : <div className="mb-4" />}
      {children}
    </div>
  );
}

export function FrameRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-center gap-8">{children}</div>;
}
