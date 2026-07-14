import { HOW_IT_WORKS_STEPS } from "@/app/lib/homepage/brandCopy";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageHowItWorks() {
  return (
    <HomepageSection id="how-it-works" variant="dark">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>How it works</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          From application
          <span className="block text-[#f4d23c]">to measurable progress.</span>
        </HomepageHeading>
      </div>

      <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <li key={step.id} className="relative">
            {index < HOW_IT_WORKS_STEPS.length - 1 ? (
              <div
                className="pointer-events-none absolute left-[calc(50%+28px)] top-6 hidden h-px w-[calc(100%-56px)] bg-gradient-to-r from-white/15 to-white/5 lg:block"
                aria-hidden
              />
            ) : null}
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0a0a0a]/60 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
                {step.step}
              </p>
              <h3 className="mt-3 text-lg font-black uppercase tracking-tight text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </HomepageSection>
  );
}
