"use client";

import { HYROX_ONE_TO_ONE_VIDEOS } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { useHomepageInView } from "./useHomepageInView";
import { cn } from "@/lib/utils";

type HomepageVideoKey = keyof typeof HYROX_ONE_TO_ONE_VIDEOS;

export function HomepageLazyVideo({
  videoKey,
  className,
  fit = "cover",
  controls = false,
}: {
  videoKey: HomepageVideoKey;
  className?: string;
  fit?: "cover" | "contain";
  controls?: boolean;
}) {
  const { ref, inView } = useHomepageInView("480px");
  const video = HYROX_ONE_TO_ONE_VIDEOS[videoKey];

  return (
    <div ref={ref} className={cn("overflow-hidden bg-black", className)}>
      {inView ? (
        <video
          className={cn(
            "h-full w-full bg-black",
            fit === "cover" ? "object-cover" : "object-contain"
          )}
          src={video.src}
          width={video.width}
          height={video.height}
          muted
          loop
          playsInline
          autoPlay
          controls={controls}
          preload="metadata"
          controlsList="nodownload"
          aria-label={video.label}
        />
      ) : (
        <div className="flex h-full w-full items-end p-5" aria-hidden>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
            Hybrid365
          </p>
        </div>
      )}
    </div>
  );
}
