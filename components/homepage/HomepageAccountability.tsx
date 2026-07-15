import Image from "next/image";
import {
  ACCOUNTABILITY_AREAS,
  ACCOUNTABILITY_COPY,
} from "@/app/lib/homepage/accountability";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageAccountability() {
  const teamScreen = getPhoneScreen("hybrid365-team");

  return (
    <HomepageSection id="accountability" variant="dark" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-30 lg:block">
        <Image
          src="/images/homepage/team/bobby-harrison-farmers-carry.png"
          alt=""
          fill
          className="object-cover object-left"
          sizes="33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{ACCOUNTABILITY_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {ACCOUNTABILITY_COPY.headline}
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
          {ACCOUNTABILITY_COPY.body}
        </p>
        <p className="mt-3 text-sm text-white/40">{ACCOUNTABILITY_COPY.note}</p>
      </div>

      <div className="relative mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.7fr] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-2">
          {ACCOUNTABILITY_AREAS.map((area) => (
            <article
              key={area.id}
              className="rounded-2xl border border-white/10 bg-[#0a0a0a]/90 p-5 sm:p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-wide text-white">
                {area.title}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {area.items.map((item) => (
                  <li key={item} className="text-sm text-white/55">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mx-auto w-[min(52vw,220px)]">
          <HomepagePhoneVisual screen={teamScreen} size="sm" fillContainer />
          <p className="mt-4 text-center text-xs text-white/40">Hybrid365 Team</p>
        </div>
      </div>

      <p className="relative mt-12 text-center text-lg font-black uppercase tracking-tight text-white sm:text-xl lg:text-left">
        {ACCOUNTABILITY_COPY.statement[0]}{" "}
        <span className="text-[#f4d23c]">{ACCOUNTABILITY_COPY.statement[1]}</span>
      </p>
    </HomepageSection>
  );
}
