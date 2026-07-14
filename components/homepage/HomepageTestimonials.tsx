import { HOMEPAGE_TESTIMONIALS } from "@/app/lib/homepage/testimonials";
import { TestimonialCard } from "./TestimonialCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageTestimonials() {
  return (
    <HomepageSection variant="dark" className="!py-20 sm:!py-24 lg:!py-28">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>Voices</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          What athletes say
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          Specific outcomes from structured coaching — effort converted into measurable progress.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3 lg:gap-10">
        {HOMEPAGE_TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>
    </HomepageSection>
  );
}
