import { PRODUCT_SCREENS } from "@/app/lib/homepage/productScreens";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageProductMockup } from "./mockups/homepageMockups";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageProduct() {
  return (
    <HomepageSection id="system" variant="default">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>The system</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          A real coaching interface.
          <span className="block text-white/80">Not a PDF plan.</span>
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          Sessions, progression, check-ins and benchmarks — delivered through a
          premium athlete dashboard built for hybrid performance.
        </p>
      </div>

      <div className="mt-12 -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:mx-0 xl:grid xl:grid-cols-5 xl:gap-4 xl:overflow-visible xl:px-0 xl:pb-0">
        {PRODUCT_SCREENS.map((screen) => (
          <article
            key={screen.id}
            className="w-[200px] shrink-0 snap-start sm:w-[220px] xl:w-auto"
          >
            <HomepageProductMockup
              screenId={screen.id as "today" | "weekly" | "progress" | "checkin" | "benchmark"}
              size="sm"
              className="mx-auto xl:mx-0"
            />
            <div className="mt-4 text-center xl:text-left">
              <h3 className="text-xs font-black uppercase tracking-wide text-white">
                {screen.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                {screen.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <HomepageCtaRow>
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
