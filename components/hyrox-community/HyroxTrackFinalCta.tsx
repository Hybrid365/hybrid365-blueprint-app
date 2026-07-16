import {
  getHyroxTrackJoinUrl,
  HYROX_TRACK_FINAL,
  HYROX_TRACK_FREE_WEEK_URL,
} from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackHeading,
  HyroxTrackJoinCta,
  HyroxTrackSecondaryCta,
} from "./hyroxTrackUi";

export function HyroxTrackFinalCta() {
  const joinUrl = getHyroxTrackJoinUrl();

  return (
    <HyroxTrackSection
      id="start"
      variant="dark"
      className="relative overflow-hidden border-b-0 pb-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.08),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <HyroxTrackHeading as="h2" className="text-[clamp(2rem,7vw,3.5rem)]">
          {HYROX_TRACK_FINAL.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_TRACK_FINAL.headline[1]}</span>
        </HyroxTrackHeading>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/50">
          {HYROX_TRACK_FINAL.body}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <HyroxTrackJoinCta href={joinUrl} size="large">
            {HYROX_TRACK_FINAL.primaryCta}
          </HyroxTrackJoinCta>
          <HyroxTrackSecondaryCta href={HYROX_TRACK_FREE_WEEK_URL}>
            {HYROX_TRACK_FINAL.secondaryCta}
          </HyroxTrackSecondaryCta>
        </div>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {HYROX_TRACK_FINAL.close}
        </p>
      </div>
    </HyroxTrackSection>
  );
}
