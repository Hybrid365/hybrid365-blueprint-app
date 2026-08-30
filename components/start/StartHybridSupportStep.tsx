import { Activity, Check, Dumbbell, Layers, TrendingUp, Users } from "lucide-react";
import {
  START_HYBRID_CHOICES,
  START_HYBRID_STEP3,
  START_PLATFORM_PREVIEWS,
} from "@/app/lib/start/startCopy";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HybridPerformanceVslPlayer } from "@/components/hybrid-performance/HybridPerformanceVsl";
import { HomepagePhoneVisual } from "@/components/homepage/HomepagePhoneVisual";
import { AttributedLink } from "./AttributedLink";
import { StartHybridProofSlider } from "./StartHybridProofSlider";
import { StartStepIndicator } from "./StartStepIndicator";

const BUILD_ICONS = {
  running: Activity,
  strength: Dumbbell,
  hybrid: Layers,
  progression: TrendingUp,
} as const;

export function StartHybridSupportStep({ onBack }: { onBack: () => void }) {
  const copy = START_HYBRID_STEP3;
  const [programme, sessions, progress] = START_PLATFORM_PREVIEWS;
  const screens = {
    sessions: getPhoneScreen(sessions.id),
    programme: getPhoneScreen(programme.id),
    progress: getPhoneScreen(progress.id),
  };

  return (
    <section className="px-4 pb-6 pt-1 sm:px-6 sm:pb-8">
      <div className="mx-auto w-full max-w-[1040px]">
        <StartStepIndicator current={3} />

        <button
          type="button"
          onClick={onBack}
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/38 transition hover:text-white/70"
        >
          {copy.back}
        </button>

        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-0.5 font-black uppercase leading-[0.86] tracking-[-0.045em] text-white text-[clamp(1.35rem,4.8vw,2.05rem)]">
          {copy.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-1.5 text-[12px] leading-snug text-white/48">{copy.supporting}</p>

        <div className="mt-3">
          <p className="mb-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.28em] text-white/28">
            {copy.vslEyebrow}
          </p>
          <HybridPerformanceVslPlayer title={copy.vslEyebrow} />
        </div>

        <StartHybridProofSlider />

        <div className="mt-5 grid items-center gap-4 border-t border-white/[0.06] pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div>
            <h2 className="font-black uppercase leading-[0.9] tracking-[-0.04em] text-white text-[clamp(1.05rem,3vw,1.35rem)]">
              {copy.buildsHeading}
            </h2>
            <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
              {copy.builds.map((item) => {
                const Icon = BUILD_ICONS[item.id];
                return (
                  <li key={item.id} className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      <Icon className="h-3 w-3 shrink-0 text-[#f4d23c]" strokeWidth={2.2} />
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-white/42 sm:text-[11px]">
                      {item.body}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[300px]">
            <div className="relative">
              <div className="pointer-events-none absolute left-[2%] top-[14%] z-0 w-[28%] -rotate-[7deg] opacity-70">
                <HomepagePhoneVisual
                  screen={screens.sessions}
                  displayWidth={120}
                  fillContainer
                  className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
                />
              </div>
              <div className="pointer-events-none absolute right-[2%] top-[14%] z-0 w-[28%] rotate-[7deg] opacity-70">
                <HomepagePhoneVisual
                  screen={screens.progress}
                  displayWidth={120}
                  fillContainer
                  className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)]"
                />
              </div>
              <div className="relative z-10 mx-auto w-[42%]">
                <HomepagePhoneVisual
                  screen={screens.programme}
                  displayWidth={160}
                  fillContainer
                  priority
                  className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>
            <ul className="mt-1.5 grid grid-cols-3 gap-1">
              {[sessions, programme, progress].map((item) => (
                <li
                  key={item.id}
                  className="text-center text-[8px] font-bold uppercase tracking-[0.12em] text-white/38"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="relative z-20 mt-5 border-t border-white/[0.06] pt-4 sm:mt-6 sm:pt-5">
          <h2 className="text-center font-black uppercase leading-[0.9] tracking-[-0.04em] text-white text-[clamp(1.1rem,3.2vw,1.5rem)]">
            {copy.choiceHeadline}
          </h2>
          <p className="mx-auto mt-1 max-w-[40ch] text-center text-[11px] leading-snug text-white/42 sm:text-[12px]">
            {copy.choiceSupporting}
          </p>

          <div className="mt-3 grid gap-2.5 md:grid-cols-2 md:gap-3">
            {START_HYBRID_CHOICES.map((option) => {
              const Icon = option.icon === "system" ? Layers : Users;
              return (
                <article
                  key={option.id}
                  className="flex flex-col rounded-md border border-white/12 bg-[#101010] px-3.5 py-3 sm:px-4 sm:py-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#f4d23c]/40 text-[#f4d23c]">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black uppercase tracking-[0.1em] text-white">
                        {option.eyebrow}
                      </p>
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f4d23c]">
                        {option.title}
                        {option.price ? (
                          <span className="ml-2 font-bold normal-case tracking-normal">{option.price}</span>
                        ) : null}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-white/48">{option.positioning}</p>
                  <ul className="mt-2 space-y-1">
                    {option.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-1.5 text-[11px] leading-snug text-white/52">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#f4d23c]" strokeWidth={2.4} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <AttributedLink
                    href={option.href}
                    className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#f4d23c] px-4 text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#050505] transition hover:bg-[#e8c935]"
                  >
                    {option.cta}
                  </AttributedLink>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
