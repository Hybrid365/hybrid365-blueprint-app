import Image from "next/image";
import { HYBRID_PERFORMANCE_OUTCOMES } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceOutcomes() {
  const copy = HYBRID_PERFORMANCE_OUTCOMES;

  return (
    <HomepageSection id="outcomes" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {copy.headline}
        </HomepageHeading>
      </div>

      <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-[1.15rem] sm:grid-cols-4 sm:rounded-[1.5rem]">
        {copy.items.map((item) => (
          <figure key={item.id} className="relative aspect-[3/4] bg-[#111]">
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent px-2 pb-3 pt-12 sm:px-3 sm:pb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f4d23c]">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-white/80 sm:text-xs">{item.body}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-6 rounded-[1.15rem] border border-white/[0.08] bg-white/[0.03] px-5 py-5 sm:px-8 sm:py-6">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f4d23c]">
          {copy.mindset.title}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">{copy.mindset.body}</p>
      </div>
    </HomepageSection>
  );
}
