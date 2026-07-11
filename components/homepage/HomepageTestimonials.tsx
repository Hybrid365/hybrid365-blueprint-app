import { HOMEPAGE_TESTIMONIALS } from "@/app/lib/homepage/testimonials";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { TestimonialCard } from "./TestimonialCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

export function HomepageTestimonials() {
  return (
    <HomepageSection variant="dark">
      <HomepageEyebrow>Voices</HomepageEyebrow>
      <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
        What athletes say
      </HomepageHeading>
      <p className="mt-5 max-w-xl text-base text-white/55">
        Specific outcomes from structured coaching — not generic praise.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {HOMEPAGE_TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      <p className="mt-8 text-xs text-white/35">
        * Placeholder quotes — replace with verified testimonials in{" "}
        <code className="text-white/50">app/lib/homepage/testimonials.ts</code>
      </p>

      <div className="mt-8">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Start My Free Training Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
