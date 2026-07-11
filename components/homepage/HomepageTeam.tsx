import Link from "next/link";
import { TEAM_MEMBERS } from "@/app/lib/homepage/teamMembers";
import {
  FREE_WEEK_HYROX_URL,
  SECONDARY_LINKS,
} from "@/app/lib/homepage/homepageLinks";
import { TeamMemberCard } from "./TeamMemberCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageTeam() {
  return (
    <HomepageSection id="team">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left lg:items-end">
        <div className="mx-auto max-w-xl sm:mx-0 sm:max-w-none">
          <HomepageEyebrow>Belonging</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            Meet the team
          </HomepageHeading>
          <p className="mt-5 max-w-xl text-base text-white/55">
            A living roster of HYROX athletes training with structure, accountability
            and race-day intent. This is what joining a performance team feels like.
          </p>
        </div>
        <Link
          href={SECONDARY_LINKS.hyroxTeam}
          className="shrink-0 text-xs font-bold uppercase tracking-wider text-white/40 transition hover:text-white/70"
        >
          About HYROX Team →
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TEAM_MEMBERS.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/35 lg:text-left">
        * Placeholder roster — add real athletes in{" "}
        <code className="text-white/50">app/lib/homepage/teamMembers.ts</code>
      </p>

      <HomepageCtaRow>
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
