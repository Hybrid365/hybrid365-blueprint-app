import {
  TEAM_SHOWCASE_ATHLETES,
  TEAM_SHOWCASE_COPY,
} from "@/app/lib/homepage/teamShowcase";
import { SECONDARY_LINKS } from "@/app/lib/homepage/homepageLinks";
import { TeamShowcaseCard } from "./TeamShowcaseCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageTeam() {
  return (
    <HomepageSection id="team" variant="dark">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{TEAM_SHOWCASE_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {TEAM_SHOWCASE_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{TEAM_SHOWCASE_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-white/55 sm:text-lg">
          {TEAM_SHOWCASE_COPY.body}
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:gap-12">
        {TEAM_SHOWCASE_ATHLETES.map((athlete) => (
          <TeamShowcaseCard key={athlete.id} athlete={athlete} />
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center text-center sm:mt-20">
        <p className="text-sm font-medium text-white/50 sm:text-base">
          {TEAM_SHOWCASE_COPY.intakeLine}
        </p>
        <PrimaryCta
          href={`${SECONDARY_LINKS.hyroxTeam}/apply`}
          size="large"
          className={`${homepageCtaClass} mt-5`}
        >
          {TEAM_SHOWCASE_COPY.applyLabel}
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
