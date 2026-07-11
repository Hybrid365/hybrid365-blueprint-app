import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

export function HomepageFinalCta() {
  return (
    <HomepageSection
      className="relative overflow-hidden border-b-0 pb-28 md:pb-24"
      variant="dark"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.12),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <HomepageHeading
          as="h2"
          className="text-[clamp(2rem,7vw,3.5rem)]"
        >
          Stop guessing with your training
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Build a personalised HYROX training week based on your experience, goals
          and available training days.
        </p>
        <div className="mt-10 flex justify-center">
          <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large">
            Build My Free Week
          </PrimaryCta>
        </div>
      </div>
    </HomepageSection>
  );
}
