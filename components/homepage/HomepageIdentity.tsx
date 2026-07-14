import { IDENTITY_BODY, IDENTITY_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { ATHLETE_EDITORIAL_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import { HomepageEyebrow, HomepageHeading } from "./homepageUi";

export function HomepageIdentity() {
  return (
    <section
      id="identity"
      className="relative scroll-mt-[72px] overflow-hidden border-b border-white/[0.06] bg-[#050505] py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-y-0 right-[-10%] w-[55%] opacity-40 sm:opacity-50">
          <HomepageEditorialPhoto
            photo={ATHLETE_EDITORIAL_PHOTOS.strengthSession}
            className="h-full w-full"
            intensity="subtle"
            sizes="(max-width: 1024px) 80vw, 50vw"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#050505_0%,#050505/88_42%,#050505/55_68%,#050505/92_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <HomepageEyebrow>Identity</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
            {IDENTITY_HEADLINE.line1}
            <span className="mt-1 block text-[#f4d23c]">{IDENTITY_HEADLINE.line2}</span>
          </HomepageHeading>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            {IDENTITY_BODY}
          </p>
        </div>
      </div>
    </section>
  );
}
