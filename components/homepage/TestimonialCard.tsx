import Image from "next/image";
import type { HomepageTestimonial } from "@/app/lib/homepage/testimonials";
import { PlaceholderBadge } from "./homepageUi";

export function TestimonialCard({ testimonial }: { testimonial: HomepageTestimonial }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        {testimonial.placeholder ? <PlaceholderBadge /> : null}
        <span className="ml-auto text-4xl font-serif leading-none text-[#f4d23c]/20" aria-hidden>
          &ldquo;
        </span>
      </div>

      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-white/75 sm:text-lg">
        {testimonial.quote}
      </blockquote>

      <footer className="mt-6 border-t border-white/10 pt-6">
        <div className="flex items-center gap-4">
          {testimonial.photoSrc ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10">
              <Image
                src={testimonial.photoSrc}
                alt={testimonial.photoAlt ?? ""}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/40">
              H365
            </div>
          )}
          <div>
            <p className="font-bold text-white">{testimonial.athleteName}</p>
            <p className="text-sm font-semibold text-[#f4d23c]">{testimonial.result}</p>
            <p className="text-xs text-white/40">{testimonial.service}</p>
          </div>
        </div>
      </footer>
    </article>
  );
}
