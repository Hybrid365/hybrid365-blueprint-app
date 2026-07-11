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
  "No structure across running, strength and conditioning",
  "No real threshold or pacing development",
  "No long-term plan for measurable progress",
] as const;

export function HomepageWhy() {
  return (
    <HomepageSection id="why">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>The athlete&apos;s problem</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            Hard work isn&apos;t the issue.
            <span className="mt-2 block text-white/90">Structure is.</span>
          </HomepageHeading>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Serious hybrid athletes don&apos;t lack effort. They lack a system that
            connects running development, strength work, threshold training and
            long-term progression — week after week.
          </p>
        </div>

        <ul className="mx-auto w-full max-w-xl space-y-3 lg:mx-0 lg:max-w-none">
          {PROBLEMS.map((item) => (
            <li
              key={item}
              className="flex gap-4 border-l-2 border-[#f4d23c]/40 py-3 pl-5 text-left text-sm leading-relaxed text-white/80 sm:text-base"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-medium leading-relaxed text-white/90 lg:text-left">
        Hybrid365 exists to give athletes structured performance coaching —
        proven through HYROX, running and strength progress, including shaving{" "}
        <span className="font-bold text-[#f4d23c]">9 minutes 23 seconds</span> off
        a Pro Solo time — not another random workout list.
      </p>

      <div className="mt-8 flex justify-center lg:justify-start">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Start My Free Training Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
