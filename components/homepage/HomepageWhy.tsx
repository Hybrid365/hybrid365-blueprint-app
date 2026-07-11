import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

const PROBLEMS = [
  "Random Instagram workouts with no progression",
  "Always training hard — never training smart",
  "No structure across running, strength and stations",
  "No real threshold or pacing development",
  "No long-term plan for race day",
] as const;

export function HomepageWhy() {
  return (
    <HomepageSection id="why">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div>
          <HomepageEyebrow>The HYROX athlete&apos;s problem</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            Hard work isn&apos;t the issue.
            <span className="mt-2 block text-white/90">Structure is.</span>
          </HomepageHeading>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
            Serious HYROX athletes don&apos;t lack effort. They lack a system that
            connects running development, strength endurance, threshold work and
            race-specific progression — week after week.
          </p>
        </div>

        <ul className="space-y-3">
          {PROBLEMS.map((item) => (
            <li
              key={item}
              className="flex gap-4 border-l-2 border-[#f4d23c]/40 py-3 pl-5 text-sm leading-relaxed text-white/80 sm:text-base"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 max-w-2xl text-lg font-medium leading-relaxed text-white/90">
        Hybrid365 exists to give HYROX athletes the same structured performance
        coaching used to shave{" "}
        <span className="text-[#f4d23c] font-bold">9 minutes 23 seconds</span> off
        a Pro Solo time — not another random workout list.
      </p>

      <div className="mt-8">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Build My Free Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
