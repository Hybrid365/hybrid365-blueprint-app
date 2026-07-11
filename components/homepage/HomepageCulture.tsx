import { CULTURE_HEADLINE, CULTURE_TRAITS } from "@/app/lib/homepage/brandCopy";
import { CULTURE_PHONE_SCREENS, getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { FREE_WEEK_HYROX_URL, HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageCulture() {
  const cultureScreens = CULTURE_PHONE_SCREENS.map(getPhoneScreen);

  return (
    <HomepageSection id="culture" variant="accent">
      <div className="mx-auto max-w-3xl text-center">
        <HomepageEyebrow>Identity</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          {CULTURE_HEADLINE}
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55">
          Hybrid365 is a standard — not a vibe. Join a system and team environment
          built for athletes who already show up and train hard.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2">
        {cultureScreens.map((screen) => (
          <article key={screen.id} className="text-center">
            <HomepagePhoneVisual screen={screen} size="lg" className="mx-auto" />
            <h3 className="mt-5 text-sm font-black uppercase tracking-wide text-white">
              {screen.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/55">
              {screen.description}
            </p>
          </article>
        ))}
      </div>

      <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
        {CULTURE_TRAITS.map((trait, index) => (
          <li
            key={trait}
            className="flex gap-4 rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-5 py-4 text-left"
          >
            <span className="text-sm font-black tabular-nums text-[#f4d23c]/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-relaxed text-white/75">{trait}</p>
          </li>
        ))}
      </ul>

      <HomepageCtaRow className="justify-center lg:justify-center">
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
        <SecondaryCta href={HOMEPAGE_NAV.team} className={homepageCtaClass}>
          Meet The Team
        </SecondaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
