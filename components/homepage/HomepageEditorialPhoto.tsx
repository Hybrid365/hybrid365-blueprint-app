import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AthleteEditorialPhoto } from "@/app/lib/homepage/athletePhotography";

const TREATMENT_STYLES: Record<
  AthleteEditorialPhoto["treatment"],
  { wrapper: string; image: string; overlay?: string }
> = {
  "bleed-left": {
    wrapper: "-left-[8%] sm:-left-[12%]",
    image: "object-cover",
    overlay:
      "bg-gradient-to-r from-[#050505] via-[#050505]/50 to-transparent",
  },
  "bleed-right": {
    wrapper: "-right-[8%] sm:-right-[12%]",
    image: "object-cover",
    overlay:
      "bg-gradient-to-l from-[#050505] via-[#050505]/45 to-transparent",
  },
  "fade-bottom": {
    wrapper: "",
    image: "object-cover",
    overlay: "bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent",
  },
  "fade-edges": {
    wrapper: "",
    image: "object-cover",
    overlay:
      "bg-[radial-gradient(ellipse_at_center,transparent_30%,#050505_88%)]",
  },
  "angled-tr": {
    wrapper: "",
    image: "object-cover [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]",
    overlay: "bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent",
  },
  "soft-mask": {
    wrapper: "",
    image: "object-cover",
    overlay:
      "bg-[radial-gradient(ellipse_at_center,transparent_30%,#050505_100%)]",
  },
  cinematic: {
    wrapper: "",
    image: "object-cover",
    overlay:
      "bg-[linear-gradient(to_right,#050505_0%,transparent_28%,transparent_72%,#050505_100%),linear-gradient(to_top,#050505_0%,transparent_35%)]",
  },
};

export function HomepageEditorialPhoto({
  photo,
  className,
  priority = false,
  sizes = "(max-width: 768px) 80vw, 40vw",
  intensity = "default",
}: {
  photo: AthleteEditorialPhoto;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Subtle for hero backgrounds; full for editorial sections */
  intensity?: "subtle" | "default" | "full";
}) {
  const style = TREATMENT_STYLES[photo.treatment];

  const imageTone =
    intensity === "subtle"
      ? "brightness-[0.55] contrast-[1.05] saturate-[0.75]"
      : intensity === "full"
        ? "brightness-[0.88] contrast-[1.1] saturate-[0.95]"
        : "brightness-[0.78] contrast-[1.08] saturate-[0.88]";

  return (
    <div className={cn("relative overflow-hidden", style.wrapper, className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        className={cn(style.image, imageTone)}
        style={{ objectPosition: photo.objectPosition ?? "center center" }}
        sizes={sizes}
      />
      {style.overlay ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            style.overlay,
            intensity === "subtle" && "opacity-90"
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
