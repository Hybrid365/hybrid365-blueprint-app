import {
  getHyroxTrackJoinUrl,
  HYROX_TRACK_FREE_WEEK_URL,
  HYROX_TRACK_PRICING,
} from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
  HyroxTrackJoinCta,
  HyroxTrackSecondaryCta,
} from "./hyroxTrackUi";

export function HyroxTrackPricing() {
  const joinUrl = getHyroxTrackJoinUrl();

  return (
    <HyroxTrackSection id="whats-included" variant="dark" className="!py-20 sm:!py-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <HyroxTrackEyebrow>{HYROX_TRACK_PRICING.eyebrow}</HyroxTrackEyebrow>
          <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
            {HYROX_TRACK_PRICING.headline[0]}
            <span className="block text-[#f4d23c]">{HYROX_TRACK_PRICING.headline[1]}</span>
          </HyroxTrackHeading>
          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {HYROX_TRACK_PRICING.inclusions.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white/75"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          id="pricing"
          className="rounded-2xl border border-[#f4d23c]/30 bg-gradient-to-b from-[#121212] to-[#080808] p-8 text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
            Hybrid365 HYROX Track
          </p>
          <p className="mt-4">
            <span className="text-5xl font-black text-white">{HYROX_TRACK_PRICING.price}</span>
            <span className="text-lg font-bold text-white/50">{HYROX_TRACK_PRICING.period}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-white/45">
            {HYROX_TRACK_PRICING.billing.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <HyroxTrackJoinCta href={joinUrl} size="large" className="w-full">
              {HYROX_TRACK_PRICING.primaryCta}
            </HyroxTrackJoinCta>
            <HyroxTrackSecondaryCta href={HYROX_TRACK_FREE_WEEK_URL} className="w-full">
              {HYROX_TRACK_PRICING.secondaryCta}
            </HyroxTrackSecondaryCta>
          </div>
        </div>
      </div>
    </HyroxTrackSection>
  );
}
