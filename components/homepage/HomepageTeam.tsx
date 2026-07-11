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
} from "./homepageUi";

export function HomepageTeam() {
  return (
    <HomepageSection id="team">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
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

      <p className="mt-8 text-xs text-white/35">
        * Placeholder roster — add real athletes in{" "}
        <code className="text-white/50">app/lib/homepage/teamMembers.ts</code>
      </p>

      <div className="mt-8">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Build My Free Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
