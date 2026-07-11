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
      "bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent",
  },
  "bleed-right": {
    wrapper: "-right-[8%] sm:-right-[12%]",
    image: "object-cover",
    overlay:
      "bg-gradient-to-l from-[#050505] via-[#050505]/35 to-transparent",
  },
  "fade-bottom": {
    wrapper: "",
    image: "object-cover",
    overlay: "bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent",
  },
  "angled-tr": {
    wrapper: "",
    image: "object-cover [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)]",
    overlay: "bg-gradient-to-t from-[#050505]/70 via-transparent to-transparent",
  },
  "soft-mask": {
    wrapper: "",
    image: "object-cover",
    overlay:
      "bg-[radial-gradient(ellipse_at_center,transparent_35%,#050505_100%)]",
  },
};

export function HomepageEditorialPhoto({
  photo,
  className,
  priority = false,
  sizes = "(max-width: 768px) 80vw, 40vw",
}: {
  photo: AthleteEditorialPhoto;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const style = TREATMENT_STYLES[photo.treatment];

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        style.wrapper,
        className
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        className={cn(
          style.image,
          "brightness-[0.82] contrast-[1.08] saturate-[0.92]"
        )}
        style={{ objectPosition: photo.objectPosition ?? "center center" }}
        sizes={sizes}
      />
      {style.overlay ? (
        <div className={cn("pointer-events-none absolute inset-0", style.overlay)} aria-hidden />
      ) : null}
    </div>
  );
}
