import {
  MEET_THE_TEAM_COPY,
  MEET_THE_TEAM_MEMBERS,
} from "@/app/lib/homepage/meetTheTeam";
import { SECONDARY_LINKS } from "@/app/lib/homepage/homepageLinks";
import { MeetTeamCard } from "./MeetTeamCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageMeetTheTeam() {
  const founder = MEET_THE_TEAM_MEMBERS.find((m) => m.featured);
  const athletes = MEET_THE_TEAM_MEMBERS.filter((m) => !m.featured);

  return (
    <HomepageSection id="team" variant="dark" className="!py-20 sm:!py-24 lg:!py-28">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{MEET_THE_TEAM_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {MEET_THE_TEAM_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{MEET_THE_TEAM_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-white/55 sm:text-lg">
          {MEET_THE_TEAM_COPY.body}
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 sm:mt-16 lg:grid-cols-12 lg:gap-8">
        {founder ? (
          <div className="lg:col-span-5">
            <MeetTeamCard member={founder} />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 lg:col-span-7 lg:gap-5">
          {athletes.map((member) => (
            <MeetTeamCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center text-center sm:mt-20">
        <p className="text-sm font-medium text-white/50 sm:text-base">
          {MEET_THE_TEAM_COPY.intakeLine}
        </p>
        <PrimaryCta
          href={`${SECONDARY_LINKS.hyroxTeam}/apply`}
          size="large"
          className={`${homepageCtaClass} mt-5`}
        >
          {MEET_THE_TEAM_COPY.applyLabel}
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
