import { LANDING_SYSTEM } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";

export function HomepageHybridSystem() {
  return (
    <HomepageSection id="system" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_SYSTEM.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.9rem,6.5vw,3.25rem)]">
          {LANDING_SYSTEM.headline}
        </HomepageHeading>
      </div>

      <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
        {LANDING_SYSTEM.steps.map((step) => (
          <li key={step.number}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
              {step.number} — {step.title}
            </p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
              {step.line}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{step.detail}</p>
          </li>
        ))}
      </ol>
    </HomepageSection>
  );
}
